import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import Contract from "@/models/Contract";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// GET: Fetch Wallet Data
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    await connectToDB();

    // 1. Fetch Transaction History
    const transactions = await Transaction.find({ user: userId }).sort({ date: -1 });

    // 2. Calculate "Available" Balance
    let available = 0;
    let pendingWithdrawals = 0;

    transactions.forEach((tx: any) => {
        if (tx.status === 'completed') {
            if (tx.type === 'deposit' || tx.type === 'payment_release') available += tx.amount;
            if (tx.type === 'withdrawal' || tx.type === 'payment_hold' || tx.type === 'service_fee') available -= tx.amount;
        }
        // IMPORTANT: Deduct pending withdrawals from available visually, or track them separately
        if (tx.status === 'pending' && tx.type === 'withdrawal') {
            pendingWithdrawals += tx.amount;
            available -= tx.amount; // Lock funds immediately so they can't be used
        }
    });

    // 3. Calculate "Escrow" Balance
    const activeContracts = await Contract.find({
        $or: [{ client: userId }, { freelancer: userId }],
        status: "active"
    });
    const escrow = activeContracts.reduce((sum: number, contract: any) => sum + contract.amount, 0);

    return NextResponse.json({ 
        balance: { available: Math.max(0, available), escrow, pending: pendingWithdrawals },
        transactions 
    }, { status: 200 });

  } catch (error) {
    console.error("Wallet Error:", error);
    return NextResponse.json({ message: "Error fetching wallet" }, { status: 500 });
  }
}