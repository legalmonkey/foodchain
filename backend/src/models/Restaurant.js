const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  cuisine: {
    type: [String],
    default: [],
  },
  address: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    default: "",
  },
  isOpen: {
    type: Boolean,
    default: true,
  },
  reputationScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
