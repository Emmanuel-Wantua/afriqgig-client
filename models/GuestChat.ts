import mongoose from "mongoose";

const GuestChatSchema = new mongoose.Schema({
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  guestPhone: { type: String },
  guestLocation: { type: String }, // Country
  guestAddress: { type: String },  // City/Address
  sessionId: { type: String, required: true, unique: true },
  messages: [{
      sender: { type: String, enum: ['guest', 'agent', 'system'] },
      content: String,
      imageUrl: { type: String },
      msgType: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
      status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
      timestamp: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  rating: { type: Number, default: 0 }, // 1-5
  feedback: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.GuestChat || mongoose.model("GuestChat", GuestChatSchema);