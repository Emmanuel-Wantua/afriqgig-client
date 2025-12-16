import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import GuestChat from "@/models/GuestChat";

export const dynamic = "force-dynamic";

// GET: Fetch all active chats for the Admin Dashboard
export async function GET() {
  try {
    await connectToDB();
    
    // Fetch chats, sorted by the most recent message first
    const chats = await GuestChat.find()
        .sort({ updatedAt: -1, createdAt: -1 });

    return NextResponse.json(chats, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching chats" }, { status: 500 });
  }
}

// POST: Admin sends a reply
export async function POST(req: Request) {
  try {
    const { chatId, content } = await req.json();
    await connectToDB();

    if (!content || !chatId) {
        return NextResponse.json({ message: "Missing data" }, { status: 400 });
    }

    const chat = await GuestChat.findById(chatId);
    if (!chat) {
        return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    // Append Agent Message
    chat.messages.push({
        sender: 'agent',
        content,
        timestamp: new Date()
    });
    
    // Update timestamp so it jumps to top of list
    chat.updatedAt = new Date(); 
    
    await chat.save();

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Admin Reply Error:", error);
    return NextResponse.json({ message: "Error sending reply" }, { status: 500 });
  }
}