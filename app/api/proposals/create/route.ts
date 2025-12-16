import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Proposal from "@/models/Proposal";
import Job from "@/models/Job";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, freelancerId, bidAmount, coverLetter, duration } = body;

    await connectToDB();

    // 1. Fetch the Job FIRST
    const job = await Job.findById(jobId);
    
    if (!job) {
        return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    const clientId = job.client; 

    // 2. Create the Proposal
    const newProposal = await Proposal.create({
      job: jobId,
      freelancer: freelancerId,
      client: clientId, 
      bidAmount,
      coverLetter,
      duration: duration || "Not specified"
    });

    console.log("✅ [Proposal API] Saved Proposal ID:", newProposal._id);

    // 3. Update Job
    await Job.findByIdAndUpdate(jobId, { $push: { proposals: newProposal._id } });

    // 4. TRIGGER NOTIFICATIONS (Background)
    (async () => {
        try {
            // Fetch Freelancer Name (for the message)
            const freelancer = await User.findById(freelancerId).select("name");
            const freelancerName = freelancer ? freelancer.name : "A Freelancer";

            // Fetch Client Email (Required for sending email)
            const clientUser = await User.findById(clientId).select("email");

            console.log(`🔔 Sending Notifications for Proposal on Job: ${job.title}`);

            // A. Notify Client (In-App)
            await Notification.create({
                user: clientId,
                type: "proposal",
                title: "New Proposal Received",
                message: `${freelancerName} applied for "${job.title}"`,
                link: `/dashboard/client/jobs/${jobId}`, 
                isRead: false
            });

            // B. Notify Client (EMAIL) - NEW
            if (clientUser) {
                sendEmail(
                    clientUser.email, 
                    "NEW_PROPOSAL", 
                    { freelancerName, jobTitle: job.title }, 
                    clientId
                );
            }

            // C. Notify Freelancer (In-App Confirmation)
            await Notification.create({
                user: freelancerId,
                type: "proposal",
                title: "Proposal Sent",
                message: `You successfully applied for "${job.title}"`,
                link: `/dashboard/freelancer`, 
                isRead: false
            });

        } catch (notifError) {
            console.error("⚠️ Notification Logic Failed:", notifError);
        }
    })();

    return NextResponse.json({ message: "Proposal sent successfully" }, { status: 201 });

  } catch (error: any) {
    console.error("🔥 PROPOSAL API ERROR:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}