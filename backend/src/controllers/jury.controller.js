const User = require("../models/User");
const ComplaintCache = require("../models/ComplaintCache");
const JurorVoteCache = require("../models/JurorVoteCache");
const inMemoryDb = require("../services/inMemoryDb");
const config = require("../config/env");
const { getContracts } = require("../services/blockchain");
const mongoose = require("mongoose");

exports.registerJuror = async (req, res) => {
  try {
    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(req.user._id);
        if (user) {
          user.isJuror = true;
          await user.save();
        }
      } catch (e) {}
    }

    if (!user) {
      user = inMemoryDb.users.find((u) => u._id === req.user._id || u.walletAddress.toLowerCase() === req.user.walletAddress?.toLowerCase());
      if (user) user.isJuror = true;
    }

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      message: "Juror registration recorded. Please sign becomeJuror transaction in MetaMask.",
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        isJuror: true,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAssignedCases = async (req, res) => {
  try {
    const jurorWallet = req.user.walletAddress.toLowerCase();
    const contracts = getContracts();

    let assignedCaseIds = [];

    if (contracts.DisputeResolution) {
      const caseCount = Number(await contracts.DisputeResolution.caseCount());
      for (let i = 1; i <= caseCount; i++) {
        try {
          const isAssigned = await contracts.DisputeResolution.isSelectedJuror(i, jurorWallet);
          if (isAssigned) {
            assignedCaseIds.push(i);
          }
        } catch (e) {
          // ignore single case fetch errors
        }
      }
    }

    const cases = [];
    for (const caseId of assignedCaseIds) {
      if (contracts.DisputeResolution) {
        const caseData = await contracts.DisputeResolution.cases(caseId);
        const userVote = await contracts.DisputeResolution.getCaseVote(caseId, jurorWallet);

        let complaint = null;
        if (mongoose.connection.readyState === 1) {
          try {
            complaint = await ComplaintCache.findOne({ onChainComplaintId: Number(caseData.complaintId) }).populate("orderId");
          } catch (e) {}
        }
        if (!complaint) {
          complaint = inMemoryDb.complaintCaches.find((c) => c.onChainComplaintId === Number(caseData.complaintId));
        }

        cases.push({
          caseId,
          complaintId: Number(caseData.complaintId),
          complaint,
          evidenceUrl: complaint ? `${config.ipfs.gatewayUrl}/${complaint.evidenceCID}` : null,
          upholdVotes: Number(caseData.upholdVotes),
          rejectVotes: Number(caseData.rejectVotes),
          votingDeadline: Number(caseData.votingDeadline),
          finalized: caseData.finalized,
          finalVerdict: Number(caseData.finalVerdict),
          myVote: Number(userVote),
        });
      }
    }

    res.json(cases);
  } catch (err) {
    console.error("Error getting assigned cases:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCaseDetails = async (req, res) => {
  try {
    const caseId = Number(req.params.caseId);
    const contracts = getContracts();
    const jurorWallet = req.user.walletAddress.toLowerCase();

    if (!contracts.DisputeResolution) {
      return res.status(404).json({ error: "DisputeResolution contract not available" });
    }

    const caseData = await contracts.DisputeResolution.cases(caseId);
    const isSelected = await contracts.DisputeResolution.isSelectedJuror(caseId, jurorWallet);
    const userVote = await contracts.DisputeResolution.getCaseVote(caseId, jurorWallet);

    let complaint = null;
    if (mongoose.connection.readyState === 1) {
      try {
        complaint = await ComplaintCache.findOne({ onChainComplaintId: Number(caseData.complaintId) }).populate("orderId");
      } catch (e) {}
    }
    if (!complaint) {
      complaint = inMemoryDb.complaintCaches.find((c) => c.onChainComplaintId === Number(caseData.complaintId));
    }

    res.json({
      caseId,
      complaintId: Number(caseData.complaintId),
      complaint,
      evidenceUrl: complaint ? `${config.ipfs.gatewayUrl}/${complaint.evidenceCID}` : null,
      upholdVotes: Number(caseData.upholdVotes),
      rejectVotes: Number(caseData.rejectVotes),
      votingDeadline: Number(caseData.votingDeadline),
      finalized: caseData.finalized,
      finalVerdict: Number(caseData.finalVerdict),
      isSelected,
      myVote: Number(userVote),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.recordVote = async (req, res) => {
  try {
    const caseId = Number(req.params.caseId);
    const { verdict, verdictIndex } = req.body;
    const jurorWallet = req.user.walletAddress.toLowerCase();

    const voteData = {
      _id: "vote_" + Date.now().toString(36),
      caseId,
      jurorWallet,
      verdict,
      verdictIndex,
      votedAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        await JurorVoteCache.findOneAndUpdate({ caseId, jurorWallet }, voteData, { upsert: true, new: true });
      } catch (e) {
        inMemoryDb.jurorVotes.push(voteData);
      }
    } else {
      inMemoryDb.jurorVotes.push(voteData);
    }

    res.json({ message: "Vote recorded in cache", vote: voteData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
