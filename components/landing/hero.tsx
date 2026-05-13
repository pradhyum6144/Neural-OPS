"use client";

import { motion, useInView } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GridPattern } from "@/components/ui/grid-pattern";

// ── Typing animation ──────────────────────────────────────────────────────────

const COMMANDS = [
  "Research top competitors for my D2C brand",
  "Summarize today's stock market in Hindi",
  "Write 30 days of Instagram captions for my café",
  "Find suppliers for my manufacturing unit",
];

function TypingDemo() {
  const [cmdIndex, setCmdIndex]     = useState(0);
  const [displayed, setDisplayed]   = useState("");
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    const full = COMMANDS[cmdIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && displayed.length < full.length) {
      timeout = setTimeout(() => setDisplayed(full.slice(0, displayed.length + 1)), 42);
    } else if (!deleting && displayed.length === full.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 22);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setCmdIndex((i) => (i + 1) % COMMANDS.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, deleting, cmdIndex]);

  return (
    <div className="rounded-xl border border-[rgba(99,102,241,0.25)] bg-[rgba(10,10,20,0.9)] px-4 py-3.5 flex items-center gap-3">
      <span className="text-[#6366f1] font-mono text-sm flex-shrink-0">❯</span>
      <span className="font-mono text-sm text-[#e0e0ff] flex-1 min-h-[20px]">
        {displayed}
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
          className="inline-block w-[2px] h-[14px] bg-[#6366f1] ml-0.5 align-middle"
        />
      </span>
    </div>
  );
}

// ── Count-up stat ─────────────────────────────────────────────────────────────

function StatNumber({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const ref                     = useRef<HTMLSpanElement>(null);
  const inView                  = useInView(ref, { once: true });
  const [count, setCount]       = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const steps = 60;
    const increment = target / steps;
    const id = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(id); }
      else setCount(Math.floor(start));
    }, 20);
    return () => clearInterval(id);
  }, [inView, target]);

  return (
    <span ref={ref} className="font-bold text-2xl text-[#e0e0ff]">
      {prefix}{count.toLocaleString("en-IN")}{suffix}
    </span>
  );
}

// ── Dashboard preview window ──────────────────────────────────────────────────

const AGENTS = [
  { name: "Planner",  status: "done",    color: "#22d3a5" },
  { name: "Research", status: "active",  color: "#6366f1" },
  { name: "Browser",  status: "active",  color: "#a78bfa" },
  { name: "Finance",  status: "waiting", color: "#f59e0b" },
  { name: "Summary",  status: "waiting", color: "#6b6b8a" },
];

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.55, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-3xl mx-auto mt-10"
    >
      {/* Glow */}
      <div className="absolute inset-0 rounded-2xl bg-[#6366f1] opacity-[0.07] blur-3xl scale-105 pointer-events-none" />

      <div className="relative rounded-2xl border border-[rgba(99,102,241,0.2)] bg-[rgba(10,10,18,0.95)] shadow-[0_0_60px_rgba(99,102,241,0.12)] overflow-hidden">

        {/* Title bar */}
        <div className="flex items-center gap-3 border-b border-[rgba(99,102,241,0.1)] px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#f43f5e]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#22d3a5]" />
          </div>
          <div className="flex-1 flex items-center gap-2 rounded-md bg-[rgba(99,102,241,0.08)] px-3 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-[#22d3a5] animate-pulse" />
            <span className="font-mono text-[11px] text-[#6060a0]">neural-ops — your AI team is working</span>
          </div>
        </div>

        {/* Command input preview */}
        <div className="px-4 pt-3 pb-2">
          <TypingDemo />
        </div>

        {/* Agent cards */}
        <div className="px-4 pb-4 grid grid-cols-5 gap-2 mt-2">
          {AGENTS.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.08 }}
              className="rounded-xl border bg-[rgba(10,10,20,0.8)] p-2.5 flex flex-col gap-1.5"
              style={{ borderColor: `${agent.color}30` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#c0c0e0]">{agent.name}</span>
                <span
                  className="relative h-1.5 w-1.5 rounded-full flex-shrink-0"
                  style={{ background: agent.color }}
                >
                  {agent.status === "active" && (
                    <span
                      className="absolute inset-0 rounded-full animate-ping opacity-70"
                      style={{ background: agent.color }}
                    />
                  )}
                </span>
              </div>
              <span
                className="text-[9px] font-mono uppercase tracking-wide"
                style={{ color: agent.color }}
              >
                {agent.status === "active" ? "running" : agent.status}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Live log ticker */}
        <div className="border-t border-[rgba(99,102,241,0.08)] px-4 py-2.5 flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#22d3a5]">✓</span>
          <motion.span
            key="log"
            animate={{ opacity: [0, 1] }}
            transition={{ duration: 0.3 }}
            className="font-mono text-[10px] text-[#5050a0]"
          >
            Research agent: found 14 sources · Finance agent: fetching market data…
          </motion.span>
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="font-mono text-[10px] text-[#6366f1]"
          >
            ▍
          </motion.span>
        </div>
      </div>

      {/* Fade out bottom */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none rounded-b-2xl" />
    </motion.div>
  );
}

// ── Video modal ───────────────────────────────────────────────────────────────

function VideoModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-2xl border border-[rgba(99,102,241,0.25)] bg-[rgba(12,12,22,0.98)] p-6 flex flex-col items-center gap-4"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6060a0] hover:text-[#e0e0ff] transition-colors text-xl font-bold"
        >
          ✕
        </button>
        <div className="w-full aspect-video rounded-xl bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.15)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-[#4a4a6a]">
            <Play size={40} className="text-[#6366f1] opacity-60" />
            <span className="font-mono text-sm">Demo video coming soon</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Hero ─────────────────────────────────────────────────────────────────

export function Hero() {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-20 pb-12">
      <GridPattern fade className="opacity-30" />

      {/* Ambient blobs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6366f1] opacity-[0.05] blur-[160px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/3 h-[400px] w-[400px] rounded-full bg-[#22d3a5] opacity-[0.04] blur-[120px]" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center max-w-4xl mx-auto">

        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 rounded-full border border-[rgba(99,102,241,0.3)] bg-[rgba(99,102,241,0.08)] px-4 py-1.5"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-[#22d3a5] animate-pulse" />
          <span className="text-xs font-medium text-[#8080b0]">
            Now in public beta — <span className="text-[#6366f1]">try it free today</span>
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(2.4rem,6vw,4.2rem)] font-bold leading-[1.1] tracking-tight"
        >
          Your AI team.{" "}
          <span className="hero-gradient-text">Working 24/7.</span>
          <br />
          No coding needed.
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-2xl text-lg text-[#8080b0] leading-relaxed"
        >
          Tell Neural OPS what you need in plain English — or just speak it.
          Watch 5 AI specialists research, analyze, and deliver results
          while you focus on what matters.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-3 mt-1"
        >
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-lg bg-[#6366f1] hover:bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-150"
          >
            Start for free
            <ArrowRight size={15} />
          </Link>
          <button
            onClick={() => setVideoOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-[rgba(99,102,241,0.25)] bg-[rgba(99,102,241,0.06)] px-6 py-3 text-sm font-medium text-[#c0c0e0] hover:border-[rgba(99,102,241,0.4)] hover:bg-[rgba(99,102,241,0.12)] transition-all duration-150"
          >
            <Play size={13} className="fill-current text-[#6366f1]" />
            Watch 2 min demo
          </button>
        </motion.div>

        {/* Social proof numbers */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 mt-2"
        >
          {[
            { target: 12400, suffix: "+ tasks run",        label: "and counting" },
            { target: 42,    prefix: "₹",  suffix: "L saved", label: "in AI costs" },
            { target: 9,     suffix: " Indian languages",  label: "supported" },
          ].map(({ target, prefix, suffix, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <StatNumber target={target} prefix={prefix} suffix={suffix} />
              <span className="text-xs text-[#5050a0]">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Dashboard preview */}
        <DashboardPreview />
      </div>

      {/* Video modal */}
      {videoOpen && <VideoModal onClose={() => setVideoOpen(false)} />}

      <style>{`
        .hero-gradient-text {
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
