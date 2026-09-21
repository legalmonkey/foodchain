const Order = require("../models/Order");
const ComplaintCache = require("../models/ComplaintCache");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const { advanceOrderStatus } = require("../services/orderStateMachine");
const { getIO } = require("../sockets/socketHandler");
const { getContracts } = require("../services/blockchain");

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("customerId", "name walletAddress")
      .populate("restaurantId", "name walletAddress address")
      .populate("deliveryPartnerId", "name walletAddress phone");

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
    const updated = await advanceOrderStatus(id, status, io, "ADMIN_FORCE");
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await ComplaintCache.find()
      .sort({ filedAt: -1 })
      .populate("orderId");

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
    const receipt = await tx.wait();

    res.json({
      message: "Dispute force-finalized successfully by Admin",
      txHash: receipt.hash,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
