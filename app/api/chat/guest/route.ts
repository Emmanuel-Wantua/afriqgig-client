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
        let chat = await GuestChat.findOne({ sessionId });

        // ✅ ROBUST AUTO-CLOSE LOGIC (Server-Side)
        // Checks if chat is 'open' but inactive for > 12 hours
        if (chat && chat.status === 'open') {
            const lastActivity = new Date(chat.updatedAt).getTime();
            const twelveHours = 12 * 60 * 60 * 1000;
            
            if (Date.now() - lastActivity > twelveHours) {
                console.log(`⏳ [API] Auto-closing stale session: ${sessionId}`);
                
                chat.status = 'closed';
                chat.messages.push({
                    sender: 'system',
                    content: "Chat closed due to inactivity (12h timeout).",
                    msgType: 'system',
                    timestamp: new Date()
                });
                chat = await chat.save();
            }
        }

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
                guestPhone: body.phone, 
                guestLocation: body.location,
                guestAddress: body.address,
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
            chat.messages.push({ 
                sender: 'guest', 
                content: body.content, 
                imageUrl: body.imageUrl,     
                msgType: body.msgType || 'text',
                status: 'sent' 
            });

            if (chat.status === 'closed') chat.status = 'open';
            chat.updatedAt = new Date(); // Update time for sorting
            await chat.save();
            
            await safeNotifyAdmins("New Chat Message", `Message from ${chat.guestName}`, `/dashboard/admin/support`);
            
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // 3. CLOSE & RATE
        if (body.type === 'close') {
            const chat = await GuestChat.findOne({ sessionId: body.sessionId });
            if (chat) {
                 if (body.isAutoClose) {
                     chat.messages.push({
                         sender: 'system',
                         content: "Chat closed due to inactivity.",
                         msgType: 'system',
                         timestamp: new Date()
                     });
                 }
                 
                 chat.status = 'closed';
                 if (body.rating) chat.rating = body.rating;
                 if (body.feedback) chat.feedback = body.feedback;
                 
                 await chat.save();
            }

            return NextResponse.json({ success: true }, { status: 200 });
        }

        return NextResponse.json({ message: "Invalid Request Type" }, { status: 400 });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}