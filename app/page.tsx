"use client";

import { useState, useEffect } from "react";

// ============================================================
// MOCK DATA
// ============================================================
const MOCK_POSTS = [
  {
    id: 1,
    author: "sarah.sol",
    handle: "@sarahbuilds",
    avatar: "S",
    verified: true,
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
    verified: true,
    content: "Hot take: The best anti-spam mechanism isn't a fee — it's proving you're actually human. Captcha charges $1 and still lets bots in. SlopScan gets it right.",
    likes: 89,
    replies: 31,
    earnings: 2.18,
    time: "8m ago",
    humanScore: 97,
  },
  {
    id: 3,
    author: "nft_nina",
    handle: "@ninaonchain",
    avatar: "N",
    verified: true,
    content: "The engagement quality here is night and day vs other platforms. When every poster is verified human, the conversations actually mean something.",
    likes: 214,
    replies: 45,
    earnings: 5.67,
    time: "14m ago",
    humanScore: 100,
  },
  {
    id: 4,
    author: "sol_dev_jr",
    handle: "@soldevjr",
    avatar: "J",
    verified: true,
    content: "Built my first Solana program today. Anyone else learning Anchor? Would love to connect with other devs here. No bots sliding into my replies is a game changer.",
    likes: 67,
    replies: 19,
    earnings: 1.54,
    time: "22m ago",
    humanScore: 98,
  },
  {
    id: 5,
    author: "crypto_kate",
    handle: "@katecrypto",
    avatar: "K",
    verified: true,
    content: "Day 3 on SlopScan: my feed is pure signal. No shilling bots, no copy-paste engagement farming, no AI-generated threads. This is what social media should feel like.",
    likes: 312,
    replies: 58,
    earnings: 8.91,
    time: "31m ago",
    humanScore: 100,
  },
];

const BLOCKED_AGENTS = [
  { name: "GPT-4 Agent", type: "LLM Bot", time: "12s ago", method: "Behavioral analysis" },
  { name: "AutoPost v3", type: "Spam Bot", time: "34s ago", method: "Pattern detection" },
  { name: "SolanaFarmBot", type: "Farm Bot", time: "1m ago", method: "Verification failed" },
  { name: "ContentMill AI", type: "LLM Bot", time: "2m ago", method: "Behavioral analysis" },
  { name: "EngagementBot9k", type: "Farm Bot", time: "3m ago", method: "Pattern detection" },
  { name: "CopyPasteAgent", type: "Spam Bot", time: "4m ago", method: "Verification failed" },
];

const STATS = {
  totalUsers: 4821,
  postsToday: 12847,
  botsBlocked: 89234,
  avgEarnings: 2.34,
  humanRate: 100,
  slopFiltered: 99.7,
};

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

function PostCard({ post }: { post: typeof MOCK_POSTS[0] }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--card-bg)] p-4 rounded-lg hover:border-[#334155] transition-colors">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-sm font-bold text-black flex-shrink-0">
          {post.avatar}
        </div>
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">{post.author}</span>
            {post.verified && (
              <span className="text-[var(--accent-green)] text-xs" title="Verified Human">
                &#x2713;
              </span>
            )}
            <span className="text-[var(--muted)] text-xs">{post.handle}</span>
            <span className="text-[var(--muted)] text-xs">· {post.time}</span>
            <ScanBadge score={post.humanScore} />
          </div>
          {/* Content */}
          <p className="text-sm mt-2 leading-relaxed">{post.content}</p>
          {/* Actions */}
          <div className="flex items-center gap-6 mt-3 text-xs text-[var(--muted)]">
            <span className="hover:text-[var(--accent-cyan)] cursor-pointer transition-colors">
              &#x2661; {post.likes}
            </span>
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

function StatCard({ label, value, subtext, color = "cyan" }: { label: string; value: string; subtext?: string; color?: string }) {
  const colorClass = color === "cyan" ? "text-[var(--accent-cyan)] glow-cyan"
    : color === "green" ? "text-[var(--accent-green)] glow-green"
    : color === "red" ? "text-[var(--accent-red)] glow-red"
    : "text-[var(--foreground)]";

  return (
    <div className="border border-[var(--border)] bg-[var(--card-bg)] p-5 rounded-lg hover:border-[#334155] transition-colors">
      <div className="text-[var(--muted)] text-xs uppercase tracking-wider mb-2 font-mono">{label}</div>
      <div className={`text-3xl font-bold font-mono ${colorClass}`}>{value}</div>
      {subtext && <div className="text-[var(--muted)] text-xs mt-1">{subtext}</div>}
    </div>
  );
}

function BlockedAgentRow({ agent }: { agent: typeof BLOCKED_AGENTS[0] }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-b-0 text-sm font-mono">
      <span className="text-[var(--accent-red)] w-5 text-center">&#x2718;</span>
      <span className="text-[var(--foreground)] flex-1">{agent.name}</span>
      <span className="text-[var(--muted)] text-xs hidden sm:block">{agent.type}</span>
      <span className="text-[var(--muted)] text-xs hidden md:block">{agent.method}</span>
      <span className="text-[var(--muted)] text-xs">{agent.time}</span>
    </div>
  );
}

function ComparisonTable() {
  const rows = [
    { feature: "Anti-bot mechanism", captcha: "$1 fee (bots can pay)", slopscan: "Human verification + fee" },
    { feature: "AI agents allowed", captcha: "Yes", slopscan: "No — humans only" },
    { feature: "Slop filtering", captcha: "Partial (fee-based)", slopscan: "99.7% filtered" },
    { feature: "Content quality", captcha: "Mixed (bots + humans)", slopscan: "Pure human signal" },
    { feature: "Engagement farming", captcha: "Bots can farm rewards", slopscan: "Verified humans only earn" },
    { feature: "Onboarding", captcha: "Complex wallet + X login", slopscan: "Streamlined 1-click flow" },
    { feature: "Performance", captcha: "Laggy under load", slopscan: "Built for scale" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left py-3 pr-4 text-[var(--muted)] text-xs uppercase tracking-wider">Feature</th>
            <th className="text-left py-3 px-4 text-[var(--accent-red)] text-xs uppercase tracking-wider">Captcha.social</th>
            <th className="text-left py-3 pl-4 text-[var(--accent-green)] text-xs uppercase tracking-wider">SlopScan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--border)] last:border-b-0">
              <td className="py-3 pr-4 text-[var(--foreground)]">{row.feature}</td>
              <td className="py-3 px-4 text-[var(--muted)]">{row.captcha}</td>
              <td className="py-3 pl-4 text-[var(--accent-green)]">{row.slopscan}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [botsBlocked, setBotsBlocked] = useState(STATS.botsBlocked);
  const [activeSection, setActiveSection] = useState<"feed" | "blocked" | "compare">("feed");

  useEffect(() => {
    setMounted(true);

    // Slowly increment blocked bots counter
    const interval = setInterval(() => {
      setBotsBlocked((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--muted)] font-mono">Initializing scan...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] grid-bg">
      {/* Scan line effect */}
      <div className="scan-line" />

      {/* Hero Section */}
      <header className="relative overflow-hidden border-b border-[var(--border)]">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5" />

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
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

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-[var(--muted)] mb-2 max-w-2xl">
              The first <span className="text-[var(--accent-green)] font-bold">truly human-only</span> social platform.
            </p>
            <p className="text-sm md:text-base text-[var(--muted)] mb-8 max-w-xl">
              Post for $1. Earn when people engage. No bots. No agents. No slop.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 justify-center mb-10">
              <a
                href="#"
                className="px-8 py-3 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black font-bold rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
              >
                Launch App
              </a>
              <a
                href="https://pump.fun/?q=slopscan&tab=created_timestamp"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 border border-[var(--accent-cyan)] text-[var(--accent-cyan)] font-bold rounded-lg hover:bg-cyan-500/10 transition-colors"
              >
                Buy $SLOPSCAN
              </a>
            </div>

            {/* Key stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-[var(--accent-cyan)] glow-cyan">{STATS.humanRate}%</div>
                <div className="text-xs text-[var(--muted)] uppercase tracking-wider mt-1">Human Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-[var(--accent-red)] glow-red">{botsBlocked.toLocaleString()}</div>
                <div className="text-xs text-[var(--muted)] uppercase tracking-wider mt-1">Bots Blocked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-[var(--accent-green)]">{STATS.slopFiltered}%</div>
                <div className="text-xs text-[var(--muted)] uppercase tracking-wider mt-1">Slop Filtered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-[var(--accent-yellow)]">${STATS.avgEarnings}</div>
                <div className="text-xs text-[var(--muted)] uppercase tracking-wider mt-1">Avg Earnings/Post</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* How It Works */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-2">How It Works</h2>
          <p className="text-[var(--muted)] text-center mb-10 text-sm">Three steps. Zero slop.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-[var(--border)] bg-[var(--card-bg)] p-6 rounded-lg text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl">
                &#x1F6E1;
              </div>
              <h3 className="font-bold mb-2 text-[var(--accent-cyan)]">1. Verify You&apos;re Human</h3>
              <p className="text-sm text-[var(--muted)]">
                Pass our multi-layer human verification. Not a simple captcha — real behavioral analysis that AI agents can&apos;t fake.
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--card-bg)] p-6 rounded-lg text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-2xl">
                &#x270D;
              </div>
              <h3 className="font-bold mb-2 text-[var(--accent-green)]">2. Post for $1</h3>
              <p className="text-sm text-[var(--muted)]">
                Buy $1 of $SLOPSCAN to post. The fee filters low-effort content. Combined with human-only access, your feed stays pure signal.
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--card-bg)] p-6 rounded-lg text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-2xl">
                &#x1F4B0;
              </div>
              <h3 className="font-bold mb-2 text-[var(--accent-yellow)]">3. Earn From Engagement</h3>
              <p className="text-sm text-[var(--muted)]">
                When real humans engage with your posts, you earn $SLOPSCAN. No bots farming rewards — every interaction is genuine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-2">The Problem With Pay-to-Post</h2>
          <p className="text-[var(--muted)] text-center mb-10 text-sm max-w-2xl mx-auto">
            Charging $1 to post was a good idea. But a fee alone doesn&apos;t stop slop — bots and AI agents can pay $1 too. SlopScan fixes what others got wrong.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* The old way */}
            <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-6">
              <h3 className="text-[var(--accent-red)] font-bold text-lg mb-4 flex items-center gap-2">
                <span>&#x2718;</span> Fee-Only Platforms
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-red)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--muted)]">$1 fee stops casual spam, but well-funded bots pay it easily</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-red)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--muted)]">AI agents farm engagement rewards, diluting human earnings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-red)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--muted)]">GPT-generated content floods the feed disguised as human posts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-red)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--muted)]">No way to know if you&apos;re engaging with a real person or a bot</span>
                </li>
              </ul>
            </div>

            {/* The SlopScan way */}
            <div className="border border-green-500/20 bg-green-500/5 rounded-lg p-6">
              <h3 className="text-[var(--accent-green)] font-bold text-lg mb-4 flex items-center gap-2">
                <span>&#x2714;</span> SlopScan
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-green)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--foreground)]">Multi-layer human verification blocks all bots and AI agents</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-green)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--foreground)]">$1 fee + human gate = double protection against slop</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-green)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--foreground)]">Every post has a verified human score — full transparency</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-green)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--foreground)]">Rewards go only to real humans, not farming bots</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-2">See It In Action</h2>
          <p className="text-[var(--muted)] text-center mb-8 text-sm">Real-time demo of the SlopScan platform.</p>

          {/* Section Tabs */}
          <div className="flex border border-[var(--border)] bg-[var(--card-bg)] rounded-lg mb-6 overflow-hidden max-w-lg mx-auto">
            {(
              [
                { id: "feed", label: "Live Feed", icon: "\u25A3" },
                { id: "blocked", label: "Blocked Bots", icon: "\u2718" },
                { id: "compare", label: "vs Captcha", icon: "\u21C4" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex-1 py-3 px-4 text-sm font-bold uppercase tracking-wider transition-all ${
                  activeSection === tab.id
                    ? "bg-gradient-to-b from-cyan-500/10 to-transparent text-[var(--accent-cyan)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <span className="mr-1">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Feed View */}
          {activeSection === "feed" && (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Compose box */}
              <div className="border border-[var(--border)] bg-[var(--card-bg)] p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-xs font-bold text-black">
                    Y
                  </div>
                  <span className="text-[var(--muted)] text-sm">What&apos;s happening?</span>
                </div>
                <div className="flex items-center justify-between">
                  <ScanBadge score={100} />
                  <button className="px-4 py-1.5 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black text-sm font-bold rounded-lg opacity-50 cursor-not-allowed">
                    Post ($1)
                  </button>
                </div>
              </div>

              {/* Posts */}
              {MOCK_POSTS.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Blocked Bots View */}
          {activeSection === "blocked" && (
            <div className="max-w-2xl mx-auto">
              <div className="border border-[var(--border)] bg-[var(--card-bg)] p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[var(--muted)] text-xs uppercase tracking-wider font-mono">Live Bot Detection Feed</div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-red)] animate-pulse" />
                    <span className="text-[var(--accent-red)] text-xs font-mono">SCANNING</span>
                  </div>
                </div>
                <div className="space-y-0">
                  {BLOCKED_AGENTS.map((agent, i) => (
                    <BlockedAgentRow key={i} agent={agent} />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Bots Blocked Today" value={botsBlocked.toLocaleString()} color="red" />
                <StatCard label="Detection Rate" value="99.7%" subtext="Multi-layer analysis" color="green" />
              </div>
            </div>
          )}

          {/* Comparison View */}
          {activeSection === "compare" && (
            <div className="max-w-3xl mx-auto">
              <div className="border border-[var(--border)] bg-[var(--card-bg)] p-6 rounded-lg">
                <ComparisonTable />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-8">Platform Stats</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Verified Users" value={STATS.totalUsers.toLocaleString()} subtext="100% human" color="cyan" />
            <StatCard label="Posts Today" value={STATS.postsToday.toLocaleString()} subtext="Zero bot content" color="green" />
            <StatCard label="Bots Blocked" value={botsBlocked.toLocaleString()} subtext="And counting" color="red" />
            <StatCard label="Avg Earnings" value={`$${STATS.avgEarnings}`} subtext="Per post" color="cyan" />
          </div>
        </div>
      </section>

      {/* Tokenomics Brief */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-2">$SLOPSCAN Token</h2>
          <p className="text-[var(--muted)] text-center mb-10 text-sm">The fuel for human-only social.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="border border-[var(--border)] bg-[var(--card-bg)] p-5 rounded-lg text-center">
              <div className="text-[var(--accent-cyan)] text-2xl mb-2">&#x1F4B3;</div>
              <h3 className="font-bold text-sm mb-1">Pay to Post</h3>
              <p className="text-xs text-[var(--muted)]">$1 of $SLOPSCAN required per post. Anti-slop economic filter.</p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--card-bg)] p-5 rounded-lg text-center">
              <div className="text-[var(--accent-green)] text-2xl mb-2">&#x1F4C8;</div>
              <h3 className="font-bold text-sm mb-1">Earn From Engagement</h3>
              <p className="text-xs text-[var(--muted)]">Get rewarded when verified humans interact with your content.</p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--card-bg)] p-5 rounded-lg text-center">
              <div className="text-[var(--accent-purple)] text-2xl mb-2">&#x1F525;</div>
              <h3 className="font-bold text-sm mb-1">Deflationary</h3>
              <p className="text-xs text-[var(--muted)]">A portion of every post fee is burned. More usage = more scarcity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-xs font-bold text-black">
                S
              </div>
              <span className="font-bold text-sm">SlopScan</span>
              <span className="text-[var(--muted)] text-xs">· Humans only.</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
              <span>Network: <span className="text-[var(--foreground)]">Solana</span></span>
              <span>|</span>
              <span>Status: <span className="text-[var(--accent-green)]">Operational</span></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
