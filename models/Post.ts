import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  
  // --- MEDIA ---
  mediaUrl: { type: String }, 
  mediaType: { type: String, enum: ["image", "video", "none"], default: "none" },
  
  // --- CATEGORIZATION & PINNING ---
  category: { type: String, default: "General" }, // e.g. "Tech", "Business", "Events"
  isPinned: { type: Boolean, default: false }, // For Admin announcements
  // --------------------------------

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: String,
      date: { type: Date, default: Date.now }
  }],
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Post || mongoose.model("Post", PostSchema);