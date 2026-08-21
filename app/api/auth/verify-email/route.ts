import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import User from '@/models/User';
import { sendEmail } from '@/lib/email'; 

export async function POST(req: Request) {
    try {
        const { token } = await req.json();

        if (!token) return NextResponse.json({ message: "Token is required" }, { status: 400 });

        await connectToDB();

        // 1. Try to find user by token
        const user = await User.findOne({ 
            verificationToken: token, 
            verificationTokenExpiry: { $gt: Date.now() } 
        });

        if (!user) {
            // Users click the link twice, or click it after it expires. Look
            // the token up again without the expiry constraint to tell those
            // two cases apart.
            const tokenHolder = await User.findOne({ verificationToken: token });

            // Already verified — a second click is a success, not an error.
            if (tokenHolder?.isVerified) {
                return NextResponse.json(
                    { message: "Email already verified. Logging you in...", code: "SUCCESS" },
                    { status: 200 }
                );
            }

            // Either the token is unknown, or it exists but has expired on a
            // still-unverified account. Both are dead links.
            //
            // This branch used to fall through to `user.isVerified = true`
            // with `user === null`, throwing a TypeError and returning a 500.
            return NextResponse.json({
                message: "Link expired or invalid. Please log in to resend.",
                code: "INVALID_TOKEN"
            }, { status: 400 });
        }

        // 2. Verify User
        user.isVerified = true;
        // Optional: Keep token for a bit or clear it. Clearing ensures security.
        user.verificationToken = undefined;       
        user.verificationTokenExpiry = undefined; 
        
        if (user.settings) {
            user.settings.verificationStatus = 'verified';
        }

        await user.save();

        // ✅ Trigger Welcome Email
        try {
            await sendEmail(user.email, "WELCOME", { name: user.name }, user._id);
        } catch (emailErr) {
            console.error("Welcome email warning:", emailErr);
        }

        return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });

    } catch (error) {
        console.error("Verify Error:", error);
        return NextResponse.json({ message: "Server error during verification" }, { status: 500 });
    }
}