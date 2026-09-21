const express = require("express");
const router = express.Router();
const multer = require("multer");
const complaintController = require("../controllers/complaint.controller");
const { verifyToken } = require("../middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

router.post("/", verifyToken, upload.single("evidence"), complaintController.prepareComplaint);
router.post("/sync", verifyToken, complaintController.syncComplaintAfterTx);
router.get("/mine", verifyToken, complaintController.getMyComplaints);
router.get("/:id", verifyToken, complaintController.getComplaintById);

module.exports = router;
