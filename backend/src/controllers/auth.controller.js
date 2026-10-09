const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const inMemoryDb = require("../services/inMemoryDb");
const { getOnChainReputation } = require("../services/blockchain");
const mongoose = require("mongoose");

exports.register = async (req, res) => {
  try {
    const { role, name, phone, walletAddress, password, restaurantName, cuisine, address } = req.body;

    if (!role || !name || !walletAddress || !password) {
      return res.status(400).json({ error: "Missing required registration fields" });
    }

    const normalizedWallet = walletAddress.toLowerCase().trim();

    // Check existing
    let existing = null;
    if (mongoose.connection.readyState === 1) {
      try {
        existing = await User.findOne({ walletAddress: normalizedWallet });
      } catch (e) {}
    }
    if (!existing) {
      existing = inMemoryDb.users.find((u) => u.walletAddress.toLowerCase() === normalizedWallet);
    }

    if (existing) {
      return res.status(400).json({ error: "A user with this wallet address is already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUserData = {
      _id: "usr_" + Date.now().toString(36),
      walletAddress: normalizedWallet,
      role,
      name,
      phone,
      passwordHash,
      isJuror: role === "juror",
      jurorStake: "0",
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const user = new User(newUserData);
        await user.save();
        if (role === "restaurant") {
          const restaurant = new Restaurant({
            ownerUserId: user._id,
            walletAddress: normalizedWallet,
            name: restaurantName || `${name}'s Kitchen`,
            cuisine: cuisine || ["Fast Food", "Indian"],
            address: address || "123 Main Food Street",
            reputationScore: 70,
          });
          await restaurant.save();
        }
      } catch (e) {
        inMemoryDb.users.push(newUserData);
      }
    } else {
      inMemoryDb.users.push(newUserData);
      if (role === "restaurant") {
        inMemoryDb.restaurants.push({
          _id: "res_" + Date.now().toString(36),
          ownerUserId: newUserData._id,
          walletAddress: normalizedWallet,
          name: restaurantName || `${name}'s Kitchen`,
          cuisine: cuisine || ["Fast Food", "Indian"],
          address: address || "123 Main Food Street",
          imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop",
          isOpen: true,
          reputationScore: 70,
        });
      }
    }

    const token = jwt.sign(
      { id: newUserData._id, role: newUserData.role, walletAddress: normalizedWallet },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUserData._id,
        name: newUserData.name,
        role: newUserData.role,
        walletAddress: newUserData.walletAddress,
        isJuror: newUserData.isJuror,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { walletAddress, password } = req.body;
    if (!walletAddress || !password) {
      return res.status(400).json({ error: "Wallet address and password required" });
    }

    const normalizedWallet = walletAddress.toLowerCase().trim();

    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ walletAddress: normalizedWallet });
      } catch (e) {}
    }

    if (!user) {
      user = inMemoryDb.users.find((u) => u.walletAddress.toLowerCase() === normalizedWallet);
    }

    if (!user) {
      return res.status(404).json({ error: "User with this wallet address not found. Please register." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, walletAddress: normalizedWallet },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    let restaurantProfile = null;
    if (user.role === "restaurant") {
      if (mongoose.connection.readyState === 1) {
        try {
          restaurantProfile = await Restaurant.findOne({ walletAddress: normalizedWallet });
        } catch (e) {}
      }
      if (!restaurantProfile) {
        restaurantProfile = inMemoryDb.restaurants.find((r) => r.walletAddress.toLowerCase() === normalizedWallet);
      }
    }

    let onChainRep = 70;
    try {
      onChainRep = await getOnChainReputation(normalizedWallet);
    } catch (e) {}

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        walletAddress: user.walletAddress,
        isJuror: user.isJuror,
        restaurant: restaurantProfile,
        reputationScore: onChainRep,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    let user = req.user;
    let restaurant = null;

    if (user.role === "restaurant") {
      if (mongoose.connection.readyState === 1) {
        try {
          restaurant = await Restaurant.findOne({ walletAddress: user.walletAddress });
        } catch (e) {}
      }
      if (!restaurant) {
        restaurant = inMemoryDb.restaurants.find((r) => r.walletAddress.toLowerCase() === user.walletAddress.toLowerCase());
      }
    }

    let reputation = 70;
    try {
      reputation = await getOnChainReputation(user.walletAddress);
    } catch (e) {}

    res.json({
      user,
      restaurant,
      reputationScore: reputation,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
