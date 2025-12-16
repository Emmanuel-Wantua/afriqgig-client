import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");

    let query = {};
    if (filter === "pending") {
        query = { "settings.verificationStatus": "pending" };
    }

    const users = await User.find(query)
        .select("-password") // Exclude password
        .select("name email avatar role isVerified settings identityDocuments identityDocType country") // Explicitly include ID docs
        .sort({ createdAt: -1 });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 });
  }
}

// PATCH: Approve or Reject Verification
export async function PATCH(req: Request) {
  try {
    const { userId, action } = await req.json(); // action: "approve" | "reject"
    
    await connectToDB();

    const updates: any = {};

    if (action === "approve") {
        updates.isVerified = true;
        updates["settings.verificationStatus"] = "verified";
    } else if (action === "reject") {
        updates.isVerified = false;
        updates["settings.verificationStatus"] = "rejected";
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { $set: updates }, 
        { new: true }
    );

    if (!updatedUser) return NextResponse.json({ message: "User not found" }, { status: 404 });

    return NextResponse.json({ message: `User ${action}d successfully` }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}