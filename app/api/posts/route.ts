import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, createPost } from "@/lib/posts";

export async function GET() {
  const posts = await getAllPosts();
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { author, handle, avatar, content, humanScore } = body;

  if (!author || !handle || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const post = await createPost({
    author,
    handle,
    avatar: avatar || author[0],
    content,
    humanScore: humanScore ?? 100,
  });

  return NextResponse.json(post, { status: 201 });
}
