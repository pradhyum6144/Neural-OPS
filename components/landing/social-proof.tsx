"use client";

import { motion } from "framer-motion";

const COMPANIES = [
  { name: "Anthropic", domain: "AI Research" },
  { name: "Vercel", domain: "Infrastructure" },
  { name: "Linear", domain: "Productivity" },
  { name: "Figma", domain: "Design" },
  { name: "Supabase", domain: "Database" },
  { name: "Resend", domain: "Developer Tools" },
];

const TESTIMONIALS = [
  {
    quote:
      "Neural OPS cut our agent debugging time by 80%. The live flow graph is unlike anything we've used before.",
    author: "Sara K.",
    role: "Head of AI, Seed-stage startup",
  },
  {
    quote:
      "We replaced three separate orchestration tools with Neural OPS. The memory nodes alone are worth the switch.",
    author: "Dev P.",
    role: "Principal Engineer",
  },
  {
    quote:
      "The browser replay feature is insane — we finally know why our scraping agents were silently failing.",
    author: "Mira L.",
    role: "Founding Engineer",
  },
];

export function SocialProof() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Gradient band */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(99,102,241,0.03)] to-transparent" />

      <div className="mx-auto max-w-7xl">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center nos-label mb-10"
        >
          Trusted by teams at
        </motion.p>

        {/* Company badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-20"
        >
          {COMPANIES.map((co, i) => (
            <motion.div
              key={co.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
              className="flex items-center gap-2 rounded-full border border-[rgba(99,102,241,0.15)] bg-[rgba(99,102,241,0.05)] px-4 py-2
                         hover:border-[rgba(99,102,241,0.3)] hover:bg-[rgba(99,102,241,0.09)] transition-all duration-200 cursor-default"
            >
              <span className="text-sm font-semibold text-nos-text">{co.name}</span>
              <span className="text-[10px] text-nos-text-muted border-l border-[rgba(99,102,241,0.2)] pl-2">{co.domain}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-xl border border-[rgba(99,102,241,0.12)] bg-[rgba(99,102,241,0.04)] p-6 flex flex-col gap-4"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, s) => (
                  <span key={s} className="text-nos-amber text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-nos-text leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="border-t border-[rgba(99,102,241,0.1)] pt-4">
                <p className="text-sm font-medium text-nos-text">{t.author}</p>
                <p className="text-xs text-nos-text-muted">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
