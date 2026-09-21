const { getOnChainReputation } = require("../services/blockchain");
const ComplaintCache = require("../models/ComplaintCache");
const Restaurant = require("../models/Restaurant");

exports.getReputation = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const normalized = walletAddress.toLowerCase().trim();

    const score = await getOnChainReputation(normalized);
    const complaintsAgainst = await ComplaintCache.find({ respondentAddress: normalized }).sort({ filedAt: -1 });

    const upheldCount = complaintsAgainst.filter((c) => c.verdictUpheld).length;
    const dismissedCount = complaintsAgainst.filter((c) => c.status === "Resolved" && !c.verdictUpheld).length;

    res.json({
      walletAddress: normalized,
      score,
      totalComplaints: complaintsAgainst.length,
      upheldCount,
      dismissedCount,
      history: complaintsAgainst,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
