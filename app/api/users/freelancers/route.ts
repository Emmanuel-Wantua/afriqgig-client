import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase() || "";

    // ✅ FIX: Filter out Suspended or Deactivated users
    // We use $nin (Not In) to ensure legacy accounts (with no status) still show up,
    // while strictly hiding anyone explicitly marked as 'suspended' or 'deactivated'.
    const searchFilter: any = { 
        role: "freelancer",
        status: { $nin: ["suspended", "deactivated"] }
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

    console.log(`Found ${freelancers.length} active freelancers`); 

    return NextResponse.json(freelancers, { status: 200 });
  } catch (error) {
    console.error("Freelancer Fetch Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}