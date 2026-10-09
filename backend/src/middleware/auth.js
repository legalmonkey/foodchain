const jwt = require("jsonwebtoken");
const config = require("../config/env");
const User = require("../models/User");
const inMemoryDb = require("../services/inMemoryDb");
const mongoose = require("mongoose");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No authentication token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(decoded.id).select("-passwordHash");
      } catch (e) {
        // Fallback
      }
    }

    if (!user) {
      const memUser = inMemoryDb.users.find(
        (u) => u._id === decoded.id || u.walletAddress.toLowerCase() === decoded.walletAddress?.toLowerCase()
      );
      if (memUser) {
        const { passwordHash, ...safeUser } = memUser;
        user = safeUser;
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid token: user not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!roles.includes(req.user.role) && req.user.role !== "admin") {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: [${roles.join(", ")}]`,
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
};
