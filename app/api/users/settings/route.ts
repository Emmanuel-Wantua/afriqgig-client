import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import Notification from "@/models/Notification";
import bcrypt from "bcryptjs";
import { getIdentity } from "@/lib/auth";

/**
 * Fields a user may set on their own settings object.
 *
 * This is an allow-list on purpose. The route previously spread every
 * unrecognised body key into `settings.*`, which let a caller PATCH
 * `verificationStatus: "verified"` and mark their own account verified —
 * bypassing the admin approval step entirely.
 */
const ALLOWED_SETTING_KEYS = new Set([
  "theme",
  "language",
  "currency",
  "contentLanguage",
  "autoplayVideo",
  "reduceAnimations",
  "soundEffects",
  "profileVisibility",
  "showOnlineStatus",
  "allowDataCollection",
]);

export async function PATCH(req: Request) {
  try {
    // ✅ Identity comes from the session. A client-supplied `userId` is never
    // trusted — otherwise any caller could rewrite any other account,
    // including its password.
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = identity.userId;

    const body = await req.json();

    const {
      newPassword,
      country,
      isActive,
      identityDocuments,
      identityDocType,
      title,
      bio,
      skills,
      languages,
      experience,
      education,
      certifications,
      hourlyRate,
      rateType,
      portfolio,
      twoFactorEnabled,
      canHire,
      ...preferences
    } = body;

    await connectToDB();

    const updates: Record<string, unknown> = {};

    // 2. Handle Root Level Updates
    if (country) updates.country = country;
    if (isActive !== undefined) updates.isActive = isActive;
    if (title) updates.title = title;
    if (bio) updates.bio = bio;
    if (hourlyRate !== undefined && Number.isFinite(Number(hourlyRate))) {
      updates.hourlyRate = Number(hourlyRate);
    }
    if (rateType) updates.rateType = rateType;
    if (twoFactorEnabled !== undefined)
      updates.twoFactorEnabled = twoFactorEnabled;
    if (canHire !== undefined) updates.canHire = Boolean(canHire);

    if (skills) updates.skills = skills;
    if (languages) updates.languages = languages;
    if (experience) updates.experience = experience;
    if (education) updates.education = education;
    if (certifications) updates.certifications = certifications;
    if (portfolio) updates.portfolio = portfolio;

    // 3. Identity documents — this is a REQUEST for verification, never a
    // grant. `isVerified` stays false; only an admin can flip it.
    if (identityDocuments) {
      updates.identityDocuments = identityDocuments;
      updates.isVerified = false;
      updates["settings.verificationStatus"] = "pending";

      try {
        const admins = await User.find({ role: "admin" }).select("_id");
        if (admins.length > 0) {
          const user = await User.findById(userId).select("name");
          const adminNotifs = admins.map((admin: { _id: unknown }) => ({
            user: admin._id,
            type: "admin_alert",
            title: "New Verification Request",
            message: `${user?.name || "A user"} submitted ID documents.`,
            link: `/dashboard/admin/users`,
            isRead: false,
          }));
          await Notification.insertMany(adminNotifs);
        }
      } catch (e) {
        console.error("Verification Notif Error:", e);
      }
    }
    if (identityDocType) updates.identityDocType = identityDocType;

    // 4. Password change
    if (newPassword && String(newPassword).trim() !== "") {
      if (String(newPassword).length < 8) {
        return NextResponse.json(
          { message: "Password must be at least 8 characters" },
          { status: 400 },
        );
      }
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(newPassword, salt);
    }

    // 5. Nested settings — allow-listed, so privilege fields such as
    // `verificationStatus` can never be written from the client.
    Object.keys(preferences).forEach((key) => {
      if (key === "notifications") {
        updates["settings.notifications"] = preferences.notifications;
      } else if (ALLOWED_SETTING_KEYS.has(key)) {
        updates[`settings.${key}`] = preferences[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true },
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: unknown) {
    console.error("Settings API Error:", error);
    return NextResponse.json(
      { message: "Settings update failed" },
      { status: 500 },
    );
  }
}
