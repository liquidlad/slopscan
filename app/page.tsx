"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================
// VERIFICATION DEMO
// ============================================================
type VerifyStep = "connect" | "scanning" | "audit-result" | "challenge" | "verified" | "rejected";

interface AuditSignal {
  label: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

const AUDIT_SIGNALS: AuditSignal[] = [
  { label: "Account Age", status: "pass", detail: "Created 4 years ago" },
  { label: "Post Frequency", status: "pass", detail: "Natural irregular patterns" },
  { label: "Content Variation", status: "pass", detail: "High originality across posts" },
  { label: "Engagement Pattern", status: "warn", detail: "Slightly repetitive reply timing" },
  { label: "Follower Quality", status: "pass", detail: "82% real followers detected" },
  { label: "Media Uploads", status: "pass", detail: "Original photos found" },
  { label: "Reply Context", status: "pass", detail: "Contextually relevant replies" },
  { label: "Posting Schedule", status: "warn", detail: "Some automated-window activity" },
];

const AGENT_SIGNALS: AuditSignal[] = [
  { label: "Account Age", status: "fail", detail: "Created 12 days ago" },
  { label: "Post Frequency", status: "fail", detail: "Posts every 3.2 min (clockwork)" },
  { label: "Content Variation", status: "fail", detail: "Template-based content detected" },
  { label: "Engagement Pattern", status: "fail", detail: "Identical reply structures" },
  { label: "Follower Quality", status: "warn", detail: "68% bot followers detected" },
  { label: "Media Uploads", status: "fail", detail: "No original media" },
  { label: "Reply Context", status: "fail", detail: "Generic/off-topic replies" },
  { label: "Posting Schedule", status: "fail", detail: "24/7 activity, no sleep pattern" },
];

// ============================================================
// COMPONENTS
// ============================================================
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
    <div className={`flex items-center gap-3 py-2.5 px-3 border-b ${borderColor} text-sm font-mono animate-[fadeIn_0.3s_ease-out]`}>
      <span className={`${color} w-5 text-center font-bold`}>{icon}</span>
      <span className="text-[var(--foreground)] flex-1">{signal.label}</span>
      <span className="text-[var(--muted)] text-xs text-right">{signal.detail}</span>
    </div>
  );
}

function VerificationDemo() {
  const [step, setStep] = useState<VerifyStep>("connect");
  const [scanProgress, setScanProgress] = useState(0);
  const [demoMode, setDemoMode] = useState<"human" | "agent">("human");
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [showSignals, setShowSignals] = useState(false);

  const signals = demoMode === "human" ? AUDIT_SIGNALS : AGENT_SIGNALS;
  const passCount = signals.filter((s) => s.status === "pass").length;
  const failCount = signals.filter((s) => s.status === "fail").length;
  const score = Math.round((passCount / signals.length) * 100);

  const startScan = useCallback(() => {
    setStep("scanning");
    setScanProgress(0);
    setShowSignals(false);

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
  }, []);

  const handleContinue = () => {
    if (demoMode === "human") {
      // Human with some warnings goes to challenge
      setStep("challenge");
    } else {
      // Agent gets rejected
      setStep("rejected");
    }
  };

  const handleChallengeSubmit = () => {
    if (challengeAnswer.toLowerCase().trim()) {
      setStep("verified");
    }
  };

  const reset = () => {
    setStep("connect");
    setScanProgress(0);
    setShowSignals(false);
    setChallengeAnswer("");
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Demo mode toggle */}
      <div className="flex justify-center gap-2 mb-6">
        <button
          onClick={() => { setDemoMode("human"); reset(); }}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
            demoMode === "human"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-[var(--accent-green)]"
              : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Simulate Human
        </button>
        <button
          onClick={() => { setDemoMode("agent"); reset(); }}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
            demoMode === "agent"
              ? "bg-red-500/10 border border-red-500/30 text-[var(--accent-red)]"
              : "border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Simulate Agent
        </button>
      </div>

      <div className="border border-[var(--border)] bg-[var(--card-bg)] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[#080d18]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center text-xs font-bold text-black">
              S
            </div>
            <span className="font-bold text-sm">SlopScan Verification</span>
          </div>
          <div className="flex items-center gap-2">
            {step === "scanning" && (
              <>
                <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
                <span className="text-[var(--accent-cyan)] text-xs font-mono">SCANNING</span>
              </>
            )}
            {step === "verified" && (
              <>
                <span className="w-2 h-2 rounded-full bg-[var(--accent-green)]" />
                <span className="text-[var(--accent-green)] text-xs font-mono">VERIFIED</span>
              </>
            )}
            {step === "rejected" && (
              <>
                <span className="w-2 h-2 rounded-full bg-[var(--accent-red)]" />
                <span className="text-[var(--accent-red)] text-xs font-mono">REJECTED</span>
              </>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Connect X */}
          {step === "connect" && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#080d18] border border-[var(--border)] flex items-center justify-center text-2xl">
                &#x1D54F;
              </div>
              <h3 className="font-bold text-lg mb-2">Connect Your X Account</h3>
              <p className="text-sm text-[var(--muted)] mb-6 max-w-md mx-auto">
                SlopScan analyzes your X account history and behavior to verify you&apos;re human. No data is stored — we only scan.
              </p>
              <button
                onClick={startScan}
                className="px-6 py-3 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                Connect X & Start Scan
              </button>
            </div>
          )}

          {/* Step 2: Scanning */}
          {step === "scanning" && (
            <div>
              <div className="text-center mb-6">
                <h3 className="font-bold text-lg mb-1">Analyzing Account</h3>
                <p className="text-sm text-[var(--muted)]">Scanning post history, engagement patterns, and behavioral signals...</p>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs font-mono text-[var(--muted)] mb-2">
                  <span>Scanning signals...</span>
                  <span>{Math.round(scanProgress)}%</span>
                </div>
                <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] transition-all duration-300 rounded-full"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>

              {/* Signals appearing */}
              <div className="space-y-0">
                {signals.map((signal, i) => (
                  <SignalRow key={signal.label} signal={signal} delay={(i + 1) * 250} />
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Audit Result */}
          {step === "audit-result" && (
            <div>
              <div className="text-center mb-6">
                <div className={`text-5xl font-bold font-mono mb-2 ${
                  score >= 80 ? "text-[var(--accent-green)] glow-green" : score >= 50 ? "text-[var(--accent-yellow)]" : "text-[var(--accent-red)] glow-red"
                }`}>
                  {score}%
                </div>
                <div className="text-sm text-[var(--muted)]">
                  {demoMode === "human"
                    ? "Human confidence score — additional verification recommended"
                    : "High probability of automated account"
                  }
                </div>
              </div>

              {/* Signal summary */}
              {showSignals && (
                <div className="space-y-0 mb-6">
                  {signals.map((signal, i) => (
                    <SignalRow key={signal.label} signal={signal} delay={0} />
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center text-xs font-mono text-[var(--muted)] mb-4">
                <span>{passCount} passed · {failCount} failed · {signals.length - passCount - failCount} warnings</span>
              </div>

              <button
                onClick={handleContinue}
                className={`w-full py-3 font-bold rounded-lg transition-opacity ${
                  demoMode === "human"
                    ? "bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black hover:opacity-90"
                    : "bg-gradient-to-r from-[var(--accent-red)] to-red-700 text-white hover:opacity-90"
                }`}
              >
                {demoMode === "human" ? "Continue to Verification Challenge" : "View Rejection"}
              </button>
            </div>
          )}

          {/* Step 4: Challenge (humans with warnings) */}
          {step === "challenge" && (
            <div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl">
                  &#x1F50D;
                </div>
                <h3 className="font-bold text-lg mb-1">Quick Verification</h3>
                <p className="text-sm text-[var(--muted)]">
                  Your account looks mostly human, but we flagged a couple signals. Complete this quick check to confirm.
                </p>
              </div>

              {/* Challenge: contextual image question */}
              <div className="border border-[var(--border)] rounded-lg p-4 mb-4 bg-[#080d18]">
                <div className="text-xs text-[var(--muted)] uppercase tracking-wider mb-3 font-mono">Challenge 1 of 1</div>
                <p className="text-sm mb-4">
                  What emotion would most people feel if they found $20 in an old jacket pocket?
                </p>
                <input
                  type="text"
                  value={challengeAnswer}
                  onChange={(e) => setChallengeAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleChallengeSubmit()}
                />
              </div>

              <p className="text-xs text-[var(--muted)] mb-4 text-center">
                These questions test contextual human understanding — not knowledge that can be looked up.
              </p>

              <button
                onClick={handleChallengeSubmit}
                disabled={!challengeAnswer.trim()}
                className="w-full py-3 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          )}

          {/* Step 5: Verified */}
          {step === "verified" && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border-2 border-[var(--accent-green)] flex items-center justify-center text-3xl text-[var(--accent-green)]">
                &#x2713;
              </div>
              <h3 className="font-bold text-xl mb-2 text-[var(--accent-green)] glow-green">Human Verified</h3>
              <p className="text-sm text-[var(--muted)] mb-6 max-w-md mx-auto">
                You&apos;re confirmed human. You can now post, engage, and earn on SlopScan. Your verification badge is permanent unless flagged by ongoing monitoring.
              </p>
              <button
                onClick={reset}
                className="px-6 py-2 border border-[var(--border)] text-[var(--muted)] rounded-lg hover:text-[var(--foreground)] hover:border-[#334155] transition-colors text-sm"
              >
                Run Demo Again
              </button>
            </div>
          )}

          {/* Step 6: Rejected */}
          {step === "rejected" && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border-2 border-[var(--accent-red)] flex items-center justify-center text-3xl text-[var(--accent-red)]">
                &#x2718;
              </div>
              <h3 className="font-bold text-xl mb-2 text-[var(--accent-red)] glow-red">Access Denied</h3>
              <p className="text-sm text-[var(--muted)] mb-2 max-w-md mx-auto">
                This account has been flagged as an automated agent. Multiple signals indicate non-human behavior patterns.
              </p>
              <p className="text-xs text-[var(--muted)] mb-6">
                If you believe this is an error, you can appeal through our review process.
              </p>
              <button
                onClick={reset}
                className="px-6 py-2 border border-[var(--border)] text-[var(--muted)] rounded-lg hover:text-[var(--foreground)] hover:border-[#334155] transition-colors text-sm"
              >
                Run Demo Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--muted)] font-mono">Initializing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] grid-bg">
      {/* Scan line effect */}
      <div className="scan-line" />

      {/* Hero Section */}
      <header className="relative overflow-hidden border-b border-[var(--border)]">
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
              Pay-to-post killed casual spam. We kill the rest. No bots. No agents. No slop.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="#how-it-works"
                className="px-8 py-3 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black font-bold rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
              >
                See How It Works
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
          </div>
        </div>
      </header>

      {/* The Problem */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-2">$1 to Post Isn&apos;t Enough</h2>
          <p className="text-[var(--muted)] text-center mb-10 text-sm max-w-2xl mx-auto">
            Pay-to-post platforms charge a fee to filter spam. But bots and AI agents can pay $1 too. The fee filters broke humans, not bots. SlopScan takes a different approach.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-6">
              <h3 className="text-[var(--accent-red)] font-bold text-lg mb-4 flex items-center gap-2">
                <span>&#x2718;</span> Fee-Only Filtering
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-red)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--muted)]">Bots pay $1 and post freely alongside humans</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-red)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--muted)]">AI agents farm engagement rewards meant for real users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-red)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--muted)]">No way to tell if a post is human or GPT-generated</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-red)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--muted)]">Feed quality degrades as agents scale up</span>
                </li>
              </ul>
            </div>

            <div className="border border-green-500/20 bg-green-500/5 rounded-lg p-6">
              <h3 className="text-[var(--accent-green)] font-bold text-lg mb-4 flex items-center gap-2">
                <span>&#x2714;</span> SlopScan
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-green)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--foreground)]">Verify human before you can post — fee is secondary</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-green)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--foreground)]">Rewards only go to verified humans</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-green)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--foreground)]">Every account is audited — transparent human scores</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-green)] mt-0.5">&#x25CF;</span>
                  <span className="text-[var(--foreground)]">Ongoing monitoring catches agents that evolve</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — The Framework */}
      <section id="how-it-works" className="border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-2">How We Block Agents</h2>
          <p className="text-[var(--muted)] text-center mb-10 text-sm">Three layers. Zero agents.</p>

          {/* Layer 1 */}
          <div className="mb-8 border border-[var(--border)] bg-[var(--card-bg)] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold font-mono text-[var(--accent-cyan)]">
                1
              </div>
              <div>
                <h3 className="font-bold text-[var(--accent-cyan)]">X Account Audit</h3>
                <p className="text-xs text-[var(--muted)]">Automatic — happens when you connect</p>
              </div>
            </div>
            <p className="text-sm text-[var(--muted)] mb-4">
              Connect your X account and SlopScan instantly analyzes your history across 8 behavioral signals. Most real humans pass automatically. Most agents fail instantly.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["Account Age", "Post Frequency", "Content Variation", "Engagement Patterns", "Follower Quality", "Media Uploads", "Reply Context", "Posting Schedule"].map((signal) => (
                <div key={signal} className="px-3 py-2 bg-[#080d18] rounded border border-[var(--border)] text-xs font-mono text-[var(--muted)] text-center">
                  {signal}
                </div>
              ))}
            </div>
          </div>

          {/* Layer 2 */}
          <div className="mb-8 border border-[var(--border)] bg-[var(--card-bg)] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center font-bold font-mono text-[var(--accent-yellow)]">
                2
              </div>
              <div>
                <h3 className="font-bold text-[var(--accent-yellow)]">Interactive Verification</h3>
                <p className="text-xs text-[var(--muted)]">Only if the audit is uncertain — most humans skip this</p>
              </div>
            </div>
            <p className="text-sm text-[var(--muted)] mb-4">
              If your X audit flags some signals but isn&apos;t conclusive, you get a quick interactive challenge. These are designed to be trivial for humans but difficult for AI agents — contextual reasoning, emotional understanding, and real-time behavioral analysis.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="px-4 py-3 bg-[#080d18] rounded border border-[var(--border)]">
                <div className="text-sm font-bold mb-1">Contextual Questions</div>
                <div className="text-xs text-[var(--muted)]">Questions requiring real-world human experience and intuition</div>
              </div>
              <div className="px-4 py-3 bg-[#080d18] rounded border border-[var(--border)]">
                <div className="text-sm font-bold mb-1">Behavioral Timing</div>
                <div className="text-xs text-[var(--muted)]">Response patterns analyzed for human-like interaction speed</div>
              </div>
              <div className="px-4 py-3 bg-[#080d18] rounded border border-[var(--border)]">
                <div className="text-sm font-bold mb-1">Pattern Recognition</div>
                <div className="text-xs text-[var(--muted)]">Visual and logical challenges that exploit agent blind spots</div>
              </div>
            </div>
          </div>

          {/* Layer 3 */}
          <div className="border border-[var(--border)] bg-[var(--card-bg)] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center font-bold font-mono text-[var(--accent-green)]">
                3
              </div>
              <div>
                <h3 className="font-bold text-[var(--accent-green)]">Ongoing Monitoring</h3>
                <p className="text-xs text-[var(--muted)]">Continuous — runs in the background after verification</p>
              </div>
            </div>
            <p className="text-sm text-[var(--muted)] mb-4">
              Verification isn&apos;t a one-time gate. SlopScan continuously monitors posting behavior on the platform. If an account that passed starts exhibiting agent-like patterns — clockwork posting, template content, suspicious engagement farming — it gets flagged for re-verification.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="px-4 py-3 bg-[#080d18] rounded border border-[var(--border)]">
                <div className="text-sm font-bold mb-1">Post Pattern Analysis</div>
                <div className="text-xs text-[var(--muted)]">Detects templated, repetitive, or suspiciously timed content</div>
              </div>
              <div className="px-4 py-3 bg-[#080d18] rounded border border-[var(--border)]">
                <div className="text-sm font-bold mb-1">Engagement Authenticity</div>
                <div className="text-xs text-[var(--muted)]">Flags coordinated or inauthentic engagement rings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-2">Try the Verification</h2>
          <p className="text-[var(--muted)] text-center mb-8 text-sm">
            See how the audit works. Toggle between a human account and an agent account.
          </p>
          <VerificationDemo />
        </div>
      </section>

      {/* How It Flows */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-2">Once You&apos;re Verified</h2>
          <p className="text-[var(--muted)] text-center mb-10 text-sm">The platform works like you&apos;d expect — minus the bots.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-[var(--border)] bg-[var(--card-bg)] p-6 rounded-lg text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl">
                &#x270D;
              </div>
              <h3 className="font-bold mb-2 text-[var(--accent-cyan)]">Post for $1</h3>
              <p className="text-sm text-[var(--muted)]">
                Buy $1 of $SLOPSCAN to post. The fee adds an economic layer on top of human verification — double filtering.
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--card-bg)] p-6 rounded-lg text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-2xl">
                &#x1F91D;
              </div>
              <h3 className="font-bold mb-2 text-[var(--accent-green)]">Engage With Humans</h3>
              <p className="text-sm text-[var(--muted)]">
                Every account in your feed is verified human. Likes, replies, and shares are all real.
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--card-bg)] p-6 rounded-lg text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-2xl">
                &#x1F4B0;
              </div>
              <h3 className="font-bold mb-2 text-[var(--accent-yellow)]">Earn Real Rewards</h3>
              <p className="text-sm text-[var(--muted)]">
                When verified humans engage with your posts, you earn $SLOPSCAN. No bots diluting your earnings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Token Section */}
      <section className="border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-2">$SLOPSCAN</h2>
          <p className="text-[var(--muted)] text-center mb-10 text-sm">The token that powers human-only social.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="border border-[var(--border)] bg-[var(--card-bg)] p-5 rounded-lg text-center">
              <div className="text-[var(--accent-cyan)] text-2xl mb-2">&#x1F4B3;</div>
              <h3 className="font-bold text-sm mb-1">Post Fee</h3>
              <p className="text-xs text-[var(--muted)]">$1 of $SLOPSCAN per post</p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--card-bg)] p-5 rounded-lg text-center">
              <div className="text-[var(--accent-green)] text-2xl mb-2">&#x1F4C8;</div>
              <h3 className="font-bold text-sm mb-1">Engagement Rewards</h3>
              <p className="text-xs text-[var(--muted)]">Earn when humans interact</p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--card-bg)] p-5 rounded-lg text-center">
              <div className="text-[var(--accent-purple)] text-2xl mb-2">&#x1F525;</div>
              <h3 className="font-bold text-sm mb-1">Deflationary</h3>
              <p className="text-xs text-[var(--muted)]">Post fees partially burned</p>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <a
              href="https://pump.fun/?q=slopscan&tab=created_timestamp"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-black font-bold rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
            >
              Buy $SLOPSCAN
            </a>
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
              <span>Built for humans, by humans.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
