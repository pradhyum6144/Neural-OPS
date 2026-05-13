"use client";

import { motion } from "framer-motion";

const PROFESSIONS = [
  {
    emoji: "🛍️",
    title: "D2C Founders",
    description: "Research competitors, write product listings, track trends",
    accent: "#6366f1",
  },
  {
    emoji: "📈",
    title: "Stock Traders",
    description: "Morning market briefs, earnings summaries, sector analysis",
    accent: "#22d3a5",
  },
  {
    emoji: "🎬",
    title: "Content Creators",
    description: "Scripts, captions, and video ideas in minutes",
    accent: "#f59e0b",
  },
  {
    emoji: "🏥",
    title: "Healthcare Workers",
    description: "Patient summaries, symptom checks, medical reference",
    accent: "#f43f5e",
  },
  {
    emoji: "🏭",
    title: "Factory Managers",
    description: "Reports in Hindi, supplier research, inventory analysis",
    accent: "#a78bfa",
  },
  {
    emoji: "🎓",
    title: "Teachers",
    description: "Lesson plans, quizzes, and study material in any Indian language",
    accent: "#34d399",
  },
  {
    emoji: "⚖️",
    title: "Lawyers and CAs",
    description: "Contract review, compliance checks, document summaries",
    accent: "#f59e0b",
  },
  {
    emoji: "🏠",
    title: "Real Estate",
    description: "Property listings, market analysis, neighbourhood reports",
    accent: "#22d3a5",
  },
  {
    emoji: "🚀",
    title: "Founders",
    description: "Investor briefs, competitor maps, pitch content",
    accent: "#6366f1",
  },
];

function ProfessionCard({ item, index }: { item: typeof PROFESSIONS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: (index % 3) * 0.08 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl border border-[rgba(99,102,241,0.12)] bg-[rgba(10,10,20,0.6)] p-6 cursor-default
                 hover:border-[rgba(99,102,241,0.3)] hover:bg-[rgba(99,102,241,0.07)]
                 transition-all duration-200"
    >
      {/* Corner glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${item.accent}10, transparent 65%)` }}
      />

      <div className="flex flex-col gap-3">
        <span className="text-3xl leading-none">{item.emoji}</span>
        <div>
          <h3 className="font-semibold text-[#e0e0ff] mb-1">{item.title}</h3>
          <p className="text-sm text-[#7070a0] leading-relaxed">{item.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function Features() {
  return (
    <section id="features" className="relative py-28 px-6">
      {/* Subtle gradient band */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(99,102,241,0.025)] to-transparent" />

      <div className="mx-auto max-w-7xl relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.06)] px-4 py-1.5 mb-5">
            <span className="text-xs font-semibold text-[#6366f1] uppercase tracking-wider">Who it is for</span>
          </div>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-tight text-[#e0e0ff]">
            Built for every Indian professional
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-[#7070a0]">
            Whether you run a business, teach students, trade stocks, or create content —
            Neural OPS speaks your language and understands your work.
          </p>
        </motion.div>

        {/* 3×3 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROFESSIONS.map((item, i) => (
            <ProfessionCard key={item.title} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
