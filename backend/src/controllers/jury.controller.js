const User = require("../models/User");
const ComplaintCache = require("../models/ComplaintCache");
const JurorVoteCache = require("../models/JurorVoteCache");
const config = require("../config/env");
const { getContracts } = require("../services/blockchain");

exports.registerJuror = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isJuror = true;
    await user.save();

    res.json({
      message: "Juror registration recorded. Please sign becomeJuror transaction in MetaMask.",
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        isJuror: user.isJuror,
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
        const complaint = await ComplaintCache.findOne({ onChainComplaintId: Number(caseData.complaintId) }).populate("orderId");

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
    const jurors = await contracts.DisputeResolution.getCaseJurors(caseId);
    const userVote = await contracts.DisputeResolution.getCaseVote(caseId, jurorWallet);
    const complaint = await ComplaintCache.findOne({ onChainComplaintId: Number(caseData.complaintId) }).populate("orderId");

    const votes = await JurorVoteCache.find({ caseId });

    res.json({
      caseId,
      complaintId: Number(caseData.complaintId),
      complaint,
      evidenceUrl: complaint ? `${config.ipfs.gatewayUrl}/${complaint.evidenceCID}` : null,
      jurors: jurors.map((j) => j.toLowerCase()),
      upholdVotes: Number(caseData.upholdVotes),
      rejectVotes: Number(caseData.rejectVotes),
      votingDeadline: Number(caseData.votingDeadline),
      finalized: caseData.finalized,
      finalVerdict: Number(caseData.finalVerdict),
      myVote: Number(userVote),
      votes,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.recordVote = async (req, res) => {
  try {
    const caseId = Number(req.params.caseId);
    const { verdict, verdictIndex } = req.body;

    const vote = await JurorVoteCache.findOneAndUpdate(
      { caseId, jurorAddress: req.user.walletAddress.toLowerCase() },
      {
        caseId,
        jurorAddress: req.user.walletAddress.toLowerCase(),
        verdict,
        verdictIndex: Number(verdictIndex),
        votedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json(vote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
