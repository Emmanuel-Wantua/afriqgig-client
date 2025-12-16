import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // A conversation is usually linked to a Job or Proposal context
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  
  content: { type: String, required: true },
  
  // Attachments logic (same as Community feed)
  attachments: [String], 
  
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);