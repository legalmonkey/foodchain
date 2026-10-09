const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const inMemoryDb = require("../services/inMemoryDb");
const { getOnChainReputation } = require("../services/blockchain");
const mongoose = require("mongoose");

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
        if (mongoose.connection.readyState === 1) {
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
    let restaurant = null;
    let menuItems = [];

    if (mongoose.connection.readyState === 1) {
      try {
        restaurant = await Restaurant.findById(req.params.id);
        if (restaurant) {
          menuItems = await MenuItem.find({ restaurantId: restaurant._id });
          restaurant = restaurant.toObject();
        }
      } catch (e) {}
    }

    if (!restaurant) {
      restaurant = inMemoryDb.restaurants.find(
        (r) => r._id === req.params.id || r.name.toLowerCase().includes(req.params.id.toLowerCase())
      );
      if (restaurant) {
        menuItems = inMemoryDb.menuItems.filter((m) => m.restaurantId === restaurant._id);
      }
    }

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
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
    if (mongoose.connection.readyState === 1) {
      try {
        restaurant = await Restaurant.findById(req.params.id);
      } catch (e) {}
    }
    if (!restaurant) {
      restaurant = inMemoryDb.restaurants.find((r) => r._id === req.params.id);
    }

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    if (restaurant.walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the restaurant owner can add menu items" });
    }

    const { name, description, price, category, isVeg, imageUrl } = req.body;
    const newItem = {
      _id: "m_" + Date.now().toString(36),
      restaurantId: restaurant._id,
      name,
      description,
      price: Number(price),
      category: category || "Specials",
      isVeg: Boolean(isVeg),
      imageUrl: imageUrl || restaurant.imageUrl,
      isAvailable: true,
    };

    if (mongoose.connection.readyState === 1) {
      const dbItem = new MenuItem(newItem);
      await dbItem.save();
    } else {
      inMemoryDb.menuItems.push(newItem);
    }

    res.status(201).json({ message: "Menu item added", item: newItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    let item = null;
    if (mongoose.connection.readyState === 1) {
      try {
        item = await MenuItem.findById(req.params.itemId);
        if (item) {
          Object.assign(item, req.body);
          await item.save();
          return res.json({ message: "Menu item updated", item });
        }
      } catch (e) {}
    }

    const memItem = inMemoryDb.menuItems.find((m) => m._id === req.params.itemId);
    if (!memItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    Object.assign(memItem, req.body);
    res.json({ message: "Menu item updated", item: memItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
