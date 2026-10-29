const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { verifyToken, requireRole } = require("../middleware/auth");

router.use(verifyToken, requireRole("admin"));

router.get("/orders", adminController.getAllOrders);
router.patch("/orders/:id/force-status", adminController.forceOrderStatus);
router.post("/orders/:id/dispatch-escrow", adminController.dispatchEscrow);
router.post("/orders/:id/refund-escrow", adminController.refundEscrow);
router.post("/orders/:id/clawback-order", adminController.clawbackOrder);
router.get("/complaints", adminController.getAllComplaints);
router.post("/complaints/:caseId/force-finalize", adminController.forceFinalizeDispute);

module.exports = router;
