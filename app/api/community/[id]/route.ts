import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Post from "@/models/Post";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectToDB();
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