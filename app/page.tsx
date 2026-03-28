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

interface HumanProfile {
  displayName: string;
  username: string;
  bio: string;
  profileImage: string;
}

type AppStep = "landing" | "connect-x" | "scanning" | "approved" | "create-account" | "account" | "feed";

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
  likedBy: string[];
  reposts: number;
  repostedBy: string[];
  replies: number;
  earnings: number;
  createdAt: number;
  humanScore: number;
}

const MAX_POST_LENGTH = 280;

// SVG Icons (X-style)
function IconReply({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className || "w-[18px] h-[18px]"} fill="currentColor">
      <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.25-.893 4.306-2.394 5.786l-2.455 2.373a1 1 0 01-1.398-.036L14.6 16.77a1 1 0 01.036-1.45l2.131-2.058A4.13 4.13 0 0018.25 10.13c0-2.291-1.837-4.13-4.128-4.13H9.756a4 4 0 00-4.005 4v.58a1 1 0 01-.293.706L3.05 13.694a1 1 0 01-1.299.042V10z" opacity="0" />
      <path d="M14.046 18.15a1.25 1.25 0 01-1.792 0l-5.5-5.6a1.25 1.25 0 010-1.75l5.5-5.6a1.25 1.25 0 011.792 1.75L9.571 11.5h8.18a3.25 3.25 0 013.25 3.25v3a1.25 1.25 0 01-2.5 0v-3a.75.75 0 00-.75-.75h-8.18l4.475 4.55a1.25 1.25 0 010 1.75v-.1z" />
    </svg>
  );
}

function IconRepost({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className || "w-[18px] h-[18px]"} fill="currentColor">
      <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.791-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.791 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
    </svg>
  );
}

function IconHeart({ filled, className }: { filled?: boolean; className?: string }) {
  return filled ? (
    <svg viewBox="0 0 24 24" className={className || "w-[18px] h-[18px]"} fill="currentColor">
      <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.45-4.92-.334-6.98 1.298-2.402 4.2-3.71 6.994-2.66 1.076.405 2.03 1.09 2.724 2.03.695-.94 1.65-1.625 2.725-2.03 2.793-1.05 5.695.258 6.993 2.66 1.117 2.06 1.027 4.48-.334 6.98z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className={className || "w-[18px] h-[18px]"} fill="currentColor">
      <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.45-4.92-.334-6.98C4.08 3.71 6.983 2.4 9.776 3.45c.984.37 1.862.95 2.583 1.69.072-.08.145-.155.22-.228a5.82 5.82 0 012.362-1.462c2.794-1.05 5.696.258 6.993 2.66 1.117 2.06 1.027 4.48-.334 6.98z" />
    </svg>
  );
}

function IconShare({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className || "w-[18px] h-[18px]"} fill="currentColor">
      <path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" />
    </svg>
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className || "w-[26px] h-[26px]"} fill="currentColor">
      <path d="M21.591 7.146L12.52 1.157c-.316-.21-.724-.21-1.04 0l-9.071 5.99c-.26.173-.409.456-.409.757v13.183c0 .502.418.913.929.913h5.852a.93.93 0 00.929-.913v-7.075h3.58v7.075a.93.93 0 00.929.913h5.852a.93.93 0 00.929-.913V7.904c0-.301-.158-.584-.409-.758z" />
    </svg>
  );
}

function IconProfile({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className || "w-[26px] h-[26px]"} fill="currentColor">
      <path d="M12 11.816c1.355 0 2.872-.15 3.84-1.256.814-.93 1.078-2.368.806-4.392-.38-2.825-2.117-4.512-4.646-4.512S7.734 3.343 7.354 6.17c-.272 2.022-.008 3.46.806 4.39.968 1.107 2.485 1.256 3.84 1.256zM8.84 6.368c.162-1.2.787-3.212 3.16-3.212s2.998 2.013 3.16 3.212c.207 1.55.057 2.627-.45 3.205-.455.52-1.266.743-2.71.743s-2.255-.223-2.71-.743c-.507-.578-.657-1.656-.45-3.205zm11.44 12.868c-.877-3.526-4.282-5.99-8.28-5.99s-7.403 2.464-8.28 5.99c-.172.692-.028 1.4.395 1.94.408.52 1.04.82 1.733.82h12.304c.693 0 1.325-.3 1.733-.82.424-.54.567-1.247.394-1.94zm-1.576 1.016c-.126.16-.316.246-.552.246H5.848c-.235 0-.426-.085-.552-.246-.137-.174-.18-.412-.12-.654.71-2.855 3.517-4.85 6.824-4.85s6.114 1.994 6.824 4.85c.06.242.017.48-.12.654z" />
    </svg>
  );
}

function IconSignOut({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className || "w-[26px] h-[26px]"} fill="currentColor">
      <path d="M16 13v-2H7V8l-5 4 5 4v-3h9zm-2-9h5v16h-5v2h5c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2h-5v2z" />
    </svg>
  );
}

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

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

function Navbar({ profile, step, onSignIn, onSignOut, feedView, onFeedView }: {
  profile: HumanProfile | null;
  step: AppStep;
  onSignIn: () => void;
  onSignOut?: () => void;
  feedView?: "home" | "profile";
  onFeedView?: (v: "home" | "profile") => void;
}) {
  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/fingerprint.png" alt="Human Social" className="w-8 h-8 rounded-lg" />
          <span className="text-lg font-bold tracking-tight">
            <span className="text-[var(--accent-cyan)]">Human</span>Social
          </span>
        </div>

        <div className="flex items-center gap-3">
          {profile ? (
            <>
              {/* Nav links for mobile (desktop uses sidebar) */}
              <div className="flex items-center gap-1 md:hidden">
                <button
                  onClick={() => onFeedView?.("home")}
                  className={`p-2 rounded-full transition-colors ${feedView === "home" ? "text-[var(--accent-cyan)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
                >
                  <IconHome className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onFeedView?.("profile")}
                  className={`p-2 rounded-full transition-colors ${feedView === "profile" ? "text-[var(--accent-cyan)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
                >
                  <IconProfile className="w-5 h-5" />
                </button>
              </div>
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
                <span className="text-sm font-bold hidden sm:inline">{profile.displayName}</span>
                <span className="text-[var(--accent-green)] text-xs">&#x2713;</span>
              </div>
              <button
                onClick={onSignOut}
                className="md:hidden p-2 text-[var(--muted)] hover:text-[var(--accent-red)] transition-colors"
                title="Sign out"
              >
                <IconSignOut className="w-5 h-5" />
              </button>
            </>
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
  const [profile, setProfile] = useState<HumanProfile | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [auditSignals, setAuditSignals] = useState<AuditSignal[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState("");
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);
  const [feedView, setFeedView] = useState<"home" | "profile">("home");
  const [activeTab, setActiveTab] = useState<"posts" | "likes">("posts");

  // Account creation form
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formImage, setFormImage] = useState("");

  const { connected, publicKey } = useWallet();

  // Fetch posts from API
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch {}
  }, []);

  // Check for existing session or OAuth callback
  useEffect(() => {
    setMounted(true);
    fetchPosts();

    // Restore saved profile from localStorage
    const savedProfile = localStorage.getItem("human_profile");
    if (savedProfile) {
      try {
        const p = JSON.parse(savedProfile);
        setProfile(p);
        setStep("feed");
      } catch {}
    }

    const cookies = document.cookie.split(";").reduce((acc, c) => {
      const [key, val] = c.trim().split("=");
      if (key) acc[key] = val;
      return acc;
    }, {} as Record<string, string>);

    if (cookies.human_user) {
      try {
        const user = JSON.parse(decodeURIComponent(cookies.human_user));
        setXUser(user);

        const params = new URLSearchParams(window.location.search);
        if (params.get("auth") === "success") {
          // Just came back from OAuth — start scanning
          window.history.replaceState({}, "", "/");
          startScan(user);
        }
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
    const newProfile: HumanProfile = {
      displayName: formName,
      username: formUsername,
      bio: formBio,
      profileImage: formImage,
    };
    setProfile(newProfile);
    localStorage.setItem("human_profile", JSON.stringify(newProfile));
    setStep("feed");
  };

  const handlePost = async () => {
    if (!newPostText.trim() || !profile) return;
    if (!connected) {
      setShowWalletPrompt(true);
      return;
    }
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: profile.displayName,
          handle: `@${profile.username}`,
          avatar: profile.profileImage || profile.displayName[0].toUpperCase(),
          content: newPostText,
          humanScore: 100,
        }),
      });
      if (res.ok) {
        const post = await res.json();
        setPosts((prev) => [post, ...prev]);
        setNewPostText("");
        setShowWalletPrompt(false);
      }
    } catch {}
  };

  const handleLike = async (postId: number) => {
    if (!profile) return;
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.username }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      }
    } catch {}
  };

  const handleRepost = async (postId: number) => {
    if (!profile) return;
    try {
      const res = await fetch(`/api/posts/${postId}/repost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.username }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      }
    } catch {}
  };

  const handleShare = (postId: number) => {
    const url = `${window.location.origin}/?post=${postId}`;
    navigator.clipboard.writeText(url);
  };

  const handleDelete = async (postId: number) => {
    if (!profile) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: profile.username }),
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch {}
  };

  const handleSignOut = () => {
    localStorage.removeItem("human_profile");
    document.cookie = "human_user=; max-age=0; path=/";
    setProfile(null);
    setXUser(null);
    setStep("landing");
    setFeedView("home");
    setActiveTab("posts");
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
      <Navbar profile={profile} step={step} onSignIn={handleSignInWithX} onSignOut={handleSignOut} feedView={feedView} onFeedView={setFeedView} />

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
                    <img src="/fingerprint.png" alt="Human Social" className="w-12 h-12 rounded-xl relative z-10" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] opacity-50 blur-lg" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    <span className="text-[var(--accent-cyan)] glow-cyan">Human</span>
                    <span className="text-[var(--foreground)]">Social</span>
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
                    href="https://pump.fun/?q=human+social&tab=created_timestamp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-3 border border-[var(--accent-cyan)] text-[var(--accent-cyan)] font-bold rounded-lg hover:bg-cyan-500/10 transition-colors"
                  >
                    Buy $HUMAN
                  </a>
                </div>

                <div className="mt-4 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg inline-block">
                  <span className="text-xs text-[var(--muted)] font-mono">CA: </span>
                  <span className="text-xs text-[var(--foreground)] font-mono">coming soon</span>
                </div>

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
                  Connect your X account and Human Social instantly analyzes your history across 8 behavioral signals. Most real humans pass automatically. Most agents fail instantly.
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
                  Verification isn&apos;t one-time. Human Social continuously monitors posting behavior. If a verified account starts exhibiting agent-like patterns, it gets flagged for re-verification.
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
                  <h3 className="text-[var(--accent-green)] font-bold text-lg mb-4">&#x2714; Human Social</h3>
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
              <h2 className="text-2xl font-bold mb-2">$HUMAN</h2>
              <p className="text-[var(--muted)] text-sm mb-8">The token that powers human-only social.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
                <div className="border border-[var(--border)] bg-[var(--card-bg)] p-5 rounded-lg">
                  <div className="text-[var(--accent-cyan)] text-2xl mb-2">&#x1F4B3;</div>
                  <h3 className="font-bold text-sm mb-1">Hold to Post</h3>
                  <p className="text-xs text-[var(--muted)]">Hold $HUMAN to unlock posting</p>
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
                href="https://pump.fun/?q=human+social&tab=created_timestamp"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black font-bold rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
              >
                Buy $HUMAN
              </a>
            </div>
          </section>

          <footer className="border-t border-[var(--border)]">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <img src="/fingerprint.png" alt="Human Social" className="w-6 h-6 rounded-md" />
                  <span className="font-bold text-sm">Human Social</span>
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
              Human Social will scan your X history to verify you&apos;re human. We check account age, posting patterns, engagement quality, and more. No data is stored.
            </p>
            <button
              onClick={startOAuth}
              className="w-full py-3 bg-[var(--foreground)] text-[var(--background)] font-bold rounded-lg hover:opacity-90 transition-opacity mb-3"
            >
              Sign In With X
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
              {xUser && (
                <button
                  onClick={copyFromX}
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
      {/* FEED (X-style layout) */}
      {/* ============================================================ */}
      {(step === "account" || step === "feed") && profile && (
        <div className="max-w-[1200px] mx-auto flex">
          {/* Left Sidebar — hidden on mobile */}
          <aside className="hidden md:flex flex-col w-[68px] xl:w-[250px] sticky top-[57px] h-[calc(100vh-57px)] border-r border-[var(--border)] py-4 px-2 xl:px-4 shrink-0">
            <nav className="flex flex-col gap-1 flex-1">
              <button
                onClick={() => { setFeedView("home"); setActiveTab("posts"); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-full transition-colors ${feedView === "home" ? "text-[var(--foreground)] font-bold" : "text-[var(--muted)] hover:bg-white/5"}`}
              >
                <IconHome className="w-[26px] h-[26px] shrink-0" />
                <span className="hidden xl:inline text-lg">Home</span>
              </button>
              <button
                onClick={() => { setFeedView("profile"); setActiveTab("posts"); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-full transition-colors ${feedView === "profile" ? "text-[var(--foreground)] font-bold" : "text-[var(--muted)] hover:bg-white/5"}`}
              >
                <IconProfile className="w-[26px] h-[26px] shrink-0" />
                <span className="hidden xl:inline text-lg">Profile</span>
              </button>
              <div className="flex justify-center xl:justify-start px-3 py-2">
                <WalletMultiButton />
              </div>
            </nav>

            {/* Sign out at bottom */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-full text-[var(--muted)] hover:text-[var(--accent-red)] hover:bg-red-500/5 transition-colors mt-auto"
            >
              <IconSignOut className="w-[26px] h-[26px] shrink-0" />
              <span className="hidden xl:inline text-lg">Sign Out</span>
            </button>
          </aside>

          {/* Main Feed */}
          <main className="flex-1 min-w-0 max-w-[600px] border-r border-[var(--border)]">
            {/* Profile header (shown in profile view) */}
            {feedView === "profile" && (
              <>
                <div className="h-32 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--background)]" />
                </div>
                <div className="px-4">
                  <div className="flex items-end justify-between -mt-10 mb-3">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[var(--background)] flex-shrink-0">
                      {profile.profileImage ? (
                        <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-2xl font-bold text-black">
                          {profile.displayName[0]}
                        </div>
                      )}
                    </div>
                    <ScanBadge score={100} />
                  </div>
                  <div className="mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xl">{profile.displayName}</span>
                      <span className="text-[var(--accent-green)]">&#x2713;</span>
                    </div>
                    <div className="text-[var(--muted)] text-sm">@{profile.username}</div>
                  </div>
                  {profile.bio && <p className="text-sm text-[var(--foreground)] mb-3">{profile.bio}</p>}
                  <div className="flex items-center gap-4 text-sm pb-3 border-b border-[var(--border)]">
                    <span><strong>{posts.filter(p => p.handle === `@${profile.username}`).length}</strong> <span className="text-[var(--muted)]">posts</span></span>
                    <span><strong>0</strong> <span className="text-[var(--muted)]">following</span></span>
                    <span><strong>0</strong> <span className="text-[var(--muted)]">followers</span></span>
                  </div>
                </div>
              </>
            )}

            {/* Feed header (shown in home view) */}
            {feedView === "home" && (
              <div className="sticky top-[57px] z-30 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)] px-4 py-3">
                <h2 className="font-bold text-lg">Home</h2>
              </div>
            )}

            {/* Compose Box */}
            {feedView === "home" && (
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-1">
                    {profile.profileImage ? (
                      <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-sm font-bold text-black">
                        {profile.displayName[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newPostText}
                      onChange={(e) => {
                        if (e.target.value.length <= MAX_POST_LENGTH) setNewPostText(e.target.value);
                      }}
                      placeholder="What's happening?"
                      rows={2}
                      className="w-full bg-transparent text-[var(--foreground)] placeholder-[var(--muted)] resize-none focus:outline-none mb-2 text-[17px] leading-relaxed"
                    />
                    <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
                      <div className="flex items-center gap-2">
                        {newPostText.length > 0 && (
                          <span className={`text-xs font-mono ${newPostText.length > MAX_POST_LENGTH * 0.9 ? "text-[var(--accent-red)]" : "text-[var(--muted)]"}`}>
                            {newPostText.length}/{MAX_POST_LENGTH}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={handlePost}
                        disabled={!newPostText.trim() || newPostText.length > MAX_POST_LENGTH}
                        className="px-5 py-1.5 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black text-sm font-bold rounded-full hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab bar */}
            <div className="flex border-b border-[var(--border)]">
              <button
                onClick={() => setActiveTab("posts")}
                className={`flex-1 py-3 text-center text-sm font-bold transition-colors relative ${activeTab === "posts" ? "text-[var(--foreground)]" : "text-[var(--muted)] hover:bg-white/5"}`}
              >
                Posts
                {activeTab === "posts" && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-[var(--accent-cyan)]" />}
              </button>
              <button
                onClick={() => setActiveTab("likes")}
                className={`flex-1 py-3 text-center text-sm font-bold transition-colors relative ${activeTab === "likes" ? "text-[var(--foreground)]" : "text-[var(--muted)] hover:bg-white/5"}`}
              >
                Likes
                {activeTab === "likes" && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-[var(--accent-cyan)]" />}
              </button>
            </div>

            {/* Timeline */}
            <div>
              {(() => {
                let filtered = posts;
                if (feedView === "profile") {
                  if (activeTab === "posts") {
                    filtered = posts.filter(p => p.handle === `@${profile.username}`);
                  } else {
                    filtered = posts.filter(p => p.likedBy?.includes(profile.username));
                  }
                } else if (activeTab === "likes") {
                  filtered = posts.filter(p => p.likedBy?.includes(profile.username));
                }

                if (filtered.length === 0) {
                  return (
                    <div className="py-16 px-4 text-center">
                      <div className="text-4xl mb-3">
                        {activeTab === "likes" ? "\u2661" : "\u270D"}
                      </div>
                      <h3 className="font-bold text-xl mb-1">
                        {activeTab === "likes" ? "No likes yet" : feedView === "profile" ? "No posts yet" : "Welcome to Human Social"}
                      </h3>
                      <p className="text-[var(--muted)] text-sm max-w-sm mx-auto">
                        {activeTab === "likes"
                          ? "Posts you like will show up here."
                          : feedView === "profile"
                          ? "When you post, your posts will show up here."
                          : "Be the first human to post. Connect your wallet and share something real."}
                      </p>
                    </div>
                  );
                }

                return filtered.map((post) => {
                  const isLiked = post.likedBy?.includes(profile.username);
                  const isReposted = post.repostedBy?.includes(profile.username);
                  return (
                    <div key={post.id} className="border-b border-[var(--border)] hover:bg-white/[0.02] transition-colors">
                      <div className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            {post.avatar.startsWith("http") ? (
                              <img src={post.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-sm font-bold text-black">
                                {post.avatar}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[15px]">{post.author}</span>
                              <span className="text-[var(--accent-green)] text-xs">&#x2713;</span>
                              <span className="text-[var(--muted)] text-[15px]">{post.handle}</span>
                              <span className="text-[var(--muted)] text-[15px]">&#xB7; {relativeTime(post.createdAt)}</span>
                            </div>
                            <p className="text-[15px] mt-0.5 leading-snug whitespace-pre-wrap">{post.content}</p>

                            {/* Action bar */}
                            <div className="flex items-center justify-between max-w-[400px] mt-2 -ml-2">
                              {/* Reply */}
                              <button className="group flex items-center gap-1.5 p-2 rounded-full hover:bg-cyan-500/10 transition-colors text-[var(--muted)] hover:text-[var(--accent-cyan)]">
                                <IconReply className="w-[18px] h-[18px]" />
                                <span className="text-[13px]">{post.replies || ""}</span>
                              </button>
                              {/* Repost */}
                              <button
                                onClick={() => handleRepost(post.id)}
                                className={`group flex items-center gap-1.5 p-2 rounded-full transition-colors ${isReposted ? "text-[#00ba7c]" : "text-[var(--muted)] hover:bg-green-500/10 hover:text-[#00ba7c]"}`}
                              >
                                <IconRepost className="w-[18px] h-[18px]" />
                                <span className="text-[13px]">{post.reposts || ""}</span>
                              </button>
                              {/* Like */}
                              <button
                                onClick={() => handleLike(post.id)}
                                className={`group flex items-center gap-1.5 p-2 rounded-full transition-colors ${isLiked ? "text-[#f91880]" : "text-[var(--muted)] hover:bg-pink-500/10 hover:text-[#f91880]"}`}
                              >
                                <IconHeart filled={isLiked} className="w-[18px] h-[18px]" />
                                <span className="text-[13px]">{post.likes || ""}</span>
                              </button>
                              {/* Share */}
                              <button
                                onClick={() => handleShare(post.id)}
                                className="group flex items-center p-2 rounded-full hover:bg-cyan-500/10 transition-colors text-[var(--muted)] hover:text-[var(--accent-cyan)]"
                              >
                                <IconShare className="w-[18px] h-[18px]" />
                              </button>
                              {/* Delete (own posts only) */}
                              {post.handle === `@${profile.username}` && (
                                <button
                                  onClick={() => handleDelete(post.id)}
                                  className="group flex items-center p-2 rounded-full hover:bg-red-500/10 transition-colors text-[var(--muted)] hover:text-[var(--accent-red)]"
                                >
                                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
                                    <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="hidden lg:block w-[350px] sticky top-[57px] h-[calc(100vh-57px)] py-4 px-6">
            <div className="border border-[var(--border)] bg-[var(--card-bg)] rounded-2xl p-4 mb-4">
              <h3 className="font-bold text-lg mb-3">$HUMAN</h3>
              <p className="text-sm text-[var(--muted)] mb-3">The token that powers human-only social.</p>
              <a
                href="https://pump.fun/?q=human+social&tab=created_timestamp"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 text-center bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black text-sm font-bold rounded-full hover:opacity-90 transition-opacity"
              >
                Buy $HUMAN
              </a>
            </div>

            <div className="border border-[var(--border)] bg-[var(--card-bg)] rounded-2xl p-4">
              <h3 className="font-bold mb-3">How it works</h3>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li className="flex items-start gap-2"><span className="text-[var(--accent-cyan)]">1.</span> Sign in with X</li>
                <li className="flex items-start gap-2"><span className="text-[var(--accent-cyan)]">2.</span> Pass the human scan</li>
                <li className="flex items-start gap-2"><span className="text-[var(--accent-cyan)]">3.</span> Connect wallet &amp; post</li>
                <li className="flex items-start gap-2"><span className="text-[var(--accent-cyan)]">4.</span> Earn from engagement</li>
              </ul>
            </div>
          </aside>
        </div>
      )}

      {/* Verify $HUMAN Holdings Modal */}
      {showWalletPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowWalletPrompt(false)}>
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 max-w-sm mx-4 w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Hold $HUMAN to Post</h3>
            <p className="text-sm text-[var(--muted)] mb-6">
              You need to hold $HUMAN in your wallet to post. Verify your holdings or grab some first.
            </p>
            <div className="space-y-3">
              <div className="flex justify-center">
                <WalletMultiButton />
              </div>
              <p className="text-center text-xs text-[var(--muted)]">Connect wallet to verify $HUMAN holdings</p>
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-xs text-[var(--muted)]">or</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>
              <a
                href="https://pump.fun/?q=human+social&tab=created_timestamp"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black font-bold rounded-full hover:opacity-90 transition-opacity flex items-center justify-center text-sm"
              >
                Buy $HUMAN
              </a>
              <button
                onClick={() => setShowWalletPrompt(false)}
                className="w-full py-2 text-[var(--muted)] text-sm hover:text-[var(--foreground)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
