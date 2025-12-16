import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Proposal from "@/models/Proposal";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // Get Job ID from URL
    await connectToDB();

    // Find ALL proposals where 'job' matches the ID in the URL
    // And populate the freelancer details inside them
    const proposals = await Proposal.find({ job: id })
      .populate("freelancer", "name title email name avatar skills isVerified rating reviewsCount")
      .sort({ createdAt: -1 });

    return NextResponse.json(proposals, { status: 200 });

  } catch (error: any) {
    console.error("Fetch Proposals Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

