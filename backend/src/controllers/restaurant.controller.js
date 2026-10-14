const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const inMemoryDb = require("../services/inMemoryDb");
const { getOnChainReputation } = require("../services/blockchain");
const { autoProvisionRestaurant } = require("./auth.controller");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("../config/env");

exports.getAllRestaurants = async (req, res) => {
  try {
    let restaurants = [];
    if (mongoose.connection.readyState === 1) {
      try {
        restaurants = await Restaurant.find().lean();
      } catch (e) {
        // Fallback
      }
    }

    if (!restaurants || restaurants.length === 0) {
      restaurants = inMemoryDb.restaurants;
    }

    // Attach on-chain reputation and item count
    const enriched = await Promise.all(
      restaurants.map(async (rest) => {
        let rep = rest.reputationScore || 70;
        try {
          rep = await getOnChainReputation(rest.walletAddress);
        } catch (e) {}

        let itemCount = 5;
        if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(rest._id)) {
          try {
            itemCount = await MenuItem.countDocuments({ restaurantId: rest._id, isAvailable: true });
          } catch (e) {}
        } else {
          itemCount = inMemoryDb.menuItems.filter((m) => m.restaurantId === rest._id).length || 5;
        }

        return {
          ...rest,
          reputationScore: rep,
          itemCount,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRestaurantById = async (req, res) => {
  try {
    if (!req.user && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
      } catch (e) {}
    }

    let restaurant = null;
    let menuItems = [];
    const reqId = req.params.id;

    if (reqId === "my-restaurant" && req.user) {
      const userWallet = (req.user.walletAddress || "").toLowerCase();
      if (mongoose.connection.readyState === 1) {
        try {
          restaurant = await Restaurant.findOne({
            $or: [
              { walletAddress: userWallet },
              ...(mongoose.Types.ObjectId.isValid(req.user._id) ? [{ ownerUserId: req.user._id }] : []),
            ],
          }).lean();
        } catch (e) {}
      }
      if (!restaurant) {
        restaurant = inMemoryDb.restaurants.find(
          (r) => (r.walletAddress && r.walletAddress.toLowerCase() === userWallet) ||
                 (r.ownerUserId && r.ownerUserId.toString() === req.user._id?.toString())
        );
      }
      if (!restaurant && req.user.role === "restaurant") {
        restaurant = await autoProvisionRestaurant(req.user);
      }
    } else if (reqId && reqId !== "undefined" && reqId !== "null") {
      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(reqId)) {
        try {
          restaurant = await Restaurant.findById(reqId).lean();
        } catch (e) {}
      }

      if (!restaurant) {
        restaurant = inMemoryDb.restaurants.find(
          (r) => r._id?.toString() === reqId || (r.name && r.name.toLowerCase().includes(reqId.toLowerCase()))
        );
      }
    }

    // Fallback: If still not found and authenticated user is a restaurant owner looking up their restaurant
    if (!restaurant && req.user?.role === "restaurant") {
      const userWallet = (req.user.walletAddress || "").toLowerCase();
      if (mongoose.connection.readyState === 1) {
        try {
          restaurant = await Restaurant.findOne({ walletAddress: userWallet }).lean();
        } catch (e) {}
      }
      if (!restaurant) {
        restaurant = inMemoryDb.restaurants.find((r) => r.walletAddress && r.walletAddress.toLowerCase() === userWallet);
      }
      if (!restaurant) {
        restaurant = await autoProvisionRestaurant(req.user);
      }
    }

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(restaurant._id)) {
      try {
        menuItems = await MenuItem.find({ restaurantId: restaurant._id }).lean();
      } catch (e) {}
    }
    if (!menuItems || menuItems.length === 0) {
      menuItems = inMemoryDb.menuItems.filter((m) => m.restaurantId?.toString() === restaurant._id?.toString());
    }

    let reputation = restaurant.reputationScore || 70;
    try {
      reputation = await getOnChainReputation(restaurant.walletAddress);
    } catch (e) {}

    res.json({
      restaurant: {
        ...restaurant,
        reputationScore: reputation,
      },
      menuItems,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addMenuItem = async (req, res) => {
  try {
    let restaurant = null;
    const reqId = req.params.id;
    const userWallet = (req.user?.walletAddress || "").toLowerCase();

    // 1. Try finding by ID if valid
    if (reqId && reqId !== "undefined" && reqId !== "my-restaurant" && reqId !== "null") {
      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(reqId)) {
        try {
          restaurant = await Restaurant.findById(reqId);
        } catch (e) {}
      }
      if (!restaurant) {
        restaurant = inMemoryDb.restaurants.find((r) => r._id?.toString() === reqId);
      }
    }

    // 2. If not found by ID or if ID is my-restaurant/undefined, find by authenticated user's wallet / ownerUserId
    if (!restaurant && userWallet) {
      if (mongoose.connection.readyState === 1) {
        try {
          restaurant = await Restaurant.findOne({
            $or: [
              { walletAddress: userWallet },
              ...(mongoose.Types.ObjectId.isValid(req.user._id) ? [{ ownerUserId: req.user._id }] : []),
            ],
          });
        } catch (e) {}
      }
      if (!restaurant) {
        restaurant = inMemoryDb.restaurants.find(
          (r) => (r.walletAddress && r.walletAddress.toLowerCase() === userWallet) ||
                 (r.ownerUserId && r.ownerUserId.toString() === req.user._id?.toString())
        );
      }
    }

    // 3. Auto-provision if missing and user is restaurant role
    if (!restaurant && req.user?.role === "restaurant") {
      restaurant = await autoProvisionRestaurant(req.user);
    }

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found for this account" });
    }

    if (restaurant.walletAddress.toLowerCase() !== userWallet && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the restaurant owner can add menu items" });
    }

    const { name, description, price, category, isVeg, imageUrl } = req.body;
    const isMongo = mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(restaurant._id);

    const newItem = {
      restaurantId: restaurant._id,
      name,
      description: description || "",
      price: Number(price) || 0,
      category: category || "Specials",
      isVeg: Boolean(isVeg),
      imageUrl: imageUrl || restaurant.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop",
      isAvailable: true,
    };

    if (isMongo) {
      try {
        const dbItem = new MenuItem(newItem);
        await dbItem.save();
        return res.status(201).json({ message: "Menu item added", item: dbItem.toObject() });
      } catch (mongoErr) {
        console.warn("MongoDB save MenuItem error, fallback to in-memory:", mongoErr.message);
      }
    }

    // In-memory fallback
    newItem._id = "m_" + Date.now().toString(36);
    inMemoryDb.menuItems.push(newItem);
    res.status(201).json({ message: "Menu item added", item: newItem });
  } catch (err) {
    console.error("addMenuItem error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    let item = null;
    const itemId = req.params.itemId;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(itemId)) {
      try {
        item = await MenuItem.findById(itemId);
        if (item) {
          Object.assign(item, req.body);
          await item.save();
          return res.json({ message: "Menu item updated", item });
        }
      } catch (e) {}
    }

    const memItem = inMemoryDb.menuItems.find((m) => m._id === itemId);
    if (!memItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    Object.assign(memItem, req.body);
    res.json({ message: "Menu item updated", item: memItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
