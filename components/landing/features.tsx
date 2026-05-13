"use client";

import { motion } from "framer-motion";
import {
  Brain,
  GitBranch,
  Monitor,
  Mic,
  Activity,
  Database,
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "Multi-Agent Orchestration",
    description:
      "Coordinate dozens of specialized AI agents in parallel. Define roles, set permissions, and watch them collaborate on complex tasks autonomously.",
    accent: "#6366f1",
    tag: "Core",
  },
  {
    icon: GitBranch,
    title: "Live Workflow Graph",
    description:
      "A real-time visual canvas showing every node, edge, and message in your pipeline. Drag to reroute, click to inspect, pause any branch.",
    accent: "#22d3a5",
    tag: "Visual",
  },
  {
    icon: Monitor,
    title: "Browser Agent Replay",
    description:
      "Replay every browser action your agent took, step by step. Full DOM snapshots, network traces, and click heatmaps included.",
    accent: "#a78bfa",
    tag: "Debug",
  },
  {
    icon: Mic,
    title: "Voice AI Integration",
    description:
      "Drop in a voice node and your pipeline gains real-time STT/TTS. Stream audio to any agent, trigger flows from spoken commands.",
    accent: "#f59e0b",
    tag: "Multimodal",
  },
  {
    icon: Activity,
    title: "Infra Heatmap",
    description:
      "Live token spend, latency percentiles, and error rates visualized per-agent. Identify bottlenecks before they become incidents.",
    accent: "#f43f5e",
    tag: "Observability",
  },
  {
    icon: Database,
    title: "Memory Nodes",
    description:
      "Persistent, queryable memory layers — vector, key-value, and graph — available to every agent. Context that survives session boundaries.",
    accent: "#34d399",
    tag: "State",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[0];
  index: number;
}) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group relative rounded-xl border border-[rgba(99,102,241,0.12)] bg-[rgba(99,102,241,0.04)] p-6 cursor-default
                 hover:border-[rgba(99,102,241,0.3)] hover:bg-[rgba(99,102,241,0.08)]
                 transition-all duration-200"
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${feature.accent}0a 0%, transparent 60%)`,
        }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{
            background: `${feature.accent}18`,
            border: `1px solid ${feature.accent}30`,
          }}
        >
          <Icon size={18} style={{ color: feature.accent }} />
        </div>
        <span
          className="text-[10px] font-medium rounded-full px-2 py-0.5 uppercase tracking-wider"
          style={{
            background: `${feature.accent}12`,
            color: feature.accent,
            border: `0.5px solid ${feature.accent}30`,
          }}
        >
          {feature.tag}
        </span>
      </div>

      <h3 className="mb-2 font-semibold text-nos-text leading-snug">
        {feature.title}
      </h3>
      <p className="text-sm text-nos-text-muted leading-relaxed">
        {feature.description}
      </p>

      {/* Arrow hint */}
      <div className="mt-4 flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
           style={{ color: feature.accent }}>
        <span>Learn more</span>
        <span className="translate-x-0 group-hover:translate-x-1 transition-transform duration-200">→</span>
      </div>
    </motion.div>
  );
}

export function Features() {
  return (
    <section className="relative py-32 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <div className="nos-label mb-4">Platform Features</div>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight text-nos-text">
            Everything you need to ship
            <br />
            <span className="text-nos-accent">production-grade agent systems</span>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-nos-text-muted">
            From local prototyping to globally distributed fleets. Neural OPS
            scales with your ambition.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
