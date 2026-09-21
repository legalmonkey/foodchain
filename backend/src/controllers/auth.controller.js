const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const { getOnChainReputation } = require("../services/blockchain");

exports.register = async (req, res) => {
  try {
    const { role, name, phone, walletAddress, password, restaurantName, cuisine, address } = req.body;

    if (!role || !name || !walletAddress || !password) {
      return res.status(400).json({ error: "Missing required registration fields" });
    }

    const normalizedWallet = walletAddress.toLowerCase().trim();
    const existing = await User.findOne({ walletAddress: normalizedWallet });
    if (existing) {
      return res.status(400).json({ error: "A user with this wallet address is already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      walletAddress: normalizedWallet,
      role,
      name,
      phone,
      passwordHash,
    });
    await user.save();

    // If registered as restaurant, create Restaurant profile
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

    const token = jwt.sign({ id: user._id, role: user.role, walletAddress: normalizedWallet }, config.jwtSecret, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        walletAddress: user.walletAddress,
        isJuror: user.isJuror,
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
    const user = await User.findOne({ walletAddress: normalizedWallet });
    if (!user) {
      return res.status(404).json({ error: "User with this wallet address not found. Please register." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password credentials" });
    }

    const token = jwt.sign({ id: user._id, role: user.role, walletAddress: normalizedWallet }, config.jwtSecret, {
      expiresIn: "7d",
    });

    let restaurantProfile = null;
    if (user.role === "restaurant") {
      restaurantProfile = await Restaurant.findOne({ walletAddress: normalizedWallet });
    }

    const onChainRep = await getOnChainReputation(normalizedWallet);

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
    const user = await User.findById(req.user._id).select("-passwordHash");
    let restaurant = null;
    if (user.role === "restaurant") {
      restaurant = await Restaurant.findOne({ walletAddress: user.walletAddress });
    }
    const reputation = await getOnChainReputation(user.walletAddress);

    res.json({
      user,
      restaurant,
      reputationScore: reputation,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
