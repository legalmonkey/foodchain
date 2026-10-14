const mongoose = require("mongoose");

const complaintCacheSchema = new mongoose.Schema({
  onChainComplaintId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  orderId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true,
  },
  onChainOrderKey: {
    type: String,
    required: true,
  },
  filerAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  respondentAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  category: {
    type: String,
    enum: ["FoodQuality", "LateDelivery", "WrongOrMissingItem", "HygienePackaging", "Behaviour"],
    required: true,
  },
  categoryIndex: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  evidenceCID: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Filed", "AutoResolved", "Contested", "InDispute", "Resolved"],
    default: "Filed",
    index: true,
  },
  statusIndex: {
    type: Number,
    default: 0,
  },
  caseId: {
    type: Number,
    default: null,
  },
  verdictUpheld: {
    type: Boolean,
    default: false,
  },
  filedAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("ComplaintCache", complaintCacheSchema);
