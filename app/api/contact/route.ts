import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";

export const dynamic = "force-dynamic";

// POST: User sends a message
export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();
    await connectToDB();

    await ContactMessage.create({ name, email, message });

    return NextResponse.json({ message: "Sent" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

// GET: Admin reads messages
export async function GET() {
  try {
    await connectToDB();
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}