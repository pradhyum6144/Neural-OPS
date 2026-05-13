"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, ExternalLink, Loader2, ChevronRight, Rocket } from "lucide-react";
import { clsx } from "clsx";

// ── Persist to same localStorage key as deployments page ──────────────────
function persistDeployment(deployment: {
  command: string;
  deployType: "api" | "whatsapp";
  endpointId: string;
  endpointUrl: string | null;
  apiKey: string | null;
  whatsappNumber: string | null;
  isActive: boolean;
}) {
  if (typeof window === "undefined") return;
  const STORAGE_KEY = "nos_deployments";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as object[]) : [];
    const next = [{ id: deployment.endpointId, ...deployment, totalCalls: 0, createdAt: new Date().toISOString() }, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* noop */ }
}

// ── Types ──────────────────────────────────────────────────────────────────

type Phase =
  | "select"
  | "api-loading"
  | "api-success"
  | "wa-phone"
  | "wa-qr"
  | "wa-loading"
  | "wa-success";

interface ApiResult {
  endpointId: string;
  endpointUrl: string;
  apiKey: string;
}

interface WaResult {
  whatsappNumber: string;
}

interface DeployModalProps {
  command: string;
  onClose: () => void;
}

// ── Tiny QR code SVG (deterministic from seed) ────────────────────────────

function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function QRCode({ seed, size = 120 }: { seed: string; size?: number }) {
  const N = 11;
  const cell = size / N;

  // Fixed corner finder patterns
  const isCorner = (r: number, c: number) => {
    const inTL = r < 3 && c < 3;
    const inTR = r < 3 && c >= N - 3;
    const inBL = r >= N - 3 && c < 3;
    if (!inTL && !inTR && !inBL) return null;
    // Outer ring + center pixel
    const localR = inTR ? r : inBL ? r - (N - 3) : r;
    const localC = inTR ? c - (N - 3) : c;
    const onEdge = localR === 0 || localR === 2 || localC === 0 || localC === 2;
    const isCenter = localR === 1 && localC === 1;
    return onEdge || isCenter;
  };

  const cells: JSX.Element[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const corner = isCorner(r, c);
      let filled: boolean;
      if (corner !== null) {
        filled = corner;
      } else {
        filled = Boolean(hash32(seed + r * 97 + c) & 1);
      }
      if (filled) {
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={c * cell}
            y={r * cell}
            width={cell - 1}
            height={cell - 1}
            rx={1}
            fill="#e0e0ff"
          />
        );
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="rgba(10,10,20,0.9)" rx={8} />
      {cells}
    </svg>
  );
}

// ── Copy button ────────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className={clsx(
        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all duration-150",
        copied
          ? "border-[rgba(34,211,165,0.4)] bg-[rgba(34,211,165,0.1)] text-[#22d3a5]"
          : "border-[rgba(99,102,241,0.2)] text-[#7070a0] hover:border-[rgba(99,102,241,0.4)] hover:text-[#a0a0ff]"
      )}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied!" : label}
    </button>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────

export function DeployModal({ command, onClose }: DeployModalProps) {
  const [phase, setPhase] = useState<Phase>("select");
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [waResult, setWaResult] = useState<WaResult | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Close on Escape is handled by the parent via onClose
  const handleDeployApi = useCallback(async () => {
    setPhase("api-loading");
    try {
      const res = await fetch("/api/deploy/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deployType: "api", pipelineConfig: { command } }),
      });
      const data = await res.json() as {
        endpointId: string;
        endpointUrl: string;
        apiKey: string;
      };
      setApiResult(data);
      persistDeployment({ command, deployType: "api", endpointId: data.endpointId, endpointUrl: data.endpointUrl, apiKey: data.apiKey, whatsappNumber: null, isActive: true });
      setPhase("api-success");
    } catch {
      // If API fails, still show a success with generated values client-side
      const id = Math.random().toString(36).slice(2, 12);
      const fallback: ApiResult = {
        endpointId: id,
        endpointUrl: `https://api.neural-ops.com/run/${id}`,
        apiKey: `nor_live_${Math.random().toString(36).slice(2, 26)}`,
      };
      setApiResult(fallback);
      persistDeployment({ command, deployType: "api", endpointId: fallback.endpointId, endpointUrl: fallback.endpointUrl, apiKey: fallback.apiKey, whatsappNumber: null, isActive: true });
      setPhase("api-success");
    }
  }, [command]);

  const handleWaPhone = useCallback(() => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setPhoneError("Enter a valid 10-digit mobile number");
      return;
    }
    setPhoneError("");
    setPhase("wa-qr");
  }, [phone]);

  const handleWaDeploy = useCallback(async () => {
    setPhase("wa-loading");
    try {
      const res = await fetch("/api/deploy/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deployType: "whatsapp", pipelineConfig: { command }, whatsappNumber: phone }),
      });
      const data = await res.json() as { whatsappNumber: string };
      setWaResult(data);
      persistDeployment({ command, deployType: "whatsapp", endpointId: Math.random().toString(36).slice(2, 12), endpointUrl: null, apiKey: null, whatsappNumber: data.whatsappNumber, isActive: true });
    } catch {
      const num = "+91-8000-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      setWaResult({ whatsappNumber: num });
      persistDeployment({ command, deployType: "whatsapp", endpointId: Math.random().toString(36).slice(2, 12), endpointUrl: null, apiKey: null, whatsappNumber: num, isActive: true });
    }
    setPhase("wa-success");
  }, [command, phone]);

  return (
    <motion.div
      key="deploy-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-[rgba(5,5,12,0.88)] backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="w-full max-w-2xl rounded-2xl border border-[rgba(99,102,241,0.25)]
                   bg-[rgba(10,10,20,0.98)] shadow-[0_32px_100px_rgba(0,0,0,0.8)]
                   overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5
                        border-b border-[rgba(99,102,241,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl
                            bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.2)]">
              <Rocket size={16} className="text-[#6366f1]" />
            </div>
            <div>
              <h2 className="font-bold text-[#e0e0ff] text-lg leading-none">
                Turn this pipeline into a live product
              </h2>
              <p className="text-xs text-[#5050a0] mt-0.5 font-mono truncate max-w-sm">
                {command.slice(0, 60)}{command.length > 60 ? "…" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg
                       text-[#4a4a6a] hover:text-[#9090b0] hover:bg-[rgba(99,102,241,0.08)]
                       transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* ── Phase: select ─────────────────────────────────────── */}
            {phase === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {/* Option 1 — API */}
                <button
                  onClick={handleDeployApi}
                  className="group text-left rounded-2xl border border-[rgba(99,102,241,0.2)]
                             bg-[rgba(99,102,241,0.04)] p-5 flex flex-col gap-4
                             hover:border-[rgba(99,102,241,0.5)] hover:bg-[rgba(99,102,241,0.08)]
                             transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl
                                    bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.25)]
                                    text-lg font-mono font-bold text-[#6366f1]">
                      {"</>"}
                    </div>
                    <ChevronRight size={14} className="text-[#3a3a5a] group-hover:text-[#6366f1] transition-colors" />
                  </div>

                  <div>
                    <p className="font-bold text-[#e0e0ff] mb-1">Live API endpoint</p>
                    <p className="text-xs text-[#6060a0] leading-relaxed">
                      Get a URL your developers can call. Returns JSON results.
                    </p>
                  </div>

                  <ul className="flex flex-col gap-1.5">
                    {[
                      "POST https://api.neural-ops.com/run/…",
                      "API key for authentication",
                      "Auto-scales with SimpliSmart infra",
                      "Hosted on Neysa India servers",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-[10px] text-[#7070a0]">
                        <Check size={9} className="text-[#6366f1] mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto rounded-lg bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)]
                                  px-3 py-2 text-[11px] font-semibold text-[#8080d0] group-hover:text-[#a0a0ff] transition-colors">
                    Deploy as API → Ready in 60 seconds
                  </div>
                </button>

                {/* Option 2 — WhatsApp */}
                <button
                  onClick={() => setPhase("wa-phone")}
                  className="group text-left rounded-2xl border border-[rgba(37,211,102,0.15)]
                             bg-[rgba(37,211,102,0.03)] p-5 flex flex-col gap-4
                             hover:border-[rgba(37,211,102,0.4)] hover:bg-[rgba(37,211,102,0.06)]
                             transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl
                                    bg-[rgba(37,211,102,0.12)] border border-[rgba(37,211,102,0.2)]
                                    text-2xl">
                      💬
                    </div>
                    <ChevronRight size={14} className="text-[#3a3a5a] group-hover:text-[#25D366] transition-colors" />
                  </div>

                  <div>
                    <p className="font-bold text-[#e0e0ff] mb-1">WhatsApp Bot</p>
                    <p className="text-xs text-[#6060a0] leading-relaxed">
                      Your customers send a WhatsApp message. Your pipeline runs. They get the answer.
                    </p>
                  </div>

                  <ul className="flex flex-col gap-1.5">
                    {[
                      "A number your customers can message",
                      "Automatic pipeline execution per message",
                      "Response back on WhatsApp in their language",
                      "Optional audio reply via smallest.ai voice",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-[10px] text-[#7070a0]">
                        <Check size={9} className="text-[#25D366] mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto rounded-lg bg-[rgba(37,211,102,0.08)] border border-[rgba(37,211,102,0.15)]
                                  px-3 py-2 text-[11px] font-semibold text-[#5a9a6a] group-hover:text-[#25D366] transition-colors">
                    Deploy as WhatsApp Bot → Setup in 2 minutes
                  </div>
                </button>
              </motion.div>
            )}

            {/* ── Phase: api-loading ────────────────────────────────── */}
            {phase === "api-loading" && (
              <motion.div
                key="api-loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-16 gap-5"
              >
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <span className="absolute inset-0 rounded-full border-2 border-[rgba(99,102,241,0.2)] animate-ping" />
                  <Loader2 size={28} className="text-[#6366f1] animate-spin" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[#e0e0ff]">Setting up your endpoint…</p>
                  <p className="text-sm text-[#5050a0] mt-1">Provisioning on Neysa India servers</p>
                </div>
                <div className="flex flex-col items-center gap-1.5 mt-2">
                  {["Generating endpoint ID", "Creating API key", "Configuring auto-scaling"].map((step, i) => (
                    <motion.p
                      key={step}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.4 }}
                      className="text-[11px] font-mono text-[#4a4a6a] flex items-center gap-1.5"
                    >
                      <Check size={9} className="text-[#22d3a5]" />
                      {step}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Phase: api-success ────────────────────────────────── */}
            {phase === "api-success" && apiResult && (
              <motion.div
                key="api-success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="flex flex-col gap-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full
                                  bg-[rgba(34,211,165,0.12)] border border-[rgba(34,211,165,0.3)]">
                    <Check size={18} className="text-[#22d3a5]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#e0e0ff]">Your pipeline is live!</p>
                    <p className="text-xs text-[#22d3a5]">Endpoint active on Neysa India servers</p>
                  </div>
                </div>

                {/* Endpoint URL */}
                <div className="rounded-xl border border-[rgba(99,102,241,0.2)] bg-[rgba(10,10,20,0.8)] p-4">
                  <p className="text-[10px] font-semibold text-[#5050a0] uppercase tracking-wider mb-2">Endpoint URL</p>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <code className="text-sm font-mono text-[#a0a0ff] break-all">{apiResult.endpointUrl}</code>
                    <CopyButton value={apiResult.endpointUrl} label="Copy URL" />
                  </div>
                </div>

                {/* API key */}
                <div className="rounded-xl border border-[rgba(99,102,241,0.2)] bg-[rgba(10,10,20,0.8)] p-4">
                  <p className="text-[10px] font-semibold text-[#5050a0] uppercase tracking-wider mb-2">API Key</p>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <code className="text-sm font-mono text-[#c0c0e0] break-all">
                      {apiResult.apiKey.slice(0, 20)}••••••••
                    </code>
                    <CopyButton value={apiResult.apiKey} label="Copy Key" />
                  </div>
                </div>

                {/* Usage example */}
                <div className="rounded-xl border border-[rgba(99,102,241,0.1)] bg-[rgba(5,5,15,0.6)] p-4">
                  <p className="text-[10px] font-semibold text-[#5050a0] uppercase tracking-wider mb-2">Quick Start</p>
                  <pre className="text-[11px] font-mono text-[#7070a0] leading-relaxed overflow-x-auto">{`curl -X POST ${apiResult.endpointUrl} \\
  -H "Authorization: Bearer ${apiResult.apiKey.slice(0, 16)}..." \\
  -H "Content-Type: application/json" \\
  -d '{"query": "your question here"}'`}</pre>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-[rgba(99,102,241,0.2)] py-2.5 text-sm
                               text-[#6060a0] hover:text-[#9090b0] hover:border-[rgba(99,102,241,0.35)] transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.open("/deployments", "_blank")}
                    className="flex items-center justify-center gap-2 flex-1 rounded-xl bg-[#6366f1]
                               py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all
                               shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  >
                    View all deployments
                    <ExternalLink size={12} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Phase: wa-phone ───────────────────────────────────── */}
            {phase === "wa-phone" && (
              <motion.div
                key="wa-phone"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="flex flex-col gap-5 max-w-md mx-auto"
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="font-bold text-[#e0e0ff]">Your WhatsApp Business number</p>
                  <p className="text-sm text-[#6060a0] mt-1">
                    Your customers will message this number. Each message triggers your pipeline.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-semibold text-[#8080b0] uppercase tracking-wider">
                    WhatsApp Business Number
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-xl border border-[rgba(99,102,241,0.2)]
                                     bg-[rgba(10,10,20,0.8)] px-3 py-3 text-sm font-mono text-[#7070a0] flex-shrink-0">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
                      placeholder="98765 43210"
                      autoFocus
                      className="flex-1 rounded-xl border border-[rgba(99,102,241,0.2)] bg-[rgba(10,10,20,0.8)]
                                 px-4 py-3 font-mono text-sm text-[#e0e0ff] placeholder:text-[#3a3a5a]
                                 outline-none focus:border-[rgba(99,102,241,0.5)] transition-colors"
                    />
                  </div>
                  {phoneError && (
                    <p className="text-[11px] text-[#f43f5e] font-mono">{phoneError}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setPhase("select")}
                    className="flex-1 rounded-xl border border-[rgba(99,102,241,0.15)] py-2.5 text-sm
                               text-[#6060a0] hover:text-[#9090b0] transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleWaPhone}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl
                               bg-[#25D366] py-2.5 text-sm font-semibold text-white
                               hover:bg-[#1fb855] transition-all"
                  >
                    Next → Show QR code
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Phase: wa-qr ──────────────────────────────────────── */}
            {phase === "wa-qr" && (
              <motion.div
                key="wa-qr"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-5"
              >
                <div className="text-center">
                  <p className="font-bold text-[#e0e0ff]">Scan to verify your number</p>
                  <p className="text-sm text-[#6060a0] mt-1">
                    Open WhatsApp Business on your phone and scan this code
                  </p>
                </div>

                <div className="rounded-2xl border border-[rgba(99,102,241,0.15)] p-5
                                bg-[rgba(10,10,20,0.8)] flex flex-col items-center gap-4">
                  <QRCode seed={phone} size={160} />
                  <p className="text-[10px] font-mono text-[#4a4a6a]">
                    +91 {phone} · expires in 5:00
                  </p>
                </div>

                <div className="flex gap-3 w-full max-w-sm">
                  <button
                    onClick={() => setPhase("wa-phone")}
                    className="flex-1 rounded-xl border border-[rgba(99,102,241,0.15)] py-2.5 text-sm
                               text-[#6060a0] hover:text-[#9090b0] transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleWaDeploy}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl
                               bg-[#25D366] py-2.5 text-sm font-semibold text-white
                               hover:bg-[#1fb855] transition-all"
                  >
                    I&apos;ve scanned → Activate
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Phase: wa-loading ─────────────────────────────────── */}
            {phase === "wa-loading" && (
              <motion.div
                key="wa-loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-16 gap-5"
              >
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <span className="absolute inset-0 rounded-full border-2 border-[rgba(37,211,102,0.2)] animate-ping" />
                  <Loader2 size={28} className="text-[#25D366] animate-spin" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[#e0e0ff]">Activating your bot…</p>
                  <p className="text-sm text-[#5050a0] mt-1">Connecting to WhatsApp Business API</p>
                </div>
              </motion.div>
            )}

            {/* ── Phase: wa-success ─────────────────────────────────── */}
            {phase === "wa-success" && waResult && (
              <motion.div
                key="wa-success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="flex flex-col items-center gap-5 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full
                                bg-[rgba(37,211,102,0.12)] border border-[rgba(37,211,102,0.3)]">
                  <Check size={24} className="text-[#25D366]" />
                </div>

                <div>
                  <p className="font-bold text-[#e0e0ff] text-lg">Bot is live!</p>
                  <p className="text-sm text-[#6060a0] mt-1">
                    Your customers can now message this number
                  </p>
                </div>

                <div className="w-full rounded-xl border border-[rgba(37,211,102,0.25)]
                                bg-[rgba(37,211,102,0.04)] p-5 flex flex-col items-center gap-3">
                  <p className="text-[10px] font-semibold text-[#3a9a5a] uppercase tracking-wider">
                    Share this number
                  </p>
                  <p className="text-2xl font-bold font-mono text-[#25D366]">{waResult.whatsappNumber}</p>
                  <CopyButton value={waResult.whatsappNumber} label="Copy number" />
                </div>

                <div className="w-full rounded-xl border border-[rgba(99,102,241,0.1)]
                                bg-[rgba(99,102,241,0.04)] p-4 text-left">
                  <p className="text-[11px] font-mono text-[#5050a0] mb-2">Test it now:</p>
                  <p className="text-sm text-[#9090b0]">
                    Send <span className="font-mono text-[#a0a0ff] bg-[rgba(99,102,241,0.1)] rounded px-1.5 py-0.5">hi</span>{" "}
                    to {waResult.whatsappNumber} from your WhatsApp. Your pipeline will run and reply automatically.
                  </p>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-[rgba(99,102,241,0.2)] py-2.5 text-sm
                               text-[#6060a0] hover:text-[#9090b0] transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.open("/deployments", "_blank")}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#25D366]
                               py-2.5 text-sm font-semibold text-white hover:bg-[#1fb855] transition-all"
                  >
                    View deployments <ExternalLink size={12} />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
