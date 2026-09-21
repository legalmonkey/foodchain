const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { verifyToken, requireRole } = require("../middleware/auth");

router.post("/", verifyToken, requireRole("customer", "admin"), orderController.createOrder);
router.get("/mine", verifyToken, orderController.getMyOrders);
router.get("/:id", verifyToken, orderController.getOrderById);
router.patch("/:id/status", verifyToken, requireRole("restaurant", "delivery_partner", "admin"), orderController.updateOrderStatus);
router.post("/:id/assign-delivery", verifyToken, requireRole("admin", "restaurant"), orderController.assignDelivery);

module.exports = router;
