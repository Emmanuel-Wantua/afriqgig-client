import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Message from "@/models/Message";
import User from "@/models/User"; 

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const otherId = searchParams.get("otherId");

    if (!userId) {
      return NextResponse.json({ message: "User ID required" }, { status: 400 });
    }

    await connectToDB();

    let query: any = {};

    // ✅ CASE A: Specific Conversation (Call Modal polling)
    // We want the latest signal between these two, no matter who sent it.
    if (otherId && otherId !== "unknown" && otherId !== "undefined") {
        query = {
            $or: [
                { sender: userId, receiver: otherId },
                { sender: otherId, receiver: userId }
            ]
        };
    } 
    // ✅ CASE B: General Layout Polling
    // We need to see if there is ANY new message/signal involving me.
    // NOTE: We check both sender OR receiver to catch call signals I might have initiated on another device.
    else {
        query = {
            $or: [
                { receiver: userId },
                { sender: userId }
            ]
        };
    }

    const latestMessage = await Message.findOne(query)
      .sort({ createdAt: -1 })
      .populate("sender", "name avatar");

    return NextResponse.json(latestMessage || null, { status: 200 });

  } catch (error) {
    console.error("Latest Message Error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}