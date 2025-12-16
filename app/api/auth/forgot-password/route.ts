import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        await connectToDB();

        const user = await User.findOne({ email });
        
        // Security: Always return "Success" even if email doesn't exist 
        // to prevent email enumeration attacks.
        if (!user) {
            return NextResponse.json({ message: "If that email exists, we sent a link." });
        }

        // 1. Generate Token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        // 2. Save to DB (Valid for 1 hour)
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        // 3. Send Email
        const resetUrl = `${process.env.NEXT_PUBLIC_URL}/reset-password/${resetToken}`;
        
        await sendEmail(user.email, "RESET_PASSWORD", { resetUrl });

        return NextResponse.json({ message: "If that email exists, we sent a link." });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}