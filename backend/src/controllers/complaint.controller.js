const ComplaintCache = require("../models/ComplaintCache");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const inMemoryDb = require("../services/inMemoryDb");
const { uploadToIPFS } = require("../services/ipfs");
const config = require("../config/env");
const mongoose = require("mongoose");

const CATEGORY_MAP = {
  FoodQuality: 0,
  LateDelivery: 1,
  WrongOrMissingItem: 2,
  HygienePackaging: 3,
  Behaviour: 4,
};

exports.prepareComplaint = async (req, res) => {
  try {
    const { orderId, category, description } = req.body;
    if (!orderId || !category) {
      return res.status(400).json({ error: "Order ID and Category are required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Evidence file (photo or video) is required" });
    }

    let order = null;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(orderId)) {
      try {
        order = await Order.findById(orderId)
          .populate("customerId", "walletAddress")
          .populate("restaurantId", "walletAddress")
          .populate("deliveryPartnerId", "walletAddress");
      } catch (e) {}
    }

    if (!order) {
      order = inMemoryDb.orders.find((o) => String(o._id) === String(orderId));
      if (order) {
        const customer = inMemoryDb.users.find((u) => String(u._id) === String(order.customerId));
        const restaurant = inMemoryDb.restaurants.find((r) => String(r._id) === String(order.restaurantId));
        order = {
          ...order,
          customerId: customer || { walletAddress: req.user.walletAddress },
          restaurantId: restaurant || { walletAddress: "0x5555555555555555555555555555555555555501" },
        };
      }
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Determine respondent based on category
    let respondentAddress = "";
    if (category === "LateDelivery" || category === "Behaviour") {
      respondentAddress = order.deliveryPartnerId?.walletAddress || order.restaurantId?.walletAddress || "0x2222222222222222222222222222222222222222";
    } else {
      respondentAddress = order.restaurantId?.walletAddress || "0x5555555555555555555555555555555555555501";
    }

    // Pin evidence to IPFS via Pinata
    const ipfsResult = await uploadToIPFS(req.file.buffer, req.file.originalname, req.file.mimetype);

    const categoryIndex = CATEGORY_MAP[category] !== undefined ? CATEGORY_MAP[category] : 0;

    res.status(200).json({
      message: "Evidence successfully pinned to IPFS. Sign transaction via MetaMask to register complaint on-chain.",
      orderKey: order.onChainOrderKey || "0x" + "0".repeat(64),
      respondentAddress,
      categoryIndex,
      categoryName: category,
      evidenceCID: ipfsResult.cid,
      evidenceUrl: ipfsResult.url,
      description,
      orderId: order._id,
    });
  } catch (err) {
    console.error("Complaint preparation error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.syncComplaintAfterTx = async (req, res) => {
  try {
    const { onChainComplaintId, orderId, orderKey, respondentAddress, category, evidenceCID, description, txHash } = req.body;

    const categoryIndex = CATEGORY_MAP[category] !== undefined ? CATEGORY_MAP[category] : 0;

    const complaintData = {
      _id: "complaint_" + Date.now().toString(36),
      onChainComplaintId: Number(onChainComplaintId),
      orderId,
      onChainOrderKey: orderKey,
      filerAddress: req.user.walletAddress.toLowerCase(),
      respondentAddress: (respondentAddress || "").toLowerCase(),
      category,
      categoryIndex,
      evidenceCID,
      description,
      txHash,
      status: "Filed",
      statusIndex: 0,
      filedAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const updated = await ComplaintCache.findOneAndUpdate(
          { onChainComplaintId: Number(onChainComplaintId) },
          complaintData,
          { upsert: true, new: true }
        );
        return res.status(201).json(updated);
      } catch (e) {}
    }

    inMemoryDb.complaintCaches.unshift(complaintData);
    res.status(201).json(complaintData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const userWallet = (req.user.walletAddress || "").toLowerCase();
    let dbComplaints = [];

    if (mongoose.connection.readyState === 1) {
      try {
        const query = {
          $or: [{ filerAddress: userWallet }, { respondentAddress: userWallet }],
        };
        dbComplaints = await ComplaintCache.find(query).sort({ filedAt: -1 }).lean();
      } catch (e) {}
    }

    const combinedMap = new Map();
    for (const c of dbComplaints) {
      combinedMap.set(String(c.onChainComplaintId || c._id), c);
    }

    const inMem = inMemoryDb.complaintCaches.filter(
      (c) => c.filerAddress === userWallet || c.respondentAddress === userWallet
    );
    for (const c of inMem) {
      const key = String(c.onChainComplaintId || c._id);
      if (!combinedMap.has(key)) {
        combinedMap.set(key, c);
      }
    }

    const complaints = Array.from(combinedMap.values());
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    let complaint = null;
    if (mongoose.connection.readyState === 1) {
      try {
        complaint = await ComplaintCache.findOne({
          $or: [{ _id: req.params.id }, { onChainComplaintId: Number(req.params.id) || -1 }],
        }).populate("orderId");
        if (complaint) complaint = complaint.toObject();
      } catch (e) {}
    }

    if (!complaint) {
      complaint = inMemoryDb.complaintCaches.find(
        (c) => c._id === req.params.id || c.onChainComplaintId === Number(req.params.id)
      );
    }

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json({
      ...complaint,
      evidenceUrl: `${config.ipfs.gatewayUrl}/${complaint.evidenceCID}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
