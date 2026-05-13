"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { clsx } from "clsx";

const NAV_LINKS = ["Product", "Docs", "Pricing", "Blog"];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

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
          ? "border-b border-[rgba(99,102,241,0.12)] bg-[rgba(10,10,15,0.8)] backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-nos-accent text-white text-lg font-bold shadow-nos-glow">
            ⬡
          </span>
          <span className="font-semibold text-nos-text tracking-tight group-hover:text-nos-accent transition-colors">
            Neural<span className="text-nos-accent">OPS</span>
          </span>
        </Link>

        {/* Links */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link}>
              <Link
                href="#"
                className="px-4 py-2 rounded-lg text-sm text-nos-text-muted hover:text-nos-text hover:bg-[rgba(99,102,241,0.08)] transition-all duration-150"
              >
                {link}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden sm:block px-4 py-2 text-sm text-nos-text-muted hover:text-nos-text transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="nos-btn-primary text-sm px-4 py-2"
          >
            Get started free
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
