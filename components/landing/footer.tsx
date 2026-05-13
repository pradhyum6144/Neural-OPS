"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Code2, X } from "lucide-react";

const FOOTER_LINKS = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Developers: ["Docs", "API Reference", "SDKs", "Examples"],
  Company: ["About", "Blog", "Careers", "Press"],
  Legal: ["Privacy", "Terms", "Security", "Status"],
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
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-nos-accent text-white text-lg font-bold">
                ⬡
              </span>
              <span className="font-semibold text-nos-text tracking-tight">
                Neural<span className="text-nos-accent">OPS</span>
              </span>
            </Link>
            <p className="text-sm text-nos-text-muted max-w-xs leading-relaxed mb-6">
              The visual operating system for AI agent orchestration. Build,
              observe, and scale autonomous workflows.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(99,102,241,0.15)] text-nos-text-muted hover:text-nos-text hover:border-[rgba(99,102,241,0.35)] transition-all duration-150"
              >
                <Code2 size={14} />
              </a>
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(99,102,241,0.15)] text-nos-text-muted hover:text-nos-text hover:border-[rgba(99,102,241,0.35)] transition-all duration-150"
              >
                <X size={14} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="nos-label mb-4">{group}</p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-nos-text-muted hover:text-nos-text transition-colors duration-150"
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
          <p className="text-xs text-nos-text-muted">
            © {new Date().getFullYear()} Neural OPS, Inc. All rights reserved.
          </p>
          <p className="text-xs text-nos-text-muted">
            Built for builders. Powered by{" "}
            <span className="text-nos-accent">intelligence</span>.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
