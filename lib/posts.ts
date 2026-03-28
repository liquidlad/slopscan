import fs from "fs";
import path from "path";

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

// Resolve a writable data file path
function getDataFile(): string {
  const projectFile = path.join(process.cwd(), "data", "posts.json");
  try {
    const dir = path.dirname(projectFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return projectFile;
  } catch {
    return "/tmp/slopscan-posts.json";
  }
}

const DATA_FILE = getDataFile();

// Use a global to survive HMR in dev and warm function instances on Vercel
declare global {
  var __slopscan_posts: StoredPost[] | undefined;
}

function load(): StoredPost[] {
  if (global.__slopscan_posts) return global.__slopscan_posts;
  try {
    if (fs.existsSync(DATA_FILE)) {
      global.__slopscan_posts = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      return global.__slopscan_posts!;
    }
  } catch {}
  global.__slopscan_posts = [];
  return global.__slopscan_posts;
}

function save() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(global.__slopscan_posts ?? [], null, 2));
  } catch {
    // Write failed (read-only FS on Vercel) — data stays in memory
  }
}

export function getAllPosts(): StoredPost[] {
  return load();
}

export function createPost(data: {
  author: string;
  handle: string;
  avatar: string;
  content: string;
  humanScore: number;
}): StoredPost {
  const posts = load();
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
  save();
  return newPost;
}

export function toggleLike(postId: number, userId: string): StoredPost | null {
  const posts = load();
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
  save();
  return post;
}

export function toggleRepost(postId: number, userId: string): StoredPost | null {
  const posts = load();
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
  save();
  return post;
}
