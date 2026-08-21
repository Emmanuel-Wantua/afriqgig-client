import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import LinkedInProvider from "next-auth/providers/linkedin";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";
import { cookies } from "next/headers";
import { authorizeCredentials } from "@/lib/credentialsAuthorize";

function generateReferralCode() {
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `AFQ-${random}`;
}

export const authOptions: NextAuthOptions = {
  // ✅ 1. Force Secure Cookies (Crucial for Nginx/VPS)
  useSecureCookies: true,

  providers: [
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
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "2FA Code", type: "text" },
      },
      authorize: (credentials) => authorizeCredentials(credentials),
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;

      if (["google", "github", "linkedin"].includes(account?.provider)) {
        await connectToDB();
        try {
          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            let userRole = "freelancer";
            try {
              const cookieStore = await cookies();
              const roleCookie = cookieStore.get("afriq_signup_role");
              if (roleCookie) userRole = roleCookie.value;
            } catch (e) {}

            let newCode = generateReferralCode();
            const codeExists = await User.findOne({ referralCode: newCode });
            if (codeExists) newCode = generateReferralCode();

            await User.create({
              name: user.name,
              email: user.email,
              avatar: user.image,
              role: userRole,
              authProvider: account.provider,
              authProviderId: user.id,
              isVerified: true,
              country: "Cameroon",
              referralCode: newCode,
              wallet: { balance: 0, credits: 0 },
              settings: { language: "en", currency: "XAF", theme: "light" },
            });
          } else {
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

    async jwt({ token, user, trigger, session }) {
      if (user) {
        if (user._id) {
          token.id = user._id.toString();
          token.role = user.role;
          token.picture = user.avatar;
        } else if (user.email) {
          try {
            await connectToDB();
            const dbUser = await User.findOne({ email: user.email });
            if (dbUser && dbUser._id) {
              token.id = dbUser._id.toString();
              token.role = dbUser.role;
              token.picture = dbUser.avatar;
            }
          } catch (error) {
            console.error("JWT DB Lookup Error:", error);
          }
        }
        token.name = user.name;
      }
      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user._id = token.id;
        session.user.role = token.role;
        session.user.avatar = token.picture;
        session.user.name = token.name;
      }
      return session;
    },
  },

  // ✅ 2. Define Secure Cookies Explicitly (Solves State Mismatch)
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: { sameSite: "lax", path: "/", secure: true },
    },
    csrfToken: {
      name: `__Secure-next-auth.csrf-token`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
    pkceCodeVerifier: {
      name: `__Secure-next-auth.pkce.code_verifier`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
    state: {
      name: `__Secure-next-auth.state`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
  },

  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
