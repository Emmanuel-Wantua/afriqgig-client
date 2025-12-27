import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Message from "@/models/Message";
import Notification from "@/models/Notification";
import User from "@/models/User";

export const dynamic = "force-dynamic";

// --- SECURITY: Contact Information Patterns ---
// Updated to catch local 9-digit numbers (e.g. 677079449)
const FORBIDDEN_PATTERNS = [
    /\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/gi, // Email
    /(?:\+?\d{1,3})?[-. (]*\d{3}[-. )]*\d{3}[-. ]*\d{4}/g, // International Phone
    /\b\d{3}[-. ]?\d{3}[-. ]?\d{3}\b/g, // ✅ Local 9-digit Phone
    /whatsapp|telegram|instagram|facebook|linkedin|skype|zoom|meet\.google/gi, 
    /wa\.me|t\.me|linkedin\.com|facebook\.com|instagram\.com/gi 
];

const containsContactInfo = (text: string) => {
    return FORBIDDEN_PATTERNS.some(pattern => pattern.test(text));
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // ✅ NEW: Destructure replyTo to link messages
    const { sender, receiver, content, job, type = "text", imageUrl, replyTo } = body;
    
    if (content.startsWith("[CALL_")) {
        console.log(`📡 [API] Call Signal: ${content}`);
    }

    await connectToDB();

    // 1. SECURITY CHECK
    if (type === "text" && !content.startsWith("[") && containsContactInfo(content)) {
        try {
            await Notification.create({
                user: sender, type: "security", title: "⚠️ Security Warning",
                message: "Sharing contact information is prohibited.", link: "/dashboard/messages", isRead: false
            });
        } catch (e) {}
        // ✅ Return 400 to trigger Security Modal on Frontend
        return NextResponse.json({ message: "Message blocked: sharing contact info." }, { status: 400 });
    }

    // 2. Create Message (Including replyTo)
    const newMessage = await Message.create({ 
        sender, receiver, content, job, type, imageUrl, replyTo 
    });

    // 3. Skip Notification for Signals
    if (content.startsWith("[CALL_")) {
        return NextResponse.json(newMessage, { status: 201 });
    }

    // 4. Trigger Notification
    try {
        const senderUser = await User.findById(sender).select("name");
        await Notification.create({
            user: receiver, type: "message",
            title: `Message from ${senderUser?.name || "User"}`,
            message: type === 'image' ? "📷 Photo" : content.substring(0, 50),
            link: `/dashboard/messages?chatWith=${sender}`, isRead: false
        });
    } catch (e) {}

    return NextResponse.json(newMessage, { status: 201 });

  } catch (error: any) {
    console.error("🔥 POST Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
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
        // ✅ FIX: Clean chain for populate to avoid TS errors
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherId },
                { sender: otherId, receiver: userId }
            ]
        })
        .sort({ createdAt: 1 })
        .populate("replyTo", "content type sender"); // ✅ Populates the referenced message
        
        // Mark as read
        await Message.updateMany(
            { sender: otherId, receiver: userId, isRead: false },
            { isRead: true }
        );

        return NextResponse.json(messages, { status: 200 });
    }

    // Fetch Inbox List
    const allMyMessages = await Message.find({
        $or: [{ sender: userId }, { receiver: userId }]
    })
    .populate("sender receiver", "name avatar isVerified rating reviewsCount lastSeen isOnline")
    .sort({ createdAt: -1 });

    return NextResponse.json(allMyMessages, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "Error fetching messages" }, { status: 500 });
  }
}