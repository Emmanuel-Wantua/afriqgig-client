import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";

export interface CredentialsInput {
  identifier?: string;
  password?: string;
  otp?: string;
}

/**
 * Core Credentials-provider logic, extracted out of the NextAuth route so it
 * can be unit-tested directly. Importing the route file itself pulls in
 * `next/headers` and instantiates NextAuth(), neither of which belongs in a
 * plain Jest environment.
 */
export async function authorizeCredentials(
  credentials: CredentialsInput | undefined,
) {
  if (!credentials?.identifier || !credentials?.password) {
    throw new Error("Invalid credentials");
  }

  await connectToDB();

  const cleanIdentifier = credentials.identifier.trim();
  const cleanPhone = cleanIdentifier.replace(/\s+/g, "");

  const user = await User.findOne({
    $or: [
      { email: cleanIdentifier },
      { phone: cleanIdentifier },
      { phone: cleanPhone },
    ],
  }).select("+password +twoFactorSecret +twoFactorEnabled");

  if (!user || !user.password) throw new Error("User not found");

  // ✅ FIX (from the audit): blocks a suspended/deactivated account from ever
  // obtaining a session — not just from the old, unused /api/auth/login route.
  if (user.status === "suspended") {
    throw new Error("Account suspended. Please contact support.");
  }
  if (user.status === "deactivated") {
    throw new Error("Account deactivated.");
  }

  const isMatch = await bcrypt.compare(credentials.password, user.password);
  if (!isMatch) throw new Error("Invalid password");

  if (user.twoFactorEnabled) {
    if (!credentials.otp) throw new Error("2FA_REQUIRED");
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: credentials.otp,
    });
    if (!verified) throw new Error("Invalid 2FA Code");
  }

  const { password, twoFactorSecret, ...userWithoutSensitive } =
    user.toObject();
  return userWithoutSensitive;
}
