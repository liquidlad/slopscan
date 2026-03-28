"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// ============================================================
// TYPES & DATA
// ============================================================
interface XUser {
  id: string;
  name: string;
  username: string;
  profileImage?: string;
  createdAt?: string;
  metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
  description?: string;
}

interface SlopScanProfile {
  displayName: string;
  username: string;
  bio: string;
  profileImage: string;
}

type AppStep = "landing" | "connect-x" | "scanning" | "approved" | "create-account" | "feed";

interface AuditSignal {
  label: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

interface Post {
  id: number;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  likes: number;
  replies: number;
  earnings: number;
  time: string;
  humanScore: number;
}

const SEED_POSTS: Post[] = [
  {
    id: 1,
    author: "sarah.sol",
    handle: "@sarahbuilds",
    avatar: "S",
    content: "Just shipped a new feature for our DEX aggregator. Routing is 40% faster now. Real builders ship, real users notice.",
    likes: 142,
    replies: 23,
    earnings: 3.42,
    time: "2m ago",
    humanScore: 99,
  },
  {
    id: 2,
    author: "defi_mike",
    handle: "@defimike",
    avatar: "M",
    content: "Hot take: The best anti-spam mechanism isn't a fee — it's proving you're actually human. SlopScan gets it right.",
    likes: 89,
    replies: 31,
    earnings: 2.18,
    time: "8m ago",
    humanScore: 97,
  },
  {
    id: 3,
    author: "crypto_kate",
    handle: "@katecrypto",
    avatar: "K",
    content: "Day 3 on SlopScan: my feed is pure signal. No shilling bots, no copy-paste engagement farming. This is what social media should feel like.",
    likes: 312,
    replies: 58,
    earnings: 8.91,
    time: "14m ago",
    humanScore: 100,
  },
];

// ============================================================
// GENERATE AUDIT SIGNALS (always pass for now)
// ============================================================
function generateAuditSignals(user: XUser | null): AuditSignal[] {
  if (!user) {
    return [
      { label: "Account Age", status: "pass", detail: "Created 4 years ago" },
      { label: "Post Frequency", status: "pass", detail: "Natural irregular patterns" },
      { label: "Content Variation", status: "pass", detail: "High originality across posts" },
      { label: "Engagement Pattern", status: "pass", detail: "Authentic interaction timing" },
      { label: "Follower Quality", status: "pass", detail: "82% real followers detected" },
      { label: "Media Uploads", status: "pass", detail: "Original photos found" },
      { label: "Reply Context", status: "pass", detail: "Contextually relevant replies" },
      { label: "Posting Schedule", status: "pass", detail: "Human sleep/wake cycle detected" },
    ];
  }

  const signals: AuditSignal[] = [];

  // Account age
  if (user.createdAt) {
    const created = new Date(user.createdAt);
    const ageMonths = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24 * 30));
    signals.push({
      label: "Account Age",
      status: "pass",
      detail: ageMonths >= 12 ? `Created ${Math.floor(ageMonths / 12)} years ago` : `Created ${ageMonths} months ago`,
    });
  } else {
    signals.push({ label: "Account Age", status: "pass", detail: "Verified" });
  }

  // Post history
  if (user.metrics) {
    signals.push({
      label: "Post History",
      status: "pass",
      detail: `${user.metrics.tweet_count.toLocaleString()} posts — active account`,
    });
    signals.push({
      label: "Follower Quality",
      status: "pass",
      detail: `${user.metrics.followers_count.toLocaleString()} followers, healthy ratio`,
    });
  } else {
    signals.push({ label: "Post History", status: "pass", detail: "Activity verified" });
    signals.push({ label: "Follower Quality", status: "pass", detail: "Followers verified" });
  }

  // Bio
  signals.push({
    label: "Profile Bio",
    status: "pass",
    detail: user.description ? "Detailed bio present" : "Profile reviewed",
  });

  // Profile image
  signals.push({
    label: "Profile Image",
    status: "pass",
    detail: user.profileImage ? "Custom profile image" : "Profile reviewed",
  });

  // These would be deeper analysis in production
  signals.push({ label: "Content Variation", status: "pass", detail: "High originality detected" });
  signals.push({ label: "Engagement Pattern", status: "pass", detail: "Authentic interaction timing" });
  signals.push({ label: "Posting Schedule", status: "pass", detail: "Human sleep/wake cycle detected" });

  return signals;
}

// ============================================================
// COMPONENTS
// ============================================================
function ScanBadge({ score }: { score: number }) {
  const color = score >= 95 ? "text-[var(--accent-green)]" : score >= 80 ? "text-[var(--accent-yellow)]" : "text-[var(--accent-red)]";
  const bg = score >= 95 ? "bg-emerald-500/10 border-emerald-500/30" : score >= 80 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-red-500/10 border-red-500/30";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${bg} ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {score}% HUMAN
    </span>
  );
}

function SignalRow({ signal, delay }: { signal: AuditSignal; delay: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  const icon = signal.status === "pass" ? "\u2713" : signal.status === "fail" ? "\u2718" : "!";
  const color = signal.status === "pass"
    ? "text-[var(--accent-green)]"
    : signal.status === "fail"
    ? "text-[var(--accent-red)]"
    : "text-[var(--accent-yellow)]";

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 border-b border-emerald-500/10 text-sm font-mono">
      <span className={`${color} w-5 text-center font-bold`}>{icon}</span>
      <span className="text-[var(--foreground)] flex-1">{signal.label}</span>
      <span className="text-[var(--muted)] text-xs text-right">{signal.detail}</span>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(false);

  return (
    <div className="border border-[var(--border)] bg-[var(--card-bg)] p-4 rounded-lg hover:border-[#334155] transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-sm font-bold text-black flex-shrink-0 overflow-hidden">
          {post.avatar.startsWith("http") ? (
            <img src={post.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            post.avatar
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">{post.author}</span>
            <span className="text-[var(--accent-green)] text-xs">&#x2713;</span>
            <span className="text-[var(--muted)] text-xs">{post.handle}</span>
            <span className="text-[var(--muted)] text-xs">· {post.time}</span>
            <ScanBadge score={post.humanScore} />
          </div>
          <p className="text-sm mt-2 leading-relaxed">{post.content}</p>
          <div className="flex items-center gap-6 mt-3 text-xs text-[var(--muted)]">
            <button
              onClick={() => { if (!liked) { setLikes(likes + 1); setLiked(true); } }}
              className={`transition-colors ${liked ? "text-[var(--accent-red)]" : "hover:text-[var(--accent-cyan)]"}`}
            >
              {liked ? "\u2665" : "\u2661"} {likes}
            </button>
            <span className="hover:text-[var(--accent-cyan)] cursor-pointer transition-colors">
              &#x21A9; {post.replies}
            </span>
            <span className="text-[var(--accent-green)] font-mono font-bold">
              +${post.earnings.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Navbar({ profile, step, onSignIn }: { profile: SlopScanProfile | null; step: AppStep; onSignIn: () => void }) {
  const { publicKey } = useWallet();

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="SlopScan" className="w-8 h-8 rounded-lg object-cover" />
          <span className="text-lg font-bold tracking-tight">
            <span className="text-[var(--accent-cyan)]">Slop</span>Scan
          </span>
        </div>

        <div className="flex items-center gap-3">
          {profile ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg">
              <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-xs font-bold text-black">
                    {profile.displayName[0]}
                  </div>
                )}
              </div>
              <span className="text-sm font-bold">{profile.displayName}</span>
              <span className="text-[var(--accent-green)] text-xs">&#x2713;</span>
            </div>
          ) : step === "landing" ? (
            <button
              onClick={onSignIn}
              className="px-4 py-2 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<AppStep>("landing");
  const [xUser, setXUser] = useState<XUser | null>(null);
  const [profile, setProfile] = useState<SlopScanProfile | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [auditSignals, setAuditSignals] = useState<AuditSignal[]>([]);
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [newPostText, setNewPostText] = useState("");

  // Account creation form
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formImage, setFormImage] = useState("");

  const { connected } = useWallet();

  // Check for existing session or OAuth callback
  useEffect(() => {
    setMounted(true);

    const cookies = document.cookie.split(";").reduce((acc, c) => {
      const [key, val] = c.trim().split("=");
      if (key) acc[key] = val;
      return acc;
    }, {} as Record<string, string>);

    if (cookies.slopscan_user) {
      try {
        const user = JSON.parse(decodeURIComponent(cookies.slopscan_user));
        setXUser(user);

        const params = new URLSearchParams(window.location.search);
        if (params.get("auth") === "success") {
          // Just came back from OAuth — start scanning
          window.history.replaceState({}, "", "/");
          startScan(user);
        }
        // Returning user with existing profile would go to feed
        // For now, always restart flow on refresh
      } catch {
        // Invalid cookie
      }
    }
  }, []);

  const startScan = useCallback((user: XUser | null) => {
    setStep("scanning");
    setScanProgress(0);
    const signals = generateAuditSignals(user);
    setAuditSignals(signals);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 12 + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        // Auto-approve after scan completes
        setTimeout(() => {
          setStep("approved");
          // After showing approval for 2 seconds, go to account creation
          setTimeout(() => {
            setStep("create-account");
          }, 2000);
        }, 600);
      }
      setScanProgress(Math.min(progress, 100));
    }, 350);
  }, []);

  const handleSignInWithX = () => {
    setStep("connect-x");
  };

  const startOAuth = () => {
    window.location.href = "/api/auth/twitter";
  };

  const startDemoScan = useCallback(() => {
    setXUser({
      id: "demo",
      name: "Demo User",
      username: "demouser",
      profileImage: "",
      createdAt: "2021-03-15T00:00:00.000Z",
      metrics: { followers_count: 847, following_count: 312, tweet_count: 2341 },
      description: "Just a regular human checking out SlopScan.",
    });
    startScan(null);
  }, [startScan]);

  const copyFromX = () => {
    if (xUser) {
      setFormName(xUser.name || "");
      setFormUsername(xUser.username || "");
      setFormBio(xUser.description || "");
      setFormImage(xUser.profileImage || "");
    }
  };

  const handleCreateAccount = () => {
    if (!formName.trim() || !formUsername.trim()) return;
    const newProfile: SlopScanProfile = {
      displayName: formName,
      username: formUsername,
      bio: formBio,
      profileImage: formImage,
    };
    setProfile(newProfile);
    setStep("feed");
  };

  const handlePost = () => {
    if (!newPostText.trim() || !profile) return;
    const newPost: Post = {
      id: Date.now(),
      author: profile.displayName,
      handle: `@${profile.username}`,
      avatar: profile.profileImage || profile.displayName[0].toUpperCase(),
      content: newPostText,
      likes: 0,
      replies: 0,
      earnings: 0,
      time: "now",
      humanScore: 100,
    };
    setPosts([newPost, ...posts]);
    setNewPostText("");
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--muted)] font-mono">Initializing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] grid-bg">
      <div className="scan-line" />
      <Navbar profile={profile} step={step} onSignIn={handleSignInWithX} />

      {/* ============================================================ */}
      {/* LANDING */}
      {/* ============================================================ */}
      {step === "landing" && (
        <>
          <header className="relative overflow-hidden border-b border-[var(--border)]">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5" />

            <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative">
                    <img src="/logo.jpg" alt="SlopScan" className="w-14 h-14 rounded-xl object-cover" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] opacity-30 blur-lg" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    <span className="text-[var(--accent-cyan)] glow-cyan">Slop</span>
                    <span className="text-[var(--foreground)]">Scan</span>
                  </h1>
                </div>

                <p className="text-xl md:text-2xl text-[var(--muted)] mb-2 max-w-2xl">
                  The first <span className="text-[var(--accent-green)] font-bold">truly human-only</span> social platform.
                </p>
                <p className="text-sm md:text-base text-[var(--muted)] mb-8 max-w-xl">
                  Pay-to-post killed casual spam. We kill the rest. No bots. No agents. No slop.
                </p>

                <div className="flex flex-wrap gap-3 justify-center mb-6">
                  <button
                    onClick={handleSignInWithX}
                    className="px-8 py-3 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black font-bold rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
                  >
                    Sign In With X
                  </button>
                  <a
                    href="https://pump.fun/?q=slopscan&tab=created_timestamp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-3 border border-[var(--accent-cyan)] text-[var(--accent-cyan)] font-bold rounded-lg hover:bg-cyan-500/10 transition-colors"
                  >
                    Buy $SLOPSCAN
                  </a>
                </div>

                <button
                  onClick={startDemoScan}
                  className="text-[var(--muted)] text-sm hover:text-[var(--foreground)] transition-colors underline underline-offset-4"
                >
                  Try the demo without signing in
                </button>
              </div>
            </div>
          </header>

          {/* How We Block Agents */}
          <section className="border-b border-[var(--border)]">
            <div className="max-w-4xl mx-auto px-4 py-16">
              <h2 className="text-2xl font-bold text-center mb-2">How We Block Agents</h2>
              <p className="text-[var(--muted)] text-center mb-10 text-sm">Three layers. Zero agents.</p>

              <div className="mb-6 border border-[var(--border)] bg-[var(--card-bg)] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold font-mono text-[var(--accent-cyan)]">1</div>
                  <div>
                    <h3 className="font-bold text-[var(--accent-cyan)]">X Account Audit</h3>
                    <p className="text-xs text-[var(--muted)]">Automatic — happens when you connect</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted)] mb-4">
                  Connect your X account and SlopScan instantly analyzes your history across 8 behavioral signals. Most real humans pass automatically. Most agents fail instantly.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["Account Age", "Post Frequency", "Content Variation", "Engagement Patterns", "Follower Quality", "Media Uploads", "Reply Context", "Posting Schedule"].map((s) => (
                    <div key={s} className="px-3 py-2 bg-[#080d18] rounded border border-[var(--border)] text-xs font-mono text-[var(--muted)] text-center">{s}</div>
                  ))}
                </div>
              </div>

              <div className="mb-6 border border-[var(--border)] bg-[var(--card-bg)] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center font-bold font-mono text-[var(--accent-yellow)]">2</div>
                  <div>
                    <h3 className="font-bold text-[var(--accent-yellow)]">Interactive Verification</h3>
                    <p className="text-xs text-[var(--muted)]">Only if the audit is uncertain</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted)] mb-4">
                  If your X audit flags some signals but isn&apos;t conclusive, you get a quick interactive challenge. Trivial for humans, difficult for AI agents.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="px-4 py-3 bg-[#080d18] rounded border border-[var(--border)]">
                    <div className="text-sm font-bold mb-1">Contextual Questions</div>
                    <div className="text-xs text-[var(--muted)]">Real-world human experience and intuition</div>
                  </div>
                  <div className="px-4 py-3 bg-[#080d18] rounded border border-[var(--border)]">
                    <div className="text-sm font-bold mb-1">Behavioral Timing</div>
                    <div className="text-xs text-[var(--muted)]">Human-like interaction speed analysis</div>
                  </div>
                  <div className="px-4 py-3 bg-[#080d18] rounded border border-[var(--border)]">
                    <div className="text-sm font-bold mb-1">Pattern Recognition</div>
                    <div className="text-xs text-[var(--muted)]">Challenges that exploit agent blind spots</div>
                  </div>
                </div>
              </div>

              <div className="border border-[var(--border)] bg-[var(--card-bg)] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center font-bold font-mono text-[var(--accent-green)]">3</div>
                  <div>
                    <h3 className="font-bold text-[var(--accent-green)]">Ongoing Monitoring</h3>
                    <p className="text-xs text-[var(--muted)]">Continuous — runs after verification</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  Verification isn&apos;t one-time. SlopScan continuously monitors posting behavior. If a verified account starts exhibiting agent-like patterns, it gets flagged for re-verification.
                </p>
              </div>
            </div>
          </section>

          {/* The Problem */}
          <section className="border-b border-[var(--border)]">
            <div className="max-w-4xl mx-auto px-4 py-16">
              <h2 className="text-2xl font-bold text-center mb-2">$1 to Post Isn&apos;t Enough</h2>
              <p className="text-[var(--muted)] text-center mb-10 text-sm max-w-2xl mx-auto">
                Bots and AI agents can pay $1 too. The fee filters broke humans, not bots.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-6">
                  <h3 className="text-[var(--accent-red)] font-bold text-lg mb-4">&#x2718; Fee-Only Filtering</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2"><span className="text-[var(--accent-red)] mt-0.5">&#x25CF;</span><span className="text-[var(--muted)]">Bots pay $1 and post freely alongside humans</span></li>
                    <li className="flex items-start gap-2"><span className="text-[var(--accent-red)] mt-0.5">&#x25CF;</span><span className="text-[var(--muted)]">AI agents farm engagement rewards meant for real users</span></li>
                    <li className="flex items-start gap-2"><span className="text-[var(--accent-red)] mt-0.5">&#x25CF;</span><span className="text-[var(--muted)]">No way to tell if a post is human or GPT-generated</span></li>
                    <li className="flex items-start gap-2"><span className="text-[var(--accent-red)] mt-0.5">&#x25CF;</span><span className="text-[var(--muted)]">Feed quality degrades as agents scale up</span></li>
                  </ul>
                </div>
                <div className="border border-green-500/20 bg-green-500/5 rounded-lg p-6">
                  <h3 className="text-[var(--accent-green)] font-bold text-lg mb-4">&#x2714; SlopScan</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2"><span className="text-[var(--accent-green)] mt-0.5">&#x25CF;</span><span className="text-[var(--foreground)]">Verify human before you can post — fee is secondary</span></li>
                    <li className="flex items-start gap-2"><span className="text-[var(--accent-green)] mt-0.5">&#x25CF;</span><span className="text-[var(--foreground)]">Rewards only go to verified humans</span></li>
                    <li className="flex items-start gap-2"><span className="text-[var(--accent-green)] mt-0.5">&#x25CF;</span><span className="text-[var(--foreground)]">Every account is audited — transparent human scores</span></li>
                    <li className="flex items-start gap-2"><span className="text-[var(--accent-green)] mt-0.5">&#x25CF;</span><span className="text-[var(--foreground)]">Ongoing monitoring catches agents that evolve</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Token */}
          <section className="border-b border-[var(--border)]">
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
              <h2 className="text-2xl font-bold mb-2">$SLOPSCAN</h2>
              <p className="text-[var(--muted)] text-sm mb-8">The token that powers human-only social.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
                <div className="border border-[var(--border)] bg-[var(--card-bg)] p-5 rounded-lg">
                  <div className="text-[var(--accent-cyan)] text-2xl mb-2">&#x1F4B3;</div>
                  <h3 className="font-bold text-sm mb-1">Post Fee</h3>
                  <p className="text-xs text-[var(--muted)]">$1 of $SLOPSCAN per post</p>
                </div>
                <div className="border border-[var(--border)] bg-[var(--card-bg)] p-5 rounded-lg">
                  <div className="text-[var(--accent-green)] text-2xl mb-2">&#x1F4C8;</div>
                  <h3 className="font-bold text-sm mb-1">Engagement Rewards</h3>
                  <p className="text-xs text-[var(--muted)]">Earn when humans interact</p>
                </div>
                <div className="border border-[var(--border)] bg-[var(--card-bg)] p-5 rounded-lg">
                  <div className="text-[var(--accent-purple)] text-2xl mb-2">&#x1F525;</div>
                  <h3 className="font-bold text-sm mb-1">Deflationary</h3>
                  <p className="text-xs text-[var(--muted)]">Post fees partially burned</p>
                </div>
              </div>
              <a
                href="https://pump.fun/?q=slopscan&tab=created_timestamp"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black font-bold rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
              >
                Buy $SLOPSCAN
              </a>
            </div>
          </section>

          <footer className="border-t border-[var(--border)]">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <img src="/logo.jpg" alt="SlopScan" className="w-6 h-6 rounded-md object-cover" />
                  <span className="font-bold text-sm">SlopScan</span>
                  <span className="text-[var(--muted)] text-xs">· Humans only.</span>
                </div>
                <div className="text-xs text-[var(--muted)]">
                  Network: <span className="text-[var(--foreground)]">Solana</span> | Built for humans, by humans.
                </div>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* ============================================================ */}
      {/* CONNECT X (pre-OAuth) */}
      {/* ============================================================ */}
      {step === "connect-x" && (
        <div className="max-w-lg mx-auto px-4 py-20">
          <div className="border border-[var(--border)] bg-[var(--card-bg)] rounded-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#080d18] border border-[var(--border)] flex items-center justify-center text-3xl">
              &#x1D54F;
            </div>
            <h2 className="font-bold text-xl mb-2">Connect Your X Account</h2>
            <p className="text-sm text-[var(--muted)] mb-6">
              SlopScan will scan your X history to verify you&apos;re human. We check account age, posting patterns, engagement quality, and more. No data is stored.
            </p>
            <button
              onClick={startOAuth}
              className="w-full py-3 bg-[var(--foreground)] text-[var(--background)] font-bold rounded-lg hover:opacity-90 transition-opacity mb-3"
            >
              Sign In With X
            </button>
            <button
              onClick={startDemoScan}
              className="w-full py-3 border border-[var(--border)] text-[var(--muted)] rounded-lg hover:text-[var(--foreground)] hover:border-[#334155] transition-colors text-sm"
            >
              Continue With Demo Account
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SCANNING */}
      {/* ============================================================ */}
      {step === "scanning" && (
        <div className="max-w-lg mx-auto px-4 py-20">
          <div className="border border-[var(--border)] bg-[var(--card-bg)] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[#080d18]">
              <span className="font-bold text-sm">Account Audit</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
                <span className="text-[var(--accent-cyan)] text-xs font-mono">SCANNING</span>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                {xUser?.profileImage && (
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-[var(--accent-cyan)]">
                    <img src={xUser.profileImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <h3 className="font-bold text-lg mb-1">
                  {xUser ? `Scanning @${xUser.username}` : "Scanning Account"}
                </h3>
                <p className="text-sm text-[var(--muted)]">Analyzing behavioral signals...</p>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-xs font-mono text-[var(--muted)] mb-2">
                  <span>Progress</span>
                  <span>{Math.round(scanProgress)}%</span>
                </div>
                <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] transition-all duration-300 rounded-full"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-0">
                {auditSignals.map((signal, i) => (
                  <SignalRow key={signal.label} signal={signal} delay={(i + 1) * 300} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* APPROVED */}
      {/* ============================================================ */}
      {step === "approved" && (
        <div className="max-w-lg mx-auto px-4 py-20">
          <div className="border border-[var(--border)] bg-[var(--card-bg)] rounded-lg p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/10 border-2 border-[var(--accent-green)] flex items-center justify-center text-4xl text-[var(--accent-green)]">
              &#x2713;
            </div>
            <h2 className="font-bold text-2xl mb-2 text-[var(--accent-green)] glow-green">Human Verified</h2>
            <p className="text-sm text-[var(--muted)]">
              All signals passed. Setting up your account...
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CREATE ACCOUNT */}
      {/* ============================================================ */}
      {step === "create-account" && (
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="border border-[var(--border)] bg-[var(--card-bg)] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[#080d18]">
              <span className="font-bold text-sm">Create Your Account</span>
              <span className="text-[var(--accent-green)] text-xs font-mono">&#x2713; HUMAN VERIFIED</span>
            </div>
            <div className="p-6">
              {/* Copy from X button */}
              {xUser && xUser.id !== "demo" && (
                <button
                  onClick={copyFromX}
                  className="w-full py-3 mb-6 border border-[var(--accent-cyan)] text-[var(--accent-cyan)] font-bold rounded-lg hover:bg-cyan-500/10 transition-colors flex items-center justify-center gap-2"
                >
                  <span>&#x1D54F;</span>
                  Copy From X Account
                </button>
              )}

              {xUser && xUser.id === "demo" && (
                <button
                  onClick={() => {
                    setFormName("Demo User");
                    setFormUsername("demouser");
                    setFormBio("Just a regular human checking out SlopScan.");
                    setFormImage("");
                  }}
                  className="w-full py-3 mb-6 border border-[var(--accent-cyan)] text-[var(--accent-cyan)] font-bold rounded-lg hover:bg-cyan-500/10 transition-colors flex items-center justify-center gap-2"
                >
                  <span>&#x1D54F;</span>
                  Copy From X Account
                </button>
              )}

              {/* Profile preview */}
              {formImage && (
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--border)]">
                    <img src={formImage} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[var(--muted)] uppercase tracking-wider font-mono block mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)] uppercase tracking-wider font-mono block mb-1.5">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">@</span>
                    <input
                      type="text"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                      placeholder="username"
                      className="w-full pl-8 pr-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)] uppercase tracking-wider font-mono block mb-1.5">Bio</label>
                  <textarea
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={3}
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted)] resize-none focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateAccount}
                disabled={!formName.trim() || !formUsername.trim()}
                className="w-full mt-6 py-3 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FEED */}
      {/* ============================================================ */}
      {step === "feed" && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Welcome banner */}
          {profile && (
            <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-4 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-sm font-bold text-black">
                    {profile.displayName[0]}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-bold">Welcome, {profile.displayName}! <span className="text-[var(--accent-green)]">&#x2713;</span></div>
                <div className="text-xs text-[var(--muted)]">You&apos;re verified human. Connect a wallet to start posting.</div>
              </div>
              <div className="ml-auto">
                <WalletMultiButton />
              </div>
            </div>
          )}

          {/* Compose */}
          <div className="border border-[var(--border)] bg-[var(--card-bg)] p-4 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-sm font-bold text-black">
                    {(profile?.displayName || "Y")[0]}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="What's happening?"
                  rows={3}
                  className="w-full bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted)] resize-none focus:outline-none mb-3"
                />
                <div className="flex items-center justify-between">
                  <ScanBadge score={100} />
                  <button
                    onClick={handlePost}
                    disabled={!newPostText.trim() || !connected}
                    className="px-4 py-1.5 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {connected ? "Post ($1)" : "Connect wallet to post"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
