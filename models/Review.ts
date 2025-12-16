import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  contract: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Client
  target: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Freelancer
  
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);