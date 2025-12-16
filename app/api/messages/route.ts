import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Message from "@/models/Message";
import Notification from "@/models/Notification";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { sender, receiver, content, job } = await req.json();
    await connectToDB();

    // 1. Create Message
    const newMessage = await Message.create({ sender, receiver, content, job });

    // 2. TRIGGER NOTIFICATION (Enhanced)
    // Fetch sender name for a personal touch
    const senderUser = await User.findById(sender).select("name");
    const senderName = senderUser ? senderUser.name : "Someone";

    let notifTitle = `Message from ${senderName}`;
    let notifBody = "";

    // Check for Voice Note
    if (content.startsWith("[VOICE_NOTE]")) {
        notifBody = `🎤 Voice message from ${senderName}`;
    } else {
        // Truncate text
        notifBody = content.length > 50 ? content.substring(0, 50) + "..." : content;
    }

    await Notification.create({
        user: receiver,
        type: "message",
        title: notifTitle,
        message: notifBody,
        link: `/dashboard/messages?chatWith=${sender}`,
        isRead: false
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error sending message" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const otherId = searchParams.get("otherId");

    await connectToDB();

    if (!userId) return NextResponse.json([], { status: 400 });

    if (otherId) {
        // Fetch conversation & MARK AS READ automatically
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherId },
                { sender: otherId, receiver: userId }
            ]
        }).sort({ createdAt: 1 });
        
        // Mark incoming messages as read since we are viewing them
        await Message.updateMany(
            { sender: otherId, receiver: userId, isRead: false },
            { isRead: true }
        );

        return NextResponse.json(messages, { status: 200 });
    }

    const allMyMessages = await Message.find({
        $or: [{ sender: userId }, { receiver: userId }]
    }).populate("sender receiver", "name avatar isVerified rating reviewsCount").sort({ createdAt: -1 });

    return NextResponse.json(allMyMessages, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "Error fetching messages" }, { status: 500 });
  }
}