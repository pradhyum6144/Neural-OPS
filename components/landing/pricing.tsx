"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

const TIERS = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    tagline: "Get started with no commitment.",
    highlight: false,
    cta: "Start for free",
    ctaHref: "/signup",
    features: [
      "10,000 tokens per day",
      "3 AI specialists",
      "Community task templates",
      "Hindi and English support",
      "Basic report export",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "₹999",
    period: "/ month",
    tagline: "For professionals who need more power.",
    highlight: true,
    badge: "Most popular",
    cta: "Start Pro",
    ctaHref: "/signup",
    features: [
      "500,000 tokens per day",
      "All 5 AI specialists",
      "Smart Router — cheapest model auto-selected",
      "Voice commands and spoken results",
      "Hindi, Tamil, Telugu + 6 more languages",
      "Full history and report archive",
      "Priority support",
    ],
  },
  {
    name: "Team",
    price: "₹4,999",
    period: "/ month",
    tagline: "For businesses and teams at scale.",
    highlight: false,
    cta: "Contact us",
    ctaHref: "#",
    features: [
      "Unlimited tokens",
      "Deploy as WhatsApp bot or API",
      "White-label with your brand",
      "Custom AI model integrations",
      "Team workspace and permissions",
      "SLA and dedicated support",
      "Onboarding assistance",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-28 px-6 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#6366f1] opacity-[0.04] blur-[160px]" />

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
            <span className="text-xs font-semibold text-[#6366f1] uppercase tracking-wider">Pricing</span>
          </div>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-tight text-[#e0e0ff]">
            Simple pricing in rupees
          </h2>
          <p className="mt-4 text-[#7070a0]">
            No dollar billing. No hidden fees. Pay via UPI or card. Cancel any time.
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
                  ? "border border-[#6366f1] bg-[rgba(99,102,241,0.1)] shadow-[0_0_40px_rgba(99,102,241,0.15)]"
                  : "border border-[rgba(99,102,241,0.12)] bg-[rgba(10,10,20,0.6)]"
              }`}
            >
              {/* Popular badge */}
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[#6366f1] px-4 py-1 text-xs font-semibold text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Plan name and price */}
              <div className="mb-6">
                <p className="text-sm font-medium text-[#7070a0] mb-2">{tier.name}</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-bold tracking-tight text-[#e0e0ff]">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-[#7070a0] text-sm pb-1">{tier.period}</span>
                  )}
                </div>
                <p className="text-sm text-[#7070a0]">{tier.tagline}</p>
              </div>

              {/* Divider */}
              <div className="border-t border-[rgba(99,102,241,0.1)] mb-6" />

              {/* Features */}
              <ul className="flex-1 space-y-3 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-[#9090b0]">
                    <Check
                      size={14}
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: tier.highlight ? "#6366f1" : "#22d3a5" }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={tier.ctaHref}
                className={`block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all duration-150 ${
                  tier.highlight
                    ? "bg-[#6366f1] text-white hover:bg-indigo-500 shadow-[0_0_16px_rgba(99,102,241,0.3)] hover:shadow-[0_0_24px_rgba(99,102,241,0.5)]"
                    : "border border-[rgba(99,102,241,0.25)] text-[#e0e0ff] hover:bg-[rgba(99,102,241,0.1)] hover:border-[rgba(99,102,241,0.4)]"
                }`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Payment note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center text-sm text-[#5050a0]"
        >
          Pay via UPI, Razorpay, or credit card. No dollar billing. Cancel any time.
        </motion.p>
      </div>
    </section>
  );
}
