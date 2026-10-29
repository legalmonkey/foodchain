const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const escrowSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["HELD_BY_ADMIN", "DISPATCHED", "REFUNDED"],
    default: "HELD_BY_ADMIN",
  },
  amount: { type: Number, default: 0 },
  heldBy: { type: String, default: "Platform Admin Escrow" },
  restaurantAmount: { type: Number, default: 0 },
  riderAmount: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  dispatchedAt: { type: Date, default: null },
  refundedAt: { type: Date, default: null },
  notes: { type: String, default: "" },
});

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
    index: true,
  },
  deliveryPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true,
  },
  items: [orderItemSchema],
  totalPrice: {
    type: Number,
    required: true,
  },
  deliveryAddress: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["PLACED", "ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CLOSED"],
    default: "PLACED",
    index: true,
  },
  statusTimestamps: {
    placed: { type: Date, default: Date.now },
    accepted: { type: Date },
    preparing: { type: Date },
    outForDelivery: { type: Date },
    delivered: { type: Date },
    closed: { type: Date },
  },
  escrow: {
    type: escrowSchema,
    default: () => ({ status: "HELD_BY_ADMIN" }),
  },
  onChainOrderKey: {
    type: String,
    default: null,
    index: true,
  },
  txHash: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
