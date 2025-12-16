import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Dispute from "@/models/Dispute";
import Contract from "@/models/Contract";
import Transaction from "@/models/Transaction";
import Notification from "@/models/Notification";
import Job from "@/models/Job";
import User from "@/models/User";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { disputeId, resolution, adminId } = await req.json();
    
    // resolution options: "refund_client" | "release_freelancer"

    await connectToDB();
    const dispute = await Dispute.findById(disputeId).populate("contract");
    if (!dispute) return NextResponse.json({ message: "Dispute not found" }, { status: 404 });

    const contract = await Contract.findById(dispute.contract._id).populate("job"); // Ensure job is populated for title
    if (!contract) return NextResponse.json({ message: "Contract not found" }, { status: 404 });

    // --- EXECUTE FINANCIAL DECISION ---
    if (resolution === "refund_client") {
        const clientId = contract.client._id || contract.client;
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
        const fee = totalAmount * 0.05;
        const net = totalAmount - fee;

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
    dispute.admin = adminId;
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