"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Database, Key } from "lucide-react";
import type { MemoryEntry } from "@/hooks/use-dashboard";

function MemoryCard({ entry, index }: { entry: MemoryEntry; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ type: "spring", stiffness: 400, damping: 28, delay: index * 0.04 }}
      className="rounded-xl border border-[rgba(99,102,241,0.18)] bg-[rgba(99,102,241,0.06)]
                 p-3 hover:border-[rgba(99,102,241,0.35)] hover:bg-[rgba(99,102,241,0.09)]
                 transition-colors duration-200 cursor-default"
    >
      {/* Key */}
      <div className="flex items-center gap-1.5 mb-2">
        <Key size={9} className="text-[#6366f1] flex-shrink-0" />
        <span className="font-mono text-[10px] font-bold text-[#6366f1] truncate">{entry.key}</span>
      </div>
      {/* Value */}
      <p className="font-mono text-[10px] text-[#8080a0] leading-relaxed line-clamp-2">
        {entry.value}
      </p>
    </motion.div>
  );
}

export function MemoryNodes({ memories }: { memories: MemoryEntry[] }) {
  return (
    <div className="nos-panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(99,102,241,0.08)]">
        <span className="nos-label">Memory Nodes</span>
        <div className="flex items-center gap-1.5">
          <Database size={11} className="text-[#4a4a6a]" />
          <span className="text-[10px] font-mono text-[#4a4a6a]">{memories.length} entries</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3" style={{ maxHeight: 260 }}>
        {memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Database size={24} className="text-[#2a2a4a]" />
            <p className="text-[11px] font-mono text-[#2a2a4a]">No memory entries yet</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-2">
            <AnimatePresence mode="popLayout">
              {memories.map((m, i) => (
                <MemoryCard key={m.id} entry={m} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
