import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { createDepositLink } from "@/lib/swychr";

export async function POST(req: Request) {
  try {
    const { userId, amount } = await req.json();

    if (!userId || !amount || amount < 100) {
      return NextResponse.json({ message: "Invalid amount (Min: 100 XAF)" }, { status: 400 });
    }

    await connectToDB();

    // 1. Verify User
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 2. Generate a Unique Transaction ID (Reference)
    // Format: DEP-{Timestamp}-{Random4Chars}
    const reference = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 3. Create "Pending" Record in MongoDB
    // We create this BEFORE calling Swychr so we have a record of the attempt
    const newTx = await Transaction.create({
      user: userId,
      type: 'deposit',
      amount: Number(amount),
      status: 'pending', // Waiting for Webhook
      paymentMethod: 'SWYCHR_LINK',
      description: 'Wallet Top-up (Pending)',
      reference: reference
    });

    // 4. Generate the Payment Link via Swychr Engine
    try {
        const swychrData = await createDepositLink(user, Number(amount), reference);
        
        // 5. Success! Return the link to the frontend
        return NextResponse.json({ 
            message: "Payment link created", 
            url: swychrData.payment_link, // The URL to redirect the user to
            transactionId: newTx._id 
        }, { status: 200 });

    } catch (swychrError: any) {
        // If Swychr fails, mark our local record as failed
        newTx.status = 'failed';
        newTx.description = `Failed to generate link: ${swychrError.message}`;
        await newTx.save();
        
        throw swychrError; // Re-throw to be caught below
    }

  } catch (error: any) {
    console.error("Deposit API Error:", error);
    return NextResponse.json({ message: error.message || "Failed to initiate deposit" }, { status: 500 });
  }
}