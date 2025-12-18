import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Message from "@/models/Message";
import User from "@/models/User"; // Required for populate

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "User ID required" }, { status: 400 });
    }

    await connectToDB();

    // Fetch the single most recent message where I am the receiver
    const latestMessage = await Message.findOne({ receiver: userId })
      .sort({ createdAt: -1 })
      .populate("sender", "name avatar"); // Get sender details for the call modal

    return NextResponse.json(latestMessage || null, { status: 200 });

  } catch (error) {
    console.error("Latest Message Error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}