import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Helper: Consistent with Registration Logic
function generateReferralCode() {
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `AFQ-${random}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ message: "ID Required" }, { status: 400 });

    await connectToDB();
    const user = await User.findById(userId);

    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // 1. Generate Code if missing (Fallback for existing users)
    if (!user.referralCode) {
        let newCode = generateReferralCode();
        
        // Safety Check: Ensure uniqueness
        const codeExists = await User.findOne({ referralCode: newCode });
        if (codeExists) newCode = generateReferralCode(); // Retry once
        
        user.referralCode = newCode;
        await user.save();
    }

    // 2. Calculate Real Stats
    // Counts how many users list THIS user's code as their 'referredBy'
    const referralCount = await User.countDocuments({ referredBy: user.referralCode });

    return NextResponse.json({
        code: user.referralCode,
        credits: user.wallet?.credits || 0,
        totalReferred: referralCount
    }, { status: 200 });

  } catch (error) {
    console.error("Referral API Error:", error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}