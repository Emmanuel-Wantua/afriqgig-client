import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { sendEmail } from "@/lib/email"; 

export const dynamic = "force-dynamic";

// GET: Fetch Transactions (Supports 'all' for Finance Page, default 'pending' for Withdrawals)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter"); // 'all' or undefined

    await connectToDB();

    let query = {};
    if (filter === 'all') {
        // Return everything for Financials Page
        query = {}; 
    } else {
        // Default: Only Pending Withdrawals (For Withdrawals Page)
        query = { type: "withdrawal", status: "pending" };
    }

    const transactions = await Transaction.find(query)
    .populate("user", "name email avatar")
    .sort({ date: -1 }); // Newest first

    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error("Tx Fetch Error:", error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

// PATCH: Approve or Reject
export async function PATCH(req: Request) {
    try {
        const { transactionId, action, reason } = await req.json(); 
        await connectToDB();

        const tx = await Transaction.findById(transactionId);
        if (!tx) return NextResponse.json({ message: "Transaction not found" }, { status: 404 });

        const user = await User.findById(tx.user);

        if (action === 'approve') {
            tx.status = 'completed';
            tx.processedAt = new Date();
            await tx.save();

            // Notify User (In-App)
            await Notification.create({
                user: tx.user,
                type: "payment",
                title: "Withdrawal Approved",
                message: `Your withdrawal of ${tx.amount} XAF has been sent to ${tx.paymentMethod}.`,
                link: `/dashboard/wallet`,
                isRead: false
            });

            // Notify User (Email)
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
            tx.status = 'failed'; 
            tx.description = `${tx.description} [REJECTED: ${reason || 'Admin Action'}]`;
            tx.processedAt = new Date();
            await tx.save();

            // Refund User Wallet Logic (Important!)
            if (user) {
                user.wallet.balance += tx.amount; // Refund the amount back to balance
                user.wallet.pending -= tx.amount; // Remove from pending
                await user.save();
            }

            // Notify User
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