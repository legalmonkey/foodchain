const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurant.controller");
const { verifyToken, requireRole } = require("../middleware/auth");

router.get("/", restaurantController.getAllRestaurants);
router.get("/:id", restaurantController.getRestaurantById);
router.post("/:id/menu", verifyToken, requireRole("restaurant", "admin"), restaurantController.addMenuItem);
router.patch("/:id/menu/:itemId", verifyToken, requireRole("restaurant", "admin"), restaurantController.updateMenuItem);
router.delete("/:id/menu/:itemId", verifyToken, requireRole("restaurant", "admin"), restaurantController.deleteMenuItem);

module.exports = router;
