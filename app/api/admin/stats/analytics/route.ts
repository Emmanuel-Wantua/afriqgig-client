import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Analytics from "@/models/Analytics";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectToDB();

    // 1. Get records for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateString = thirtyDaysAgo.toISOString().split('T')[0];

    const stats = await Analytics.find({ date: { $gte: dateString } }).sort({ date: 1 });

    // 2. Format for Frontend
    // Ensure we return an array even if empty
    return NextResponse.json(stats || [], { status: 200 });

  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}