import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Dispute from "@/models/Dispute";
import Contract from "@/models/Contract";
import Notification from "@/models/Notification";
import User from "@/models/User"; // <--- Import User to find admins
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contractId, initiatorId, reason, description, evidence } = body;

    await connectToDB();

    // 1. Find Contract
    let contract = null;
    if (mongoose.Types.ObjectId.isValid(contractId)) {
        contract = await Contract.findOne({ 
            $or: [
                { _id: contractId }, 
                { job: contractId }
            ] 
        });
    }

    if (!contract) {
        return NextResponse.json({ message: "Contract not found" }, { status: 404 });
    }

    const opponentId = String(contract.client) === String(initiatorId) 
        ? contract.freelancer 
        : contract.client;

    // 2. Create Dispute Record
    const newDispute = await Dispute.create({
        contract: contract._id, 
        initiator: initiatorId,
        opponent: opponentId,
        reason,
        description,
        evidence: evidence || []
    });

    // 3. FREEZE CONTRACT
    contract.status = "disputed";
    await contract.save();

    // 4. NOTIFY OPPONENT (User)
    await Notification.create({
        user: opponentId,
        type: "dispute", // Fixed type to match enum
        title: "Dispute Filed",
        message: "A dispute has been filed. Funds are frozen pending review.",
        link: `/dashboard/contracts/${contract._id}`,
        isRead: false
    });

    // 5. --- NEW: NOTIFY ADMINS ---
    try {
        const admins = await User.find({ role: "admin" }).select("_id");
        if (admins.length > 0) {
            const adminNotifs = admins.map(admin => ({
                user: admin._id,
                type: "admin_alert",
                title: "New Dispute Filed",
                message: `Dispute opened on contract #${String(contract._id).slice(-6)}. Action required.`,
                link: `/dashboard/admin/disputes`, // Link to admin dispute center
                isRead: false
            }));
            await Notification.insertMany(adminNotifs);
        }
    } catch (e) {
        console.error("Admin Notification Error:", e);
    }

    return NextResponse.json({ message: "Dispute filed", disputeId: newDispute._id }, { status: 201 });

  } catch (error: any) {
    console.error("Dispute Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}