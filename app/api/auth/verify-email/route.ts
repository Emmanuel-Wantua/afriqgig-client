import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db'; // Changed from utils/db to lib/db to match your structure
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const { token } = await req.json();

        if (!token) return NextResponse.json({ message: "Token is required" }, { status: 400 });

        await connectToDB();

        const user = await User.findOne({ 
            verificationToken: token, 
            verificationTokenExpiry: { $gt: Date.now() } // Check expiry
        });

        if (!user) {
            return NextResponse.json({ message: "Invalid or expired verification link." }, { status: 400 });
        }

        // Verify User
        user.isVerified = true;
        user.verificationToken = undefined;       // Clear token
        user.verificationTokenExpiry = undefined; // Clear expiry
        
        // Update settings status if it exists
        if (user.settings) {
            user.settings.verificationStatus = 'verified';
        }

        await user.save();

        return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });

    } catch (error) {
        console.error("Verify Error:", error);
        return NextResponse.json({ message: "Server error during verification" }, { status: 500 });
    }
}