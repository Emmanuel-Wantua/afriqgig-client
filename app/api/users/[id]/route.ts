import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db"; 
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
    if (body.email) {
        const emailExists = await User.findOne({ email: body.email, _id: { $ne: id } });
        if (emailExists) {
            return NextResponse.json({ message: "Email is already in use by another account." }, { status: 400 });
        }
    }

    // 2. Define Allowed Updates (Whitelist)
    // ✅ ADDED: address, categories (array), category (legacy string)
    const allowedUpdates: any = {
        name: body.name,
        title: body.title,
        bio: body.bio,
        country: body.country,
        address: body.address,       // ✅ Added Address
        categories: body.categories, // ✅ Added Categories (Array)
        category: body.category,     // ✅ Added Legacy Category (String)

        phone: body.phone, 
        email: body.email, 
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
    // ✅ ADDED: "categories" to this list to ensure it's saved properly
    const arrayFields = [
        "skills", "interests", "portfolio", "certifications", 
        "experience", "education", "languages", "categories" 
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
    if (error.code === 11000) {
        return NextResponse.json({ message: "Email or Phone already in use." }, { status: 400 });
    }
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}