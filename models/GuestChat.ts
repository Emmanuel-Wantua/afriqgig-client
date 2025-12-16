import mongoose from "mongoose";

const GuestChatSchema = new mongoose.Schema({
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true },
  messages: [{
      sender: { type: String, enum: ['guest', 'agent'] },
      content: String,
      status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
      timestamp: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  rating: { type: Number, default: 0 }, // 1-5
  feedback: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.GuestChat || mongoose.model("GuestChat", GuestChatSchema);