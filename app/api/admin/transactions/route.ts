import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { sendEmail } from "@/lib/email"; // <--- 1. Import Email

export const dynamic = "force-dynamic";

// GET: Fetch Pending Withdrawals
export async function GET() {
  try {
    await connectToDB();
    const pending = await Transaction.find({ 
        type: "withdrawal", 
        status: "pending" 
    })
    .populate("user", "name email avatar")
    .sort({ date: 1 }); // Oldest first

    return NextResponse.json(pending, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

// PATCH: Approve or Reject
export async function PATCH(req: Request) {
    try {
        const { transactionId, action, reason } = await req.json(); // action: 'approve' | 'reject'
        await connectToDB();

        const tx = await Transaction.findById(transactionId);
        if (!tx) return NextResponse.json({ message: "Transaction not found" }, { status: 404 });

        // Need the user details for email
        const user = await User.findById(tx.user);

        if (action === 'approve') {
            tx.status = 'completed';
            tx.processedAt = new Date();
            await tx.save();

            // 2. Notify User (In-App)
            await Notification.create({
                user: tx.user,
                type: "payment",
                title: "Withdrawal Approved",
                message: `Your withdrawal of ${tx.amount} XAF has been sent to ${tx.paymentMethod}.`,
                link: `/dashboard/wallet`,
                isRead: false
            });

            // 3. 📧 Notify User (EMAIL) - SUCCESS
            if (user && user.email) {
                sendEmail(
                    user.email,
                    "WITHDRAWAL_APPROVED",
                    { amount: `${tx.amount.toLocaleString()} XAF` },
                    user._id
                );
            }
        } 
        else if (action === 'reject') {
            tx.status = 'failed'; // Marks it failed so it doesn't deduct from balance anymore
            tx.description = `${tx.description} [REJECTED: ${reason || 'Admin Action'}]`;
            tx.processedAt = new Date();
            await tx.save();

            // Notify User (In-App)
            await Notification.create({
                user: tx.user,
                type: "admin_alert",
                title: "Withdrawal Rejected",
                message: `Your request for ${tx.amount} XAF was rejected. Reason: ${reason || "Invalid details"}`,
                link: `/dashboard/wallet`,
                isRead: false
            });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("Tx Admin Error:", error);
        return NextResponse.json({ message: "Error processing" }, { status: 500 });
    }
}