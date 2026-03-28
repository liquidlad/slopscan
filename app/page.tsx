export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] grid-bg flex items-center justify-center">
      <div className="scan-line" />
      <div className="text-center px-4">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src="/fingerprint.png" alt="SlopScan" className="w-14 h-14 rounded-xl" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="text-[var(--accent-cyan)]">Slop</span>
            <span className="text-[var(--foreground)]">Scan</span>
          </h1>
        </div>
        <p className="text-xl text-[var(--muted)] mb-4">Under maintenance</p>
        <p className="text-sm text-[var(--muted)] max-w-md mx-auto mb-6">
          We&apos;re making improvements. Check back soon.
        </p>
        <div className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg inline-block">
          <span className="text-xs text-[var(--muted)] font-mono">CA: </span>
          <span className="text-xs text-[var(--foreground)] font-mono select-all">G7EebyKn9As2Q7AdvHy57T9MxrGpdvTS9c2M1DCCpump</span>
        </div>
      </div>
    </div>
  );
}
