import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectToDB();
    
    const posts = await Post.find()
      .populate("author", "name avatar title isVerified rating reviewsCount") // Populates Post Author
      .populate({
          path: "comments.user",
          select: "name avatar isVerified" // <--- FIX: Added isVerified here for Comments
      })
      .sort({ createdAt: -1 });

    // FIX: Use 'posts || []' to guarantee an array return
    return NextResponse.json(posts || [], { status: 200 });

  } catch (error) {
    console.error("Feed Fetch Error:", error);
    // FIX: Return empty array [] on error, NOT an error object
    return NextResponse.json([], { status: 200 }); 
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDB();

    // Validate
    if (!body.author || !body.content) {
        return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const newPost = await Post.create({
        author: body.author,
        content: body.content,
        // --- SAVE MEDIA ---
        mediaUrl: body.mediaUrl || null,
        mediaType: body.mediaType || "none",
        // ------------------
        createdAt: new Date()
    });

    return NextResponse.json(newPost, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: "Error creating post" }, { status: 500 });
  }
}