const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const inMemoryDb = require("../services/inMemoryDb");
const { getOnChainReputation } = require("../services/blockchain");
const mongoose = require("mongoose");

const autoProvisionRestaurant = async (user, restaurantName, cuisine, address) => {
  const normWallet = (user.walletAddress || "").toLowerCase();
  const restData = {
    name: restaurantName || `${user.name || "Chef"}'s Kitchen`,
    cuisine: Array.isArray(cuisine) && cuisine.length > 0 ? cuisine : ["Fast Food", "Indian"],
    address: address || "123 Main Food Street",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop",
    isOpen: true,
    reputationScore: 70,
    walletAddress: normWallet,
  };

  if (mongoose.connection.readyState === 1) {
    try {
      const ownerId = (user._id && mongoose.Types.ObjectId.isValid(user._id))
        ? user._id
        : new mongoose.Types.ObjectId();
      const newRest = new Restaurant({
        ...restData,
        ownerUserId: ownerId,
      });
      await newRest.save();
      return newRest.toObject();
    } catch (e) {
      console.warn("MongoDB auto-provision restaurant error, fallback to in-memory:", e.message);
    }
  }

  // in-memory fallback
  const inMemRest = {
    _id: "res_" + Date.now().toString(36),
    ownerUserId: user._id ? user._id.toString() : "usr_" + Date.now().toString(36),
    ...restData,
  };
  inMemoryDb.restaurants.push(inMemRest);
  return inMemRest;
};

exports.autoProvisionRestaurant = autoProvisionRestaurant;

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

    const isMongo = mongoose.connection.readyState === 1;
    const userId = isMongo ? new mongoose.Types.ObjectId() : "usr_" + Date.now().toString(36);

    const newUserData = {
      _id: userId,
      walletAddress: normalizedWallet,
      role,
      name,
      phone,
      passwordHash,
      isJuror: role === "juror",
      jurorStake: "0",
    };

    let createdRestaurant = null;
    if (role === "restaurant") {
      createdRestaurant = {
        _id: isMongo ? new mongoose.Types.ObjectId() : "res_" + Date.now().toString(36),
        ownerUserId: userId,
        walletAddress: normalizedWallet,
        name: restaurantName || `${name}'s Kitchen`,
        cuisine: Array.isArray(cuisine) && cuisine.length > 0 ? cuisine : ["Fast Food", "Indian"],
        address: address || "123 Main Food Street",
        imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop",
        isOpen: true,
        reputationScore: 70,
      };
    }

    if (isMongo) {
      try {
        const user = new User(newUserData);
        await user.save();
        if (createdRestaurant) {
          const restaurant = new Restaurant(createdRestaurant);
          await restaurant.save();
        }
      } catch (e) {
        console.error("MongoDB register error, saving to inMemoryDb:", e.message);
        const fallbackUserId = typeof newUserData._id === "object" ? newUserData._id.toString() : newUserData._id;
        inMemoryDb.users.push({ ...newUserData, _id: fallbackUserId });
        if (createdRestaurant) {
          const fallbackRestId = typeof createdRestaurant._id === "object" ? createdRestaurant._id.toString() : createdRestaurant._id;
          inMemoryDb.restaurants.push({
            ...createdRestaurant,
            _id: fallbackRestId,
            ownerUserId: fallbackUserId,
          });
        }
      }
    } else {
      inMemoryDb.users.push(newUserData);
      if (createdRestaurant) {
        inMemoryDb.restaurants.push(createdRestaurant);
      }
    }

    const token = jwt.sign(
      { id: newUserData._id.toString(), role: newUserData.role, walletAddress: normalizedWallet },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUserData._id.toString(),
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
      { id: user._id.toString(), role: user.role, walletAddress: normalizedWallet },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    let restaurantProfile = null;
    if (user.role === "restaurant") {
      if (mongoose.connection.readyState === 1) {
        try {
          restaurantProfile = await Restaurant.findOne({
            $or: [
              { walletAddress: normalizedWallet },
              ...(mongoose.Types.ObjectId.isValid(user._id) ? [{ ownerUserId: user._id }] : []),
            ],
          }).lean();
        } catch (e) {}
      }
      if (!restaurantProfile) {
        restaurantProfile = inMemoryDb.restaurants.find(
          (r) => (r.walletAddress && r.walletAddress.toLowerCase() === normalizedWallet) ||
                 (r.ownerUserId && r.ownerUserId.toString() === user._id.toString())
        );
      }
      if (!restaurantProfile) {
        restaurantProfile = await autoProvisionRestaurant(user);
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
        id: user._id.toString(),
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
      const normWallet = (user.walletAddress || "").toLowerCase();
      if (mongoose.connection.readyState === 1) {
        try {
          restaurant = await Restaurant.findOne({
            $or: [
              { walletAddress: normWallet },
              ...(mongoose.Types.ObjectId.isValid(user._id) ? [{ ownerUserId: user._id }] : []),
            ],
          }).lean();
        } catch (e) {}
      }
      if (!restaurant) {
        restaurant = inMemoryDb.restaurants.find(
          (r) => (r.walletAddress && r.walletAddress.toLowerCase() === normWallet) ||
                 (r.ownerUserId && r.ownerUserId.toString() === user._id.toString())
        );
      }
      if (!restaurant) {
        restaurant = await autoProvisionRestaurant(user);
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
