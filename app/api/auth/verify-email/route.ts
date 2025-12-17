import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import User from '@/models/User';
import { sendEmail } from '@/lib/email'; // Import email sender

export async function POST(req: Request) {
    try {
        const { token } = await req.json();

        if (!token) return NextResponse.json({ message: "Token is required" }, { status: 400 });

        await connectToDB();

        const user = await User.findOne({ 
            verificationToken: token, 
            verificationTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            // FIX: Be less aggressive with the error.
            return NextResponse.json({ message: "Invalid or expired link. You may already be verified." }, { status: 400 });
        }

        // Verify User
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
        
        if (user.settings) {
            user.settings.verificationStatus = 'verified';
        }

        await user.save();

        // ✅ NEW: Trigger Welcome Email HERE (After successful verification)
        try {
            await sendEmail(user.email, "WELCOME", { name: user.name }, user._id);
        } catch (emailErr) {
            console.error("Welcome email failed:", emailErr);
            // Don't fail the request just because email failed
        }

        return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });

    } catch (error) {
        console.error("Verify Error:", error);
        return NextResponse.json({ message: "Server error during verification" }, { status: 500 });
    }
}