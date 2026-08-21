import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Dispute from "@/models/Dispute";
import Contract from "@/models/Contract";
import Transaction from "@/models/Transaction";
import Notification from "@/models/Notification";
import Job from "@/models/Job";
import User from "@/models/User";
import { sendEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // This endpoint decides who gets the escrowed money, so it must be
    // admin-only. The acting admin is taken from the verified session — the
    // request body's `adminId` is not trusted for the audit record.
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { disputeId, resolution } = await req.json();

    // resolution options: "refund_client" | "release_freelancer"
    if (!["refund_client", "release_freelancer"].includes(resolution)) {
      return NextResponse.json({ message: "Invalid resolution" }, { status: 400 });
    }

    await connectToDB();
    const dispute = await Dispute.findById(disputeId).populate("contract");
    if (!dispute) return NextResponse.json({ message: "Dispute not found" }, { status: 404 });

    // Resolving twice would pay out twice — a dispute settles once.
    if (dispute.status !== "open") {
      return NextResponse.json({ message: "Dispute is already resolved" }, { status: 409 });
    }

    const contract = await Contract.findById(dispute.contract._id).populate("job"); // Ensure job is populated for title
    if (!contract) return NextResponse.json({ message: "Contract not found" }, { status: 404 });

    if (contract.paymentStatus === "released" || contract.paymentStatus === "refunded") {
      return NextResponse.json(
        { message: "Escrow for this contract has already been settled" },
        { status: 409 }
      );
    }

    // --- EXECUTE FINANCIAL DECISION ---
    if (resolution === "refund_client") {
        const clientId = contract.client._id || contract.client;

        // Credit the spendable balance, not just the ledger row — otherwise
        // the refund shows in history but can never be withdrawn.
        await User.findByIdAndUpdate(clientId, {
            $inc: { "wallet.balance": contract.amount }
        });

        await Transaction.create({
            user: clientId, 
            type: "refund",
            amount: contract.amount,
            status: "completed",
            paymentMethod: "ESCROW",
            description: `Dispute Refund: ${dispute._id}`,
            reference: `REF-${contract._id}`
        });

        contract.paymentStatus = "refunded";
        contract.status = "cancelled";
        
        const jobId = contract.job._id || contract.job;
        await Job.findByIdAndUpdate(jobId, { status: "closed" }); 

    } else {
        const freelancerId = contract.freelancer._id || contract.freelancer;
        const totalAmount = contract.amount;
        const fee = Math.ceil(totalAmount * 0.05);
        const net = totalAmount - fee;

        await User.findByIdAndUpdate(freelancerId, {
            $inc: { "wallet.balance": net }
        });

        await Transaction.create({
            user: freelancerId,
            type: "payment_release",
            amount: net,
            status: "completed",
            paymentMethod: "ESCROW",
            description: `Dispute Resolution Release: ${dispute._id}`,
            reference: `REL-${contract._id}`
        });
        contract.paymentStatus = "released";
        contract.status = "completed";
        
        const jobId = contract.job._id || contract.job;
        await Job.findByIdAndUpdate(jobId, { status: "completed" });
    }

    await contract.save();

    // --- UPDATE DISPUTE RECORD ---
    dispute.status = "resolved";
    dispute.resolution = resolution;
    dispute.admin = admin.userId;
    await dispute.save();

    // --- NOTIFY PARTIES (IN-APP) ---
    const message = resolution === "refund_client" 
        ? "Dispute Resolved: Funds refunded to Client." 
        : "Dispute Resolved: Funds released to Freelancer.";

    const clientId = contract.client._id || contract.client;
    const freelancerId = contract.freelancer._id || contract.freelancer;

    await Notification.create([
        { user: clientId, type: "dispute", title: "Dispute Resolved", message, link: `/dashboard/contracts/${contract._id}` },
        { user: freelancerId, type: "dispute", title: "Dispute Resolved", message, link: `/dashboard/contracts/${contract._id}` }
    ]);

    // --- 📧 NOTIFY PARTIES (EMAIL) - NEW ---
    try {
        const clientUser = await User.findById(clientId);
        const freelancerUser = await User.findById(freelancerId);
        const jobTitle = contract.job?.title || "Contract Dispute";
        const resolutionText = resolution === "refund_client" ? "Refunded to Client" : "Released to Freelancer";

        // Notify Client
        if (clientUser && clientUser.email) {
            sendEmail(
                clientUser.email, 
                "DISPUTE_RESOLVED", 
                { jobTitle, resolution: resolutionText }, 
                clientId
            );
        }

        // Notify Freelancer
        if (freelancerUser && freelancerUser.email) {
            sendEmail(
                freelancerUser.email, 
                "DISPUTE_RESOLVED", 
                { jobTitle, resolution: resolutionText }, 
                freelancerId
            );
        }
    } catch (emailErr) {
        console.error("Dispute Email Error:", emailErr);
    }
    // ---------------------------------------

    return NextResponse.json({ message: "Resolved successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Resolution Error:", error);
    return NextResponse.json({ message: error.message || "Unknown error occurred" }, { status: 500 });
  }
}