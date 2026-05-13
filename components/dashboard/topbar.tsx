"use client";

import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface TopbarProps {
  isRunning: boolean;
  isDone: boolean;
}

export function Topbar({ isRunning, isDone }: TopbarProps) {
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between
                       border-b border-[rgba(99,102,241,0.1)] bg-[rgba(10,10,15,0.9)]
                       backdrop-blur-xl px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[#4a4a6a]">Neural OPS</span>
        <ChevronRight size={13} className="text-[#2a2a3a]" />
        <span className="text-[#e0e0ff] font-medium">Command Center</span>
      </div>

      {/* Status + avatar */}
      <div className="flex items-center gap-4">
        <motion.div
          key={statusLabel}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-full border border-[rgba(99,102,241,0.15)]
                     bg-[rgba(99,102,241,0.06)] px-3 py-1.5"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          <span className="text-xs font-medium tracking-wide"
                style={{ color: isRunning ? "#f59e0b" : "#22d3a5" }}>
            {statusLabel}
          </span>
        </motion.div>

        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full
                        bg-[rgba(99,102,241,0.2)] border border-[rgba(99,102,241,0.3)]
                        text-xs font-bold text-[#6366f1]">
          NP
        </div>
      </div>
    </header>
  );
}
