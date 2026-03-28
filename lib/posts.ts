export interface StoredPost {
  id: number;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  likes: number;
  likedBy: string[];
  reposts: number;
  repostedBy: string[];
  replies: number;
  earnings: number;
  createdAt: number;
  humanScore: number;
}

const POSTS_KEY = "posts";

// ── Read: Edge Config SDK (fast edge reads) ──
async function load(): Promise<StoredPost[]> {
  const ecUrl = process.env.EDGE_CONFIG;
  if (ecUrl) {
    const { createClient } = await import("@vercel/edge-config");
    const client = createClient(ecUrl);
    const data = await client.get<StoredPost[]>(POSTS_KEY);
    return data ?? [];
  }
  // Local dev fallback
  return global.__slopscan_posts ?? [];
}

// ── Write: Vercel REST API ──
async function save(posts: StoredPost[]) {
  const ecId = process.env.EDGE_CONFIG_ID;
  const token = process.env.VERCEL_API_TOKEN;
  if (ecId && token) {
    await fetch(`https://api.vercel.com/v1/edge-config/${ecId}/items`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ operation: "upsert", key: POSTS_KEY, value: posts }],
      }),
    });
    return;
  }
  // Local dev fallback
  global.__slopscan_posts = posts;
}

// Local dev fallback
declare global {
  var __slopscan_posts: StoredPost[] | undefined;
}

export async function getAllPosts(): Promise<StoredPost[]> {
  return load();
}

export async function createPost(data: {
  author: string;
  handle: string;
  avatar: string;
  content: string;
  humanScore: number;
}): Promise<StoredPost> {
  const posts = await load();
  const newPost: StoredPost = {
    id: Date.now(),
    author: data.author,
    handle: data.handle,
    avatar: data.avatar,
    content: data.content,
    likes: 0,
    likedBy: [],
    reposts: 0,
    repostedBy: [],
    replies: 0,
    earnings: 0,
    createdAt: Date.now(),
    humanScore: data.humanScore,
  };
  posts.unshift(newPost);
  await save(posts);
  return newPost;
}

export async function toggleLike(postId: number, userId: string): Promise<StoredPost | null> {
  const posts = await load();
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;

  const idx = post.likedBy.indexOf(userId);
  if (idx >= 0) {
    post.likedBy.splice(idx, 1);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    post.likedBy.push(userId);
    post.likes++;
  }
  await save(posts);
  return post;
}

export async function toggleRepost(postId: number, userId: string): Promise<StoredPost | null> {
  const posts = await load();
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;

  const idx = post.repostedBy.indexOf(userId);
  if (idx >= 0) {
    post.repostedBy.splice(idx, 1);
    post.reposts = Math.max(0, post.reposts - 1);
  } else {
    post.repostedBy.push(userId);
    post.reposts++;
  }
  await save(posts);
  return post;
}

export async function deletePost(postId: number, username: string): Promise<boolean> {
  const posts = await load();
  const idx = posts.findIndex((p) => p.id === postId && p.handle === `@${username}`);
  if (idx === -1) return false;
  posts.splice(idx, 1);
  await save(posts);
  return true;
}
