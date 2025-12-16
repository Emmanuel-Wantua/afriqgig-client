import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User"; // Required for population

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { userId, type, commentText } = body;

    await connectToDB();
    const post = await Post.findById(id);

    if (!post) return NextResponse.json({ message: "Post not found" }, { status: 404 });

    if (type === "like") {
        // Toggle Like logic
        const isLiked = post.likes.includes(userId);
        if (isLiked) {
            post.likes = post.likes.filter((uid: any) => uid.toString() !== userId);
        } else {
            post.likes.push(userId);
        }
    } else if (type === "comment") {
        // Add Comment logic
        if (!commentText) return NextResponse.json({ message: "Empty comment" }, { status: 400 });
        post.comments.push({
            user: userId,
            text: commentText,
            date: new Date()
        });
    }

    await post.save();

    // Return the updated post populated (so frontend updates instantly)
    const updatedPost = await Post.findById(id)
        .populate("author", "name avatar title")
        .populate("comments.user", "name avatar");

    return NextResponse.json(updatedPost, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Interaction failed" }, { status: 500 });
  }
}