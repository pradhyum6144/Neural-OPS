"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Product",      href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing",      href: "#pricing" },
  { label: "Marketplace",  href: "#marketplace" },
];

export function Navbar() {
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={clsx(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-[rgba(99,102,241,0.12)] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1] text-white text-lg font-bold shadow-[0_0_16px_rgba(99,102,241,0.4)]">
            ⬡
          </span>
          <span className="font-bold text-[#e0e0ff] tracking-tight">
            Neural<span className="text-[#6366f1]">OPS</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="px-4 py-2 rounded-lg text-sm text-[#8080b0] hover:text-[#e0e0ff] hover:bg-[rgba(99,102,241,0.08)] transition-all duration-150"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-[#8080b0] hover:text-[#e0e0ff] rounded-lg hover:bg-[rgba(99,102,241,0.08)] transition-all duration-150"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-lg bg-[#6366f1] hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_12px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-150"
          >
            Try free — no code needed
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-[#8080b0] hover:text-[#e0e0ff] hover:bg-[rgba(99,102,241,0.08)] transition-all"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="md:hidden border-t border-[rgba(99,102,241,0.1)] bg-[rgba(10,10,15,0.98)] backdrop-blur-xl px-6 py-4 flex flex-col gap-2"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="py-2.5 text-sm text-[#8080b0] hover:text-[#e0e0ff] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="border-t border-[rgba(99,102,241,0.08)] pt-3 mt-1 flex flex-col gap-2">
            <Link href="/login" className="py-2 text-sm text-[#8080b0] text-center hover:text-[#e0e0ff]">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="py-2.5 text-sm font-semibold text-white text-center bg-[#6366f1] rounded-lg"
            >
              Try free — no code needed
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
