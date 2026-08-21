import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Contract from "@/models/Contract";
import Job from "@/models/Job";
import Proposal from "@/models/Proposal";
import Notification from "@/models/Notification";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { sendEmail } from "@/lib/email";
import { sendMobileNotification } from "@/lib/twilio";
import { getIdentity } from "@/lib/auth";

/**
 * Hire a freelancer: create the contract and move the money into escrow.
 *
 * Everything financial here is derived server-side. The request body supplies
 * only *which* job and *which* proposal — never the price, never the payer.
 * A client that POSTs `amount: 1` is ignored; the figure comes from the
 * accepted proposal's stored bid.
 */
export async function POST(req: Request) {
  try {
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const clientId = identity.userId;

    const { jobId, proposalId } = await req.json();

    if (!jobId || !proposalId) {
      return NextResponse.json(
        { message: "jobId and proposalId are required" },
        { status: 400 }
      );
    }

    await connectToDB();

    // 1. The job must exist and belong to the caller. This is the
    //    authorization chain — the browser doesn't get to name the payer.
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    if (String(job.client) !== clientId) {
      return NextResponse.json(
        { message: "You can only hire on your own job" },
        { status: 403 }
      );
    }

    if (job.status !== "open") {
      return NextResponse.json(
        { message: "This job is no longer open for hiring" },
        { status: 409 }
      );
    }

    // 2. The proposal must belong to this job. The freelancer and the price
    //    both come from it, not from the request.
    const proposal = await Proposal.findById(proposalId);
    if (!proposal || String(proposal.job) !== String(job._id)) {
      return NextResponse.json(
        { message: "Proposal not found for this job" },
        { status: 404 }
      );
    }

    const freelancerId = String(proposal.freelancer);
    const amount = Number(proposal.bidAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ message: "Proposal has an invalid bid amount" }, { status: 400 });
    }

    if (freelancerId === clientId) {
      return NextResponse.json({ message: "You cannot hire yourself" }, { status: 400 });
    }

    // 3. Referral discount — also server-side, read from the stored credits.
    const clientUser = await User.findById(clientId);
    if (!clientUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const hasCredit = (clientUser.wallet?.credits || 0) > 0;
    const amountToPay = hasCredit ? Math.ceil(amount * 0.95) : amount;

    // 4. Move the money into escrow atomically. The filter doubles as the
    //    balance check, so two concurrent hires can't both pass on the same
    //    funds. A client-side "you have enough balance" check is advisory
    //    only — this is the one that counts.
    const debitUpdate: Record<string, number> = { "wallet.balance": -amountToPay };
    if (hasCredit) debitUpdate["wallet.credits"] = -1;

    const debitedClient = await User.findOneAndUpdate(
      { _id: clientId, "wallet.balance": { $gte: amountToPay } },
      { $inc: debitUpdate },
      { new: true }
    );

    if (!debitedClient) {
      return NextResponse.json(
        { message: "Insufficient wallet balance to fund this contract" },
        { status: 402 }
      );
    }

    try {
      const newContract = await Contract.create({
        job: jobId,
        client: clientId,
        freelancer: freelancerId,
        amount: amount,
        amountPaid: amountToPay,
        discountApplied: hasCredit,
        paymentStatus: "held",
        status: "active",
        startDate: new Date()
      });

      await Transaction.create({
        user: clientId,
        type: "payment_hold",
        amount: amountToPay,
        status: "completed",
        paymentMethod: "ESCROW",
        description: `Escrow funded for: ${job.title}`,
        reference: `HOLD-${newContract._id}`
      });

      const updatedJob = await Job.findByIdAndUpdate(
        jobId,
        { status: "hired", hiredFreelancer: freelancerId },
        { new: true }
      );

      await Proposal.findByIdAndUpdate(proposalId, { status: "accepted" });

      await Notification.create({
        user: freelancerId,
        type: "hired",
        title: "You're Hired!",
        message: `You have been hired for "${updatedJob?.title || job.title}"`,
        link: `/dashboard/contracts/${newContract._id}`,
        isRead: false
      });

      const freelancerUser = await User.findById(freelancerId);
      if (freelancerUser?.email) {
        sendEmail(freelancerUser.email, "HIRED", { jobTitle: job.title }, freelancerId);

        sendMobileNotification(freelancerId, "HIRED", [clientUser.name, job.title]).catch(
          (err: unknown) => console.error("Mobile Notif Failed:", err)
        );
      }

      if (hasCredit) {
        await Notification.create({
          user: clientId,
          type: "system",
          title: "Discount Applied! 🎉",
          message: `Referral credit used. You saved ${amount - amountToPay} XAF on this hire.`,
          link: `/dashboard/wallet`,
          isRead: false
        });
      }

      return NextResponse.json({
        message: "Contract created successfully",
        contractId: newContract._id,
        amount,
        amountPaid: amountToPay,
        discountApplied: hasCredit
      }, { status: 201 });

    } catch (creationError: unknown) {
      // The debit already landed. If anything downstream failed, hand the
      // money back rather than leaving the client short with no contract.
      await User.findByIdAndUpdate(clientId, { $inc: { "wallet.balance": amountToPay } });
      console.error("❌ Hiring failed after debit — refunded client:", creationError);
      throw creationError;
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("❌ Hiring Failed:", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
