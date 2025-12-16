import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Contract from "@/models/Contract";
import Notification from "@/models/Notification";
import Transaction from "@/models/Transaction";
import Job from "@/models/Job"; 
import User from "@/models/User"; 
import mongoose from "mongoose";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const findContractFast = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const objId = new mongoose.Types.ObjectId(id);
    return await Contract.findOne({ $or: [{ _id: objId }, { job: objId }] })
    .populate("client", "name avatar email title isVerified rating reviewsCount")
    .populate("freelancer", "name avatar email title isVerified rating reviewsCount")
    .populate("job", "title description attachments status currency"); 
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDB();
    const contract = await findContractFast(id);
    
    if (!contract) return NextResponse.json({ message: "Contract not found" }, { status: 404 });

    // --- SELF-HEALING LOGIC ---
    if (contract.status === "completed" && contract.job?.status !== "completed") {
        console.log(`[API FIX] Auto-correcting Job Status for: ${contract.job.title}`);
        await Job.findByIdAndUpdate(contract.job._id, { status: "completed" });
        contract.job.status = "completed"; 
    }
    // ---------------------------

    return NextResponse.json(contract, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        await connectToDB();

        const existingContract = await Contract.findById(id)
            .populate("client")
            .populate("freelancer")
            .populate("job");

        if (!existingContract) return NextResponse.json({ message: "Contract not found" }, { status: 404 });

        // 1. Update Contract
        const updatedContract = await Contract.findByIdAndUpdate(existingContract._id, body, { new: true })
                                                .populate("job");

                                                if (body.submission) {
            // Logic: Freelancer just submitted work. Notify Client.
            const clientUser = existingContract.client;
            const freelancerUser = existingContract.freelancer;

            if (clientUser && clientUser.email) {
                sendEmail(
                    clientUser.email,
                    "JOB_SUBMITTED",
                    { 
                        freelancerName: freelancerUser.name, 
                        jobTitle: existingContract.job.title,
                        jobId: existingContract.job._id
                    },
                    clientUser._id
                );
            }
        }

        // 2. SYNC JOB STATUS & RELEASE PAYMENT
        if (body.status === "completed") {
            
            // A. Update Job Status
            const jobId = updatedContract.job._id || updatedContract.job;
            await Job.findByIdAndUpdate(jobId, { status: "completed" });

            // B. Release Payment
            if (existingContract.paymentStatus !== "released") {
                
                const totalAmount = updatedContract.amount;
                
                // --- REFERRAL DISCOUNT LOGIC (Freelancer Side) ---
                let feePercentage = 0.05; // Standard 5%
                
                // Fetch Freelancer to check credits
                const freelancerId = updatedContract.freelancer._id || updatedContract.freelancer;
                const freelancerUser = await User.findById(freelancerId);

                if (freelancerUser && freelancerUser.wallet?.credits > 0) {
                    console.log(`[PAYMENT] applying Referral Discount for ${freelancerUser.name}`);
                    feePercentage = 0.025; // 50% Discount (2.5%)
                    
                    // Deduct Credit
                    freelancerUser.wallet.credits -= 1;
                    await freelancerUser.save();
                }
                // -------------------------------------------------

                const platformFee = totalAmount * feePercentage; 
                const freelancerPay = totalAmount - platformFee; 

                console.log(`[FINANCE] Releasing Payment. Total: ${totalAmount}, Fee: ${platformFee} (${feePercentage*100}%), Net: ${freelancerPay}`);

                // 1. Credit Freelancer (Net Amount)
                await Transaction.create({
                    user: freelancerId,
                    type: "payment_release",
                    amount: freelancerPay, 
                    status: "completed",
                    paymentMethod: "ESCROW",
                    description: `Payment released: ${updatedContract.job?.title || 'Contract'} (Fee: ${feePercentage*100}%)`,
                    reference: `REL-${updatedContract._id}`
                });

                await Contract.findByIdAndUpdate(existingContract._id, { paymentStatus: "released" });

                // Notify Freelancer
                await Notification.create({
                    user: freelancerId,
                    type: "payment",
                    title: "Payment Released!",
                    message: `Client approved work. ${freelancerPay} XAF added to wallet. (Fee: ${feePercentage*100}%)`,
                    link: `/dashboard/wallet`,
                    isRead: false
                });
                // --- 📧 CASE B: PAYMENT RELEASED ---
                if (freelancerUser && freelancerUser.email) {
                    sendEmail(
                        freelancerUser.email,
                        "PAYMENT_RELEASED",
                        { 
                            jobTitle: updatedContract.job.title, 
                            amount: `${freelancerPay.toLocaleString()} XAF` 
                        },
                        freelancerId
                    );
                }
            }
        }

        // 3. Other Notifications
        try {
            if (body.submission) {
                await Notification.create({
                    user: updatedContract.client._id || updatedContract.client,
                    type: "submission",
                    title: "Work Submitted",
                    message: "Freelancer has submitted work for review.",
                    link: `/dashboard/contracts/${updatedContract._id}`,
                    isRead: false
                });
            }
        } catch (e) { console.error("Notification Error:", e); }

        return NextResponse.json(updatedContract, { status: 200 });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

