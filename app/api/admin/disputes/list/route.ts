import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Dispute from "@/models/Dispute";
import User from "@/models/User"; // Needed for population
import Contract from "@/models/Contract"; // Needed for population

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectToDB();
    // Fetch only OPEN disputes for the active list
    const disputes = await Dispute.find({ status: "open" })
      .populate("initiator", "name email phone avatar")
      .populate("opponent", "name email phone avatar")
      .populate("contract", "amount title")
      .sort({ createdAt: -1 });

    return NextResponse.json(disputes, { status: 200 });
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}