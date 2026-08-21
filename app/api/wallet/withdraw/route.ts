import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { executePayout, SwychrPayoutError } from "@/lib/swychr";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    // ✅ Identity now comes from the verified session, never from the request
    // body. Your session callback stores the id at `session.user._id`.
    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { amount, phone, beneficiaryName, provider } = await req.json();

    if (!amount || !phone || !beneficiaryName) {
      return NextResponse.json({ message: "Missing details" }, { status: 400 });
    }

    const withdrawAmount = Number(amount);

    // Guard the NaN hole first: `Number("10000abc")` is NaN, and every
    // comparison against NaN is false — so a bare `< 1000` check would let a
    // junk amount straight through to the payout call.
    if (!Number.isFinite(withdrawAmount)) {
        return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    if (withdrawAmount < 1000) {
        return NextResponse.json({ message: "Minimum withdrawal is 1,000 XAF" }, { status: 400 });
    }

    await connectToDB();

    const existingUser = await User.findById(userId);
    if (!existingUser) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const pendingWithdrawals = await Transaction.find({ user: userId, type: "withdrawal", status: "pending" });
    const lockedAmount = pendingWithdrawals.reduce((acc, tx) => acc + tx.amount, 0);

    // Server-side only — never trust a client-supplied fee or net amount
    const PERCENTAGE_FEE = 0.015;
    const FIXED_FEE = 450;

    const fee = Math.ceil((withdrawAmount * PERCENTAGE_FEE) + FIXED_FEE);
    const netPayout = withdrawAmount - fee;

    if (netPayout <= 0) {
        return NextResponse.json({ message: "Amount too low to cover fees" }, { status: 400 });
    }

    // Idempotency key. Uses crypto randomness rather than Math.random so two
    // concurrent withdrawals can't collide on a reference and have the
    // provider silently dedupe one real payout away.
    const reference = `WTH-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;

    const transaction = await Transaction.create({
        user: userId,
        type: "withdrawal",
        amount: withdrawAmount,
        status: "pending",
        paymentMethod: provider || "MOMO",
        description: `Payout to ${phone} (${beneficiaryName})`,
        reference: reference,
        metadata: { fee, netPayout, provider }
    });

    // Atomic balance deduction: the "check balance is sufficient" and
    // "deduct it" happen as one indivisible operation, so two concurrent
    // withdrawal requests can't both pass the check before either deducts.
    const lockedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        $expr: { $gte: [{ $subtract: ["$wallet.balance", lockedAmount] }, withdrawAmount] }
      },
      { $inc: { "wallet.balance": -withdrawAmount } },
      { new: true }
    );

    if (!lockedUser) {
        transaction.status = "failed";
        transaction.description += " [Insufficient available balance]";
        await transaction.save();
        return NextResponse.json({ message: "Insufficient available balance" }, { status: 400 });
    }

    try {
        console.log(`💸 [Payout] Sending ${netPayout} XAF to ${phone}...`);

        const payoutResponse = await executePayout({
            country_code: "CM",
            beneficiary_name: beneficiaryName,
            mobile_no: phone,
            amount: netPayout,
            transaction_id: reference,
            payment_method: "mobile_money",
        });

        console.log("✅ [Payout] Swychr Accepted:", payoutResponse);

        transaction.status = "completed";
        await transaction.save();

        await Notification.create({
            user: userId,
            type: "payment",
            title: "Withdrawal Sent",
            message: `${netPayout.toLocaleString()} XAF has been sent to your account. (Fee: ${fee} XAF)`,
            link: "/dashboard/wallet",
            isRead: false
        });

        if (lockedUser.email) {
            sendEmail(
                lockedUser.email,
                "WITHDRAWAL_APPROVED",
                { amount: `${withdrawAmount.toLocaleString()} XAF` },
                userId
            );
        }

        return NextResponse.json({
            message: "Withdrawal successful",
            netReceived: netPayout,
            fee
        }, { status: 200 });

    } catch (swychrError: unknown) {
        console.error("❌ [Payout] Swychr Failed:", swychrError);

        const isKnownRejection = swychrError instanceof SwychrPayoutError && swychrError.isExplicitRejection;
        const errorMessage = swychrError instanceof Error ? swychrError.message : "Unknown payout error";

        if (isKnownRejection) {
            await User.findByIdAndUpdate(userId, { $inc: { "wallet.balance": withdrawAmount } });

            transaction.status = "failed";
            transaction.description += " [Refunded: Provider rejected the payout]";
            await transaction.save();

            return NextResponse.json({
                message: "Payout failed. Funds refunded.",
                error: errorMessage
            }, { status: 502 });
        }

        // Unclear outcome (timeout/no response) — do NOT auto-refund, since
        // the payout may have gone through on Swychr's side already.
        transaction.status = "processing";
        transaction.description += " [Unclear outcome — needs reconciliation, NOT auto-refunded]";
        await transaction.save();

        console.error(`🚨 [Payout] UNCLEAR OUTCOME for ${reference} — do not auto-refund. Needs reconciliation.`);

        return NextResponse.json({
            message: "We're confirming your withdrawal status with the payment provider. This can take a few minutes — check back on your wallet page before retrying.",
        }, { status: 202 });
    }

  } catch (error: unknown) {
    console.error("Withdrawal API Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
