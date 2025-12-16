import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Job from "@/models/Job";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, title, category, description, budget, deadline } = body;

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
      budget: Number(budget), // Ensure it's a number
      deadline: new Date(deadline),
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

