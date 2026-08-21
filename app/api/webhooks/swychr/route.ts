import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { sendEmail } from "@/lib/email";

function isValidSecret(provided: string | null): boolean {
  const expected = process.env.SWYCHR_WEBHOOK_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

interface SwychrWebhookAttributes {
  transaction_id: string;
  status: number;
  amount?: number;
  net_payable?: number;
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    if (!isValidSecret(searchParams.get("secret"))) {
      console.warn("🚫 [Webhook] Rejected request with invalid/missing secret");
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    console.log("🔔 [Swychr Webhook] Received:", JSON.stringify(body, null, 2));

    const attributes: SwychrWebhookAttributes | undefined = body?.data?.data?.attributes;

    if (!attributes) {
      console.error("❌ [Webhook] Invalid Payload Structure");
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const { transaction_id, status, amount, net_payable } = attributes;

    await connectToDB();

    const transaction = await Transaction.findOne({ reference: transaction_id });

    if (!transaction) {
      console.error(`❌ [Webhook] Transaction not found: ${transaction_id}`);
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
    }

    if (transaction.status === "completed") {
      console.log(`⚠️ [Webhook] Transaction ${transaction_id} already processed.`);
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    if (typeof amount === "number" && amount !== transaction.amount) {
      console.warn(
        `⚠️ [Webhook] Amount mismatch for ${transaction_id}: expected ${transaction.amount}, payload said ${amount}`
      );
    }

    if (status === 1) {
      console.log(`💰 [Webhook] Payment Success for ${transaction_id}`);

      transaction.status = "completed";
      transaction.amountPaid = net_payable || amount;
      transaction.updatedAt = new Date();
      await transaction.save();

      const user = await User.findByIdAndUpdate(
        transaction.user,
        { $inc: { "wallet.balance": transaction.amount } },
        { new: true }
      );

      await Notification.create({
        user: transaction.user,
        type: "payment",
        title: "Deposit Successful",
        message: `Your wallet has been funded with ${transaction.amount} XAF.`,
        link: "/dashboard/wallet",
        isRead: false
      });

      if (user && user.email) {
        sendEmail(
          user.email,
          "DEPOSIT",
          { amount: `${transaction.amount.toLocaleString()} XAF` },
          user._id
        );
      }

    } else if (status === 2) {
      console.log(`❌ [Webhook] Payment Failed for ${transaction_id}`);
      transaction.status = "failed";
      await transaction.save();

      await Notification.create({
        user: transaction.user,
        type: "system",
        title: "Deposit Failed",
        message: "Your payment could not be processed. Please try again.",
        link: "/dashboard/wallet",
        isRead: false
      });
    }

    return NextResponse.json({ message: "Webhook processed" }, { status: 200 });

  } catch (error: unknown) {
    console.error("🔥 [Webhook] Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
