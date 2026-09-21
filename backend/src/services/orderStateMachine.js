const Order = require("../models/Order");
const User = require("../models/User");
const config = require("../config/env");
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

  const order = await Order.findById(orderId);
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
  const now = new Date();

  if (targetStatus === "ACCEPTED") {
    order.statusTimestamps.accepted = now;
  } else if (targetStatus === "PREPARING") {
    order.statusTimestamps.preparing = now;
  } else if (targetStatus === "OUT_FOR_DELIVERY") {
    order.statusTimestamps.outForDelivery = now;

    // If no delivery partner assigned yet, auto-assign an active delivery partner
    if (!order.deliveryPartnerId) {
      const deliveryPartner = await User.findOne({ role: "delivery_partner" });
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
  } else if (targetStatus === "CLOSED") {
    order.statusTimestamps.closed = now;
  }

  await order.save();

  // Populate references for clean frontend payload
  const populatedOrder = await Order.findById(order._id)
    .populate("customerId", "name walletAddress")
    .populate("restaurantId", "name walletAddress address")
    .populate("deliveryPartnerId", "name walletAddress phone");

  if (io) {
    io.emit("orderStatusChanged", {
      orderId: order._id,
      status: order.status,
      order: populatedOrder,
      triggeredBy,
    });
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
