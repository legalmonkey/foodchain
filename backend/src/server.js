const express = require("express");
const http = require("http");
const cors = require("cors");
const config = require("./config/env");
const connectDB = require("./config/db");
const { setupSockets } = require("./sockets/socketHandler");
const { initBlockchain, initEventListeners } = require("./services/blockchain");

// Import Routes
const authRoutes = require("./routes/auth.routes");
const restaurantRoutes = require("./routes/restaurant.routes");
const orderRoutes = require("./routes/order.routes");
const complaintRoutes = require("./routes/complaint.routes");
const juryRoutes = require("./routes/jury.routes");
const adminRoutes = require("./routes/admin.routes");
const reputationRoutes = require("./routes/reputation.routes");

const fs = require("fs");
const path = require("path");

const app = express();
const httpServer = http.createServer(app);

// Flexible CORS for Render deployments and local development
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin === config.frontendUrl ||
      origin.endsWith(".onrender.com") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io initialization
const io = setupSockets(httpServer);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "FoodChain Protocol API",
    version: "1.0.0",
    healthCheck: "/api/health",
    frontendOrigin: config.frontendUrl,
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "FoodChain Backend",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/juror", juryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reputation", reputationRoutes);

// Serve frontend static build if present (for single-service Render deployments)
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

async function startServer() {
  await connectDB();
  initBlockchain();
  initEventListeners(io);

  httpServer.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`🚀 FoodChain Backend running on port ${config.port}`);
    console.log(`📡 Environment: ${config.nodeEnv}`);
    console.log(`🌐 Frontend Origin: ${config.frontendUrl}`);
    console.log(`====================================================`);
  });
}

startServer();

module.exports = { app, httpServer };
