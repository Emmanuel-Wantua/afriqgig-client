import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectToDB();
    
    const posts = await Post.find()
      .populate("author", "name avatar title isVerified rating reviewsCount") 
      .populate({
          path: "comments.user",
          select: "name avatar isVerified" 
      })
      .sort({ createdAt: -1 });

    return NextResponse.json(posts || [], { status: 200 });

  } catch (error) {
    console.error("Feed Fetch Error:", error);
    return NextResponse.json([], { status: 200 }); 
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDB();

    if (!body.author) {
        return NextResponse.json({ message: "Author is required" }, { status: 400 });
    }

    // Validate Content OR Media
    const hasContent = body.content && body.content.trim().length > 0;
    // Check both single URL (old) and array (new)
    const hasMedia = (body.mediaUrl && body.mediaUrl.trim().length > 0) || (body.mediaUrls && body.mediaUrls.length > 0);

    if (!hasContent && !hasMedia) {
        return NextResponse.json({ message: "Post must contain text or media" }, { status: 400 });
    }

    const finalContent = hasContent ? body.content : (hasMedia ? " " : "");

    const newPost = await Post.create({
        author: body.author,
        content: finalContent, 
        category: body.category || "General",
        mediaType: body.mediaType || "none",
        mediaUrl: body.mediaUrl || "",       // Save primary for backward compat
        mediaUrls: body.mediaUrls || [],     // ✅ Save full array
        likes: [],
        comments: [],
        createdAt: new Date()
    });

    await newPost.populate("author", "name avatar title isVerified");

    return NextResponse.json(newPost, { status: 201 });

  } catch (error: any) {
    console.error("Create Post Error:", error);
    return NextResponse.json({ message: error.message || "Error creating post" }, { status: 500 });
  }
}