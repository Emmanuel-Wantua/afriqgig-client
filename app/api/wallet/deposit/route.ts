import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { createDepositLink } from "@/lib/swychr";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await req.json();

    const depositAmount = Number(amount);

    // `Number.isFinite` first — NaN fails every `<` comparison, so a junk
    // amount like "100abc" would otherwise pass a bare minimum check.
    if (!Number.isFinite(depositAmount) || depositAmount < 100) {
      return NextResponse.json({ message: "Invalid amount (Min: 100 XAF)" }, { status: 400 });
    }

    await connectToDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const reference = `DEP-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;

    const newTx = await Transaction.create({
      user: userId,
      type: 'deposit',
      amount: depositAmount,
      status: 'pending',
      paymentMethod: 'SWYCHR_LINK',
      description: 'Wallet Top-up (Pending)',
      reference: reference
    });

    try {
        const swychrData = await createDepositLink(user, depositAmount, reference);

        return NextResponse.json({
            message: "Payment link created",
            url: swychrData.payment_link,
            transactionId: newTx._id
        }, { status: 200 });

    } catch (swychrError: unknown) {
        const message = swychrError instanceof Error ? swychrError.message : "Unknown error";
        newTx.status = 'failed';
        newTx.description = `Failed to generate link: ${message}`;
        await newTx.save();

        throw swychrError;
    }

  } catch (error: unknown) {
    console.error("Deposit API Error:", error);
    const message = error instanceof Error ? error.message : "Failed to initiate deposit";
    return NextResponse.json({ message }, { status: 500 });
  }
}
