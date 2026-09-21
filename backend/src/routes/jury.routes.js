const express = require("express");
const router = express.Router();
const juryController = require("../controllers/jury.controller");
const { verifyToken } = require("../middleware/auth");

router.post("/register", verifyToken, juryController.registerJuror);
router.get("/cases/assigned", verifyToken, juryController.getAssignedCases);
router.get("/cases/:caseId", verifyToken, juryController.getCaseDetails);
router.post("/cases/:caseId/vote", verifyToken, juryController.recordVote);

module.exports = router;
