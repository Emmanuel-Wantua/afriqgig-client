import mongoose from "mongoose";

const ContactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: "unread" }, // unread, read, replied
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ContactMessage || mongoose.model("ContactMessage", ContactMessageSchema);