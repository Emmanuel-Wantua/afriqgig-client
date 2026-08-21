import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || typeof password !== "string" || password.length === 0) {
        return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    // 1. Connect to DB
    await connectToDB();

    // 2. Find the user (and ask Mongoose to give us the password too)
    // Email is normalised at registration, so look it up the same way.
    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select("+password");

    if (!user) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });
    }

    // ✅ FIX: Security Check for Suspended/Deactivated Accounts
    if (user.status === 'suspended') {
        return NextResponse.json({ 
            message: "Account suspended. Please contact support." 
        }, { status: 403 }); // 403 Forbidden
    }
    
    if (user.status === 'deactivated') {
        return NextResponse.json({ 
            message: "Account deactivated." 
        }, { status: 403 });
    }

    // Social-login accounts have no password hash. `bcrypt.compare` throws on
    // an undefined hash, which would surface as a 500 — reject cleanly instead.
    if (!user.password) {
        return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // 4. Remove password from the object before sending back to frontend
    const userWithoutPassword = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      balance: user.balance,
      avatar: user.avatar
    };

    // 5. Success
    return NextResponse.json(
      { message: "Login successful", user: userWithoutPassword },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}