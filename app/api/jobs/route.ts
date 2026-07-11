import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Job from "@/models/Job";
import User from "@/models/User";
import Proposal from "@/models/Proposal"; 
import { sendEmail } from "@/lib/email";


export const dynamic = "force-dynamic";

// GET: Fetch Jobs
export async function GET(req: Request) {
  try {
    await connectToDB();
    
    // We try to fetch with population first
    try {
        const jobs = await Job.find({})
          .populate("client", "name avatar country isVerified")
          .populate("hiredFreelancer", "_id name")
          // FIX: Explicitly pass the model to prevent "Schema not registered" errors
          .populate({
              path: "proposals",
              model: Proposal, 
              select: "freelancer status" 
          })
          .sort({ createdAt: -1 });

        return NextResponse.json(jobs || [], { status: 200 });

    } catch (populateError) {
        console.error("Population Failed (Falling back to basic fetch):", populateError);
        
        // FALLBACK: If populate fails, fetch jobs anyway so the page isn't empty
        const jobsFallback = await Job.find({})
          .populate("client", "name avatar country isVerified")
          .sort({ createdAt: -1 });
          
        return NextResponse.json(jobsFallback || [], { status: 200 });
    }

  } catch (error: any) {
    console.error("GET Jobs Error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST: Create Job
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, title, category, description, budget, deadline } = body;

    // DEBUG LOGS (Check your terminal when you click Post)
    console.log("📝 [Job Post Debug] Received Body:", { clientId, title });

    if (!clientId) {
        console.error("❌ [Job Post Debug] Client ID is missing in request body.");
        return NextResponse.json({ message: "Client ID is missing" }, { status: 400 });
    }

    await connectToDB();

    // 2. Validate Client
    const client = await User.findById(clientId);
    
    // DEBUG: Check what user was found
    if (client) {
        console.log(`👤 [Job Post Debug] User Found: ${client.email}, Role: '${client.role}'`);
    } else {
        console.error(`❌ [Job Post Debug] User NOT found for ID: ${clientId}`);
    }

    if (!client || (client.role !== 'client' && client.role !== 'freelancer')) {
      return NextResponse.json({ 
          message: `Unauthorized. Role is '${client?.role}', but must be 'client' or 'freelancer'.` 
      }, { status: 401 });
    }

    // 3. Create the Job
    const newJob = await Job.create({
      client: clientId,
      title,
      category,
      description,
      budget: Number(budget),
      deadline: new Date(deadline),
      status: "open"
    });

    // 4. Trigger Email
    if (client.email) {
        sendEmail(
            client.email, 
            "JOB_POSTED", 
            { jobTitle: title }, 
            clientId
        );
    }

    // ✅ NEW: Notify Relevant Freelancers (Smart Matching Background Task)
    (async () => {
        try {
            // 1. Extract Keywords from Title (remove common stopwords)
            const stopwords = ['a', 'an', 'the', 'for', 'in', 'on', 'with', 'and', 'or', 'to', 'of'];
            const titleKeywords = title
                .toLowerCase()
                .split(' ')
                .filter((word: string) => word.length > 3 && !stopwords.includes(word))
                .map((word: string) => new RegExp(word, 'i')); // Create regex for partial matches

            // 2. Find Freelancers with Matching Skills or Interests
            const matchingFreelancers = await User.find({
                role: 'freelancer',
                isActive: true,
                $or: [
                    { skills: { $in: [new RegExp(category, 'i'), ...titleKeywords] } },
                    { interests: { $in: [new RegExp(category, 'i')] } }
                ]
            }).select('email settings _id name').limit(50); // Limit batch size for safety

            console.log(`📧 [Job Alert] Found ${matchingFreelancers.length} matching freelancers for "${title}"`);

            // 3. Send Emails in Parallel (with individual error handling)
            await Promise.all(matchingFreelancers.map(async (freelancer) => {
                // Check user notification preferences
                if (freelancer.settings?.notifications?.email !== false) {
                    try {
                        await sendEmail(
                            freelancer.email,
                            "JOB_ALERT",
                            { 
                                freelancerName: freelancer.name.split(' ')[0], // First name personalized
                                jobTitle: title, 
                                jobId: newJob._id,
                                jobBudget: `${Number(budget).toLocaleString()} XAF`
                            },
                            freelancer._id
                        );
                    } catch (e) {
                        console.error(`Failed to email freelancer ${freelancer._id}`, e);
                    }
                }
            }));
            
        } catch (err) {
            console.error("❌ [Job Alert] Failed to send alerts:", err);
        }
    })();

    return NextResponse.json(
      { message: "Job posted successfully", jobId: newJob._id },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("🔥 Job Post Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}