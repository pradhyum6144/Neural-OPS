"use client";

import { motion } from "framer-motion";
import { Zap, Timer, Cpu, RefreshCw } from "lucide-react";
import type { MetricState } from "@/hooks/use-dashboard";

const MAX_VALUES = { tokens: 5000, latency: 200, gpu: 100, retries: 10 };

interface MetricCardProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function MetricCard({ label, value, max, unit, icon: Icon, color, bgColor }: MetricCardProps) {
  const pct = Math.min((value / max) * 100, 100);

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
          {value.toLocaleString()}
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

export function InfraHeatmap({ metrics }: { metrics: MetricState }) {
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
      label: "Avg Latency",
      value: metrics.latency,
      max: MAX_VALUES.latency,
      unit: "ms",
      icon: Timer,
      color: "#22d3a5",
      bgColor: "rgba(34,211,165,0.12)",
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
    </div>
  );
}
