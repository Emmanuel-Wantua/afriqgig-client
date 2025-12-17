import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import LinkedInProvider from "next-auth/providers/linkedin";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import crypto from "crypto";
import { cookies } from "next/headers"; // Import cookies

// --- Helper: Generate Referral Code ---
function generateReferralCode() {
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `AFQ-${random}`;
}

export const authOptions: NextAuthOptions = {
  providers: [
    // 1. Social Providers
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
    
    // 2. Credentials Provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "2FA Code", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        await connectToDB();
        
        // Fix: Clean phone input
        const cleanIdentifier = credentials.identifier.trim();
        const cleanPhone = cleanIdentifier.replace(/\s+/g, ''); 

        // 1. Find User (Email OR Phone)
        const user = await User.findOne({
          $or: [
            { email: cleanIdentifier },
            { phone: cleanIdentifier },
            { phone: cleanPhone }
          ]
        }).select("+password +twoFactorSecret +twoFactorEnabled"); 

        if (!user || !user.password) throw new Error("User not found");

        // 2. Verify Password
        const isMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isMatch) throw new Error("Invalid password");

        // 3. Verify 2FA
        if (user.twoFactorEnabled) {
            if (!credentials.otp) throw new Error("2FA_REQUIRED");
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: "base32",
                token: credentials.otp
            });
            if (!verified) throw new Error("Invalid 2FA Code");
        }

        const { password, twoFactorSecret, ...userWithoutSensitive } = user.toObject();
        return userWithoutSensitive;
      }
    })
  ],
  callbacks: {
    // A. Sign In Callback - Handles Social Login Creation
    async signIn({ user, account }: any) {
        if (account?.provider === "credentials") return true;
        
        if (["google", "github", "linkedin"].includes(account?.provider)) {
            await connectToDB();
            try {
                const existingUser = await User.findOne({ email: user.email });
                
                if (!existingUser) {
                    // --- CREATE NEW USER VIA SOCIAL ---
                    
                    // 1. Retrieve the role from the cookie (Safe for Next.js 15 & 14)
                    let userRole = "freelancer";
                    try {
                        const cookieStore = await cookies(); // Await is needed for Next.js 15
                        const roleCookie = cookieStore.get("afriq_signup_role");
                        if (roleCookie) userRole = roleCookie.value;
                    } catch (e) {
                        // Fallback if cookie fails
                    }

                    let newCode = generateReferralCode();
                    const codeExists = await User.findOne({ referralCode: newCode });
                    if (codeExists) newCode = generateReferralCode();

                    await User.create({
                        name: user.name,
                        email: user.email,
                        avatar: user.image,
                        role: userRole, // Uses the cookie role
                        authProvider: account.provider,
                        authProviderId: user.id,
                        isVerified: true, // Social is verified by default
                        country: "Cameroon",
                        referralCode: newCode, 
                        wallet: { balance: 0, credits: 0 },
                        settings: { language: "en", currency: "XAF", theme: "light" }
                    });
                } else {
                    // --- LINK EXISTING ACCOUNT ---
                    if (!existingUser.authProvider) {
                        existingUser.authProvider = account.provider;
                        existingUser.authProviderId = user.id;
                        await existingUser.save();
                    }
                }
                return true;
            } catch (error) {
                console.error("Social Signin Error:", error);
                return false;
            }
        }
        return true;
    },

    // B. JWT Callback - ✅ FIXED THE CRASH HERE
    async jwt({ token, user, trigger, session }: any) {
        if (user) {
            // 1. Check if user came from Database (Credentials)
            if (user._id) {
                token.id = user._id.toString();
                token.role = user.role;
                token.picture = user.avatar;
            } 
            // 2. Check if user came from Social Provider (No _id yet)
            else {
                await connectToDB();
                const dbUser = await User.findOne({ email: user.email });
                if (dbUser) {
                    token.id = dbUser._id.toString(); // Safe access
                    token.role = dbUser.role;
                    token.picture = dbUser.avatar;
                }
            }
            token.name = user.name;
        }
        if (trigger === "update" && session) {
            return { ...token, ...session.user };
        }
        return token;
    },

    async session({ session, token }: any) {
        if (token) {
            session.user._id = token.id;
            session.user.role = token.role;
            session.user.avatar = token.picture;
            session.user.name = token.name;
        }
        return session;
    },
  },
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: `afriqgig.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };