import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who gets the alert
  type: { 
    type: String, 
    enum: ["message", "hired", "submission", "payment", "security", "like", "comment", "system", "dispute", "alert", 'proposal', 'admin_alert', "job_update", "security"],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String }, // Where clicking takes you (e.g., /dashboard/contracts/123)
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);