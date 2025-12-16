import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Job from "@/models/Job";
import User from "@/models/User";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// --- EXISTING GET HANDLER (Database Diagnostics) ---
export async function GET() {
  try {
    await connectToDB();
    
    // Get Connection Details
    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;
    const readyState = mongoose.connection.readyState; // 1 = connected, 0 = disconnected

    // Get Raw Counts
    const userCount = await User.countDocuments();
    const jobCount = await Job.countDocuments();
    
    // Get actual data samples (First 3 jobs)
    const rawJobs = await Job.find({}).limit(3);

    return NextResponse.json({
      status: "System Diagnostic",
      connection: {
        state: readyState === 1 ? "✅ Connected" : "❌ Disconnected",
        host: host,
        databaseName: dbName,
      },
      data_stats: {
        total_users: userCount,
        total_jobs: jobCount,
      },
      sample_data: rawJobs
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ 
        error: "Diagnostic Failed", 
        details: error.message 
    }, { status: 500 });
  }
}

// --- NEW POST HANDLER (Mobile Remote Logger) ---
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { label, message, data } = body;

        // This prints directly to your VS Code Terminal
        console.log(`\n📱 [MOBILE LOG - ${label}] ------------------`);
        console.log(message);
        if (data) {
            console.dir(data, { depth: null, colors: true });
        }
        console.log(`-------------------------------------------\n`);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}