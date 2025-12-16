import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db"; // Changed from dbConnect to match your imports
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDB();
    const user = await User.findById(id).select("-password"); 
    
    if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await connectToDB();

    // 1. Check if email is being changed (Unique Check)
    // We check this BEFORE creating the update object
    if (body.email) {
        const emailExists = await User.findOne({ email: body.email, _id: { $ne: id } });
        if (emailExists) {
            return NextResponse.json({ message: "Email is already in use by another account." }, { status: 400 });
        }
    }

    // 2. Define Allowed Updates (Whitelist)
    // This securely filters the body. We explicitly INCLUDE email and phone here.
    const allowedUpdates: any = {
        name: body.name,
        title: body.title,
        bio: body.bio,
        country: body.country,
        phone: body.phone, // <--- Explicitly allowed now
        email: body.email, // <--- Explicitly allowed now
        skills: body.skills,
        interests: body.interests,
        portfolio: body.portfolio,
        certifications: body.certifications,
        experience: body.experience,
        education: body.education,
        languages: body.languages,
        avatar: body.avatar,
        coverPhoto: body.coverPhoto,
        rateType: body.rateType,
        hourlyRate: body.hourlyRate,
        externalPortfolio: body.externalPortfolio,
        settings: body.settings
    };

    // 3. Remove undefined keys so we don't overwrite existing data with nulls
    Object.keys(allowedUpdates).forEach(key => 
        allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    // 4. Ensure Arrays are Arrays (Data Integrity)
    const arrayFields = [
        "skills", "interests", "portfolio", "certifications", 
        "experience", "education", "languages"
    ];

    arrayFields.forEach(field => {
        if (allowedUpdates[field] && !Array.isArray(allowedUpdates[field])) {
            allowedUpdates[field] = [allowedUpdates[field]];
        }
    });

    // 5. Update User
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { $set: allowedUpdates }, 
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error: any) {
    console.error("Update failed:", error);
    // Handle Duplicate Key Error (MongoDB Code 11000)
    if (error.code === 11000) {
        return NextResponse.json({ message: "Email or Phone already in use." }, { status: 400 });
    }
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}