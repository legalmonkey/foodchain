const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const { createOnChainOrder, assignOnChainDelivery } = require("../services/blockchain");
const { advanceOrderStatus, scheduleNextTransition } = require("../services/orderStateMachine");
const { getIO } = require("../sockets/socketHandler");

exports.createOrder = async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress } = req.body;
    if (!restaurantId || !items || !items.length || !deliveryAddress) {
      return res.status(400).json({ error: "Restaurant, items, and delivery address are required" });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Verify and compute total price securely
    let computedTotal = 0;
    const orderItems = [];

    for (const item of items) {
      const dbItem = await MenuItem.findById(item.menuItemId);
      if (!dbItem) {
        return res.status(400).json({ error: `Menu item not found: ${item.menuItemId}` });
      }
      computedTotal += dbItem.price * item.qty;
      orderItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        qty: item.qty,
        price: dbItem.price,
      });
    }

    const order = new Order({
      customerId: req.user._id,
      restaurantId: restaurant._id,
      items: orderItems,
      totalPrice: computedTotal,
      deliveryAddress,
      status: "PLACED",
      statusTimestamps: { placed: new Date() },
    });

    await order.save();

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
      await order.save();
    } catch (chainErr) {
      console.warn("On-chain order anchor warning:", chainErr.message);
    }

    // Schedule auto-advance lifecycle timer
    const io = getIO();
    scheduleNextTransition(order, io);

    const populated = await Order.findById(order._id)
      .populate("customerId", "name walletAddress")
      .populate("restaurantId", "name walletAddress address")
      .populate("deliveryPartnerId", "name walletAddress phone");

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
    const order = await Order.findById(req.params.id)
      .populate("customerId", "name walletAddress phone")
      .populate("restaurantId", "name walletAddress address")
      .populate("deliveryPartnerId", "name walletAddress phone");

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
    let query = {};
    if (req.user.role === "customer") {
      query = { customerId: req.user._id };
    } else if (req.user.role === "restaurant") {
      const rest = await Restaurant.findOne({ walletAddress: req.user.walletAddress });
      if (!rest) return res.json([]);
      query = { restaurantId: rest._id };
    } else if (req.user.role === "delivery_partner") {
      query = { deliveryPartnerId: req.user._id };
    } else if (req.user.role === "admin") {
      query = {};
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("customerId", "name walletAddress")
      .populate("restaurantId", "name walletAddress address")
      .populate("deliveryPartnerId", "name walletAddress phone");

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({ error: "Target status required" });
    }

    const io = getIO();
    const updated = await advanceOrderStatus(id, status, io, "MANUAL");
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.assignDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryPartnerId } = req.body;

    const partner = await User.findById(deliveryPartnerId);
    if (!partner || partner.role !== "delivery_partner") {
      return res.status(400).json({ error: "Invalid delivery partner" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.deliveryPartnerId = partner._id;
    await order.save();

    if (order.onChainOrderKey) {
      assignOnChainDelivery(order.onChainOrderKey, partner.walletAddress).catch((e) =>
        console.error("Assign on-chain delivery error:", e.message)
      );
    }

    const populated = await Order.findById(order._id)
      .populate("customerId", "name walletAddress")
      .populate("restaurantId", "name walletAddress address")
      .populate("deliveryPartnerId", "name walletAddress phone");

    const io = getIO();
    if (io) {
      io.emit("orderStatusChanged", {
        orderId: order._id,
        status: order.status,
        order: populated,
        triggeredBy: "DELIVERY_ASSIGNED",
      });
    }

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
