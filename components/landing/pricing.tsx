"use client";

import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "For solo builders and experiments.",
    highlight: false,
    cta: "Start for free",
    ctaStyle: "secondary" as const,
    features: [
      "Up to 3 agents",
      "1 active pipeline",
      "10k events / month",
      "Community memory nodes",
      "7-day log retention",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/ month",
    tagline: "For teams shipping real products.",
    highlight: true,
    badge: "Most popular",
    cta: "Get started",
    ctaStyle: "primary" as const,
    features: [
      "Unlimited agents",
      "Unlimited pipelines",
      "5M events / month",
      "Persistent memory nodes",
      "90-day log retention",
      "Browser replay (unlimited)",
      "Voice AI integration",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    tagline: "For teams that need SLAs and control.",
    highlight: false,
    cta: "Contact sales",
    ctaStyle: "secondary" as const,
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Custom retention",
      "Dedicated infra",
      "Audit logs",
      "SLA guarantee",
      "Onboarding engineer",
      "Custom contracts",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-32 px-6 overflow-hidden">
      {/* BG accent */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-nos-accent opacity-[0.04] blur-[160px]" />

      <div className="mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <div className="nos-label mb-4">Pricing</div>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-tight text-nos-text">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-nos-text-muted">
            Start free. Scale when you're ready. No hidden fees.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative flex flex-col rounded-2xl p-8 ${
                tier.highlight
                  ? "border border-nos-accent bg-[rgba(99,102,241,0.1)] shadow-nos-glow-lg"
                  : "border border-[rgba(99,102,241,0.12)] bg-[rgba(99,102,241,0.04)]"
              }`}
            >
              {/* Popular badge */}
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1.5 rounded-full bg-nos-accent px-3 py-1 text-xs font-semibold text-white shadow-nos-glow">
                    <Zap size={11} className="fill-current" />
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Tier name */}
              <div className="mb-6">
                <p className="text-sm font-medium text-nos-text-muted mb-2">{tier.name}</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`text-4xl font-bold tracking-tight ${tier.highlight ? "text-white" : "text-nos-text"}`}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-nos-text-muted text-sm pb-1">{tier.period}</span>
                  )}
                </div>
                <p className="text-sm text-nos-text-muted">{tier.tagline}</p>
              </div>

              {/* Divider */}
              <div className="nos-divider mb-6" />

              {/* Features */}
              <ul className="flex-1 space-y-3 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-nos-text-muted">
                    <Check
                      size={14}
                      className={tier.highlight ? "text-nos-accent flex-shrink-0" : "text-nos-green flex-shrink-0"}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  tier.ctaStyle === "primary"
                    ? "bg-nos-accent text-white hover:bg-indigo-500 shadow-nos-glow"
                    : "border border-[rgba(99,102,241,0.25)] text-nos-text hover:bg-[rgba(99,102,241,0.1)] hover:border-[rgba(99,102,241,0.4)]"
                }`}
              >
                {tier.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Fine print */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center text-xs text-nos-text-muted"
        >
          All plans include 99.9% uptime SLA on infrastructure. Billed monthly. Cancel anytime.
        </motion.p>
      </div>
    </section>
  );
}
