import mongoose from "mongoose";

const ProposalSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  client: { // Useful for quick filtering
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  bidAmount: { type: Number, required: true },
  duration: { type: String },
  coverLetter: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Proposal || mongoose.model("Proposal", ProposalSchema);