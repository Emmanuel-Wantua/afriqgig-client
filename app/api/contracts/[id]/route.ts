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

        // 🔍 DEBUG: Log Entry
        console.log(`\n--- [SERVER] PATCH /api/contracts/${id} ---`);
        console.log("[SERVER] Payload Received:", JSON.stringify(body));

        // 1. Fetch Contract (Robust Lookup)
        let existingContract = await Contract.findById(id)
            .populate("client")
            .populate("freelancer")
            .populate("job");

        if (!existingContract) {
            console.log("[SERVER] Contract not found by ID. Checking via Job ID...");
            existingContract = await Contract.findOne({ job: id })
                .populate("client")
                .populate("freelancer")
                .populate("job");
        }

        if (!existingContract) {
            console.error("[SERVER] ❌ Contract Not Found.");
            return NextResponse.json({ message: "Contract not found" }, { status: 404 });
        }

        // ✅ FIX: Handle Client adding extra files (WITH LOGS)
        if (body.newAttachment) {
            console.log("📎 [SERVER] Processing New Attachment...");

            if (existingContract.job) {
                // 1. Update Job
                await Job.findByIdAndUpdate(existingContract.job._id, {
                    $push: { attachments: body.newAttachment }
                });
                console.log("✅ [SERVER] Job Attachment Saved.");

                // 2. Notify Freelancer
                try {
                    // Robust ID Extraction (Handle populated object vs string ID)
                    const freelancerObj = existingContract.freelancer;
                    const freelancerId = freelancerObj?._id || freelancerObj;

                    console.log(`[SERVER] Targeting Freelancer ID: ${freelancerId}`);

                    if (freelancerId) {
                        const newNotif = await Notification.create({
                            user: freelancerId,
                            type: "job_update", 
                            title: "New File Added 📎",
                            message: `The client added a new file to the contract: ${existingContract.job.title}`,
                            link: `/dashboard/contracts/${existingContract._id}`,
                            isRead: false
                        });
                        console.log(`✅ [SERVER] Notification Created (ID: ${newNotif._id})`);
                    } else {
                        console.warn("⚠️ [SERVER] Freelancer ID is missing! Cannot send notification.");
                    }
                } catch (e) {
                    console.error("🔥 [SERVER] Notification Failed:", e);
                }
                
                // If only uploading a file, return success now
                if (Object.keys(body).length === 1) {
                    return NextResponse.json({ message: "File added successfully" }, { status: 200 });
                }
            } else {
                console.error("❌ [SERVER] Contract has no associated Job.");
            }
        }

        // Clean Payload
        const updatePayload = { ...body };
        delete updatePayload.newAttachment;

        // 1. Update Contract
        const updatedContract = await Contract.findByIdAndUpdate(
            existingContract._id, 
            { $set: updatePayload }, 
            { new: true }
        ).populate("job").populate("client").populate("freelancer");

        // 2. Handle Notifications for Submission (Freelancer -> Client)
        if (body.submission) {
            const clientUser = existingContract.client;
            const freelancerUser = existingContract.freelancer;

            if (clientUser) {
                await Notification.create({
                    user: clientUser._id,
                    type: "submission",
                    title: "Work Submitted",
                    message: `${freelancerUser.name} has submitted work for review.`,
                    link: `/dashboard/contracts/${updatedContract._id}`,
                    isRead: false
                });

                if (clientUser.email) {
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
        }

        // 3. SYNC JOB STATUS & RELEASE PAYMENT (Client -> Freelancer)
        if (body.status === "completed") {
            const jobId = updatedContract.job._id || updatedContract.job;
            await Job.findByIdAndUpdate(jobId, { status: "completed" });

            if (existingContract.paymentStatus !== "released") {
                const totalAmount = updatedContract.amount;
                let feePercentage = 0.05; 
                
                const freelancerId = updatedContract.freelancer._id || updatedContract.freelancer;
                const freelancerUser = await User.findById(freelancerId);

                if (freelancerUser && freelancerUser.wallet?.credits > 0) {
                    feePercentage = 0.025;
                    freelancerUser.wallet.credits -= 1;
                    await freelancerUser.save();
                }

                const platformFee = totalAmount * feePercentage; 
                const freelancerPay = totalAmount - platformFee; 

                await Transaction.create({
                    user: freelancerId,
                    type: "payment_release",
                    amount: freelancerPay, 
                    status: "completed",
                    paymentMethod: "ESCROW",
                    description: `Payment released: ${updatedContract.job?.title}`,
                    reference: `REL-${updatedContract._id}`
                });

                await Contract.findByIdAndUpdate(existingContract._id, { paymentStatus: "released" });

                await Notification.create({
                    user: freelancerId,
                    type: "payment",
                    title: "Payment Released!",
                    message: `Client approved work. ${freelancerPay.toLocaleString()} XAF added to wallet.`,
                    link: `/dashboard/wallet`,
                    isRead: false
                });

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

        return NextResponse.json(updatedContract, { status: 200 });

    } catch (error: any) {
        console.error("Contract Update Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}