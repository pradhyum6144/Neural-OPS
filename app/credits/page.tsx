"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  ChevronRight, Wallet, Zap, IndianRupee, TrendingDown,
  Cpu, X, Check, Download, ChevronLeft, ChevronRight as ChevronR,
  Save, Bell,
} from "lucide-react";
import { clsx } from "clsx";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useCredits } from "@/hooks/use-credits";
import { useRunHistory } from "@/hooks/use-run-history";
import type { RunRecord } from "@/hooks/use-run-history";

// ── Constants ──────────────────────────────────────────────────────────────

const TOPUP_PRESETS = [99, 299, 499, 999] as const;
const ALERT_THRESHOLDS = [50, 100, 200] as const;
const PAGE_SIZE = 10;
const CREDIT_STORAGE = "nos_credits";

// ── Helpers ────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function downloadCSV(records: RunRecord[]) {
  const header = "Date,Command,Model,Tokens,Cost (₹),Saved (₹)\n";
  const rows = records.map((r) =>
    [
      new Date(r.date).toLocaleDateString("en-IN"),
      `"${r.command.replace(/"/g, "'").slice(0, 60)}"`,
      r.model,
      r.tokens,
      r.costINR.toFixed(2),
      r.savedINR.toFixed(2),
    ].join(",")
  );
  const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nos-usage-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Alert settings storage ─────────────────────────────────────────────────

const ALERT_KEY = "nos_credit_alerts";
interface AlertSettings { threshold: number; channel: "whatsapp" | "email" | "both" }
const DEFAULT_ALERT: AlertSettings = { threshold: 100, channel: "both" };

function loadAlerts(): AlertSettings {
  if (typeof window === "undefined") return DEFAULT_ALERT;
  try {
    const raw = localStorage.getItem(ALERT_KEY);
    return raw ? (JSON.parse(raw) as AlertSettings) : DEFAULT_ALERT;
  } catch { return DEFAULT_ALERT; }
}

// ── Top-up Modal ───────────────────────────────────────────────────────────

function TopUpModal({
  onTopUp,
  onClose,
}: {
  onTopUp: (amount: number) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(299);
  const [custom, setCustom]     = useState("");
  const [method, setMethod]     = useState<"upi" | "card" | "netbanking">("upi");
  const [paying, setPaying]     = useState(false);
  const [success, setSuccess]   = useState(false);

  const effectiveAmount = custom ? parseFloat(custom) || 0 : (selected ?? 0);

  const handlePay = async () => {
    if (effectiveAmount <= 0) return;
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1200)); // simulate payment
    setPaying(false);
    setSuccess(true);
    onTopUp(effectiveAmount);
    setTimeout(onClose, 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-[rgba(5,5,12,0.88)] backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="w-full max-w-md rounded-2xl border border-[rgba(99,102,241,0.25)]
                   bg-[rgba(10,10,20,0.98)] shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
      >
        {success ? (
          <div className="flex flex-col items-center p-10 gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full
                            bg-[rgba(34,211,165,0.12)] border border-[rgba(34,211,165,0.3)]">
              <Check size={28} className="text-[#22d3a5]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#e0e0ff]">₹{effectiveAmount} added!</p>
              <p className="text-sm text-[#22d3a5] mt-1">
                ~{Math.floor(effectiveAmount * 500).toLocaleString()} tokens added to your balance
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[rgba(99,102,241,0.08)]">
              <div>
                <p className="font-bold text-[#e0e0ff]">Add Credits</p>
                <p className="text-xs text-[#5050a0] mt-0.5">1 credit = 1,000 tokens</p>
              </div>
              <button onClick={onClose} className="text-[#4a4a6a] hover:text-[#9090b0] transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Quick amount selector */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold text-[#5050a0] uppercase tracking-wider">Choose amount</p>
                <div className="grid grid-cols-4 gap-2">
                  {TOPUP_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => { setSelected(amt); setCustom(""); }}
                      className={clsx(
                        "rounded-xl border py-2.5 text-sm font-bold transition-all duration-150",
                        selected === amt && !custom
                          ? "border-[rgba(99,102,241,0.6)] bg-[rgba(99,102,241,0.12)] text-[#a0a0ff]"
                          : "border-[rgba(99,102,241,0.15)] text-[#6060a0] hover:border-[rgba(99,102,241,0.35)] hover:text-[#9090c0]"
                      )}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#4a4a6a]">Custom:</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5050a0]">₹</span>
                    <input
                      type="number"
                      min="10"
                      max="50000"
                      value={custom}
                      onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
                      placeholder="Enter amount"
                      className="w-full rounded-xl border border-[rgba(99,102,241,0.15)] bg-[rgba(10,10,20,0.8)]
                                 pl-7 pr-3 py-2 text-sm text-[#e0e0ff] placeholder:text-[#3a3a5a]
                                 outline-none focus:border-[rgba(99,102,241,0.5)] transition-colors"
                    />
                  </div>
                </div>
                {effectiveAmount > 0 && (
                  <p className="text-[10px] text-[#22d3a5] font-mono">
                    ~{Math.floor(effectiveAmount * 500).toLocaleString()} tokens added
                  </p>
                )}
              </div>

              {/* Payment method */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold text-[#5050a0] uppercase tracking-wider">Pay via</p>
                <div className="flex flex-col gap-2">
                  {[
                    { key: "upi",        label: "UPI",         hint: "GPay · PhonePe · Paytm · BHIM", emoji: "📱" },
                    { key: "card",       label: "Card",        hint: "Visa · Mastercard · RuPay",     emoji: "💳" },
                    { key: "netbanking", label: "Net Banking", hint: "All major Indian banks",         emoji: "🏦" },
                  ].map(({ key, label, hint, emoji }) => (
                    <button
                      key={key}
                      onClick={() => setMethod(key as typeof method)}
                      className={clsx(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150",
                        method === key
                          ? "border-[rgba(99,102,241,0.45)] bg-[rgba(99,102,241,0.08)]"
                          : "border-[rgba(99,102,241,0.12)] hover:border-[rgba(99,102,241,0.3)]"
                      )}
                    >
                      <span className="text-xl">{emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#c0c0e0]">{label}</p>
                        <p className="text-[10px] text-[#5050a0]">{hint}</p>
                      </div>
                      {method === key && <Check size={14} className="text-[#6366f1] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={paying || effectiveAmount <= 0}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#6366f1]
                           py-3 text-sm font-semibold text-white hover:bg-indigo-500
                           disabled:opacity-40 disabled:cursor-not-allowed transition-all
                           shadow-[0_0_24px_rgba(99,102,241,0.3)]"
              >
                {paying ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <IndianRupee size={14} />
                    Pay ₹{effectiveAmount || 0} · Add{" "}
                    {effectiveAmount ? `${Math.floor(effectiveAmount * 500).toLocaleString()} tokens` : "credits"}
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-[#3a3a5a]">
                Secure payment · No dollar billing · GST included
              </p>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Stat card (same style as infra heatmap) ────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-[rgba(99,102,241,0.1)] bg-[rgba(10,10,20,0.6)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: bg }}>
            <Icon size={13} style={{ color }} />
          </div>
          <span className="text-xs font-medium text-[#9090b0]">{label}</span>
        </div>
      </div>
      <p className="font-mono text-xl font-bold" style={{ color }}>
        {value}
        {unit && <span className="text-[11px] font-normal text-[#4a4a6a] ml-1">{unit}</span>}
      </p>
    </div>
  );
}

// ── Custom recharts tooltip ────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[rgba(99,102,241,0.25)] bg-[rgba(12,12,22,0.98)]
                    px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-[#e0e0ff] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-[#9090b0]">
          {p.name}: <span className="font-mono text-[#22d3a5]">₹{p.value.toFixed(2)}</span>
        </p>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function CreditsPage() {
  const { balance, addCredits }   = useCredits();
  const { records }               = useRunHistory();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [page, setPage]           = useState(0);
  const [alerts, setAlerts]       = useState<{ threshold: number; channel: "whatsapp" | "email" | "both" }>(DEFAULT_ALERT);
  const [alertsSaved, setAlertsSaved] = useState(false);

  useEffect(() => { setAlerts(loadAlerts()); }, []);

  // Today's records
  const today = todayISO();
  const todayRecords = useMemo(
    () => records.filter((r) => r.date.startsWith(today)),
    [records, today]
  );

  const tokensToday   = todayRecords.reduce((s, r) => s + r.tokens, 0);
  const costToday     = todayRecords.reduce((s, r) => s + r.costINR, 0);
  const savedToday    = todayRecords.reduce((s, r) => s + r.savedINR, 0);
  const noRouterCost  = costToday + savedToday;

  // Model usage breakdown
  const modelCounts = useMemo(() => {
    const freq: Record<string, number> = {};
    todayRecords.forEach((r) => { freq[r.model] = (freq[r.model] ?? 0) + 1; });
    return freq;
  }, [todayRecords]);
  const topModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0];
  const topModelLabel = topModel
    ? `${topModel[0]} (${Math.round((topModel[1] / todayRecords.length) * 100)}%)`
    : "—";

  // Balance progress (assume monthly budget = ₹500)
  const MONTHLY_BUDGET = 500;
  const monthRecords = useMemo(() => {
    const since = new Date();
    since.setDate(1);
    return records.filter((r) => new Date(r.date) >= since);
  }, [records]);
  const spentThisMonth = monthRecords.reduce((s, r) => s + r.costINR, 0);
  const usedPct = Math.min((spentThisMonth / MONTHLY_BUDGET) * 100, 100);

  // Bar chart data — last 7 days
  const chartData = useMemo(() => {
    const days: { date: string; withRouter: number; withoutRouter: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayRecs = records.filter((r) => r.date.startsWith(key));
      const withRouter     = Math.round(dayRecs.reduce((s, r) => s + r.costINR, 0) * 100) / 100;
      const withoutRouter  = Math.round(dayRecs.reduce((s, r) => s + r.costINR + r.savedINR, 0) * 100) / 100;
      days.push({
        date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        withRouter,
        withoutRouter,
      });
    }
    return days;
  }, [records]);

  // Pagination
  const totalPages = Math.ceil(records.length / PAGE_SIZE);
  const pageRecords = records.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleTopUp = useCallback((amount: number) => {
    addCredits(amount);
    // Fire-and-forget to backend
    fetch("/api/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "add", amountINR: amount }),
    }).catch(() => {});
  }, [addCredits]);

  const handleSaveAlerts = () => {
    try { localStorage.setItem(ALERT_KEY, JSON.stringify(alerts)); } catch { /* noop */ }
    setAlertsSaved(true);
    setTimeout(() => setAlertsSaved(false), 2000);
  };

  const tokensEstimate = Math.floor(balance * 500);

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
            <span className="font-medium text-[#e0e0ff]">Credits & Billing</span>
          </div>
          <button
            onClick={() => setTopUpOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[#6366f1] px-4 py-1.5
                       text-xs font-semibold text-white hover:bg-indigo-500 transition-all
                       shadow-[0_0_16px_rgba(99,102,241,0.25)]"
          >
            <IndianRupee size={12} />
            Add credits
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">

            {/* ── Balance card ──────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[rgba(99,102,241,0.2)]
                         bg-[rgba(10,10,20,0.7)] p-6 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[10px] font-semibold text-[#5050a0] uppercase tracking-wider mb-1">
                    Current balance
                  </p>
                  <motion.p
                    key={balance}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-bold font-mono text-[#e0e0ff]"
                  >
                    <span className="text-2xl text-[#6366f1] mr-1">₹</span>
                    {balance.toFixed(2)}
                  </motion.p>
                  <p className="text-sm text-[#6060a0] mt-1">
                    ~{tokensEstimate.toLocaleString()} tokens at average usage
                  </p>
                </div>
                <button
                  onClick={() => setTopUpOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-[rgba(99,102,241,0.35)]
                             bg-[rgba(99,102,241,0.08)] px-5 py-2.5 text-sm font-semibold text-[#8080d0]
                             hover:bg-[rgba(99,102,241,0.15)] hover:text-[#a0a0ff] transition-all"
                >
                  <IndianRupee size={14} />
                  Add credits
                </button>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-[#5050a0] font-mono">Used this month</span>
                  <span className="text-[10px] font-mono text-[#7070a0]">
                    ₹{spentThisMonth.toFixed(2)} / ₹{MONTHLY_BUDGET}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[rgba(99,102,241,0.08)]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: usedPct >= 80 ? "#f43f5e" : usedPct >= 60 ? "#f59e0b" : "#6366f1",
                    }}
                    animate={{ width: `${usedPct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>

            {/* ── Usage stats cards ──────────────────────────────────── */}
            <section>
              <p className="text-[10px] font-semibold text-[#6366f1] uppercase tracking-wider mb-3">
                Today&apos;s usage
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={Zap}         label="Tokens used"     value={tokensToday.toLocaleString()}          unit="tkns"  color="#6366f1" bg="rgba(99,102,241,0.12)" />
                <StatCard icon={IndianRupee} label="Cost today"      value={`₹${costToday.toFixed(2)}`}            color="#f43f5e" bg="rgba(244,63,94,0.12)" />
                <StatCard icon={TrendingDown} label="Saved by router" value={`₹${savedToday.toFixed(2)}`}          color="#22d3a5" bg="rgba(34,211,165,0.12)" />
                <StatCard icon={Cpu}          label="Top model"       value={topModelLabel}                         color="#f59e0b" bg="rgba(245,158,11,0.12)" />
              </div>
            </section>

            {/* ── Savings breakdown chart ────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-[10px] font-semibold text-[#6366f1] uppercase tracking-wider">
                  Savings breakdown — last 7 days
                </p>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1.5 text-[#4a4a6a]">
                    <span className="inline-block h-2 w-3 rounded bg-[rgba(99,102,241,0.4)]" />
                    Without Router
                  </span>
                  <span className="flex items-center gap-1.5 text-[#22d3a5]">
                    <span className="inline-block h-2 w-3 rounded bg-[#22d3a5]" />
                    With Smart Router
                  </span>
                </div>
              </div>

              {/* Today summary strip */}
              <div className="rounded-xl border border-[rgba(34,211,165,0.15)] bg-[rgba(34,211,165,0.03)] p-3 mb-3
                              flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                <span className="text-[#6060a0]">
                  Without Smart Router (all Claude Sonnet):
                  <span className="font-mono text-[#c0c0e0] ml-1">₹{noRouterCost.toFixed(2)}</span>
                </span>
                <span className="hidden sm:inline text-[#3a3a5a]">·</span>
                <span className="text-[#6060a0]">
                  With Smart Router:
                  <span className="font-mono text-[#22d3a5] ml-1">₹{costToday.toFixed(2)}</span>
                </span>
                <span className="hidden sm:inline text-[#3a3a5a]">·</span>
                <span className="font-semibold text-[#22d3a5]">
                  You saved ₹{savedToday.toFixed(2)} today
                </span>
              </div>

              <div className="rounded-2xl border border-[rgba(99,102,241,0.1)] bg-[rgba(10,10,20,0.5)] p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} barCategoryGap="30%">
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#5050a0", fontSize: 10, fontFamily: "monospace" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#5050a0", fontSize: 10, fontFamily: "monospace" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v}`}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
                    <Bar dataKey="withoutRouter" name="Without Router" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill="rgba(99,102,241,0.25)" />
                      ))}
                    </Bar>
                    <Bar dataKey="withRouter" name="With Router" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill="#22d3a5" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* ── Usage history table ────────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-[10px] font-semibold text-[#6366f1] uppercase tracking-wider">
                  Usage history
                </p>
                {records.length > 0 && (
                  <button
                    onClick={() => downloadCSV(records)}
                    className="flex items-center gap-1.5 rounded-lg border border-[rgba(99,102,241,0.2)]
                               px-3 py-1.5 text-[10px] font-semibold text-[#6060a0]
                               hover:text-[#9090c0] hover:border-[rgba(99,102,241,0.35)] transition-all"
                  >
                    <Download size={11} />
                    Export CSV
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-[rgba(99,102,241,0.1)] overflow-hidden">
                {records.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-2">
                    <Wallet size={24} className="text-[#2a2a4a]" />
                    <p className="text-sm text-[#4a4a6a]">No runs yet. Run a pipeline to see usage here.</p>
                  </div>
                ) : (
                  <>
                    {/* Table header */}
                    <div className="grid grid-cols-6 gap-2 px-4 py-2.5 border-b border-[rgba(99,102,241,0.08)]
                                    bg-[rgba(5,5,15,0.5)]">
                      {["Date", "Command", "Model", "Tokens", "Cost ₹", "Saved ₹"].map((col) => (
                        <p key={col} className="text-[9px] font-semibold text-[#4a4a6a] uppercase tracking-wider">
                          {col}
                        </p>
                      ))}
                    </div>

                    {/* Rows */}
                    {pageRecords.map((r, i) => (
                      <div
                        key={r.id}
                        className={clsx(
                          "grid grid-cols-6 gap-2 px-4 py-2.5 items-center text-[11px]",
                          i % 2 === 0 ? "bg-[rgba(10,10,20,0.4)]" : "bg-transparent"
                        )}
                      >
                        <span className="font-mono text-[#5050a0]">{formatDate(r.date)}</span>
                        <span className="text-[#9090b0] truncate col-span-1" title={r.command}>
                          {r.command.slice(0, 30)}{r.command.length > 30 ? "…" : ""}
                        </span>
                        <span className="font-mono text-[#7070a0] truncate" title={r.model}>
                          {r.model.split(" ").slice(-1)[0]}
                        </span>
                        <span className="font-mono text-[#6060a0]">{r.tokens.toLocaleString()}</span>
                        <span className="font-mono text-[#f43f5e]">₹{r.costINR.toFixed(2)}</span>
                        <span className="font-mono text-[#22d3a5]">₹{r.savedINR.toFixed(2)}</span>
                      </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3
                                      border-t border-[rgba(99,102,241,0.08)] bg-[rgba(5,5,15,0.5)]">
                        <span className="text-[10px] font-mono text-[#4a4a6a]">
                          {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, records.length)} of {records.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border
                                       border-[rgba(99,102,241,0.15)] text-[#5050a0] hover:text-[#9090b0]
                                       disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <ChevronLeft size={12} />
                          </button>
                          <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border
                                       border-[rgba(99,102,241,0.15)] text-[#5050a0] hover:text-[#9090b0]
                                       disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <ChevronR size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* ── Alert settings (inline) ────────────────────────────── */}
            <section>
              <p className="text-[10px] font-semibold text-[#6366f1] uppercase tracking-wider mb-3">
                Credit alerts
              </p>
              <div className="rounded-2xl border border-[rgba(99,102,241,0.1)]
                              bg-[rgba(10,10,20,0.5)] p-5 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
                  <span className="text-sm text-[#9090b0] flex-shrink-0">
                    Alert me when balance drops below:
                  </span>
                  <div className="flex items-center gap-2">
                    {ALERT_THRESHOLDS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setAlerts((a) => ({ ...a, threshold: t }))}
                        className={clsx(
                          "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                          alerts.threshold === t
                            ? "border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.12)] text-[#a0a0ff]"
                            : "border-[rgba(99,102,241,0.15)] text-[#5050a0] hover:border-[rgba(99,102,241,0.3)]"
                        )}
                      >
                        ₹{t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
                  <span className="text-sm text-[#9090b0] flex-shrink-0">Alert via:</span>
                  <div className="flex items-center gap-2">
                    {(["whatsapp", "email", "both"] as const).map((ch) => (
                      <button
                        key={ch}
                        onClick={() => setAlerts((a) => ({ ...a, channel: ch }))}
                        className={clsx(
                          "rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition-all",
                          alerts.channel === ch
                            ? "border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.12)] text-[#a0a0ff]"
                            : "border-[rgba(99,102,241,0.15)] text-[#5050a0] hover:border-[rgba(99,102,241,0.3)]"
                        )}
                      >
                        {ch === "whatsapp" ? "💬 WhatsApp" : ch === "email" ? "📧 Email" : "🔔 Both"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveAlerts}
                    className="flex items-center gap-2 rounded-xl bg-[#6366f1] px-5 py-2
                               text-xs font-semibold text-white hover:bg-indigo-500 transition-all"
                  >
                    {alertsSaved ? <Check size={12} /> : <Save size={12} />}
                    {alertsSaved ? "Saved!" : "Save settings"}
                  </button>
                  <p className="text-[10px] text-[#4a4a6a]">
                    Alert threshold: ₹{alerts.threshold} · Via {alerts.channel}
                  </p>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>

      <AnimatePresence>
        {topUpOpen && (
          <TopUpModal onTopUp={handleTopUp} onClose={() => setTopUpOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
