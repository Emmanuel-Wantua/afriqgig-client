import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Job from "@/models/Job";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // ✅ FIX: Added 'attachments' to the destructuring so it is captured
    const { clientId, title, category, description, budget, deadline, attachments } = body;

    // 1. Connect to DB
    await connectToDB();

    // 2. Validate Client
    const client = await User.findById(clientId);
    if (!client || client.role !== 'client') {
      return NextResponse.json({ message: "Unauthorized. Only clients can post jobs." }, { status: 401 });
    }

    // 3. Create the Job
    const newJob = await Job.create({
      client: clientId,
      title,
      category,
      description,
      budget: Number(budget),
      deadline: new Date(deadline),
      // ✅ FIX: Explicitly save the attachments array (or empty array if null)
      attachments: attachments || [], 
      status: "open"
    });

    // 4. Success
    return NextResponse.json(
      { message: "Job posted successfully", jobId: newJob._id },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Job Post Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}