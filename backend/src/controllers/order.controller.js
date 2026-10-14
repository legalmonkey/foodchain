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
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(restaurantId)) {
      try {
        restaurant = await Restaurant.findById(restaurantId).lean();
      } catch (e) {}
    }
    if (!restaurant) {
      restaurant = inMemoryDb.restaurants.find(
        (r) => String(r._id) === String(restaurantId) || r.name.toLowerCase().includes(String(restaurantId).toLowerCase())
      );
    }
    if (!restaurant) {
      restaurant = inMemoryDb.restaurants[0];
    }

    // Verify and compute total price securely
    let computedTotal = 0;
    const orderItems = [];

    for (const item of items) {
      let dbItem = null;
      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(item.menuItemId)) {
        try {
          dbItem = await MenuItem.findById(item.menuItemId).lean();
        } catch (e) {}
      }
      if (!dbItem) {
        dbItem = inMemoryDb.menuItems.find(
          (m) => String(m._id) === String(item.menuItemId) || m.name === item.name
        );
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

    const isMongoValid =
      mongoose.connection.readyState === 1 &&
      mongoose.Types.ObjectId.isValid(req.user._id) &&
      mongoose.Types.ObjectId.isValid(restaurant._id);

    const orderId = isMongoValid ? new mongoose.Types.ObjectId() : "ord_" + Date.now().toString(36);

    const newOrderData = {
      _id: orderId,
      customerId: req.user._id,
      customerWallet: (req.user.walletAddress || "").toLowerCase(),
      restaurantId: restaurant._id,
      restaurantWallet: (restaurant.walletAddress || "").toLowerCase(),
      items: orderItems,
      totalPrice: computedTotal,
      deliveryAddress,
      status: "PLACED",
      statusTimestamps: { placed: new Date() },
      createdAt: new Date(),
    };

    let order = newOrderData;
    if (isMongoValid) {
      try {
        const mongoDoc = new Order(newOrderData);
        await mongoDoc.save();
        order = mongoDoc.toObject();
      } catch (e) {
        console.warn("Mongo order save fallback to in-memory store:", e.message);
      }
    }

    // Ensure order is always in inMemoryDb for fast retrieval and auto-advance
    inMemoryDb.orders.unshift(order);

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
        order.txHash = onChainResult.txHash;
      }
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
    const reqOrderId = req.params.id;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(reqOrderId)) {
      try {
        order = await Order.findById(reqOrderId)
          .populate("customerId", "name walletAddress phone")
          .populate("restaurantId", "name walletAddress address")
          .populate("deliveryPartnerId", "name walletAddress phone")
          .lean();
      } catch (e) {}
    }

    if (!order) {
      order = inMemoryDb.orders.find((o) => String(o._id) === String(reqOrderId));
      if (order) {
        const customer = inMemoryDb.users.find((u) => String(u._id) === String(order.customerId));
        const restaurant = inMemoryDb.restaurants.find((r) => String(r._id) === String(order.restaurantId));
        const delivery = inMemoryDb.users.find((u) => String(u._id) === String(order.deliveryPartnerId));
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
    let dbOrders = [];
    const activeRestId = req.query.restaurantId;

    if (mongoose.connection.readyState === 1) {
      try {
        let query = {};
        if (req.user.role === "customer") {
          query = { customerId: req.user._id };
        } else if (req.user.role === "restaurant") {
          if (activeRestId && mongoose.Types.ObjectId.isValid(activeRestId)) {
            query = { restaurantId: activeRestId };
          } else if (activeRestId && !mongoose.Types.ObjectId.isValid(activeRestId)) {
            query = null; // String ID like res_truffles_01 is in inMemoryDb
          } else {
            const rest = await Restaurant.findOne({
              $or: [
                { walletAddress: req.user.walletAddress.toLowerCase() },
                ...(mongoose.Types.ObjectId.isValid(req.user._id) ? [{ ownerUserId: req.user._id }] : [])
              ]
            });
            if (rest) query = { restaurantId: rest._id };
          }
        } else if (req.user.role === "delivery_partner") {
          query = { deliveryPartnerId: req.user._id };
        }

        if (query) {
          dbOrders = await Order.find(query)
            .sort({ createdAt: -1 })
            .populate("customerId", "name walletAddress")
            .populate("restaurantId", "name walletAddress address")
            .populate("deliveryPartnerId", "name walletAddress phone")
            .lean();
        }
      } catch (e) {}
    }

    // Merge DB orders and in-memory orders
    const combinedOrdersMap = new Map();
    for (const o of dbOrders) {
      combinedOrdersMap.set(String(o._id), o);
    }

    let inMemFiltered = inMemoryDb.orders;
    if (req.user.role === "customer") {
      inMemFiltered = inMemoryDb.orders.filter(
        (o) =>
          String(o.customerId) === String(req.user._id) ||
          (o.customerWallet && o.customerWallet.toLowerCase() === req.user.walletAddress?.toLowerCase())
      );
    } else if (req.user.role === "restaurant") {
      if (activeRestId && activeRestId !== "my-restaurant") {
        inMemFiltered = inMemoryDb.orders.filter((o) => String(o.restaurantId) === String(activeRestId));
      } else {
        const userWallet = (req.user.walletAddress || "").toLowerCase();
        const myRest = inMemoryDb.restaurants.find((r) => r.walletAddress?.toLowerCase() === userWallet);
        inMemFiltered = myRest
          ? inMemoryDb.orders.filter((o) => String(o.restaurantId) === String(myRest._id))
          : inMemoryDb.orders;
      }
    } else if (req.user.role === "delivery_partner") {
      inMemFiltered = inMemoryDb.orders.filter(
        (o) =>
          String(o.deliveryPartnerId) === String(req.user._id) ||
          !o.deliveryPartnerId ||
          ["ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"].includes(o.status)
      );
    }

    for (const o of inMemFiltered) {
      if (!combinedOrdersMap.has(String(o._id))) {
        const customer = inMemoryDb.users.find((u) => String(u._id) === String(o.customerId));
        const restaurant = inMemoryDb.restaurants.find((r) => String(r._id) === String(o.restaurantId));
        const delivery = inMemoryDb.users.find((u) => String(u._id) === String(o.deliveryPartnerId));
        combinedOrdersMap.set(String(o._id), {
          ...o,
          customerId: customer || o.customerId || { name: req.user.name || "Customer", walletAddress: req.user.walletAddress },
          restaurantId: restaurant || o.restaurantId || { name: "Restaurant", walletAddress: "0x..." },
          deliveryPartnerId: delivery || null,
        });
      }
    }

    const orders = Array.from(combinedOrdersMap.values()).sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let order = null;
    const reqOrderId = req.params.id;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(reqOrderId)) {
      try {
        order = await Order.findById(reqOrderId);
      } catch (e) {}
    }
    if (!order) {
      order = inMemoryDb.orders.find((o) => String(o._id) === String(reqOrderId));
    }
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = status;
    if (!order.statusTimestamps) order.statusTimestamps = {};
    order.statusTimestamps[status.toLowerCase()] = new Date();

    if (req.user?.role === "delivery_partner" && !order.deliveryPartnerId) {
      order.deliveryPartnerId = req.user._id;
      order.deliveryPartnerWallet = req.user.walletAddress;
    }

    if (order.save) {
      try {
        await order.save();
      } catch (e) {}
    }

    const io = getIO();
    const eventPayload = { orderId: order._id, status, order };
    if (io) {
      io.emit("orderStatusChanged", eventPayload);
      io.emit("orderStatusUpdated", eventPayload);
    }

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
