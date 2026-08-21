import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Contract from "@/models/Contract";
import Notification from "@/models/Notification";
import Transaction from "@/models/Transaction";
import Job from "@/models/Job";
import User from "@/models/User";
import mongoose from "mongoose";
import { sendEmail } from "@/lib/email";
import { getIdentity } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Platform commission. Server-side constants — never read from a request. */
const STANDARD_FEE = 0.05;
const DISCOUNTED_FEE = 0.025;

const findContractFast = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const objId = new mongoose.Types.ObjectId(id);
    return await Contract.findOne({ $or: [{ _id: objId }, { job: objId }] })
    .populate("client", "name avatar email title isVerified rating reviewsCount")
    .populate("freelancer", "name avatar email title isVerified rating reviewsCount")
    .populate("job", "title description attachments status currency");
};

/** Normalises a populated-or-raw ObjectId reference to a string. */
function idOf(ref: unknown): string {
    if (!ref) return "";
    if (typeof ref === "object" && ref !== null && "_id" in ref) {
        return String((ref as { _id: unknown })._id);
    }
    return String(ref);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDB();
    const contract = await findContractFast(id);

    if (!contract) return NextResponse.json({ message: "Contract not found" }, { status: 404 });

    // A contract is private to its two parties (and admins).
    const isParty =
      idOf(contract.client) === identity.userId ||
      idOf(contract.freelancer) === identity.userId;

    if (!isParty && identity.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // --- SELF-HEALING LOGIC ---
    if (contract.status === "completed" && contract.job?.status !== "completed") {
        await Job.findByIdAndUpdate(contract.job._id, { status: "completed" });
        contract.job.status = "completed";
    }

    return NextResponse.json(contract, { status: 200 });
  } catch (error: unknown) {
    console.error("Contract GET Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const identity = await getIdentity();
        if (!identity) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        await connectToDB();

        // 1. Fetch Contract (Robust Lookup)
        let existingContract = await Contract.findById(id)
            .populate("client")
            .populate("freelancer")
            .populate("job");

        if (!existingContract) {
            existingContract = await Contract.findOne({ job: id })
                .populate("client")
                .populate("freelancer")
                .populate("job");
        }

        if (!existingContract) {
            return NextResponse.json({ message: "Contract not found" }, { status: 404 });
        }

        const clientId = idOf(existingContract.client);
        const freelancerId = idOf(existingContract.freelancer);
        const isClient = clientId === identity.userId;
        const isFreelancer = freelancerId === identity.userId;

        if (!isClient && !isFreelancer) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // 2. Client attaching an extra file to the brief.
        if (body.newAttachment) {
            if (!isClient) {
                return NextResponse.json(
                    { message: "Only the client can add attachments" },
                    { status: 403 }
                );
            }

            if (existingContract.job) {
                await Job.findByIdAndUpdate(existingContract.job._id, {
                    $push: { attachments: body.newAttachment }
                });

                if (freelancerId) {
                    await Notification.create({
                        user: freelancerId,
                        type: "job_update",
                        title: "New File Added 📎",
                        message: `The client added a new file to the contract: ${existingContract.job.title}`,
                        link: `/dashboard/contracts/${existingContract._id}`,
                        isRead: false
                    });
                }

                if (Object.keys(body).length === 1) {
                    return NextResponse.json({ message: "File added successfully" }, { status: 200 });
                }
            }
        }

        // 3. Build the update from an ALLOW-LIST.
        //
        // The route used to `$set` the raw request body, so a caller could
        // PATCH `{ amount: 999999 }` or `{ paymentStatus: "released" }` and
        // rewrite the contract's financial terms. Money fields are never
        // client-writable; `paymentStatus` is set by the release logic below.
        const updatePayload: Record<string, unknown> = {};

        if (body.submission !== undefined) {
            if (!isFreelancer) {
                return NextResponse.json(
                    { message: "Only the freelancer can submit work" },
                    { status: 403 }
                );
            }
            updatePayload.submission = body.submission;
        }

        if (body.status !== undefined) {
            const ALLOWED_STATUSES = ["active", "completed", "cancelled", "disputed"];
            if (!ALLOWED_STATUSES.includes(body.status)) {
                return NextResponse.json({ message: "Invalid status" }, { status: 400 });
            }
            // Approving the work releases the escrow, so only the paying
            // client may mark a contract completed.
            if (body.status === "completed" && !isClient) {
                return NextResponse.json(
                    { message: "Only the client can approve and complete a contract" },
                    { status: 403 }
                );
            }
            updatePayload.status = body.status;
        }

        if (body.endDate !== undefined) updatePayload.endDate = body.endDate;

        const updatedContract = await Contract.findByIdAndUpdate(
            existingContract._id,
            { $set: updatePayload },
            { new: true }
        ).populate("job").populate("client").populate("freelancer");

        // 4. Work submitted → notify the client.
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

        // 5. Completion → release escrow to the freelancer.
        if (body.status === "completed") {
            const jobId = idOf(updatedContract.job);
            await Job.findByIdAndUpdate(jobId, { status: "completed" });

            // Idempotency guard: release exactly once, however many times the
            // client clicks "approve".
            const claimed = await Contract.findOneAndUpdate(
                { _id: existingContract._id, paymentStatus: { $ne: "released" } },
                { $set: { paymentStatus: "released" } },
                { new: true }
            );

            if (claimed) {
                // The amount comes from the stored contract, never the request.
                const totalAmount = Number(existingContract.amount);
                const freelancerUser = await User.findById(freelancerId);

                let feePercentage = STANDARD_FEE;
                if (freelancerUser && (freelancerUser.wallet?.credits || 0) > 0) {
                    feePercentage = DISCOUNTED_FEE;
                    await User.findByIdAndUpdate(freelancerId, {
                        $inc: { "wallet.credits": -1 }
                    });
                }

                const platformFee = Math.ceil(totalAmount * feePercentage);
                const freelancerPay = totalAmount - platformFee;

                // Actually move the money. Previously only a Transaction row
                // was written, so the freelancer's spendable balance never
                // changed and the earnings could not be withdrawn.
                await User.findByIdAndUpdate(freelancerId, {
                    $inc: { "wallet.balance": freelancerPay }
                });

                await Transaction.create({
                    user: freelancerId,
                    type: "payment_release",
                    amount: freelancerPay,
                    status: "completed",
                    paymentMethod: "ESCROW",
                    description: `Payment released: ${updatedContract.job?.title}`,
                    reference: `REL-${updatedContract._id}`
                });

                await Notification.create({
                    user: freelancerId,
                    type: "payment",
                    title: "Payment Released!",
                    message: `Client approved work. ${freelancerPay.toLocaleString()} XAF added to wallet.`,
                    link: `/dashboard/wallet`,
                    isRead: false
                });

                if (freelancerUser?.email) {
                    sendEmail(
                        freelancerUser.email,
                        "PAYMENT_RELEASED",
                        {
                            jobTitle: updatedContract.job?.title,
                            amount: `${freelancerPay.toLocaleString()} XAF`
                        },
                        freelancerId
                    );
                }
            }
        }

        return NextResponse.json(updatedContract, { status: 200 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Server Error";
        console.error("Contract Update Error:", error);
        return NextResponse.json({ message }, { status: 500 });
    }
}
