"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, Monitor, TrendingUp, Mic } from "lucide-react";
import { clsx } from "clsx";
import type { AgentState, AgentStatus } from "@/hooks/use-dashboard";

const ICONS: Record<string, React.ElementType> = {
  planner:  Brain,
  research: Search,
  browser:  Monitor,
  finance:  TrendingUp,
  voice:    Mic,
};

const STATUS_CONFIG: Record<AgentStatus, { label: string; dot: string; badge: string; border: string }> = {
  idle:   { label: "IDLE",   dot: "bg-[#3a3a5a]",  badge: "text-[#4a4a6a] bg-[rgba(99,102,241,0.05)] border-[rgba(99,102,241,0.1)]",  border: "border-[rgba(99,102,241,0.08)]" },
  active: { label: "ACTIVE", dot: "bg-[#6366f1]",  badge: "text-[#6366f1] bg-[rgba(99,102,241,0.12)] border-[rgba(99,102,241,0.3)]", border: "border-[rgba(99,102,241,0.4)]" },
  done:   { label: "DONE",   dot: "bg-[#22d3a5]",  badge: "text-[#22d3a5] bg-[rgba(34,211,165,0.1)]  border-[rgba(34,211,165,0.3)]",  border: "border-[rgba(34,211,165,0.2)]" },
  error:  { label: "ERROR",  dot: "bg-[#f43f5e]",  badge: "text-[#f43f5e] bg-[rgba(244,63,94,0.1)]   border-[rgba(244,63,94,0.3)]",   border: "border-[rgba(244,63,94,0.2)]"  },
};

function AgentCard({ agent, index }: { agent: AgentState; index: number }) {
  const Icon = ICONS[agent.id] ?? Brain;
  const cfg = STATUS_CONFIG[agent.status];
  const isActive = agent.status === "active";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className={clsx(
        "relative flex items-center gap-3 rounded-xl border p-3",
        "bg-[rgba(10,10,20,0.6)] transition-all duration-300",
        cfg.border,
        isActive && "shadow-[0_0_16px_rgba(99,102,241,0.15)]"
      )}
    >
      {/* Active glow */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl bg-[rgba(99,102,241,0.04)] pointer-events-none" />
      )}

      {/* Icon */}
      <div className={clsx(
        "relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border",
        isActive
          ? "bg-[rgba(99,102,241,0.15)] border-[rgba(99,102,241,0.4)]"
          : "bg-[rgba(99,102,241,0.05)] border-[rgba(99,102,241,0.1)]"
      )}>
        <Icon size={15} className={isActive ? "text-[#6366f1]" : "text-[#4a4a6a]"} />
        {isActive && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#6366f1]">
            <span className="absolute inset-0 rounded-full bg-[#6366f1] animate-ping opacity-75" />
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-xs font-semibold text-[#c0c0e0] truncate">{agent.name}</span>
          <span className={clsx("text-[9px] font-bold rounded-full px-1.5 py-0.5 border flex-shrink-0", cfg.badge)}>
            {cfg.label}
          </span>
        </div>
        <p className="text-[10px] text-[#4a4a6a] truncate">{agent.subStatus}</p>
      </div>

      {/* Token counter */}
      <div className="flex-shrink-0 text-right">
        <AnimatePresence mode="wait">
          <motion.span
            key={agent.tokens}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="block font-mono text-[10px] text-[#5a5a7a]"
          >
            {agent.tokens.toLocaleString()}
          </motion.span>
        </AnimatePresence>
        <span className="text-[9px] text-[#3a3a5a]">tkns</span>
      </div>

      {/* Status dot */}
      <div className="relative flex-shrink-0">
        <div className={clsx("h-1.5 w-1.5 rounded-full", cfg.dot)} />
        {isActive && (
          <div className={clsx("absolute inset-0 h-1.5 w-1.5 rounded-full animate-ping", cfg.dot, "opacity-60")} />
        )}
      </div>
    </motion.div>
  );
}

export function AgentFleet({ agents }: { agents: AgentState[] }) {
  return (
    <div className="nos-panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(99,102,241,0.08)]">
        <span className="nos-label">Agent Fleet</span>
        <span className="text-[10px] font-mono text-[#4a4a6a]">
          {agents.filter((a) => a.status === "active").length} active
        </span>
      </div>
      <div className="flex flex-col gap-2 p-3 overflow-y-auto">
        {agents.map((a, i) => (
          <AgentCard key={a.id} agent={a} index={i} />
        ))}
      </div>
    </div>
  );
}
