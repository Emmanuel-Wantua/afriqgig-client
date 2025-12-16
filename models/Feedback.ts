import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema({
  content: { type: String, required: true },
  // Optional: Link to a user if they are logged in, otherwise anonymous
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);