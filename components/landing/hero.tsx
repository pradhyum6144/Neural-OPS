"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Cpu, GitBranch, Activity, Zap } from "lucide-react";
import Link from "next/link";
import { GridPattern } from "@/components/ui/grid-pattern";

const MOCK_AGENTS = [
  { id: "AGT-001", name: "ResearchBot", status: "running", task: "Scraping arxiv.org...", color: "#22d3a5" },
  { id: "AGT-002", name: "SynthAgent", status: "running", task: "Summarising 14 papers...", color: "#6366f1" },
  { id: "AGT-003", name: "WriterAgent", status: "idle", task: "Awaiting context...", color: "#f59e0b" },
  { id: "AGT-004", name: "PublisherBot", status: "idle", task: "Queued", color: "#6b6b8a" },
];

const MOCK_LOGS = [
  "→ ResearchBot: fetched 47 results [t+0.8s]",
  "→ SynthAgent: tokenised 62k tokens [t+1.2s]",
  "→ SynthAgent: LLM call in progress... [t+1.4s]",
  "→ WriterAgent: context pending [t+1.4s]",
];

function AgentCard({ agent, delay }: { agent: typeof MOCK_AGENTS[0]; delay: number }) {
  const isRunning = agent.status === "running";
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-3 rounded-lg border border-[rgba(99,102,241,0.1)] bg-[rgba(99,102,241,0.04)] px-3 py-2.5"
    >
      <div className="relative flex-shrink-0">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: agent.color }}
        />
        {isRunning && (
          <div
            className="absolute inset-0 h-2 w-2 rounded-full animate-ping opacity-60"
            style={{ backgroundColor: agent.color }}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-nos-text truncate">{agent.name}</span>
          <span className="font-mono text-[10px] text-nos-text-muted flex-shrink-0">{agent.id}</span>
        </div>
        <p className="text-[10px] text-nos-text-muted truncate mt-0.5">{agent.task}</p>
      </div>
    </motion.div>
  );
}

function MockCommandCenter() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-4xl mx-auto"
    >
      {/* Glow behind the card */}
      <div className="absolute inset-0 rounded-2xl bg-nos-accent opacity-[0.06] blur-3xl scale-105" />

      {/* Main window frame */}
      <div className="relative rounded-2xl border border-[rgba(99,102,241,0.2)] bg-[rgba(10,10,15,0.9)] shadow-[0_0_60px_rgba(99,102,241,0.12)] overflow-hidden">

        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-[rgba(99,102,241,0.1)] px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#f43f5e]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#22d3a5]" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md bg-[rgba(99,102,241,0.08)] px-3 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-nos-green animate-pulse" />
            <span className="font-mono text-[11px] text-nos-text-muted">neural-ops — pipeline/research-synthesis</span>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-3 divide-x divide-[rgba(99,102,241,0.08)]" style={{ minHeight: 280 }}>

          {/* Left: agent list */}
          <div className="col-span-1 flex flex-col gap-2 p-4">
            <div className="nos-label mb-1">Active Agents</div>
            {MOCK_AGENTS.map((agent, i) => (
              <AgentCard key={agent.id} agent={agent} delay={0.7 + i * 0.1} />
            ))}
          </div>

          {/* Center: flow graph */}
          <div className="col-span-1 flex items-center justify-center p-4">
            <svg width="180" height="200" viewBox="0 0 180 200">
              {/* Edges */}
              <line x1="90" y1="32" x2="50" y2="90" stroke="rgba(99,102,241,0.3)" strokeWidth="1" strokeDasharray="4 3" />
              <line x1="90" y1="32" x2="130" y2="90" stroke="rgba(99,102,241,0.3)" strokeWidth="1" strokeDasharray="4 3" />
              <line x1="50" y1="108" x2="90" y2="158" stroke="rgba(99,102,241,0.25)" strokeWidth="1" strokeDasharray="4 3" />
              <line x1="130" y1="108" x2="90" y2="158" stroke="rgba(99,102,241,0.25)" strokeWidth="1" strokeDasharray="4 3" />

              {/* Nodes */}
              {/* Trigger */}
              <circle cx="90" cy="28" r="14" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.5)" strokeWidth="1" />
              <text x="90" y="32" textAnchor="middle" fill="#6366f1" fontSize="9" fontFamily="monospace">⚡ Start</text>

              {/* ResearchBot */}
              <rect x="26" y="84" width="48" height="24" rx="6" fill="rgba(34,211,165,0.1)" stroke="rgba(34,211,165,0.4)" strokeWidth="1" />
              <text x="50" y="100" textAnchor="middle" fill="#22d3a5" fontSize="8" fontFamily="monospace">Research</text>

              {/* SynthAgent */}
              <rect x="106" y="84" width="48" height="24" rx="6" fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.4)" strokeWidth="1" />
              <text x="130" y="100" textAnchor="middle" fill="#6366f1" fontSize="8" fontFamily="monospace">Synth</text>

              {/* WriterAgent */}
              <rect x="66" y="152" width="48" height="24" rx="6" fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.3)" strokeWidth="1" />
              <text x="90" y="168" textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="monospace">Writer</text>

              {/* Running indicator on Research */}
              <circle cx="68" cy="88" r="3" fill="#22d3a5">
                <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="148" cy="88" r="3" fill="#6366f1">
                <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" begin="0.3s" />
              </circle>
            </svg>
          </div>

          {/* Right: logs */}
          <div className="col-span-1 flex flex-col p-4">
            <div className="nos-label mb-2">Live Logs</div>
            <div className="flex-1 space-y-1.5 font-mono">
              {MOCK_LOGS.map((log, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.25 }}
                  className="text-[10px] text-nos-text-muted leading-relaxed"
                >
                  {log}
                </motion.p>
              ))}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-[10px] text-nos-accent font-mono"
              >
                ▍
              </motion.span>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-[rgba(99,102,241,0.08)] px-4 py-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] text-nos-text-muted">
              <Cpu size={10} className="text-nos-accent" /> 4 agents
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-nos-text-muted">
              <Activity size={10} className="text-nos-green" /> 2 running
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-nos-text-muted">
              <GitBranch size={10} className="text-nos-amber" /> 1 pipeline
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] text-nos-green">
            <Zap size={10} /> 47 events/s
          </span>
        </div>
      </div>

      {/* Reflection gradient at bottom */}
      <div className="absolute -bottom-px inset-x-0 h-24 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-16">
      <GridPattern fade className="opacity-40" />

      {/* Blobs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-nos-accent opacity-[0.05] blur-[140px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/3 h-[400px] w-[400px] rounded-full bg-[#22d3a5] opacity-[0.04] blur-[120px]" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 rounded-full border border-[rgba(99,102,241,0.3)] bg-[rgba(99,102,241,0.08)] px-4 py-1.5"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-nos-green animate-pulse" />
          <span className="text-xs font-medium text-nos-text-muted">
            Now in public beta — <span className="text-nos-accent">try it free</span>
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.1] tracking-tight"
        >
          The Visual Operating System{" "}
          <br className="hidden sm:block" />
          <span className="animated-gradient-text">for AI Agents</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-xl text-lg text-nos-text-muted leading-relaxed"
        >
          Watch your AI agents think, collaborate, and execute —{" "}
          <span className="text-nos-text">in real time.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <Link href="/signup" className="nos-btn-primary gap-2 px-6 py-3 text-sm font-semibold">
            Start building free
            <ArrowRight size={15} />
          </Link>
          <Link href="/dashboard" className="nos-btn-ghost nos-panel-2 gap-2 px-6 py-3 text-sm font-medium border border-[rgba(99,102,241,0.2)]">
            <Play size={13} className="fill-current" />
            View live demo
          </Link>
        </motion.div>

        {/* Social proof micro-line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-nos-text-muted"
        >
          No credit card required · Free tier forever · Deploy in &lt;2 minutes
        </motion.p>

        {/* Mock preview */}
        <div className="mt-8 w-full max-w-4xl">
          <MockCommandCenter />
        </div>
      </div>

      <style>{`
        .animated-gradient-text {
          background: linear-gradient(135deg, #e0e0ff 0%, #6366f1 40%, #22d3a5 80%, #6366f1 100%);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradientShift 6s ease infinite;
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </section>
  );
}
