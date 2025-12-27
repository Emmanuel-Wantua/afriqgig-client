import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Analytics from "@/models/Analytics";

export async function POST(req: Request) {
  try {
    const { isUnique } = await req.json();
    await connectToDB();
    const today = new Date().toISOString().split('T')[0];

    const update: any = { $inc: { visits: 1 } };
    if (isUnique) {
        update.$inc.uniqueVisitors = 1;
    }

    await Analytics.findOneAndUpdate(
      { date: today },
      update,
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}