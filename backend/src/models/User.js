const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  role: {
    type: String,
    enum: ["customer", "restaurant", "delivery_partner", "admin"],
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  isJuror: {
    type: Boolean,
    default: false,
  },
  jurorStake: {
    type: String, // Stored as wei string for precision
    default: "0",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
