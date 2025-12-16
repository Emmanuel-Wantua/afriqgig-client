import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import Notification from "@/models/Notification"; 
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Destructure ALL Root Fields explicitly
    // We separate "Root" fields from "Settings" fields here
    const { 
        userId, newPassword, country, isActive, 
        identityDocuments, identityDocType, 
        title, bio, skills, languages, experience, education, certifications, hourlyRate, rateType, portfolio,
        twoFactorEnabled, // <--- CRITICAL FIX: Extract this from preferences
        ...preferences    // Everything left here goes into 'settings' object
    } = body; 
    
    if (!userId) {
        return NextResponse.json({ message: "User ID required" }, { status: 400 });
    }

    await connectToDB();

    const updates: any = {};

    // 2. Handle Root Level Updates
    if (country) updates.country = country;
    if (isActive !== undefined) updates.isActive = isActive;
    if (title) updates.title = title;
    if (bio) updates.bio = bio;
    if (hourlyRate) updates.hourlyRate = hourlyRate;
    if (rateType) updates.rateType = rateType;
    if (twoFactorEnabled !== undefined) updates.twoFactorEnabled = twoFactorEnabled; // <--- Saved to Root

    if (skills) updates.skills = skills;
    if (languages) updates.languages = languages;
    if (experience) updates.experience = experience;
    if (education) updates.education = education;
    if (certifications) updates.certifications = certifications;
    if (portfolio) updates.portfolio = portfolio;
    
    // 3. Handle Identity Documents
    if (identityDocuments) {
        updates.identityDocuments = identityDocuments;
        updates.isVerified = false; // Reset verification on new doc upload
        
        // We update the setting status to pending
        updates['settings.verificationStatus'] = "pending";
        
        try {
            const admins = await User.find({ role: "admin" }).select("_id");
            if (admins.length > 0) {
                const user = await User.findById(userId).select("name");
                const adminNotifs = admins.map(admin => ({
                    user: admin._id,
                    type: "admin_alert",
                    title: "New Verification Request",
                    message: `${user?.name || "A user"} submitted ID documents.`,
                    link: `/dashboard/admin/users`,
                    isRead: false
                }));
                await Notification.insertMany(adminNotifs);
            }
        } catch (e) {
            console.error("Verification Notif Error:", e);
        }
    }
    if (identityDocType) updates.identityDocType = identityDocType;

    // 4. Handle Password Security
    if (newPassword && newPassword.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(newPassword, salt);
    }

    // 5. Handle Nested Settings (Privacy Toggles, etc.)
    // This loop now correctly handles: profileVisibility, showOnlineStatus, allowDataCollection
    Object.keys(preferences).forEach(key => {
        if (key === "notifications") {
             updates[`settings.notifications`] = preferences.notifications;
        } else {
             // Example: settings.profileVisibility = "private"
             updates[`settings.${key}`] = preferences[key];
        }
    });

    const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { $set: updates }, 
        { new: true }
    ).select("-password");

    if (!updatedUser) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error: any) {
    console.error("Settings API Error:", error);
    return NextResponse.json({ message: "Settings update failed" }, { status: 500 });
  }
}