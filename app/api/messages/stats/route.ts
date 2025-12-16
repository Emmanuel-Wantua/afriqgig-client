import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Message from "@/models/Message";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ unread: 0 });

    await connectToDB();

    // Log the query attempt
    // console.log(`[API] Checking stats for user: ${userId}`);

    // Count messages where I am the receiver AND they are NOT read
    const unreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false
    });

    // console.log(`[API] Found ${unreadCount} unread messages.`);

    return NextResponse.json({ unread: unreadCount }, { status: 200 });
  } catch (error) {
    console.error("[API] Message Stats Error:", error);
    return NextResponse.json({ unread: 0 }, { status: 500 });
  }
}