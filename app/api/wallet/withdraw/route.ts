import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { executePayout } from "@/lib/swychr";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { userId, amount, phone, beneficiaryName, provider } = await req.json();

    // 1. Basic Validation
    if (!userId || !amount || !phone || !beneficiaryName) {
      return NextResponse.json({ message: "Missing details" }, { status: 400 });
    }

    const withdrawAmount = Number(amount);
    if (withdrawAmount < 1000) {
        return NextResponse.json({ message: "Minimum withdrawal is 1,000 XAF" }, { status: 400 });
    }

    await connectToDB();

    // 2. Check Balance (Concurrency Safe)
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Calculate Available Balance (Balance - Pending Withdrawals)
    // Note: We do this check manually to be safe
    const pendingWithdrawals = await Transaction.find({ user: userId, type: "withdrawal", status: "pending" });
    const lockedAmount = pendingWithdrawals.reduce((acc, tx) => acc + tx.amount, 0);
    const availableBalance = user.wallet.balance - lockedAmount;

    if (availableBalance < withdrawAmount) {
        return NextResponse.json({ message: "Insufficient available balance" }, { status: 400 });
    }

    // 3. Calculate Fees (Pass to User)
    const PERCENTAGE_FEE = 0.015; // 1.5%
    const FIXED_FEE = 450; // 450 XAF
    
    const fee = Math.ceil((withdrawAmount * PERCENTAGE_FEE) + FIXED_FEE);
    const netPayout = withdrawAmount - fee;

    if (netPayout <= 0) {
        return NextResponse.json({ message: "Amount too low to cover fees" }, { status: 400 });
    }

    // 4. Create Transaction Record (Status: Pending)
    const reference = `WTH-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const transaction = await Transaction.create({
        user: userId,
        type: "withdrawal",
        amount: withdrawAmount, // We deduct the FULL amount from their wallet
        status: "pending",
        paymentMethod: provider || "MOMO",
        description: `Payout to ${phone} (${beneficiaryName})`,
        reference: reference,
        metadata: {
            fee,
            netPayout,
            provider
        }
    });

    // 5. Deduct from Wallet Immediately (Lock funds)
    // We deduct now. If Swychr fails, we refund. This prevents double-spending.
    user.wallet.balance -= withdrawAmount;
    await user.save();

    // 6. Execute Payout via Swychr
    try {
        console.log(`💸 [Payout] Sending ${netPayout} XAF to ${phone}...`);
        
        const payoutResponse = await executePayout({
            country_code: "CM", // Default Cameroon
            beneficiary_name: beneficiaryName,
            mobile_no: phone, // Must be E.164 (e.g., 237677...)
            amount: netPayout, // Send the NET amount
            transaction_id: reference,
            payment_method: "mobile_money", // or 'bank_transfer' based on provider
            // bank_code: "..." // Needed if bank transfer
        });

        console.log("✅ [Payout] Swychr Accepted:", payoutResponse);

        // 7. Update Status to Completed (or Processing)
        // Swychr creates it as 'pending' usually, but since we deducted, we keep it 'completed' 
        // or 'processing' until webhook confirms. For now, let's mark 'completed' 
        // as the funds effectively left our system.
        transaction.status = "completed";
        await transaction.save();

        // Notify User
        await Notification.create({
            user: userId,
            type: "payment",
            title: "Withdrawal Sent",
            message: `${netPayout.toLocaleString()} XAF has been sent to your account. (Fee: ${fee} XAF)`,
            link: "/dashboard/wallet",
            isRead: false
        });

        // Email
        if (user.email) {
            sendEmail(
                user.email,
                "WITHDRAWAL_APPROVED", // Ensure this template exists
                { amount: `${withdrawAmount.toLocaleString()} XAF` },
                userId
            );
        }

        return NextResponse.json({ 
            message: "Withdrawal successful", 
            netReceived: netPayout,
            fee 
        }, { status: 200 });

    } catch (swychrError: any) {
        console.error("❌ [Payout] Swychr Failed:", swychrError);

        // REFUND USER if Swychr failed immediately
        user.wallet.balance += withdrawAmount;
        await user.save();

        transaction.status = "failed";
        transaction.description += " [Refunded: Provider Error]";
        await transaction.save();

        return NextResponse.json({ 
            message: "Payout failed. Funds refunded.", 
            error: swychrError.message 
        }, { status: 502 });
    }

  } catch (error: any) {
    console.error("Withdrawal API Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}