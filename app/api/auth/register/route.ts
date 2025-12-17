import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import Notification from "@/models/Notification";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

// --- HELPER: Generate Unique Referral Code ---
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

    // 3. Handle Referral LOGIC
    let referrerId = null;
    let initialCredits = 0; 

    if (referralCode) {
        const referrer = await User.findOne({ referralCode });
        
        if (referrer && referrer.email !== email) {
            console.log(`Referral Valid: ${referrer.name} referred ${name}`);
            referrerId = referrer.referralCode;
            
            referrer.wallet.credits = (referrer.wallet.credits || 0) + 1;
            await referrer.save();

            await Notification.create({
                user: referrer._id,
                type: "system",
                title: "New Referral Signup! 🎉",
                message: `Your friend ${name} just joined. You earned 1 Commission-Free Job Credit!`,
                link: "/dashboard/referrals",
                isRead: false
            });

            initialCredits = 2;
        }
    }

    // 4. Generate NEW Referral Code
    let newReferralCode = generateReferralCode();
    const codeExists = await User.findOne({ referralCode: newReferralCode });
    if (codeExists) newReferralCode = generateReferralCode();

    // --- 5. GENERATE VERIFICATION TOKEN ---
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

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
      
      // Verification Fields
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

    // --- 7. SEND VERIFICATION EMAIL ---
    
    // Construct the link (Use NEXT_PUBLIC_APP_URL for consistency if defined, fallback to afriqgig.com)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || 'https://afriqgig.com';
    const verifyLink = `${baseUrl}/verify-email?token=${verifyToken}`;

    // A. LOG TO CONSOLE (Crucial for testing)
    console.log("========================================");
    console.log(`📧 VERIFICATION LINK FOR ${email}:`);
    console.log(verifyLink);
    console.log("========================================");

    // B. SEND VIA BREVO
    await sendEmail(
        newUser.email, 
        "VERIFY", 
        { 
            name: newUser.name, 
            link: verifyLink 
        }, 
        newUser._id // ✅ Corrected: Pass ID as 4th arg, not a template string
    );

    // ❌ REMOVED: Welcome Email (Moved to verification API)

    return NextResponse.json({ message: "User created. Please check your email to verify account." }, { status: 201 });

  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}