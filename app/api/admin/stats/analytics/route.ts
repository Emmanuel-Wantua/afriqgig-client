import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Analytics from "@/models/Analytics";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectToDB();

    // 1. Generate last 30 days dates
    const dates = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }

    // 2. Fetch real data
    const startDate = dates[0];
    const realStats = await Analytics.find({ date: { $gte: startDate } });

    // 3. Merge: Fill missing days with 0 to prevent blank chart gaps
    const finalStats = dates.map(date => {
        const found = realStats.find((s: any) => s.date === date);
        return {
            date,
            visits: found ? found.visits : 0, // Fallback to 0 if no data
            uniqueVisitors: found ? found.uniqueVisitors : 0
        };
    });

    return NextResponse.json(finalStats, { status: 200 });

  } catch (error) {
    console.error("Analytics API Error:", error);
    // Return empty fallback structure instead of error to keep UI alive
    return NextResponse.json([], { status: 200 });
  }
}