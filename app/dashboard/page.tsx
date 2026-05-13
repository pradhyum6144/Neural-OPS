import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6366f1] text-white text-2xl font-bold mx-auto mb-6 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
          ⬡
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-[#6b6b8a] text-sm mb-8">You&apos;re in. The command center is coming soon.</p>
        <Link
          href="/"
          className="text-sm text-[#6366f1] hover:text-indigo-400 transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
