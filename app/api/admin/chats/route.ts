import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import GuestChat from "@/models/GuestChat";
import User from "@/models/User"; // ✅ Import User model

export const dynamic = "force-dynamic";

// GET: Fetch all active chats & Enrich with Real User Data
export async function GET() {
  try {
    await connectToDB();
    
    // 1. Fetch chats (Plain JavaScript objects with .lean() for better performance)
    const chats = await GuestChat.find()
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();

    // 2. Enrich with User Data (Avatar, Verified, Rating)
    // We look up users by email since GuestChat stores guestEmail
    const enrichedChats = await Promise.all(chats.map(async (chat: any) => {
        // Try to find a registered user with this email
        const user = await User.findOne({ email: chat.guestEmail }).select("avatar isVerified rating _id");
        
        return {
            ...chat,
            // ✅ Add these fields so UserBadge works on the frontend
            guestId: user?._id || null, 
            guestAvatar: user?.avatar || null,
            isVerified: user?.isVerified || false,
            userRating: user?.rating || 0
        };
    }));

    return NextResponse.json(enrichedChats, { status: 200 });

  } catch (error) {
    console.error("Error fetching admin chats:", error);
    return NextResponse.json({ message: "Error fetching chats" }, { status: 500 });
  }
}

// POST: Admin sends a reply (Kept mostly the same, just ensured robust saving)
export async function POST(req: Request) {
  try {
    const { chatId, content, imageUrl, type } = await req.json();
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
        imageUrl: imageUrl || undefined, 
        msgType: type || 'text',        
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