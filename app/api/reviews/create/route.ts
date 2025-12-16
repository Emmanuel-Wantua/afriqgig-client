import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Review from "@/models/Review";
import User from "@/models/User";
import Notification from "@/models/Notification";

export async function POST(req: Request) {
  try {
    const { contractId, reviewerId, targetId, rating, comment } = await req.json();

    await connectToDB();

    // 1. Create Review
    const newReview = await Review.create({
        contract: contractId,
        reviewer: reviewerId,
        target: targetId,
        rating,
        comment
    });

    // 2. Update Freelancer Stats (The Math)
    const freelancer = await User.findById(targetId);
    
    if (freelancer) {
        // Calculate new average
        const currentTotal = (freelancer.rating || 0) * (freelancer.reviewsCount || 0);
        const newCount = (freelancer.reviewsCount || 0) + 1;
        const newAverage = (currentTotal + rating) / newCount;

        // Update User
        freelancer.rating = parseFloat(newAverage.toFixed(1)); // Keep 1 decimal (e.g. 4.8)
        freelancer.reviewsCount = newCount;
        freelancer.jobsCompleted = (freelancer.jobsCompleted || 0) + 1;
        await freelancer.save();
    }

    // 3. Notify Freelancer
    await Notification.create({
        user: targetId,
        type: "alert", // or 'review'
        title: "New 5-Star Review!", 
        message: `You received a ${rating}-star rating from your recent client.`,
        link: `/dashboard/freelancer`, // Or link to profile
        isRead: false
    });

    return NextResponse.json({ message: "Review submitted successfully" }, { status: 201 });

  } catch (error: any) {
    console.error("Review Error:", error);
    return NextResponse.json({ message: "Failed to submit review" }, { status: 500 });
  }
}