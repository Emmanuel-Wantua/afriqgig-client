import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Job from "@/models/Job";
import Contract from "@/models/Contract";

export const dynamic = "force-dynamic";

// DELETE JOB
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDB();

    // 1. Check if job exists
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    // 2. Check if job has been filled (Safety Check)
    if (job.status === "hired" || job.status === "completed") {
      return NextResponse.json({ message: "Cannot delete a job that has active hires." }, { status: 400 });
    }

    // 3. Double check for any contracts linked to this job
    const contracts = await Contract.find({ job: id });
    if (contracts.length > 0) {
        return NextResponse.json({ message: "Cannot delete. Active contracts exist." }, { status: 400 });
    }

    // 4. Delete
    await Job.findByIdAndDelete(id);

    return NextResponse.json({ message: "Job deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Delete Job Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}