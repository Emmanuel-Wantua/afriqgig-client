import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    // Validate before touching crypto/bcrypt: hashing `undefined` throws, and
    // a thrown error here would surface as an opaque 500.
    if (!token || typeof token !== "string") {
      return NextResponse.json({ message: "Token is invalid or has expired" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await connectToDB();

    // 1. Hash the token to compare with DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Find User with valid token & expiry
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Check if time > now
    });

    if (!user) {
      return NextResponse.json({ message: "Token is invalid or has expired" }, { status: 400 });
    }

    // 3. Hash New Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Update User
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;   // Clear token
    user.resetPasswordExpires = undefined; // Clear expiry
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" });

  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}