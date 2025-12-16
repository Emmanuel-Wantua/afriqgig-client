import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🔔 [Swychr Webhook] Received:", JSON.stringify(body, null, 2));

    // 1. Extract Data safely from the nested structure
    // Schema: { data: { data: { attributes: { transaction_id, status, ... } } } }
    const attributes = body?.data?.data?.attributes;

    if (!attributes) {
      console.error("❌ [Webhook] Invalid Payload Structure");
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const { transaction_id, status, amount, net_payable } = attributes;

    // 2. Connect to DB
    await connectToDB();

    // 3. Find the Transaction (using the reference we sent as transaction_id)
    const transaction = await Transaction.findOne({ reference: transaction_id });

    if (!transaction) {
      console.error(`❌ [Webhook] Transaction not found: ${transaction_id}`);
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
    }

    // 4. Check Idempotency (Prevent double crediting)
    if (transaction.status === "completed") {
      console.log(`⚠️ [Webhook] Transaction ${transaction_id} already processed.`);
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    // 5. Handle Status Updates
    // Status 1 = Success (Paid)
    if (status === 1) {
      console.log(`💰 [Webhook] Payment Success for ${transaction_id}`);

      // A. Update Transaction Record
      transaction.status = "completed";
      transaction.amountPaid = net_payable || amount; // Track actual amount paid if available
      transaction.updatedAt = new Date();
      await transaction.save();

      // B. Credit User Wallet
      const user = await User.findByIdAndUpdate(
        transaction.user,
        { $inc: { "wallet.balance": transaction.amount } }, // Add the original requested amount
        { new: true }
      );

      // C. Notify User (In-App)
      await Notification.create({
        user: transaction.user,
        type: "payment",
        title: "Deposit Successful",
        message: `Your wallet has been funded with ${transaction.amount} XAF.`,
        link: "/dashboard/wallet",
        isRead: false
      });

      // D. Send Email
      if (user && user.email) {
        sendEmail(
          user.email,
          "DEPOSIT", // Ensure you have this template in src/lib/email.ts
          { amount: `${transaction.amount.toLocaleString()} XAF` },
          user._id
        );
      }

    } else if (status === 2) {
      // Status 2 = Failed
      console.log(`❌ [Webhook] Payment Failed for ${transaction_id}`);
      transaction.status = "failed";
      await transaction.save();
      
      // Notify User of Failure
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

  } catch (error: any) {
    console.error("🔥 [Webhook] Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}