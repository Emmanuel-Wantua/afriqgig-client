import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import Job from "@/models/Job";
import Dispute from "@/models/Dispute";
import Transaction from "@/models/Transaction";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectToDB();

    // 1. User Stats
    const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });
    const pendingVerifications = await User.countDocuments({ "settings.verificationStatus": "pending" });

    // 2. Business Stats
    const activeJobs = await Job.countDocuments({ status: "hired" });
    const completedJobs = await Job.countDocuments({ status: "completed" });

    // 3. Safety Stats
    const openDisputes = await Dispute.countDocuments({ status: "open" });

    // 4. Financials (Calculate Platform Revenue)
    // We look for transactions where type is 'service_fee' (if implemented) 
    // OR we calculate 5% of all released payments.
    // For now, let's sum up total volume processed.
    const completedTransactions = await Transaction.find({ type: "payment_release" });
    const totalVolume = completedTransactions.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const estRevenue = totalVolume * 0.05; // 5% estimate
    const pendingWithdrawals = await Transaction.countDocuments({ type: "withdrawal", status: "pending" });

    return NextResponse.json({
        users: { total: totalUsers, pending: pendingVerifications },
        jobs: { active: activeJobs, completed: completedJobs },
        disputes: { open: openDisputes },
        finance: { volume: totalVolume, revenue: estRevenue, pendingWithdrawals }
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: "Error fetching stats" }, { status: 500 });
  }
}