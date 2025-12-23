import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import Notification from "@/models/Notification";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

function generateReferralCode() {
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `AFQ-${random}`;
}

export async function POST(req: Request) {
  try {
    const { 
        name, email, phone, password, 
        role, country, skills, referralCode 
    } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    await connectToDB();

    // 1. STRICT ANTI-ABUSE CHECKS
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ message: "Email already registered" }, { status: 400 });
    }

    if (phone) {
        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return NextResponse.json({ message: "Phone number already in use" }, { status: 400 });
        }
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Handle Referral LOGIC (✅ UPDATED: Credit only if NEW user is CLIENT)
    let referrerId = null;
    let initialCredits = 0; 

    if (referralCode) {
        const referrer = await User.findOne({ referralCode });
        
        if (referrer && referrer.email !== email) {
            console.log(`Referral Valid: ${referrer.name} referred ${name}`);
            referrerId = referrer.referralCode;
            
            // ✅ FIX: Only award credits if the NEW user is a CLIENT
            // (Bringing in freelancers is good, but you only pay for clients)
            if (role === 'client') {
                referrer.wallet.credits = (referrer.wallet.credits || 0) + 1;
                await referrer.save();

                await Notification.create({
                    user: referrer._id,
                    type: "system",
                    title: "New Referral Reward! 🎁",
                    message: `You referred a new Client (${name})! You earned 1 Commission Discount Credit.`,
                    link: "/dashboard/referrals",
                    isRead: false
                });
                
                // Bonus for the new user (incentive to use the code)
                initialCredits = 2; 
            }
        }
    }

    // 4. Generate NEW Referral Code
    let newReferralCode = generateReferralCode();
    const codeExists = await User.findOne({ referralCode: newReferralCode });
    if (codeExists) newReferralCode = generateReferralCode();

    // 5. Generate Verification Token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 Days

    // 6. Create User
    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      country: country || "Cameroon",
      skills: skills || [],
      
      referralCode: newReferralCode,
      referredBy: referrerId,
      
      isVerified: false, 
      verificationToken: verifyToken,
      verificationTokenExpiry: verifyTokenExpiry,
      
      wallet: {
          balance: 0,
          pending: 0,
          credits: initialCredits,
          currency: "XAF"
      },
      
      settings: {
          language: "en",
          currency: "XAF",
          theme: "light",
          notifications: { email: true, push: true, inApp: true }
      }
    });

    // 7. Send Verification Email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || 'https://afriqgig.com';
    const verifyLink = `${baseUrl}/verify-email?token=${verifyToken}`;

    await sendEmail(
        newUser.email, 
        "VERIFY", 
        { 
            name: newUser.name, 
            link: verifyLink 
        }, 
        newUser._id
    );

    return NextResponse.json({ message: "User created. Please verify your email." }, { status: 201 });

  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}