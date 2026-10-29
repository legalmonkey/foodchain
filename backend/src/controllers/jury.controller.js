const User = require("../models/User");
const ComplaintCache = require("../models/ComplaintCache");
const JurorVoteCache = require("../models/JurorVoteCache");
const Order = require("../models/Order");
const inMemoryDb = require("../services/inMemoryDb");
const config = require("../config/env");
const { getContracts } = require("../services/blockchain");
const { getIO } = require("../sockets/socketHandler");
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
    const jurorWallet = (req.user.walletAddress || "").toLowerCase();
    const contracts = getContracts();

    const casesMap = new Map();

    // 1. Check on-chain cases if available
    if (contracts.DisputeResolution) {
      try {
        const caseCount = Number(await contracts.DisputeResolution.caseCount());
        for (let i = 1; i <= caseCount; i++) {
          try {
            const isAssigned = await contracts.DisputeResolution.isSelectedJuror(i, jurorWallet);
            if (isAssigned) {
              const caseData = await contracts.DisputeResolution.cases(i);
              const userVote = await contracts.DisputeResolution.getCaseVote(i, jurorWallet);

              let complaint = null;
              if (mongoose.connection.readyState === 1) {
                try {
                  complaint = await ComplaintCache.findOne({ onChainComplaintId: Number(caseData.complaintId) }).populate("orderId");
                } catch (e) {}
              }
              if (!complaint) {
                complaint = inMemoryDb.complaintCaches.find((c) => c.onChainComplaintId === Number(caseData.complaintId));
              }

              casesMap.set(i, {
                caseId: i,
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
          } catch (e) {}
        }
      } catch (e) {}
    }

    // 2. Merge all InDispute and Resolved complaints from dual-store cache
    let allComplaints = [...inMemoryDb.complaintCaches];
    if (mongoose.connection.readyState === 1) {
      try {
        const dbC = await ComplaintCache.find().populate("orderId").lean();
        for (const c of dbC) {
          if (!allComplaints.some((x) => String(x.onChainComplaintId) === String(c.onChainComplaintId))) {
            allComplaints.push(c);
          }
        }
      } catch (e) {}
    }

    for (const c of allComplaints) {
      if (c.status === "InDispute" || c.status === "Resolved") {
        const caseId = Number(c.caseId || c.onChainComplaintId || 1);
        if (!casesMap.has(caseId)) {
          // Count votes from inMemoryDb & cache
          const votes = inMemoryDb.jurorVotes.filter((v) => Number(v.caseId) === caseId);
          const upholdCount = votes.filter((v) => Number(v.verdictIndex) === 1).length;
          const rejectCount = votes.filter((v) => Number(v.verdictIndex) === 2).length;
          const myVoteObj = votes.find((v) => v.jurorWallet?.toLowerCase() === jurorWallet);
          const myVote = myVoteObj ? Number(myVoteObj.verdictIndex) : 0;

          const totalVotes = upholdCount + rejectCount;
          // Single-juror consensus rule for evaluation testing: >= 1 vote resolves the case!
          const finalized = totalVotes >= 1 || c.status === "Resolved";
          const finalVerdict = finalized
            ? (upholdCount >= rejectCount ? 1 : 2)
            : 0;

          casesMap.set(caseId, {
            caseId,
            complaintId: Number(c.onChainComplaintId || caseId),
            complaint: c,
            evidenceUrl: c.evidenceCID ? `${config.ipfs.gatewayUrl}/${c.evidenceCID}` : null,
            upholdVotes: upholdCount,
            rejectVotes: rejectCount,
            votingDeadline: Math.floor(Date.now() / 1000) + 86400,
            finalized,
            finalVerdict,
            myVote,
          });
        }
      }
    }

    res.json(Array.from(casesMap.values()));
  } catch (err) {
    console.error("Error getting assigned cases:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCaseDetails = async (req, res) => {
  try {
    const caseId = Number(req.params.caseId);
    const contracts = getContracts();
    const jurorWallet = (req.user.walletAddress || "").toLowerCase();

    let complaint = null;
    if (mongoose.connection.readyState === 1) {
      try {
        complaint = await ComplaintCache.findOne({
          $or: [{ caseId }, { onChainComplaintId: caseId }],
        }).populate("orderId");
      } catch (e) {}
    }
    if (!complaint) {
      complaint = inMemoryDb.complaintCaches.find(
        (c) => Number(c.caseId) === caseId || Number(c.onChainComplaintId) === caseId
      );
    }

    const votes = inMemoryDb.jurorVotes.filter((v) => Number(v.caseId) === caseId);
    const upholdVotes = votes.filter((v) => Number(v.verdictIndex) === 1).length;
    const rejectVotes = votes.filter((v) => Number(v.verdictIndex) === 2).length;
    const myVoteObj = votes.find((v) => v.jurorWallet?.toLowerCase() === jurorWallet);
    const myVote = myVoteObj ? Number(myVoteObj.verdictIndex) : 0;

    const finalized = (upholdVotes + rejectVotes >= 1) || complaint?.status === "Resolved";
    const finalVerdict = finalized ? (upholdVotes >= rejectVotes ? 1 : 2) : 0;

    res.json({
      caseId,
      complaintId: Number(complaint?.onChainComplaintId || caseId),
      complaint,
      evidenceUrl: complaint?.evidenceCID ? `${config.ipfs.gatewayUrl}/${complaint.evidenceCID}` : null,
      upholdVotes,
      rejectVotes,
      votingDeadline: Math.floor(Date.now() / 1000) + 86400,
      finalized,
      finalVerdict,
      isSelected: true,
      myVote,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.recordVote = async (req, res) => {
  try {
    const caseId = Number(req.params.caseId);
    const { verdict, verdictIndex } = req.body;
    const jurorWallet = (req.user.walletAddress || "").toLowerCase();

    const voteData = {
      _id: "vote_" + Date.now().toString(36),
      caseId,
      jurorWallet,
      verdict: verdict || (verdictIndex === 1 ? "UpholdComplaint" : "RejectComplaint"),
      verdictIndex: Number(verdictIndex),
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

    // Update in-memory votes array
    const existingIdx = inMemoryDb.jurorVotes.findIndex(
      (v) => Number(v.caseId) === caseId && v.jurorWallet?.toLowerCase() === jurorWallet
    );
    if (existingIdx >= 0) {
      inMemoryDb.jurorVotes[existingIdx] = voteData;
    } else {
      inMemoryDb.jurorVotes.push(voteData);
    }

    // 1-JUROR CONSENSUS: Immediately finalize case upon single juror vote
    const complaint = inMemoryDb.complaintCaches.find(
      (c) => Number(c.caseId) === caseId || Number(c.onChainComplaintId) === caseId
    );

    let refunded = false;
    if (complaint) {
      complaint.status = "Resolved";
      complaint.verdictUpheld = Number(verdictIndex) === 1;
      complaint.resolvedAt = new Date();

      if (complaint.save) {
        try { await complaint.save(); } catch (e) {}
      }

      // If customer won (verdict upheld), execute full escrow refund to customer!
      if (complaint.verdictUpheld) {
        const ordId = String(complaint.orderId?._id || complaint.orderId);
        let order = inMemoryDb.orders.find((o) => String(o._id) === ordId);
        if (order) {
          order.escrow = {
            ...(order.escrow || {}),
            status: "REFUNDED",
            amount: order.totalPrice,
            refundedAt: new Date(),
            notes: `Full escrow refund issued to customer: Community Jury upheld Complaint #${complaint.onChainComplaintId}`,
          };
          refunded = true;
        }
      }
    }

    const io = getIO();
    if (io) {
      io.emit("voteCast", { caseId, jurorWallet, verdictIndex });
      io.emit("caseFinalized", { caseId, finalVerdict: Number(verdictIndex) });
      if (complaint) io.emit("complaintUpdated", { complaintId: complaint.onChainComplaintId, status: "Resolved", verdictUpheld: complaint.verdictUpheld });
    }

    res.json({
      message: `Vote recorded successfully! 1-Juror consensus achieved (Verdict: ${verdictIndex === 1 ? 'Customer Won - Complaint Upheld' : 'Respondent Cleared'}).${refunded ? ' Escrow refunded to customer.' : ''}`,
      vote: voteData,
      finalized: true,
      verdictIndex: Number(verdictIndex),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
