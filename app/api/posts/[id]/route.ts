import { NextRequest, NextResponse } from "next/server";
import { deletePost } from "@/lib/posts";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { username } = body;

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const deleted = await deletePost(parseInt(id), username);
  if (!deleted) {
    return NextResponse.json({ error: "Post not found or not yours" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
