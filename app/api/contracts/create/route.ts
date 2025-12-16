import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Contract from "@/models/Contract";
import Job from "@/models/Job";
import Proposal from "@/models/Proposal";
import Notification from "@/models/Notification";
import User from "@/models/User";
import mongoose from "mongoose";
import { sendEmail } from "@/lib/email";
import { sendMobileNotification } from "@/lib/twilio"; // <--- 1. IMPORT ADDED

export async function POST(req: Request) {
  let session = null;

  try {
    const body = await req.json();
    console.log("[API] Starting Hiring Transaction...", body);
    
    const { jobId, freelancerId, clientId, amount, proposalId } = body;

    // 1. Connect & Start Session
    const conn = await connectToDB();
    session = await conn.startSession();
    session.startTransaction();

    // 2. CHECK FOR CLIENT REFERRAL CREDITS
    const clientUser = await User.findById(clientId).session(session);
    let discountApplied = false;
    let amountToPay = amount; 

    if (clientUser && clientUser.wallet.credits > 0) {
        console.log(`[DISCOUNT] Client ${clientUser.name} has credits. Applying 5% off.`);
        amountToPay = amount * 0.95; 
        clientUser.wallet.credits -= 1;
        await clientUser.save({ session });
        discountApplied = true;
    }

    // 3. Create Contract
    const [newContract] = await Contract.create([{
      job: jobId,
      client: clientId,
      freelancer: freelancerId,
      amount: amount, 
      amountPaid: amountToPay, 
      discountApplied: discountApplied, 
      paymentStatus: "pending", 
      status: "active",
      startDate: new Date()
    }], { session });

    // 4. Update Job Status
    const updatedJob = await Job.findByIdAndUpdate(jobId, { 
      status: "hired",
      hiredFreelancer: freelancerId
    }, { session, new: true });

    if (!updatedJob) {
        throw new Error("Job not found. Transaction aborted.");
    }

    // 5. Update Proposal Status
    if (proposalId) {
        await Proposal.findByIdAndUpdate(proposalId, { status: "accepted" }, { session });
    }

    // 6. Create Notification (Freelancer)
    await Notification.create([{
        user: freelancerId,
        type: "hired",
        title: "You're Hired!",
        message: `You have been hired for "${updatedJob.title}"`,
        link: `/dashboard/contracts/${newContract._id}`,
        isRead: false
    }], { session });

    // --- 📧 EMAIL & 📱 MOBILE NOTIFICATIONS ---
    // Fetch freelancer details to send alerts
    const freelancerUser = await User.findById(freelancerId).session(session);
    
    if (freelancerUser) {
        // A. Send Email
        sendEmail(
            freelancerUser.email, 
            "HIRED", 
            { jobTitle: updatedJob.title }, 
            freelancerId
        );

        // B. Send WhatsApp/SMS (New Feature)
        // We use the client's name in the message for context
        const clientName = clientUser ? clientUser.name : "A Client";
        
        // This runs asynchronously so it doesn't block the transaction commit
        sendMobileNotification(
            freelancerId, 
            "HIRED", 
            [clientName, updatedJob.title]
        ).catch(err => console.error("Mobile Notif Failed:", err));
    }
    // ------------------------------------------

    // 7. Create Notification (Client - Confirming Discount)
    if (discountApplied) {
        await Notification.create([{
            user: clientId,
            type: "system",
            title: "Discount Applied! 🎉",
            message: `Referral credit used. You saved ${amount - amountToPay} XAF on this hire.`,
            link: `/dashboard/wallet`,
            isRead: false
        }], { session });
    }

    // --- COMMIT TRANSACTION ---
    await session.commitTransaction();
    console.log("✅ Hiring Transaction Committed. Contract ID:", newContract._id);

    return NextResponse.json({ 
      message: "Contract created successfully", 
      contractId: newContract._id,
      discountApplied
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ Hiring Transaction Failed:", error);
    
    if (session) {
        await session.abortTransaction();
        console.log("⚠️ Transaction Aborted.");
    }
    
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    if (session) {
        session.endSession();
    }
  }
}