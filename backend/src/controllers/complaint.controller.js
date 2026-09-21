const ComplaintCache = require("../models/ComplaintCache");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const { uploadToIPFS } = require("../services/ipfs");
const config = require("../config/env");

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

    const order = await Order.findById(orderId)
      .populate("customerId", "walletAddress")
      .populate("restaurantId", "walletAddress")
      .populate("deliveryPartnerId", "walletAddress");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.customerId.walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the customer who placed this order can file a complaint" });
    }

    if (order.status !== "DELIVERED" && order.status !== "CLOSED" && req.user.role !== "admin") {
      return res.status(400).json({ error: "Complaints can only be filed once the order is DELIVERED" });
    }

    // Determine respondent based on category
    let respondentAddress = "";
    if (category === "LateDelivery" || category === "Behaviour") {
      respondentAddress = order.deliveryPartnerId ? order.deliveryPartnerId.walletAddress : order.restaurantId.walletAddress;
    } else {
      respondentAddress = order.restaurantId.walletAddress;
    }

    // Pin evidence to IPFS via Pinata
    const ipfsResult = await uploadToIPFS(req.file.buffer, req.file.originalname, req.file.mimetype);

    const categoryIndex = CATEGORY_MAP[category] !== undefined ? CATEGORY_MAP[category] : 0;

    res.status(200).json({
      message: "Evidence successfully pinned to IPFS. Sign transaction via MetaMask to register complaint on-chain.",
      orderKey: order.onChainOrderKey,
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

    const complaint = await ComplaintCache.findOneAndUpdate(
      { onChainComplaintId: Number(onChainComplaintId) },
      {
        onChainComplaintId: Number(onChainComplaintId),
        orderId,
        onChainOrderKey: orderKey,
        filerAddress: req.user.walletAddress.toLowerCase(),
        respondentAddress: respondentAddress.toLowerCase(),
        category,
        categoryIndex,
        evidenceCID,
        description,
        txHash,
        status: "Filed",
        statusIndex: 0,
        filedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const userWallet = req.user.walletAddress.toLowerCase();
    const query = {
      $or: [{ filerAddress: userWallet }, { respondentAddress: userWallet }],
    };

    const complaints = await ComplaintCache.find(query)
      .sort({ filedAt: -1 })
      .populate("orderId");

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await ComplaintCache.findOne({
      $or: [{ _id: req.params.id }, { onChainComplaintId: Number(req.params.id) || -1 }],
    }).populate("orderId");

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json({
      ...complaint.toObject(),
      evidenceUrl: `${config.ipfs.gatewayUrl}/${complaint.evidenceCID}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
