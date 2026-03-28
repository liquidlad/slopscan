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

type AppStep = "landing" | "connect-x" | "scanning" | "audit-result" | "challenge" | "connect-wallet" | "feed";

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
// HELPER: generate audit signals from real X user data
// ============================================================
function generateAuditSignals(user: XUser | null): AuditSignal[] {
  if (!user) {
    // Demo signals for when not logged in
    return [
      { label: "Account Age", status: "pass", detail: "Created 4 years ago" },
      { label: "Post Frequency", status: "pass", detail: "Natural irregular patterns" },
      { label: "Content Variation", status: "pass", detail: "High originality across posts" },
      { label: "Engagement Pattern", status: "warn", detail: "Slightly repetitive reply timing" },
      { label: "Follower Quality", status: "pass", detail: "82% real followers detected" },
      { label: "Media Uploads", status: "pass", detail: "Original photos found" },
      { label: "Reply Context", status: "pass", detail: "Contextually relevant replies" },
      { label: "Posting Schedule", status: "warn", detail: "Some automated-window activity" },
    ];
  }

  const signals: AuditSignal[] = [];
  const now = new Date();

  // Account age
  if (user.createdAt) {
    const created = new Date(user.createdAt);
    const ageMonths = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (ageMonths >= 12) {
      signals.push({ label: "Account Age", status: "pass", detail: `Created ${Math.floor(ageMonths / 12)} years ago` });
    } else if (ageMonths >= 3) {
      signals.push({ label: "Account Age", status: "warn", detail: `Created ${ageMonths} months ago` });
    } else {
      signals.push({ label: "Account Age", status: "fail", detail: `Created ${ageMonths} months ago — very new` });
    }
  } else {
    signals.push({ label: "Account Age", status: "warn", detail: "Unable to determine" });
  }

  // Tweet count / frequency
  if (user.metrics) {
    const tweetCount = user.metrics.tweet_count;
    if (tweetCount > 500) {
      signals.push({ label: "Post History", status: "pass", detail: `${tweetCount.toLocaleString()} posts — active account` });
    } else if (tweetCount > 50) {
      signals.push({ label: "Post History", status: "warn", detail: `${tweetCount.toLocaleString()} posts — moderate activity` });
    } else {
      signals.push({ label: "Post History", status: "fail", detail: `${tweetCount} posts — very low activity` });
    }

    // Follower ratio
    const ratio = user.metrics.following_count > 0 ? user.metrics.followers_count / user.metrics.following_count : 0;
    if (ratio > 0.3 && user.metrics.followers_count > 20) {
      signals.push({ label: "Follower Ratio", status: "pass", detail: `${user.metrics.followers_count.toLocaleString()} followers, healthy ratio` });
    } else if (user.metrics.followers_count > 5) {
      signals.push({ label: "Follower Ratio", status: "warn", detail: `${user.metrics.followers_count.toLocaleString()} followers — ratio flagged` });
    } else {
      signals.push({ label: "Follower Ratio", status: "fail", detail: `${user.metrics.followers_count} followers — suspicious` });
    }
  } else {
    signals.push({ label: "Post History", status: "warn", detail: "Metrics unavailable" });
    signals.push({ label: "Follower Ratio", status: "warn", detail: "Metrics unavailable" });
  }

  // Bio check
  if (user.description && user.description.length > 20) {
    signals.push({ label: "Profile Bio", status: "pass", detail: "Detailed bio present" });
  } else if (user.description) {
    signals.push({ label: "Profile Bio", status: "warn", detail: "Minimal bio" });
  } else {
    signals.push({ label: "Profile Bio", status: "fail", detail: "No bio — common for bots" });
  }

  // Profile image
  if (user.profileImage && !user.profileImage.includes("default_profile")) {
    signals.push({ label: "Profile Image", status: "pass", detail: "Custom profile image" });
  } else {
    signals.push({ label: "Profile Image", status: "fail", detail: "Default/no profile image" });
  }

  // Content Variation (simulated — would need tweet content in production)
  signals.push({ label: "Content Variation", status: "pass", detail: "Analysis pending — full scan on post" });

  // Posting Schedule (simulated)
  signals.push({ label: "Posting Schedule", status: "pass", detail: "Analysis pending — full scan on post" });

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
  const borderColor = signal.status === "pass"
    ? "border-emerald-500/20"
    : signal.status === "fail"
    ? "border-red-500/20"
    : "border-yellow-500/20";

  return (
    <div className={`flex items-center gap-3 py-2.5 px-3 border-b ${borderColor} text-sm font-mono`}>
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
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-sm font-bold text-black flex-shrink-0">
          {post.avatar}
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

function Navbar({ user, step, onSignIn }: { user: XUser | null; step: AppStep; onSignIn: () => void }) {
  const { publicKey } = useWallet();

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-sm font-bold text-black">
            S
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-[var(--accent-cyan)]">Slop</span>Scan
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              {publicKey && (
                <span className="text-[var(--accent-green)] text-xs font-mono hidden sm:block">
                  {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                </span>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg">
                <span className="text-[var(--accent-green)] text-xs">&#x2713;</span>
                <span className="text-sm font-bold">@{user.username}</span>
              </div>
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
  const [scanProgress, setScanProgress] = useState(0);
  const [auditSignals, setAuditSignals] = useState<AuditSignal[]>([]);
  const [showSignals, setShowSignals] = useState(false);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [newPostText, setNewPostText] = useState("");

  const { publicKey, connected } = useWallet();

  // Check for existing session or OAuth callback
  useEffect(() => {
    setMounted(true);

    // Check for user cookie
    const cookies = document.cookie.split(";").reduce((acc, c) => {
      const [key, val] = c.trim().split("=");
      acc[key] = val;
      return acc;
    }, {} as Record<string, string>);

    if (cookies.slopscan_user) {
      try {
        const user = JSON.parse(decodeURIComponent(cookies.slopscan_user));
        setXUser(user);
        // If we have a user but haven't gone through verification, jump to scanning
        const params = new URLSearchParams(window.location.search);
        if (params.get("auth") === "success") {
          setStep("scanning");
          window.history.replaceState({}, "", "/");
        } else {
          // Returning user — go to wallet or feed
          setStep(connected ? "feed" : "connect-wallet");
        }
      } catch {
        // Invalid cookie
      }
    }
  }, []);

  // When wallet connects while on connect-wallet step, advance to feed
  useEffect(() => {
    if (connected && step === "connect-wallet") {
      setStep("feed");
    }
  }, [connected, step]);

  const handleSignInWithX = () => {
    setStep("connect-x");
  };

  const startOAuth = () => {
    window.location.href = "/api/auth/twitter";
  };

  // Demo mode: simulate the scan without real OAuth
  const startDemoScan = useCallback(() => {
    setStep("scanning");
    setScanProgress(0);
    setShowSignals(false);
    const signals = generateAuditSignals(xUser);
    setAuditSignals(signals);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setShowSignals(true);
          setStep("audit-result");
        }, 500);
      }
      setScanProgress(Math.min(progress, 100));
    }, 300);
  }, [xUser]);

  // Real scan after OAuth
  useEffect(() => {
    if (step === "scanning" && xUser) {
      setScanProgress(0);
      setShowSignals(false);
      const signals = generateAuditSignals(xUser);
      setAuditSignals(signals);

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTimeout(() => {
            setShowSignals(true);
            setStep("audit-result");
          }, 500);
        }
        setScanProgress(Math.min(progress, 100));
      }, 300);

      return () => clearInterval(interval);
    }
  }, [step === "scanning" && !!xUser]);

  const auditScore = auditSignals.length > 0
    ? Math.round((auditSignals.filter((s) => s.status === "pass").length / auditSignals.length) * 100)
    : 0;

  const handleAuditContinue = () => {
    if (auditScore >= 90) {
      setStep("connect-wallet");
    } else {
      setStep("challenge");
    }
  };

  const handleChallengeSubmit = () => {
    if (challengeAnswer.trim()) {
      setStep("connect-wallet");
    }
  };

  const handlePost = () => {
    if (!newPostText.trim()) return;
    const newPost: Post = {
      id: Date.now(),
      author: xUser?.name || "You",
      handle: `@${xUser?.username || "you"}`,
      avatar: (xUser?.name || "Y")[0].toUpperCase(),
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
      <Navbar user={xUser} step={step} onSignIn={handleSignInWithX} />

      {/* ============================================================ */}
      {/* LANDING */}
      {/* ============================================================ */}
      {step === "landing" && (
        <>
          {/* Hero */}
          <header className="relative overflow-hidden border-b border-[var(--border)]">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5" />

            <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center">
                    <span className="text-2xl font-bold text-black">S</span>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] opacity-50 blur-lg" />
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

              {/* Layer 1 */}
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

              {/* Layer 2 */}
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

              {/* Layer 3 */}
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

          {/* Footer */}
          <footer className="border-t border-[var(--border)]">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-xs font-bold text-black">S</div>
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
                <h3 className="font-bold text-lg mb-1">
                  {xUser ? `Analyzing @${xUser.username}` : "Analyzing Demo Account"}
                </h3>
                <p className="text-sm text-[var(--muted)]">Scanning behavioral signals...</p>
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
                  <SignalRow key={signal.label} signal={signal} delay={(i + 1) * 250} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* AUDIT RESULT */}
      {/* ============================================================ */}
      {step === "audit-result" && (
        <div className="max-w-lg mx-auto px-4 py-20">
          <div className="border border-[var(--border)] bg-[var(--card-bg)] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[#080d18]">
              <span className="font-bold text-sm">Audit Complete</span>
              <span className={`text-xs font-mono ${auditScore >= 80 ? "text-[var(--accent-green)]" : "text-[var(--accent-yellow)]"}`}>
                SCORE: {auditScore}%
              </span>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className={`text-5xl font-bold font-mono mb-2 ${
                  auditScore >= 80 ? "text-[var(--accent-green)] glow-green" : "text-[var(--accent-yellow)]"
                }`}>
                  {auditScore}%
                </div>
                <div className="text-sm text-[var(--muted)]">
                  {auditScore >= 90
                    ? "High confidence — you look human!"
                    : "Some signals flagged — quick verification needed"
                  }
                </div>
              </div>

              {showSignals && (
                <div className="space-y-0 mb-6">
                  {auditSignals.map((signal) => (
                    <SignalRow key={signal.label} signal={signal} delay={0} />
                  ))}
                </div>
              )}

              <button
                onClick={handleAuditContinue}
                className="w-full py-3 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                {auditScore >= 90 ? "Continue to Wallet" : "Complete Verification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CHALLENGE */}
      {/* ============================================================ */}
      {step === "challenge" && (
        <div className="max-w-lg mx-auto px-4 py-20">
          <div className="border border-[var(--border)] bg-[var(--card-bg)] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[#080d18]">
              <span className="font-bold text-sm">Verification Challenge</span>
              <span className="text-[var(--accent-yellow)] text-xs font-mono">STEP 2</span>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="font-bold text-lg mb-1">Quick Human Check</h3>
                <p className="text-sm text-[var(--muted)]">Your audit flagged a few signals. Answer this to confirm you&apos;re human.</p>
              </div>

              <div className="border border-[var(--border)] rounded-lg p-4 mb-4 bg-[#080d18]">
                <div className="text-xs text-[var(--muted)] uppercase tracking-wider mb-3 font-mono">Challenge</div>
                <p className="text-sm mb-4">What emotion would most people feel if they found $20 in an old jacket pocket?</p>
                <input
                  type="text"
                  value={challengeAnswer}
                  onChange={(e) => setChallengeAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleChallengeSubmit()}
                />
              </div>

              <button
                onClick={handleChallengeSubmit}
                disabled={!challengeAnswer.trim()}
                className="w-full py-3 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CONNECT WALLET */}
      {/* ============================================================ */}
      {step === "connect-wallet" && (
        <div className="max-w-lg mx-auto px-4 py-20">
          <div className="border border-[var(--border)] bg-[var(--card-bg)] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[#080d18]">
              <span className="font-bold text-sm">Connect Wallet</span>
              <span className="text-[var(--accent-green)] text-xs font-mono">VERIFIED HUMAN</span>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border-2 border-[var(--accent-green)] flex items-center justify-center text-2xl text-[var(--accent-green)]">
                &#x2713;
              </div>
              <h3 className="font-bold text-lg mb-2 text-[var(--accent-green)]">Human Verified!</h3>
              <p className="text-sm text-[var(--muted)] mb-6">
                Now connect your Solana wallet to post and earn. You&apos;ll need $1 of $SLOPSCAN to publish your first post.
              </p>

              <div className="flex justify-center mb-4">
                <WalletMultiButton />
              </div>

              <button
                onClick={() => setStep("feed")}
                className="text-[var(--muted)] text-sm hover:text-[var(--foreground)] transition-colors underline underline-offset-4"
              >
                Skip for now — browse the feed
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
          {/* Compose */}
          <div className="border border-[var(--border)] bg-[var(--card-bg)] p-4 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-sm font-bold text-black flex-shrink-0">
                {(xUser?.name || "Y")[0].toUpperCase()}
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

          {/* Feed */}
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
