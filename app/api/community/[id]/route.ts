import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId"); // We need to pass userId from frontend

        await connectToDB();
        
        const post = await Post.findById(id);
        if (!post) return NextResponse.json({ message: "Post not found" }, { status: 404 });

        // Check permissions
        const user = await User.findById(userId);
        
        // ✅ Allow if Author OR Admin
        if (post.author.toString() !== userId && user?.role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        await Post.findByIdAndDelete(id);
        return NextResponse.json({ message: "Deleted" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Delete failed" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json(); // Expecting { content: "new text" }
        
        await connectToDB();
        const updatedPost = await Post.findByIdAndUpdate(
            id, 
            { content: body.content }, 
            { new: true }
        ).populate("author", "name avatar title");

        return NextResponse.json(updatedPost, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Update failed" }, { status: 500 });
    }
}