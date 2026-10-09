const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const inMemoryDb = require("../services/inMemoryDb");
const { createOnChainOrder, assignOnChainDelivery } = require("../services/blockchain");
const { advanceOrderStatus, scheduleNextTransition } = require("../services/orderStateMachine");
const { getIO } = require("../sockets/socketHandler");
const mongoose = require("mongoose");

exports.createOrder = async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress } = req.body;
    if (!restaurantId || !items || !items.length || !deliveryAddress) {
      return res.status(400).json({ error: "Restaurant, items, and delivery address are required" });
    }

    let restaurant = null;
    if (mongoose.connection.readyState === 1) {
      try {
        restaurant = await Restaurant.findById(restaurantId);
      } catch (e) {}
    }
    if (!restaurant) {
      restaurant = inMemoryDb.restaurants.find((r) => r._id === restaurantId || r.name.toLowerCase().includes(restaurantId.toLowerCase()));
    }
    if (!restaurant) {
      // Fallback to first restaurant
      restaurant = inMemoryDb.restaurants[0];
    }

    // Verify and compute total price securely
    let computedTotal = 0;
    const orderItems = [];

    for (const item of items) {
      let dbItem = null;
      if (mongoose.connection.readyState === 1) {
        try {
          dbItem = await MenuItem.findById(item.menuItemId);
        } catch (e) {}
      }
      if (!dbItem) {
        dbItem = inMemoryDb.menuItems.find((m) => m._id === item.menuItemId || m.name === item.name);
      }
      const itemPrice = dbItem ? dbItem.price : (item.price || 200);
      computedTotal += itemPrice * (item.qty || 1);
      orderItems.push({
        menuItemId: dbItem ? dbItem._id : item.menuItemId,
        name: dbItem ? dbItem.name : (item.name || "Menu Item"),
        qty: item.qty || 1,
        price: itemPrice,
      });
    }

    const newOrderData = {
      _id: "ord_" + Date.now().toString(36),
      customerId: req.user._id,
      restaurantId: restaurant._id,
      items: orderItems,
      totalPrice: computedTotal,
      deliveryAddress,
      status: "PLACED",
      statusTimestamps: { placed: new Date() },
      createdAt: new Date(),
    };

    let order = null;
    if (mongoose.connection.readyState === 1) {
      try {
        order = new Order(newOrderData);
        await order.save();
      } catch (e) {
        order = newOrderData;
        inMemoryDb.orders.unshift(newOrderData);
      }
    } else {
      order = newOrderData;
      inMemoryDb.orders.unshift(newOrderData);
    }

    // Call on-chain order ref creation (backend relayer signs)
    try {
      const onChainResult = await createOnChainOrder(
        order._id.toString(),
        req.user.walletAddress,
        restaurant.walletAddress
      );
      if (typeof onChainResult === "string") {
        order.onChainOrderKey = onChainResult;
      } else if (onChainResult?.orderKey) {
        order.onChainOrderKey = onChainResult.orderKey;
      }
      if (order.save) await order.save();
    } catch (chainErr) {
      console.warn("On-chain order anchor warning:", chainErr.message);
    }

    // Schedule auto-advance lifecycle timer
    const io = getIO();
    scheduleNextTransition(order, io);

    // Format populated order
    const populated = {
      ...order,
      customerId: { _id: req.user._id, name: req.user.name, walletAddress: req.user.walletAddress },
      restaurantId: { _id: restaurant._id, name: restaurant.name, walletAddress: restaurant.walletAddress, address: restaurant.address },
    };

    if (io) {
      io.emit("orderCreated", populated);
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    let order = null;
    if (mongoose.connection.readyState === 1) {
      try {
        order = await Order.findById(req.params.id)
          .populate("customerId", "name walletAddress phone")
          .populate("restaurantId", "name walletAddress address")
          .populate("deliveryPartnerId", "name walletAddress phone");
      } catch (e) {}
    }

    if (!order) {
      order = inMemoryDb.orders.find((o) => o._id === req.params.id);
      if (order) {
        const customer = inMemoryDb.users.find((u) => u._id === order.customerId);
        const restaurant = inMemoryDb.restaurants.find((r) => r._id === order.restaurantId);
        const delivery = inMemoryDb.users.find((u) => u._id === order.deliveryPartnerId);
        order = {
          ...order,
          customerId: customer || { name: "Customer", walletAddress: "0x..." },
          restaurantId: restaurant || { name: "Restaurant", walletAddress: "0x..." },
          deliveryPartnerId: delivery || null,
        };
      }
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    let orders = [];
    if (mongoose.connection.readyState === 1) {
      try {
        let query = {};
        if (req.user.role === "customer") query = { customerId: req.user._id };
        else if (req.user.role === "restaurant") {
          const rest = await Restaurant.findOne({ walletAddress: req.user.walletAddress });
          if (rest) query = { restaurantId: rest._id };
        } else if (req.user.role === "delivery_partner") query = { deliveryPartnerId: req.user._id };

        orders = await Order.find(query)
          .sort({ createdAt: -1 })
          .populate("customerId", "name walletAddress")
          .populate("restaurantId", "name walletAddress address")
          .populate("deliveryPartnerId", "name walletAddress phone");
      } catch (e) {}
    }

    if (!orders || orders.length === 0) {
      let filtered = inMemoryDb.orders;
      if (req.user.role === "customer") {
        filtered = inMemoryDb.orders.filter((o) => o.customerId === req.user._id);
      } else if (req.user.role === "restaurant") {
        const rest = inMemoryDb.restaurants.find((r) => r.walletAddress.toLowerCase() === req.user.walletAddress.toLowerCase());
        filtered = rest ? inMemoryDb.orders.filter((o) => o.restaurantId === rest._id) : [];
      } else if (req.user.role === "delivery_partner") {
        filtered = inMemoryDb.orders.filter((o) => o.deliveryPartnerId === req.user._id);
      }

      orders = filtered.map((o) => {
        const customer = inMemoryDb.users.find((u) => u._id === o.customerId);
        const restaurant = inMemoryDb.restaurants.find((r) => r._id === o.restaurantId);
        const delivery = inMemoryDb.users.find((u) => u._id === o.deliveryPartnerId);
        return {
          ...o,
          customerId: customer || { name: "Customer", walletAddress: "0x..." },
          restaurantId: restaurant || { name: "Restaurant", walletAddress: "0x..." },
          deliveryPartnerId: delivery || null,
        };
      });
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let order = null;
    if (mongoose.connection.readyState === 1) {
      try {
        order = await Order.findById(req.params.id);
      } catch (e) {}
    }
    if (!order) {
      order = inMemoryDb.orders.find((o) => o._id === req.params.id);
    }
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = status;
    if (!order.statusTimestamps) order.statusTimestamps = {};
    order.statusTimestamps[status.toLowerCase()] = new Date();
    if (order.save) await order.save();

    const io = getIO();
    if (io) io.emit("orderStatusUpdated", { orderId: order._id, status });

    res.json({ message: `Order status advanced to ${status}`, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.assignDelivery = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;
    let order = null;
    if (mongoose.connection.readyState === 1) {
      try {
        order = await Order.findById(req.params.id);
      } catch (e) {}
    }
    if (!order) {
      order = inMemoryDb.orders.find((o) => o._id === req.params.id);
    }
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.deliveryPartnerId = deliveryPartnerId;
    if (order.save) await order.save();

    res.json({ message: "Delivery partner assigned", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
