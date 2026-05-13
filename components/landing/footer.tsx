"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const FOOTER_LINKS = {
  Product:   ["Features", "How it works", "Pricing", "Marketplace", "Changelog"],
  Support:   ["Help Center", "Contact Us", "WhatsApp Support", "Status"],
  Company:   ["About", "Blog", "Careers", "Press"],
  Legal:     ["Privacy Policy", "Terms of Use", "Security", "Refund Policy"],
};

export function Footer() {
  return (
    <footer className="relative border-t border-[rgba(99,102,241,0.1)] pt-20 pb-12 px-6">
      <div className="mx-auto max-w-7xl">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-16"
        >
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1] text-white text-lg font-bold shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                ⬡
              </span>
              <span className="font-bold text-[#e0e0ff] tracking-tight">
                Neural<span className="text-[#6366f1]">OPS</span>
              </span>
            </Link>

            <p className="text-sm text-[#7070a0] max-w-xs leading-relaxed mb-6">
              Your AI team, ready around the clock. No coding.
              No complexity. Just results — in your language.
            </p>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#5050a0] uppercase tracking-wider">Pay with</span>
              <div className="flex items-center gap-2 flex-wrap">
                {["UPI", "Razorpay", "Visa", "Mastercard"].map((method) => (
                  <span
                    key={method}
                    className="rounded border border-[rgba(99,102,241,0.15)] bg-[rgba(99,102,241,0.05)] px-2.5 py-1 text-[11px] font-semibold text-[#7070a0]"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-[10px] font-semibold text-[#5050a0] uppercase tracking-wider mb-4">
                {group}
              </p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-[#7070a0] hover:text-[#e0e0ff] transition-colors duration-150"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[rgba(99,102,241,0.08)] pt-8"
        >
          <p className="text-xs text-[#5050a0]">
            © {new Date().getFullYear()} Neural OPS. All rights reserved.
          </p>
          <p className="text-xs text-[#5050a0]">
            Made in India 🇮🇳 for the world
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
