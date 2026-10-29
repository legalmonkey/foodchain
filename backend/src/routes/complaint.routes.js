const express = require("express");
const router = express.Router();
const multer = require("multer");
const complaintController = require("../controllers/complaint.controller");
const { verifyToken } = require("../middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

router.get("/evidence/:cid", complaintController.getEvidenceFile);
router.post("/", verifyToken, upload.single("evidence"), complaintController.prepareComplaint);
router.post("/sync", verifyToken, complaintController.syncComplaintAfterTx);
router.get("/mine", verifyToken, complaintController.getMyComplaints);
router.post("/:id/accept-fault", verifyToken, complaintController.acceptFault);
router.post("/:id/contest", verifyToken, complaintController.contestComplaint);
router.get("/:id", verifyToken, complaintController.getComplaintById);

module.exports = router;
