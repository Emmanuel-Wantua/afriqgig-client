import mongoose from "mongoose";

const JobSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  
  // Financials
  budget: { type: Number, required: true },
  currency: { type: String, default: "XAF" },
  
  // Job Details
  deadline: { type: String }, // Storing as String is safer for HTML Inputs
  location: { type: String, default: "Remote" },
  isUrgent: { type: Boolean, default: false },
  
  // Arrays (Default to [] to prevent frontend crashes)
  tags: { type: [String], default: [] },
  attachments: { type: [String], default: [] }, // Stores Cloudinary URLs or Filenames
  
  // Relations
  proposals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Proposal" 
  }],
  
  status: {
    type: String,
    enum: ["open", "hired", "completed", "cancelled"],
    default: "open"
  },
  
  hiredFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

}, { 
  timestamps: true // Automatically manages createdAt and updatedAt
});

export default mongoose.models.Job || mongoose.model("Job", JobSchema);