import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import Job from "@/models/Job";
import Proposal from "@/models/Proposal";
import Contract from "@/models/Contract";
import Message from "@/models/Message";
import Notification from "@/models/Notification";
import Review from "@/models/Review";
import Post from "@/models/Post";
import Dispute from "@/models/Dispute";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Every handler in this file exposes or mutates other people's accounts,
    // so each one re-checks admin privilege from the database.
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectToDB();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");

    const query: Record<string, unknown> = {};
    if (filter === "pending") {
        query["settings.verificationStatus"] = "pending";
    }

    const users = await User.find(query)
        .select("name email avatar role isVerified settings identityDocuments identityDocType country status createdAt")
        .sort({ createdAt: -1 });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Fetch Users Error:", error);
    return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 });
  }
}

// PATCH: Approve/Reject Verification OR Update Status
export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action, status } = body; // action: "approve" | "reject" | "update_status"

    if (!userId) {
        return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }

    await connectToDB();

    const updates: Record<string, unknown> = {};

    // --- ACTION 1: VERIFICATION ---
    // This is the ONLY path that can set isVerified = true. Users request
    // verification by uploading documents; an admin grants it here.
    if (action === "approve") {
        updates.isVerified = true;
        updates["settings.verificationStatus"] = "verified";
    } else if (action === "reject") {
        updates.isVerified = false;
        updates["settings.verificationStatus"] = "rejected";
    }
    // --- ACTION 2: STATUS UPDATE (Suspend/Activate) ---
    else if (action === "update_status") {
        const ALLOWED_STATUSES = ["active", "suspended", "deactivated"];
        if (!ALLOWED_STATUSES.includes(status)) {
            return NextResponse.json({ message: "Invalid status" }, { status: 400 });
        }
        // An admin suspending themselves would lock the platform's own
        // operators out, so block it.
        if (String(userId) === admin.userId && status !== "active") {
            return NextResponse.json(
                { message: "You cannot suspend your own admin account" },
                { status: 400 }
            );
        }
        updates.status = status;
    } else {
        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true }
    ).select("-password");

    if (!updatedUser) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const msg = action === "update_status" ? `User status updated to ${status}` : `User verification ${action}ed`;
    return NextResponse.json({ message: msg, user: updatedUser }, { status: 200 });

  } catch (error) {
    console.error("Update User Error:", error);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

/**
 * DELETE: remove a user account and every piece of content they created.
 *
 * Financial ledger rows (Transaction) are deliberately NOT deleted — they are
 * accounting records, not user content, and destroying them would break the
 * platform's books and any audit of past payouts. The account is removed and
 * its content erased; the money trail survives.
 */
export async function DELETE(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }

    if (userId === admin.userId) {
      return NextResponse.json(
        { message: "You cannot delete your own admin account" },
        { status: 400 }
      );
    }

    await connectToDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Refuse while money is still in flight — deleting here would strand
    // funds held in escrow with no party to release them to.
    const activeContracts = await Contract.countDocuments({
      $or: [{ client: userId }, { freelancer: userId }],
      status: "active",
    });

    if (activeContracts > 0) {
      return NextResponse.json(
        {
          message: `User has ${activeContracts} active contract(s). Resolve or cancel them before deleting.`,
        },
        { status: 409 }
      );
    }

    // Cascade: remove everything this user authored across the platform.
    const [jobs, proposals, contracts, messages, notifications, reviews, posts, disputes] =
      await Promise.all([
        Job.deleteMany({ client: userId }),
        Proposal.deleteMany({ $or: [{ freelancer: userId }, { client: userId }] }),
        Contract.deleteMany({ $or: [{ client: userId }, { freelancer: userId }] }),
        Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
        Notification.deleteMany({ user: userId }),
        Review.deleteMany({ $or: [{ reviewer: userId }, { target: userId }] }),
        Post.deleteMany({ author: userId }),
        Dispute.deleteMany({ $or: [{ initiator: userId }, { opponent: userId }] }),
      ]);

    await User.findByIdAndDelete(userId);

    const deleted = {
      jobs: jobs.deletedCount ?? 0,
      proposals: proposals.deletedCount ?? 0,
      contracts: contracts.deletedCount ?? 0,
      messages: messages.deletedCount ?? 0,
      notifications: notifications.deletedCount ?? 0,
      reviews: reviews.deletedCount ?? 0,
      posts: posts.deletedCount ?? 0,
      disputes: disputes.deletedCount ?? 0,
    };

    console.log(`🗑️ [Admin] Deleted user ${userId} and content:`, deleted);

    return NextResponse.json(
      { message: "User and all their content deleted", deleted },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
