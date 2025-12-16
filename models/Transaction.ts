import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  type: { 
    type: String, 
    enum: ["deposit", "withdrawal", "payment_hold", "payment_release", "service_fee", "refund"], 
    required: true 
  },
  
  amount: { type: Number, required: true }, // Always stored in Base Currency (XAF)
  currency: { type: String, default: "XAF" },
  
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending"
  },
  
  paymentMethod: { type: String, default: "MOMO" }, // MOMO, Card, PayPal
  reference: { type: String }, // Transaction ID
  description: { type: String },

  date: { type: Date, default: Date.now }
});

export default mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);