import { NextResponse } from "next/server";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";

// 1. SETUP: Generate Secret & QR Code
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) return NextResponse.json({ message: "User ID required" }, { status: 400 });

        const secret = speakeasy.generateSecret({
            name: "AfriqGig" 
        });

        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || "");

        return NextResponse.json({ 
            secret: secret.base32, 
            qrCode: qrCodeUrl 
        });

    } catch (error) {
        return NextResponse.json({ message: "Failed to generate 2FA" }, { status: 500 });
    }
}

// 2. VERIFY: Check Code & Enable
export async function POST(req: Request) {
    try {
        await connectToDB();
        const body = await req.json();
        const { userId, token, secret } = body;

        console.log(`🔐 2FA Attempt for User: ${userId}`);
        console.log(`📝 Token: ${token}, Secret Length: ${secret?.length}`);

        // 1. Verify the token first
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: "base32",
            token: token,
            window: 1 // Allow 30sec leeway for time drift
        });

        console.log(`✅ Verification Result: ${verified}`);

        if (verified) {
            // 2. Update User in DB
            // We use { new: true } to return the updated document so we can log it
            const updatedUser = await User.findByIdAndUpdate(
                userId, 
                {
                    twoFactorEnabled: true,
                    twoFactorSecret: secret 
                },
                { new: true } 
            );

            if (!updatedUser) {
                console.error("❌ User not found in DB during 2FA update");
                return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
            }

            console.log("💾 Database Updated Successfully:", {
                id: updatedUser._id,
                "2fa_enabled": updatedUser.twoFactorEnabled
            });

            return NextResponse.json({ success: true, message: "2FA Enabled" });
        } else {
            console.warn("⚠️ Invalid 2FA Code entered");
            return NextResponse.json({ success: false, message: "Invalid Code" }, { status: 400 });
        }

    } catch (error: any) {
        console.error("🔥 2FA Server Error:", error);
        return NextResponse.json({ message: "Verification failed", error: error.message }, { status: 500 });
    }
}