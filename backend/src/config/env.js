const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/foodchain",
  jwtSecret: process.env.JWT_SECRET || "dev_secret_key_foodchain_2026",

  blockchain: {
    rpcUrl: process.env.AMOY_RPC_URL || "http://127.0.0.1:8545",
    relayerPrivateKey: process.env.BACKEND_WALLET_PRIVATE_KEY || "",
    contracts: {
      userRegistry: process.env.USER_REGISTRY_ADDRESS || "",
      orderRegistry: process.env.ORDER_REGISTRY_ADDRESS || "",
      complaintRegistry: process.env.COMPLAINT_REGISTRY_ADDRESS || "",
      disputeResolution: process.env.DISPUTE_RESOLUTION_ADDRESS || "",
      reputationManager: process.env.REPUTATION_MANAGER_ADDRESS || "",
    },
  },

  ipfs: {
    pinataJwt: process.env.PINATA_JWT || "",
    gatewayUrl: process.env.PINATA_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs",
  },

  orderTimers: {
    placedToAccepted: parseInt(process.env.TIMER_PLACED_TO_ACCEPTED || "20", 10) * 1000,
    acceptedToPreparing: parseInt(process.env.TIMER_ACCEPTED_TO_PREPARING || "45", 10) * 1000,
    preparingToOut: parseInt(process.env.TIMER_PREPARING_TO_OUT || "60", 10) * 1000,
    outToDelivered: parseInt(process.env.TIMER_OUT_TO_DELIVERED || "90", 10) * 1000,
  },
};

module.exports = config;
