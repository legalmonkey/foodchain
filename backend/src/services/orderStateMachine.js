const Order = require("../models/Order");
const User = require("../models/User");
const config = require("../config/env");
const inMemoryDb = require("./inMemoryDb");
const mongoose = require("mongoose");
const { markOnChainDelivered, assignOnChainDelivery } = require("./blockchain");

// Active timers mapped by orderId
const orderTimers = new Map();

function cancelOrderTimer(orderId) {
  const existingTimer = orderTimers.get(orderId.toString());
  if (existingTimer) {
    clearTimeout(existingTimer);
    orderTimers.delete(orderId.toString());
  }
}

/**
 * Schedule next state transition
 * @param {object} order
 * @param {object} io Socket.io instance
 */
function scheduleNextTransition(order, io) {
  const orderIdStr = order._id.toString();
  cancelOrderTimer(orderIdStr);

  let delay = 0;
  let nextStatus = null;

  switch (order.status) {
    case "PLACED":
      delay = config.orderTimers.placedToAccepted;
      nextStatus = "ACCEPTED";
      break;
    case "ACCEPTED":
      delay = config.orderTimers.acceptedToPreparing;
      nextStatus = "PREPARING";
      break;
    case "PREPARING":
      delay = config.orderTimers.preparingToOut;
      nextStatus = "OUT_FOR_DELIVERY";
      break;
    case "OUT_FOR_DELIVERY":
      delay = config.orderTimers.outToDelivered;
      nextStatus = "DELIVERED";
      break;
    default:
      return; // Terminal state or manual close
  }

  if (delay > 0 && nextStatus) {
    const timer = setTimeout(async () => {
      try {
        await advanceOrderStatus(orderIdStr, nextStatus, io, "SYSTEM_AUTO_ADVANCE");
      } catch (err) {
        console.error(`Auto-advance error for order ${orderIdStr}:`, err.message);
      }
    }, delay);

    orderTimers.set(orderIdStr, timer);
  }
}

/**
 * Advances order status, executes side-effects (e.g. delivery assignment, on-chain mark),
 * broadcasts socket event, and schedules next transition.
 */
async function advanceOrderStatus(orderId, targetStatus, io, triggeredBy = "MANUAL") {
  cancelOrderTimer(orderId);

  let order = null;
  const isMongoId = mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(orderId);

  if (isMongoId) {
    try {
      order = await Order.findById(orderId);
    } catch (e) {}
  }

  if (!order) {
    order = inMemoryDb.orders.find((o) => String(o._id) === String(orderId));
  }

  if (!order) {
    throw new Error("Order not found");
  }

  const validTransitions = {
    PLACED: ["ACCEPTED", "CLOSED"],
    ACCEPTED: ["PREPARING", "CLOSED"],
    PREPARING: ["OUT_FOR_DELIVERY", "CLOSED"],
    OUT_FOR_DELIVERY: ["DELIVERED", "CLOSED"],
    DELIVERED: ["CLOSED"],
  };

  // If triggered by admin force status, bypass transition checks
  if (triggeredBy !== "ADMIN_FORCE" && !validTransitions[order.status]?.includes(targetStatus)) {
    throw new Error(`Invalid status transition from ${order.status} to ${targetStatus}`);
  }

  order.status = targetStatus;
  if (!order.statusTimestamps) {
    order.statusTimestamps = {};
  }
  const now = new Date();

  if (targetStatus === "ACCEPTED") {
    order.statusTimestamps.accepted = now;
  } else if (targetStatus === "PREPARING") {
    order.statusTimestamps.preparing = now;
  } else if (targetStatus === "OUT_FOR_DELIVERY") {
    order.statusTimestamps.outForDelivery = now;

    // If no delivery partner assigned yet, auto-assign an active delivery partner
    if (!order.deliveryPartnerId) {
      let deliveryPartner = null;
      if (mongoose.connection.readyState === 1) {
        try {
          deliveryPartner = await User.findOne({ role: "delivery_partner" });
        } catch (e) {}
      }
      if (!deliveryPartner) {
        deliveryPartner = inMemoryDb.users.find((u) => u.role === "delivery_partner");
      }
      if (deliveryPartner) {
        order.deliveryPartnerId = deliveryPartner._id;
        if (order.onChainOrderKey) {
          assignOnChainDelivery(order.onChainOrderKey, deliveryPartner.walletAddress).catch((e) =>
            console.error("Assign on-chain delivery partner error:", e.message)
          );
        }
      }
    }
  } else if (targetStatus === "DELIVERED") {
    order.statusTimestamps.delivered = now;

    // Call on-chain markDelivered
    if (order.onChainOrderKey) {
      markOnChainDelivered(order.onChainOrderKey).catch((e) =>
        console.error("Mark on-chain delivered error:", e.message)
      );
    }

    if (!order.escrow) {
      const orderTotal = Number(order.totalPrice || 200);
      order.escrow = {
        status: "HELD_BY_ADMIN",
        amount: orderTotal,
        heldBy: "Platform Admin Escrow",
        restaurantAmount: Math.round(orderTotal * 0.8),
        riderAmount: Math.round(orderTotal * 0.15),
        platformFee: Math.round(orderTotal * 0.05),
        dispatchedAt: null,
        refundedAt: null,
        notes: "Funds held in Escrow ready for dispatch payout",
      };
    }
  } else if (targetStatus === "CLOSED") {
    order.statusTimestamps.closed = now;
  }

  if (order.save) {
    try {
      await order.save();
    } catch (e) {
      console.warn("Order save warning in advanceOrderStatus:", e.message);
    }
  }

  // Populate references for clean frontend payload
  let populatedOrder = null;
  if (isMongoId) {
    try {
      populatedOrder = await Order.findById(order._id)
        .populate("customerId", "name walletAddress")
        .populate("restaurantId", "name walletAddress address")
        .populate("deliveryPartnerId", "name walletAddress phone")
        .lean();
    } catch (e) {}
  }

  if (!populatedOrder) {
    const customer = inMemoryDb.users.find((u) => String(u._id) === String(order.customerId));
    const restaurant = inMemoryDb.restaurants.find((r) => String(r._id) === String(order.restaurantId));
    const delivery = inMemoryDb.users.find((u) => String(u._id) === String(order.deliveryPartnerId));
    populatedOrder = {
      ...(order.toObject ? order.toObject() : order),
      customerId: customer || order.customerId || { name: "Customer", walletAddress: "0x..." },
      restaurantId: restaurant || order.restaurantId || { name: "Restaurant", walletAddress: "0x..." },
      deliveryPartnerId: delivery || null,
    };
  }

  if (io) {
    io.emit("orderStatusChanged", {
      orderId: order._id,
      status: order.status,
      order: populatedOrder,
      triggeredBy,
    });
    io.emit("rupeeBalanceUpdated", { orderId: order._id });
  }

  // Schedule next automatic step if not delivered/closed
  scheduleNextTransition(order, io);

  return populatedOrder;
}

module.exports = {
  advanceOrderStatus,
  scheduleNextTransition,
  cancelOrderTimer,
};
