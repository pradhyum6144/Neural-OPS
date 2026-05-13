"use client";

import { motion } from "framer-motion";
import { MessageSquare, Eye, TrendingUp } from "lucide-react";

// ── How it works ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Type or speak your request",
    description:
      "Write your question in plain English, Hindi, Tamil, Telugu, or any other Indian language. Or just hit the mic and talk — Neural OPS understands you.",
    color: "#6366f1",
  },
  {
    number: "02",
    icon: Eye,
    title: "Watch your AI team work",
    description:
      "Five specialists — a planner, researcher, analyst, writer, and voice narrator — spring into action at once. You can watch each one live as they work.",
    color: "#22d3a5",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Get results and save money",
    description:
      "Receive a full report, spoken summary, and exportable document. Our Smart Router automatically picks the cheapest AI model for each task.",
    color: "#a78bfa",
  },
];

// ── India Stack ───────────────────────────────────────────────────────────────

const INDIA_COMPANIES = [
  "AEOS", "Agrani", "aqqrue", "Composio", "DASHVERSE",
  "Deccan AI", "Emergent", "Gnani.ai", "HOLY DR/P", "Neysa",
  "pre6", "sarvam.ai", "Scaled Focus", "SimpliSmart", "smallest.ai",
];

function MarqueeTrack() {
  const doubled = [...INDIA_COMPANIES, ...INDIA_COMPANIES];

  return (
    <div className="relative overflow-hidden py-3">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />

      <div className="marquee-track flex gap-4">
        {doubled.map((name, i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-full border border-[rgba(99,102,241,0.18)] bg-[rgba(99,102,241,0.06)]
                       px-5 py-2 text-sm font-semibold text-[#9090c0] hover:text-[#e0e0ff]
                       hover:border-[rgba(99,102,241,0.4)] hover:bg-[rgba(99,102,241,0.12)]
                       cursor-default transition-all duration-150 whitespace-nowrap"
          >
            {name}
          </div>
        ))}
      </div>

      <style>{`
        .marquee-track {
          animation: marqueeScroll 28s linear infinite;
          width: max-content;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ── Smart Router Teaser ───────────────────────────────────────────────────────

function SmartRouterCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-3xl rounded-2xl border border-[rgba(99,102,241,0.2)] bg-[rgba(10,10,20,0.7)] p-8"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">

        {/* Flow diagram */}
        <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap flex-shrink-0">
          {/* Input */}
          <div className="rounded-xl border border-[rgba(99,102,241,0.25)] bg-[rgba(99,102,241,0.08)] px-3 py-2 text-xs font-mono text-[#9090c0] whitespace-nowrap">
            Summarize this in Hindi
          </div>

          <span className="text-[#3a3a5a] text-lg">→</span>

          {/* Router */}
          <div className="rounded-xl border border-[rgba(167,139,250,0.35)] bg-[rgba(167,139,250,0.08)] px-3 py-2 text-xs font-semibold text-[#a78bfa] whitespace-nowrap">
            Smart Router
          </div>

          <span className="text-[#3a3a5a] text-lg">→</span>

          {/* Model */}
          <div className="rounded-xl border border-[rgba(34,211,165,0.3)] bg-[rgba(34,211,165,0.08)] px-3 py-2 text-xs font-semibold text-[#22d3a5] whitespace-nowrap">
            sarvam.ai 30B
          </div>
        </div>

        {/* Savings */}
        <div className="flex flex-col gap-1 lg:border-l lg:border-[rgba(99,102,241,0.1)] lg:pl-6">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#22d3a5]">₹0.08</span>
            <span className="text-sm text-[#5050a0]">per task</span>
          </div>
          <div className="text-xs text-[#5050a0]">
            <span className="text-[#f59e0b]">₹1.84 saved</span> vs using GPT-4 directly
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function SocialProof() {
  return (
    <>
      {/* How it works */}
      <section id="how-it-works" className="relative py-28 px-6">
        <div className="mx-auto max-w-7xl">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14 text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.06)] px-4 py-1.5 mb-5">
              <span className="text-xs font-semibold text-[#6366f1] uppercase tracking-wider">How it works</span>
            </div>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-tight text-[#e0e0ff]">
              Three steps. Zero complexity.
            </h2>
            <p className="mt-4 max-w-lg mx-auto text-[#7070a0]">
              No setup, no training, no accounts to manage. Just tell it what you need.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="relative rounded-2xl border border-[rgba(99,102,241,0.12)] bg-[rgba(10,10,20,0.6)] p-7"
                >
                  <div className="flex flex-col gap-4">
                    {/* Step number + icon */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-5xl font-bold tabular-nums"
                        style={{ color: `${step.color}25` }}
                      >
                        {step.number}
                      </span>
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: `${step.color}18`, border: `1px solid ${step.color}30` }}
                      >
                        <Icon size={18} style={{ color: step.color }} />
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-[#e0e0ff] mb-2">{step.title}</h3>
                      <p className="text-sm text-[#7070a0] leading-relaxed">{step.description}</p>
                    </div>
                  </div>

                  {/* Connector line between cards (desktop only) */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 border-t border-dashed border-[rgba(99,102,241,0.2)] z-10" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* India Stack */}
      <section id="marketplace" className="relative py-20 px-6 overflow-hidden">
        <div className="mx-auto max-w-7xl">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.06)] px-4 py-1.5 mb-5">
              <span className="text-xs font-semibold text-[#6366f1] uppercase tracking-wider">India stack</span>
            </div>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-tight text-[#e0e0ff]">
              Built on India&apos;s best AI companies
            </h2>
            <p className="mt-4 max-w-lg mx-auto text-[#7070a0]">
              Neural OPS connects India&apos;s entire AI ecosystem in one platform
            </p>
          </motion.div>

          <MarqueeTrack />
        </div>
      </section>

      {/* Smart Router */}
      <section className="relative py-20 px-6">
        <div className="mx-auto max-w-7xl">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.06)] px-4 py-1.5 mb-5">
              <span className="text-xs font-semibold text-[#6366f1] uppercase tracking-wider">Smart router</span>
            </div>
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-tight text-[#e0e0ff]">
              Neural OPS picks the right AI for every task
            </h2>
            <p className="mt-4 max-w-lg mx-auto text-[#7070a0]">
              You never think about which AI to use. We handle it — and save you money every time.
            </p>
          </motion.div>

          <SmartRouterCard />
        </div>
      </section>
    </>
  );
}
