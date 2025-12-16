import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Review from "@/models/Review";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json([], { status: 400 });

    const reviews = await Review.find({ target: userId })
      .populate("reviewer", "name avatar isVerified") // Get reviewer details
      .populate("contract", "job") // Get job title context
      .sort({ createdAt: -1 });

    return NextResponse.json(reviews, { status: 200 });
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}