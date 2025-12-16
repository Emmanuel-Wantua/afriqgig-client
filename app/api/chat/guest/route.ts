import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import GuestChat from "@/models/GuestChat";
import Notification from "@/models/Notification";
import User from "@/models/User";

export const dynamic = "force-dynamic";

// Helper to notify admins safely
const safeNotifyAdmins = async (title: string, message: string, link: string) => {
    try {
        const admins = await User.find({ role: "admin" }).select("_id");
        if (admins.length > 0) {
            const notifs = admins.map(admin => ({
                user: admin._id,
                type: "admin_alert",
                title,
                message,
                link,
                isRead: false
            }));
            await Notification.insertMany(notifs);
        }
    } catch (e) {
        console.error("Notification Warning:", e);
    }
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get("sessionId");
        if (!sessionId) return NextResponse.json({ messages: [] });

        await connectToDB();
        const chat = await GuestChat.findOne({ sessionId }).select('messages status');
        return NextResponse.json(chat ? chat : { messages: [] });
    } catch (error) {
        return NextResponse.json({ messages: [] }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        await connectToDB();

        // 1. START CHAT
        if (body.type === 'start') {
            const newChat = await GuestChat.create({
                guestName: body.name,
                guestEmail: body.email,
                sessionId: body.sessionId,
                messages: [{ sender: 'guest', content: body.message, status: 'sent' }]
            });
            
            await safeNotifyAdmins("New Live Chat", `${body.name} started a support chat.`, `/dashboard/admin/support`);
            
            return NextResponse.json(newChat, { status: 201 });
        }

        // 2. SEND MESSAGE
        if (body.type === 'message') {
            const chat = await GuestChat.findOne({ sessionId: body.sessionId });
            
            if (!chat) {
                // CRITICAL FIX: If chat is missing (db cleared), return 404 so frontend handles it
                return NextResponse.json({ message: "Session expired" }, { status: 404 });
            }

            // Add message
            chat.messages.push({ sender: 'guest', content: body.content, status: 'sent' });
            if (chat.status === 'closed') chat.status = 'open';
            chat.updatedAt = new Date(); // Update time for sorting
            await chat.save();
            
            await safeNotifyAdmins("New Chat Message", `Message from ${chat.guestName}`, `/dashboard/admin/support`);
            
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // 3. CLOSE & RATE
        if (body.type === 'close') {
            await GuestChat.findOneAndUpdate(
                { sessionId: body.sessionId },
                { 
                    status: 'closed',
                    rating: body.rating,
                    feedback: body.feedback
                }
            );
            return NextResponse.json({ success: true }, { status: 200 });
        }

        return NextResponse.json({ message: "Invalid Request Type" }, { status: 400 });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}