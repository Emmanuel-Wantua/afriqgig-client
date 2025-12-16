import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Notification from "@/models/Notification";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    // SAFETY CHECK: Don't query DB if userId is missing
    if (!userId) return NextResponse.json([], { status: 400 });

    await connectToDB();

    const notifications = await Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20);
        
    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

// Mark as Read
export async function PATCH(req: Request) {
    try {
        const { notificationId } = await req.json();
        await connectToDB();
        await Notification.findByIdAndUpdate(notificationId, { isRead: true });
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}

// Internal Helper
export async function POST(req: Request) {
    try {
        const body = await req.json();
        await connectToDB();
        const newNotif = await Notification.create(body);
        return NextResponse.json(newNotif, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}