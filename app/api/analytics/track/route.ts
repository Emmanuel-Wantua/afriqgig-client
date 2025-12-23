import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Analytics from "@/models/Analytics";

export async function POST(req: Request) {
  try {
    await connectToDB();
    const today = new Date().toISOString().split('T')[0];

    // Simple upsert: Increment visits for today
    await Analytics.findOneAndUpdate(
      { date: today },
      { $inc: { visits: 1 } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}