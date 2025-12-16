import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Feedback from "@/models/Feedback";

export const dynamic = "force-dynamic";

// 1. SAVE FEEDBACK (Used by Landing Page Modal)
export async function POST(req: Request) {
  try {
    await connectToDB();
    const { content, userId } = await req.json();

    if (!content) {
        return NextResponse.json({ message: "Content required" }, { status: 400 });
    }

    await Feedback.create({ 
        content, 
        user: userId || null 
    });

    return NextResponse.json({ message: "Feedback received" }, { status: 201 });
  } catch (error) {
    console.error("Feedback Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

// 2. GET FEEDBACK (Used by Admin Dashboard)
export async function GET() {
  try {
    await connectToDB();
    // Fetch latest first, populate user details if available
    const items = await Feedback.find()
        .populate("user", "name email role") 
        .sort({ createdAt: -1 });
        
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}