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
    let orders = [];
    if (mongoose.connection.readyState === 1) {
      try {
        orders = await Order.find()
          .sort({ createdAt: -1 })
          .populate("customerId", "name walletAddress")
          .populate("restaurantId", "name walletAddress address")
          .populate("deliveryPartnerId", "name walletAddress phone");
      } catch (e) {}
    }

    if (!orders || orders.length === 0) {
      orders = inMemoryDb.orders.map((o) => {
        const customer = inMemoryDb.users.find((u) => u._id === o.customerId);
        const restaurant = inMemoryDb.restaurants.find((r) => r._id === o.restaurantId);
        const delivery = inMemoryDb.users.find((u) => u._id === o.deliveryPartnerId);
        return {
          ...o,
          customerId: customer || { name: "Customer", walletAddress: "0x..." },
          restaurantId: restaurant || { name: "Restaurant", walletAddress: "0x..." },
          deliveryPartnerId: delivery || null,
        };
      });
    }

    res.json(orders);
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
    let complaints = [];
    if (mongoose.connection.readyState === 1) {
      try {
        complaints = await ComplaintCache.find()
          .sort({ filedAt: -1 })
          .populate("orderId");
      } catch (e) {}
    }

    if (!complaints || complaints.length === 0) {
      complaints = inMemoryDb.complaintCaches;
    }

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forceFinalizeDispute = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { forcedVerdict } = req.body; // 1 = Uphold, 2 = Reject
    const contracts = getContracts();

    if (!contracts.DisputeResolution) {
      return res.status(400).json({ error: "DisputeResolution contract not available" });
    }

    const tx = await contracts.DisputeResolution.forceFinalize(caseId, forcedVerdict);
    await tx.wait();

    res.json({ message: `Dispute Case #${caseId} forced to verdict ${forcedVerdict}`, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
