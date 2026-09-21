const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const { getOnChainReputation } = require("../services/blockchain");

exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().lean();

    // Attach real on-chain reputation and item count
    const enriched = await Promise.all(
      restaurants.map(async (rest) => {
        const rep = await getOnChainReputation(rest.walletAddress);
        const itemCount = await MenuItem.countDocuments({ restaurantId: rest._id, isAvailable: true });
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
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const menuItems = await MenuItem.find({ restaurantId: restaurant._id });
    const reputation = await getOnChainReputation(restaurant.walletAddress);

    res.json({
      restaurant: {
        ...restaurant.toObject(),
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
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Verify ownership
    if (restaurant.walletAddress !== req.user.walletAddress && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the restaurant owner can add menu items" });
    }

    const { name, description, price, imageUrl, category, isVeg } = req.body;
    if (!name || price === undefined || !category) {
      return res.status(400).json({ error: "Name, price, and category are required" });
    }

    const item = new MenuItem({
      restaurantId: restaurant._id,
      name,
      description,
      price,
      imageUrl,
      category,
      isVeg: isVeg !== undefined ? isVeg : true,
    });
    await item.save();

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await MenuItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const restaurant = await Restaurant.findById(item.restaurantId);
    if (restaurant.walletAddress !== req.user.walletAddress && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the restaurant owner can update menu items" });
    }

    const allowedUpdates = ["name", "description", "price", "imageUrl", "category", "isAvailable", "isVeg"];
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        item[key] = req.body[key];
      }
    }

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
