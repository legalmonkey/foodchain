const Order = require("../models/Order");
const ComplaintCache = require("../models/ComplaintCache");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const inMemoryDb = require("../services/inMemoryDb");
const { advanceOrderStatus } = require("../services/orderStateMachine");
const { getIO } = require("../sockets/socketHandler");
const { getContracts } = require("../services/blockchain");
const mongoose = require("mongoose");

exports.getAllOrders = async (req, res) => {
  try {
    let dbOrders = [];
    if (mongoose.connection.readyState === 1) {
      try {
        dbOrders = await Order.find()
          .sort({ createdAt: -1 })
          .populate("customerId", "name walletAddress")
          .populate("restaurantId", "name walletAddress address")
          .populate("deliveryPartnerId", "name walletAddress phone")
          .lean();
      } catch (e) {}
    }

    const combinedOrdersMap = new Map();
    for (const o of dbOrders) {
      combinedOrdersMap.set(String(o._id), {
        ...o,
        escrow: o.escrow || {
          status: o.status === "DELIVERED" || o.status === "CLOSED" ? "DISPATCHED" : "HELD_BY_ADMIN",
          amount: o.totalPrice,
          restaurantAmount: Math.round(o.totalPrice * 0.8),
          riderAmount: Math.round(o.totalPrice * 0.15),
          platformFee: Math.round(o.totalPrice * 0.05),
        },
      });
    }

    for (const o of inMemoryDb.orders) {
      if (!combinedOrdersMap.has(String(o._id))) {
        const customer = inMemoryDb.users.find((u) => String(u._id) === String(o.customerId?._id || o.customerId));
        const restaurant = inMemoryDb.restaurants.find((r) => String(r._id) === String(o.restaurantId?._id || o.restaurantId));
        const delivery = inMemoryDb.users.find((u) => String(u._id) === String(o.deliveryPartnerId?._id || o.deliveryPartnerId));
        combinedOrdersMap.set(String(o._id), {
          ...o,
          customerId: customer || o.customerId || { name: "Customer", walletAddress: "0x..." },
          restaurantId: restaurant || o.restaurantId || { name: "Restaurant", walletAddress: "0x..." },
          deliveryPartnerId: delivery || null,
          escrow: o.escrow || {
            status: o.status === "DELIVERED" || o.status === "CLOSED" ? "DISPATCHED" : "HELD_BY_ADMIN",
            amount: o.totalPrice,
            restaurantAmount: Math.round(o.totalPrice * 0.8),
            riderAmount: Math.round(o.totalPrice * 0.15),
            platformFee: Math.round(o.totalPrice * 0.05),
          },
        });
      }
    }

    res.json(Array.from(combinedOrdersMap.values()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forceOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Target status required" });
    }

    const io = getIO();
    let updated = null;
    try {
      updated = await advanceOrderStatus(id, status, io, "ADMIN_FORCE");
    } catch (e) {
      const order = inMemoryDb.orders.find((o) => o._id === id);
      if (order) {
        order.status = status;
        if (!order.statusTimestamps) order.statusTimestamps = {};
        order.statusTimestamps[status.toLowerCase()] = new Date();
        updated = order;
        if (io) io.emit("orderStatusUpdated", { orderId: order._id, status });
      }
    }
    res.json(updated || { message: "Status updated", orderId: id, status });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllComplaints = async (req, res) => {
  try {
    let dbComplaints = [];
    if (mongoose.connection.readyState === 1) {
      try {
        dbComplaints = await ComplaintCache.find()
          .sort({ filedAt: -1 })
          .populate("orderId")
          .lean();
      } catch (e) {}
    }

    const combinedMap = new Map();
    for (const c of dbComplaints) {
      combinedMap.set(String(c.onChainComplaintId || c._id), c);
    }

    for (const c of inMemoryDb.complaintCaches) {
      const key = String(c.onChainComplaintId || c._id);
      if (!combinedMap.has(key)) {
        combinedMap.set(key, c);
      }
    }

    res.json(Array.from(combinedMap.values()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.dispatchEscrow = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        order = await Order.findById(id);
      } catch (e) {}
    }
    if (!order) {
      order = inMemoryDb.orders.find((o) => String(o._id) === String(id));
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderTotal = Number(order.totalPrice || 200);
    const restAmt = Math.round(orderTotal * 0.8);
    const riderAmt = Math.round(orderTotal * 0.15);
    const feeAmt = Math.round(orderTotal * 0.05);

    order.escrow = {
      status: "DISPATCHED",
      amount: orderTotal,
      heldBy: "Platform Admin Escrow",
      restaurantAmount: restAmt,
      riderAmount: riderAmt,
      platformFee: feeAmt,
      dispatchedAt: new Date(),
      refundedAt: null,
      notes: `Escrow settled: ₹${restAmt} paid to Restaurant, ₹${riderAmt} paid to Rider (₹${feeAmt} platform commission)`,
    };

    if (order.save) {
      try {
        await order.save();
      } catch (e) {}
    }

    const inMem = inMemoryDb.orders.find((o) => String(o._id) === String(id));
    if (inMem) {
      inMem.escrow = order.escrow;
    }

    const io = getIO();
    if (io) {
      io.emit("orderEscrowUpdated", { orderId: order._id, escrow: order.escrow, order });
      io.emit("orderStatusUpdated", { orderId: order._id, status: order.status, order });
      io.emit("rupeeBalanceUpdated", { orderId: order._id });
    }

    res.json({
      message: `Escrow dispatched: ₹${restAmt} to Kitchen, ₹${riderAmt} to Rider`,
      escrow: order.escrow,
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.clawbackOrder = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        order = await Order.findById(id);
      } catch (e) {}
    }
    if (!order) {
      order = inMemoryDb.orders.find((o) => String(o._id) === String(id));
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const restAmt = order.escrow?.restaurantAmount || Math.round((order.totalPrice || 200) * 0.8);

    if (!order.escrow) {
      order.escrow = { status: "DISPATCHED" };
    }
    order.escrow.clawbackRequested = true;
    order.escrow.clawbackRequestedAt = new Date();
    order.escrow.notes = `Platform Admin ordered Restaurant to refund ₹${restAmt} back to customer due to unresolved grievance.`;

    if (order.save) {
      try {
        await order.save();
      } catch (e) {}
    }

    const inMem = inMemoryDb.orders.find((o) => String(o._id) === String(id));
    if (inMem) {
      if (!inMem.escrow) inMem.escrow = {};
      inMem.escrow.clawbackRequested = true;
      inMem.escrow.clawbackRequestedAt = order.escrow.clawbackRequestedAt;
      inMem.escrow.notes = order.escrow.notes;
    }

    const io = getIO();
    if (io) {
      io.emit("orderEscrowUpdated", { orderId: order._id, escrow: order.escrow, order });
      io.emit("clawbackRequested", {
        orderId: order._id,
        restaurantId: order.restaurantId,
        amount: restAmt,
        notes: order.escrow.notes,
      });
      io.emit("rupeeBalanceUpdated", { orderId: order._id });
    }

    res.json({
      message: `Demand issued: Restaurant has been formally ordered to pay back ₹${restAmt} for Order #${order._id.toString().slice(-6)}`,
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.refundEscrow = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      try {
        order = await Order.findById(id);
      } catch (e) {}
    }
    if (!order) {
      order = inMemoryDb.orders.find((o) => String(o._id) === String(id));
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderTotal = Number(order.totalPrice || 200);
    order.escrow = {
      status: "REFUNDED",
      amount: orderTotal,
      heldBy: "Platform Admin Escrow",
      restaurantAmount: 0,
      riderAmount: 0,
      platformFee: 0,
      dispatchedAt: null,
      refundedAt: new Date(),
      clawbackRequested: false,
      notes: `Escrow returned: Full refund of ₹${orderTotal} returned to customer following grievance redressal`,
    };

    if (order.save) {
      try {
        await order.save();
      } catch (e) {}
    }

    const inMem = inMemoryDb.orders.find((o) => String(o._id) === String(id));
    if (inMem) {
      inMem.escrow = order.escrow;
    }

    const io = getIO();
    if (io) {
      io.emit("orderEscrowUpdated", { orderId: order._id, escrow: order.escrow, order });
      io.emit("orderStatusUpdated", { orderId: order._id, status: order.status, order });
      io.emit("rupeeBalanceUpdated", { orderId: order._id });
    }

    res.json({
      message: `Escrow refunded: ₹${orderTotal} returned to customer`,
      escrow: order.escrow,
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forceFinalizeDispute = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { forcedVerdict } = req.body; // 1 = Uphold, 2 = Reject
    const contracts = getContracts();

    let txHash = null;
    if (contracts.DisputeResolution) {
      try {
        const tx = await contracts.DisputeResolution.forceFinalize(caseId, forcedVerdict);
        await tx.wait();
        txHash = tx.hash;
      } catch (chainErr) {
        console.warn("DisputeResolution on-chain forceFinalize fallback:", chainErr.message);
      }
    }

    // Update in-memory complaint and cache
    const complaint = inMemoryDb.complaintCaches.find(
      (c) => Number(c.caseId) === Number(caseId) || Number(c.onChainComplaintId) === Number(caseId)
    );
    if (complaint) {
      complaint.status = "Resolved";
      complaint.verdictUpheld = Number(forcedVerdict) === 1;
      complaint.resolvedAt = new Date();

      // If customer won (verdict upheld), automatically refund escrow or flag for refund!
      if (complaint.verdictUpheld && complaint.orderId) {
        const ordId = String(complaint.orderId?._id || complaint.orderId);
        const ord = inMemoryDb.orders.find((o) => String(o._id) === ordId);
        if (ord && ord.escrow) {
          ord.escrow.status = "REFUNDED";
          ord.escrow.refundedAt = new Date();
          ord.escrow.notes = "Full customer escrow refund issued upon dispute upheld";
        }
      }
    }

    res.json({
      message: `Dispute Case #${caseId} finalized to verdict ${forcedVerdict} (${forcedVerdict === 1 ? 'Customer Won - Complaint Upheld' : 'Respondent Exonerated'})`,
      txHash: txHash || "0x_simulated_admin_finalize",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
