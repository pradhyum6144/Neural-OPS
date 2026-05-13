"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FloatingOrbs } from "@/components/auth/floating-orbs";
import { InputField } from "@/components/auth/input-field";
import { GoogleButton } from "@/components/auth/google-button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    } else if (result?.url) {
      window.location.href = result.url;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0f] flex items-center justify-center overflow-hidden px-4">
      <FloatingOrbs />

      {/* Subtle grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(99,102,241,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div
          className="rounded-2xl p-10"
          style={{
            background: "rgba(15,15,25,0.85)",
            border: "0.5px solid rgba(99,102,241,0.3)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow:
              "0 0 0 1px rgba(99,102,241,0.06), 0 32px 64px rgba(0,0,0,0.5), 0 0 80px rgba(99,102,241,0.06)",
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6366f1] text-white text-xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              ⬡
            </div>
            <div className="text-center">
              <h1 className="text-xl font-semibold text-white tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-[#6b6b8a] mt-1">
                Sign in to your Neural<span className="text-[#6366f1]">OPS</span> account
              </p>
            </div>
          </div>

          {/* Google */}
          <GoogleButton />

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-[rgba(99,102,241,0.12)]" />
            <span className="text-xs text-[#4a4a6a] font-medium">or continue with email</span>
            <div className="h-px flex-1 bg-[rgba(99,102,241,0.12)]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputField
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#9090b0]">Password</span>
                <Link
                  href="#"
                  className="text-xs text-[#6366f1] hover:text-indigo-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <InputField
                label=""
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-[#f43f5e] text-center bg-[rgba(244,63,94,0.08)] border border-[rgba(244,63,94,0.2)] rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                mt-1 w-full rounded-lg bg-[#6366f1] hover:bg-indigo-500
                px-4 py-2.5 text-sm font-semibold text-white
                transition-all duration-150
                shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_28px_rgba(99,102,241,0.4)]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f19]
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {loading && (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              {loading ? "Signing in…" : "Sign in to NeuralOPS"}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-[#6b6b8a]">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-[#6366f1] hover:text-indigo-400 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
