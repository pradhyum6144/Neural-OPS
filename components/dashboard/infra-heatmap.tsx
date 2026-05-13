"use client";

import { motion } from "framer-motion";
import { Zap, Timer, Cpu, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { MetricState } from "@/hooks/use-dashboard";

const MAX_VALUES = { tokens: 5000, latency: 5000, gpu: 100, retries: 10 };
const DAILY_LIMIT = 50000;

interface MetricCardProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  formatValue?: (v: number) => string;
}

function MetricCard({ label, value, max, unit, icon: Icon, color, bgColor, formatValue }: MetricCardProps) {
  const pct = Math.min((value / max) * 100, 100);
  const displayValue = formatValue ? formatValue(value) : value.toLocaleString();

  return (
    <div className="rounded-xl border border-[rgba(99,102,241,0.1)] bg-[rgba(10,10,20,0.6)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg"
               style={{ background: bgColor }}>
            <Icon size={13} style={{ color }} />
          </div>
          <span className="text-xs font-medium text-[#9090b0]">{label}</span>
        </div>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-sm font-bold"
          style={{ color }}
        >
          {displayValue}
          <span className="text-[10px] font-normal text-[#4a4a6a] ml-0.5">{unit}</span>
        </motion.span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-[rgba(99,102,241,0.08)]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="flex justify-between mt-1.5">
        <span className="text-[9px] text-[#3a3a5a] font-mono">0</span>
        <span className="text-[9px] text-[#3a3a5a] font-mono">{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

export function InfraHeatmap({
  metrics,
  userId = "anonymous",
  costThisRun,
  savedToday,
  modelUsed,
}: {
  metrics: MetricState;
  costThisRun?: number | null;
  savedToday?: number;
  modelUsed?: string | null;
  userId?: string;
}) {
  const [todayTotal, setTodayTotal] = useState(0);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch(`/api/alerts/usage?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const json = (await res.json()) as { todayTotal: number };
          setTodayTotal(json.todayTotal ?? 0);
        }
      } catch {
        // silently ignore — badge stays at 0
      }
    };

    fetchUsage();
    const id = setInterval(fetchUsage, 30_000);
    return () => clearInterval(id);
  }, [userId]);

  const usagePct = Math.min((todayTotal / DAILY_LIMIT) * 100, 100);
  const barColor =
    usagePct >= 80 ? "#f43f5e" : usagePct >= 60 ? "#f59e0b" : "#22d3a5";
  const isWarning = usagePct >= 80;

  const cards: MetricCardProps[] = [
    {
      label: "Tokens Used",
      value: metrics.tokens,
      max: MAX_VALUES.tokens,
      unit: "tkns",
      icon: Zap,
      color: "#6366f1",
      bgColor: "rgba(99,102,241,0.12)",
    },
    {
      label: "Pipeline Latency",
      value: metrics.latency,
      max: MAX_VALUES.latency,
      unit: metrics.latency >= 1000 ? "s" : "ms",
      icon: Timer,
      color: "#22d3a5",
      bgColor: "rgba(34,211,165,0.12)",
      formatValue: (v) => v >= 1000 ? (v / 1000).toFixed(1) : v.toLocaleString(),
    },
    {
      label: "GPU Usage",
      value: metrics.gpu,
      max: MAX_VALUES.gpu,
      unit: "%",
      icon: Cpu,
      color: "#f59e0b",
      bgColor: "rgba(245,158,11,0.12)",
    },
    {
      label: "Retries",
      value: metrics.retries,
      max: MAX_VALUES.retries,
      unit: "",
      icon: RefreshCw,
      color: "#f43f5e",
      bgColor: "rgba(244,63,94,0.12)",
    },
  ];

  return (
    <div className="nos-panel flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-[rgba(99,102,241,0.08)]">
        <span className="nos-label">Infra Heatmap</span>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {cards.map((c) => (
          <MetricCard key={c.label} {...c} />
        ))}
      </div>

      {/* Daily token usage badge */}
      <div className="px-4 pb-4 border-t border-[rgba(99,102,241,0.06)] pt-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] text-[#6060a0] font-mono">
            Daily limit: {todayTotal.toLocaleString()} / {DAILY_LIMIT.toLocaleString()} tokens used
          </span>
          {isWarning && (
            <span className="text-[11px] leading-none animate-pulse select-none">⚠</span>
          )}
        </div>
        <div className="h-1.5 w-full rounded-full bg-[rgba(99,102,241,0.08)]">
          <motion.div
            className="h-full rounded-full"
            style={{ background: barColor }}
            animate={{ width: `${usagePct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Cost this run / saved today / model used */}
      {(costThisRun != null || savedToday != null || modelUsed) && (
        <div className="px-4 pb-4 border-t border-[rgba(99,102,241,0.06)] pt-3 flex flex-col gap-1.5">
          {costThisRun != null && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#6060a0] font-mono">Cost this run</span>
              <motion.span
                key={costThisRun}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[11px] font-mono font-semibold text-[#22d3a5]"
              >
                ₹{costThisRun.toFixed(2)}
              </motion.span>
            </div>
          )}
          {savedToday != null && savedToday > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#6060a0] font-mono">Saved today</span>
              <motion.span
                key={savedToday}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[11px] font-mono font-semibold text-[#22d3a5]"
              >
                ₹{savedToday.toFixed(2)}
              </motion.span>
            </div>
          )}
          {modelUsed && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#6060a0] font-mono">Model used</span>
              <span className="text-[10px] font-mono text-[#9090b0] border border-[rgba(99,102,241,0.2)] rounded px-1.5 py-0.5">
                {modelUsed}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
