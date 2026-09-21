const express = require("express");
const router = express.Router();
const reputationController = require("../controllers/reputation.controller");

router.get("/:walletAddress", reputationController.getReputation);

module.exports = router;
