import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Job from "@/models/Job";
import User from "@/models/User";
import { getIdentity } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // ✅ FIX: Identity comes from the session, not a client-supplied `clientId`.
    // Previously any caller could POST { clientId: "<someone else's id>" }
    // and create a job under another client's name without authenticating as them.
    const identity = await getIdentity();
    if (!identity) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, category, description, budget, deadline, attachments } =
      body;

    await connectToDB();

    // 2. Validate the authenticated user is allowed to post jobs
    const client = await User.findById(identity.userId);
    // ✅ NEW: also blocks a suspended/deactivated account from posting jobs,
    // as defense-in-depth until the NextAuth authorize() status check is fixed
    if (
      !client ||
      client.status !== "active" ||
      (client.role !== "client" && !client.canHire)
    ) {
      return NextResponse.json(
        { message: "Unauthorized. Only clients can post jobs." },
        { status: 401 },
      );
    }

    // 3. Create the Job
    const newJob = await Job.create({
      client: identity.userId,
      title,
      category,
      description,
      budget: Number(budget),
      deadline: new Date(deadline),
      attachments: attachments || [],
      status: "open",
    });

    // 4. Success
    return NextResponse.json(
      { message: "Job posted successfully", jobId: newJob._id },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Job Post Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
