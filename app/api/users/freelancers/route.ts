import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase() || "";

    // FIX: Removed 'isActive: true' so older test accounts show up
    const searchFilter: any = { 
        role: "freelancer"
    };

    if (query) {
        searchFilter.$or = [
            { name: { $regex: query, $options: "i" } },
            { title: { $regex: query, $options: "i" } },
            { skills: { $in: [new RegExp(query, "i")] } }
        ];
    }

    const freelancers = await User.find(searchFilter)
        .select("name avatar title bio skills hourlyRate rateType rating reviewsCount isVerified country")
        .sort({ rating: -1, isVerified: -1 });

    console.log(`Found ${freelancers.length} freelancers`); // Check your terminal for this log

    return NextResponse.json(freelancers, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }
}