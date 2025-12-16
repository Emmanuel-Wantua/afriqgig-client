import mongoose from "mongoose";

const DisputeSchema = new mongoose.Schema({
  contract: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
  initiator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who complained?
  opponent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who are they complaining about?
  
  reason: { 
    type: String, 
    enum: ["no_submission", "poor_quality", "ghosting", "payment_issue", "other"],
    required: true 
  },
  description: { type: String, required: true },

  evidence: [String],
  
  status: { 
    type: String, 
    enum: ["open", "resolved", "dismissed"], 
    default: "open" 
  },
  
  resolution: { type: String }, // Admin's final decision notes
  adminNote: { type: String }, 
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Dispute || mongoose.model("Dispute", DisputeSchema);