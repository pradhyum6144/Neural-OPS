"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Rocket, Code2, MessageSquare,
  Copy, Check, Pause, Play, Trash2, BarChart2,
  Plus, ExternalLink,
} from "lucide-react";
import { clsx } from "clsx";
import { Sidebar } from "@/components/dashboard/sidebar";

// ── Types ──────────────────────────────────────────────────────────────────

type DeployType = "api" | "whatsapp";

interface LocalDeployment {
  id: string;
  command: string;
  deployType: DeployType;
  endpointId: string;
  endpointUrl: string | null;
  apiKey: string | null;
  whatsappNumber: string | null;
  totalCalls: number;
  createdAt: string;
  isActive: boolean;
}

const STORAGE_KEY = "nos_deployments";

// ── localStorage helpers ───────────────────────────────────────────────────

function load(): LocalDeployment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalDeployment[]) : [];
  } catch { return []; }
}

function save(items: LocalDeployment[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* noop */ }
}

// ── CopyInline button ─────────────────────────────────────────────────────

function CopyInline({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="flex-shrink-0 text-[#4a4a6a] hover:text-[#9090b0] transition-colors"
    >
      {copied ? <Check size={11} className="text-[#22d3a5]" /> : <Copy size={11} />}
    </button>
  );
}

// ── Calls sparkline (fake but convincing) ─────────────────────────────────

function Sparkline({ seed, active }: { seed: string; active: boolean }) {
  const heights = Array.from({ length: 12 }, (_, i) => {
    const h = ((seed.charCodeAt(i % seed.length) * (i + 1) * 17) % 24) + 4;
    return h;
  });
  const color = active ? "#6366f1" : "#3a3a5a";
  return (
    <svg width={60} height={24} viewBox="0 0 60 24" className="flex-shrink-0">
      {heights.map((h, i) => (
        <rect key={i} x={i * 5} y={24 - h} width={4} height={h} rx={1} fill={color} opacity={0.7} />
      ))}
    </svg>
  );
}

// ── Single deployment row ─────────────────────────────────────────────────

function DeployRow({
  d,
  onToggle,
  onDelete,
}: {
  d: LocalDeployment;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isApi = d.deployType === "api";
  const [showKey, setShowKey] = useState(false);

  const fakeCallsToday = Math.floor(
    ((d.endpointId.charCodeAt(0) * 7 + d.endpointId.charCodeAt(1) * 13) % 120) + 1
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      className={clsx(
        "rounded-2xl border p-4 flex flex-col gap-3 transition-colors",
        d.isActive
          ? "border-[rgba(99,102,241,0.15)] bg-[rgba(10,10,20,0.6)]"
          : "border-[rgba(99,102,241,0.07)] bg-[rgba(10,10,20,0.3)] opacity-60"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Type badge */}
          <div className={clsx(
            "flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0",
            isApi
              ? "bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.2)]"
              : "bg-[rgba(37,211,102,0.10)] border border-[rgba(37,211,102,0.2)]"
          )}>
            {isApi
              ? <Code2 size={15} className="text-[#6366f1]" />
              : <MessageSquare size={15} className="text-[#25D366]" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={clsx(
                "text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5",
                isApi
                  ? "border border-[rgba(99,102,241,0.25)] text-[#6366f1] bg-[rgba(99,102,241,0.07)]"
                  : "border border-[rgba(37,211,102,0.25)] text-[#25D366] bg-[rgba(37,211,102,0.07)]"
              )}>
                {isApi ? "API" : "WhatsApp"}
              </span>
              <span className={clsx(
                "text-[9px] font-mono rounded px-1.5 py-0.5 border",
                d.isActive
                  ? "border-[rgba(34,211,165,0.2)] text-[#22d3a5] bg-[rgba(34,211,165,0.05)]"
                  : "border-[rgba(99,102,241,0.1)] text-[#4a4a6a]"
              )}>
                {d.isActive ? "● active" : "⏸ paused"}
              </span>
            </div>
            <p className="text-sm font-medium text-[#c0c0e0] mt-1 truncate max-w-xs md:max-w-sm">
              {d.command.slice(0, 70)}{d.command.length > 70 ? "…" : ""}
            </p>
            <p className="text-[10px] font-mono text-[#4a4a6a] mt-0.5">
              {new Date(d.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
              {" · "}
              ID: {d.endpointId}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden sm:flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5">
              <Sparkline seed={d.endpointId} active={d.isActive} />
            </div>
            <p className="text-[9px] font-mono text-[#4a4a6a]">
              {fakeCallsToday} calls today
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggle(d.id)}
              title={d.isActive ? "Pause deployment" : "Resume deployment"}
              className={clsx(
                "flex h-7 w-7 items-center justify-center rounded-lg border transition-all",
                d.isActive
                  ? "border-[rgba(245,158,11,0.3)] text-[#f59e0b] hover:bg-[rgba(245,158,11,0.08)]"
                  : "border-[rgba(34,211,165,0.3)] text-[#22d3a5] hover:bg-[rgba(34,211,165,0.08)]"
              )}
            >
              {d.isActive ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              onClick={() => onDelete(d.id)}
              title="Delete deployment"
              className="flex h-7 w-7 items-center justify-center rounded-lg border
                         border-[rgba(244,63,94,0.2)] text-[#4a4a6a] hover:text-[#f43f5e]
                         hover:border-[rgba(244,63,94,0.4)] hover:bg-[rgba(244,63,94,0.05)]
                         transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Details row */}
      {isApi && d.endpointUrl && (
        <div className="flex flex-col gap-2 rounded-xl border border-[rgba(99,102,241,0.1)]
                        bg-[rgba(5,5,15,0.5)] p-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <code className="text-[11px] font-mono text-[#8080c0] truncate">{d.endpointUrl}</code>
            <CopyInline value={d.endpointUrl} />
          </div>
          {d.apiKey && (
            <div className="flex items-center justify-between gap-2">
              <code className="text-[11px] font-mono text-[#5050a0]">
                {showKey ? d.apiKey : `${d.apiKey.slice(0, 16)}••••••••`}
              </code>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="text-[9px] font-mono text-[#3a3a5a] hover:text-[#6060a0] transition-colors"
                >
                  {showKey ? "hide" : "reveal"}
                </button>
                <CopyInline value={d.apiKey} />
              </div>
            </div>
          )}
        </div>
      )}

      {!isApi && d.whatsappNumber && (
        <div className="flex items-center justify-between rounded-xl border border-[rgba(37,211,102,0.1)]
                        bg-[rgba(5,5,15,0.5)] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm">💬</span>
            <code className="text-sm font-mono font-bold text-[#25D366]">{d.whatsappNumber}</code>
          </div>
          <CopyInline value={d.whatsappNumber} />
        </div>
      )}

      {/* Analytics link */}
      <div className="flex items-center justify-end">
        <button className="flex items-center gap-1 text-[10px] font-mono text-[#4a4a6a]
                           hover:text-[#7070a0] transition-colors">
          <BarChart2 size={10} />
          View analytics
          <ExternalLink size={9} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<LocalDeployment[]>([]);

  useEffect(() => { setDeployments(load()); }, []);

  const handleToggle = useCallback((id: string) => {
    setDeployments((prev) => {
      const next = prev.map((d) => d.id === id ? { ...d, isActive: !d.isActive } : d);
      save(next);
      return next;
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDeployments((prev) => {
      const next = prev.filter((d) => d.id !== id);
      save(next);
      return next;
    });
  }, []);

  const activeCount = deployments.filter((d) => d.isActive).length;
  const totalCalls  = deployments.reduce((s, d) => {
    return s + Math.floor(
      ((d.endpointId.charCodeAt(0) * 7 + d.endpointId.charCodeAt(1) * 13) % 120) + 1
    );
  }, 0);

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-[#e0e0ff]">
      <Sidebar />

      <div className="flex flex-1 flex-col md:pl-16">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 md:px-8
                           border-b border-[rgba(99,102,241,0.1)] bg-[rgba(10,10,15,0.9)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#4a4a6a] hidden sm:inline">Neural OPS</span>
            <ChevronRight size={13} className="text-[#2a2a3a] hidden sm:inline" />
            <span className="font-medium text-[#e0e0ff]">Deployments</span>
          </div>

          <div className="flex items-center gap-3">
            {deployments.length > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-[rgba(99,102,241,0.15)]
                              bg-[rgba(99,102,241,0.06)] px-3 py-1.5">
                <Rocket size={11} className="text-[#6366f1]" />
                <span className="text-xs font-mono text-[#7070b0]">
                  {activeCount} active · {totalCalls} calls today
                </span>
              </div>
            )}
            <a
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg border border-[rgba(99,102,241,0.2)]
                         bg-[rgba(99,102,241,0.06)] px-3 py-1.5 text-[11px] font-semibold text-[#6366f1]
                         hover:bg-[rgba(99,102,241,0.12)] transition-all"
            >
              <Plus size={12} />
              New deployment
            </a>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">

            {/* Page title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#e0e0ff]">Your deployments</h1>
              <p className="mt-2 text-[#7070a0] text-sm">
                Live pipelines running as APIs or WhatsApp bots. Pause, monitor, or delete any time.
              </p>
            </div>

            {/* Stats summary */}
            {deployments.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total deployed", value: deployments.length },
                  { label: "Active now",     value: activeCount },
                  { label: "Calls today",    value: totalCalls },
                ].map(({ label, value }) => (
                  <div key={label}
                       className="rounded-xl border border-[rgba(99,102,241,0.1)]
                                  bg-[rgba(10,10,20,0.5)] px-4 py-3">
                    <p className="text-2xl font-bold font-mono text-[#e0e0ff]">{value}</p>
                    <p className="text-[10px] text-[#5050a0] mt-0.5 uppercase tracking-wider">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Deployments list */}
            <AnimatePresence mode="popLayout">
              {deployments.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {deployments.map((d) => (
                    <DeployRow
                      key={d.id}
                      d={d}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-5 py-20"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl
                                  border border-dashed border-[rgba(99,102,241,0.2)]
                                  bg-[rgba(99,102,241,0.04)]">
                    <Rocket size={24} className="text-[#3a3a5a]" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-[#c0c0e0]">No deployments yet</p>
                    <p className="text-sm text-[#5050a0] mt-1 max-w-xs">
                      Run a pipeline and click "Deploy this pipeline" to turn it into a live API or WhatsApp bot.
                    </p>
                  </div>
                  <a
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-xl bg-[#6366f1] px-6 py-2.5
                               text-sm font-semibold text-white hover:bg-indigo-500 transition-all
                               shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  >
                    Go to dashboard
                    <ExternalLink size={13} />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </main>
      </div>
    </div>
  );
}
