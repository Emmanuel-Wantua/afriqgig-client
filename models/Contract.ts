import mongoose from "mongoose";

const ContractSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  amount: { type: Number, required: true },
  currency: { type: String, default: "XAF" },
  
  status: { 
    type: String, 
    enum: ["active", "completed", "cancelled", "disputed"], 
    default: "active" 
  },
  
  paymentStatus: { 
    type: String, 
    enum: ["pending", "held", "released", "refunded"], 
    default: "pending" 
  },

  // --- FIX: Explicit Submission Schema ---
  submission: {
    files: [String], // Array of file names/URLs
    note: String,
    date: Date
  },
  // ---------------------------------------

  startDate: { type: Date, default: Date.now },
  endDate: Date
}, { timestamps: true });

export default mongoose.models.Contract || mongoose.model("Contract", ContractSchema);