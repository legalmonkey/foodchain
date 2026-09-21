const mongoose = require("mongoose");

const jurorVoteCacheSchema = new mongoose.Schema({
  caseId: {
    type: Number,
    required: true,
    index: true,
  },
  jurorAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  verdict: {
    type: String,
    enum: ["UpholdComplaint", "RejectComplaint"],
    required: true,
  },
  verdictIndex: {
    type: Number,
    required: true,
  },
  votedAt: {
    type: Date,
    default: Date.now,
  },
});

jurorVoteCacheSchema.index({ caseId: 1, jurorAddress: 1 }, { unique: true });

module.exports = mongoose.model("JurorVoteCache", jurorVoteCacheSchema);
