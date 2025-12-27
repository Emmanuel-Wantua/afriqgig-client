import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
  
  // A conversation is usually linked to a Job or Proposal context
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  
  // ✅ NEW: Message Type Support
  type: { 
      type: String, 
      enum: ["text", "image", "audio", "call"], 
      default: "text" 
  },

  content: { type: String, required: true },
  
  // ✅ NEW: Field for Image Uploads
  imageUrl: { type: String },

  // Attachments logic (Keeping this for legacy support, though new images use imageUrl)
  attachments: [String], 
  
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);