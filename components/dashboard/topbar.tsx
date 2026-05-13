"use client";

import { ChevronRight, Menu } from "lucide-react";
import { motion } from "framer-motion";

interface TopbarProps {
  isRunning: boolean;
  isDone: boolean;
  agentsDone?: number;
  agentsTotal?: number;
  pipelineElapsedMs?: number | null;
  onMenuOpen?: () => void;
}

export function Topbar({ isRunning, isDone, agentsDone = 0, agentsTotal = 5, pipelineElapsedMs, onMenuOpen }: TopbarProps) {
  const statusLabel = isRunning
    ? "PIPELINE RUNNING"
    : isDone
    ? "PIPELINE COMPLETE"
    : "ALL SYSTEMS OPERATIONAL";

  const dotClass = isRunning
    ? "bg-[#f59e0b] animate-pulse"
    : isDone
    ? "bg-[#22d3a5]"
    : "bg-[#22d3a5] animate-pulse";

  return (
    <header className="sticky top-0 z-30 flex flex-col
                       border-b border-[rgba(99,102,241,0.1)] bg-[rgba(10,10,15,0.9)]
                       backdrop-blur-xl">
      {/* Pipeline progress bar */}
      {(isRunning || isDone) && (
        <div className="h-0.5 w-full bg-[rgba(99,102,241,0.08)]">
          <motion.div
            className="h-full bg-[#6366f1]"
            animate={{ width: isDone ? "100%" : `${Math.round((agentsDone / agentsTotal) * 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      )}
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuOpen}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg
                     text-[#4a4a6a] hover:text-[#9090b0] hover:bg-[rgba(99,102,241,0.08)]
                     transition-all"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#4a4a6a] hidden sm:inline">Neural OPS</span>
          <ChevronRight size={13} className="text-[#2a2a3a] hidden sm:inline" />
          <span className="text-[#e0e0ff] font-medium">Command Center</span>
        </div>
      </div>

      {/* Status + avatar */}
      <div className="flex items-center gap-3 md:gap-4">
        <motion.div
          key={statusLabel}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-full border border-[rgba(99,102,241,0.15)]
                     bg-[rgba(99,102,241,0.06)] px-2.5 py-1.5 md:px-3"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          <span className="hidden sm:inline text-xs font-medium tracking-wide"
                style={{ color: isRunning ? "#f59e0b" : "#22d3a5" }}>
            {statusLabel}
          </span>
          {isDone && pipelineElapsedMs != null && (
            <span className="hidden sm:inline font-mono text-[10px] text-[#4a4a6a]">
              {pipelineElapsedMs < 60000
                ? `${(pipelineElapsedMs / 1000).toFixed(1)}s`
                : `${Math.floor(pipelineElapsedMs / 60000)}m ${Math.floor((pipelineElapsedMs % 60000) / 1000)}s`}
            </span>
          )}
        </motion.div>

        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full
                        bg-[rgba(99,102,241,0.2)] border border-[rgba(99,102,241,0.3)]
                        text-xs font-bold text-[#6366f1]">
          NP
        </div>
      </div>
      </div>
    </header>
  );
}
