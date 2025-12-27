import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");

    let query: any = {};
    if (filter === "pending") {
        query = { "settings.verificationStatus": "pending" };
    }

    const users = await User.find(query)
        .select("-password") // Exclude password
        // ✅ FIX: Added 'status' to the selection list
        .select("name email avatar role isVerified settings identityDocuments identityDocType country status createdAt") 
        .sort({ createdAt: -1 });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Fetch Users Error:", error);
    return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 });
  }
}

// PATCH: Approve/Reject Verification OR Update Status
// PATCH: Approve/Reject Verification OR Update Status
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    
    // 🔍 DEBUG: Log what the server received
    console.log("📥 [API] PATCH Received Body:", body);

    const { userId, action, status } = body; // action: "approve" | "reject" | "update_status"
    
    await connectToDB();

    const updates: any = {};

    // --- ACTION 1: VERIFICATION ---
    if (action === "approve") {
        updates.isVerified = true;
        updates["settings.verificationStatus"] = "verified";
    } else if (action === "reject") {
        updates.isVerified = false;
        updates["settings.verificationStatus"] = "rejected";
    } 
    // --- ACTION 2: STATUS UPDATE (Suspend/Activate) ---
    else if (action === "update_status") {
        updates.status = status; // 'active' | 'suspended' | 'deactivated'
        console.log(`🔄 [API] Staging status update to: ${status}`);
    } else {
        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    console.log("💾 [API] Performing DB Update on ID:", userId, "with updates:", updates);

    // Perform the update
    const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { $set: updates }, 
        { new: true } // Return the updated document
    );

    if (!updatedUser) {
        console.log("❌ [API] User not found");
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 🔍 DEBUG: Log the result from the DB to ensure it stuck
    console.log("✅ [API] Update Successful. New DB Status:", updatedUser.status);

    const msg = action === "update_status" ? `User status updated to ${status}` : `User verification ${action}ed`;
    return NextResponse.json({ message: msg, user: updatedUser }, { status: 200 });

  } catch (error) {
    console.error("🔥 [API] Update User Error:", error);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}