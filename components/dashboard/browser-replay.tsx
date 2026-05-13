"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ArrowLeft, ArrowRight, Lock } from "lucide-react";

interface BrowserReplayProps {
  url: string;
  loading: boolean;
}

function SkeletonLine({ w, delay = 0 }: { w: string; delay?: number }) {
  return (
    <motion.div
      className="h-2.5 rounded-full bg-[rgba(99,102,241,0.08)]"
      style={{ width: w }}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.6, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function SkeletonBlock({ h, delay = 0 }: { h: number; delay?: number }) {
  return (
    <motion.div
      className="w-full rounded-lg bg-[rgba(99,102,241,0.05)]"
      style={{ height: h }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 2, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function BrowserReplay({ url, loading }: BrowserReplayProps) {
  const isBlank = url === "about:blank";

  return (
    <div className="nos-panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(99,102,241,0.08)]">
        <span className="nos-label">Browser Replay</span>
        <div className="flex items-center gap-1.5">
          {loading && <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b] animate-pulse" />}
          <span className="text-[10px] font-mono text-[#4a4a6a]">
            {loading ? "navigating…" : isBlank ? "idle" : "loaded"}
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-3 gap-3">
        {/* Browser chrome */}
        <div className="rounded-lg border border-[rgba(99,102,241,0.1)] bg-[rgba(10,10,20,0.7)] overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[rgba(99,102,241,0.08)]">
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-[rgba(244,63,94,0.4)]" />
              <div className="h-2 w-2 rounded-full bg-[rgba(245,158,11,0.4)]" />
              <div className="h-2 w-2 rounded-full bg-[rgba(34,211,165,0.4)]" />
            </div>
            <div className="flex items-center gap-1 ml-1">
              <ArrowLeft size={10} className="text-[#3a3a5a]" />
              <ArrowRight size={10} className="text-[#3a3a5a]" />
              <RefreshCw size={9} className={loading ? "text-[#6366f1] animate-spin" : "text-[#3a3a5a]"} />
            </div>
            {/* URL bar */}
            <div className="flex flex-1 items-center gap-1.5 rounded-md bg-[rgba(99,102,241,0.06)]
                            border border-[rgba(99,102,241,0.1)] px-2 py-1 mx-1">
              <Lock size={8} className="text-[#22d3a5] flex-shrink-0" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={url}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-[9px] text-[#6b6b8a] truncate"
                >
                  {isBlank ? "about:blank" : url}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Page content */}
          <div className="relative p-3 min-h-[140px]">
            {isBlank ? (
              <div className="flex items-center justify-center h-[120px]">
                <p className="text-[10px] font-mono text-[#2a2a4a]">No page loaded</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {/* Header row */}
                <div className="flex items-center gap-2">
                  <SkeletonBlock h={28} delay={0} />
                </div>
                <SkeletonLine w="70%" delay={0.1} />
                <SkeletonLine w="55%" delay={0.15} />
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <SkeletonBlock h={48} delay={0.2} />
                  <SkeletonBlock h={48} delay={0.3} />
                  <SkeletonBlock h={48} delay={0.4} />
                </div>
                <SkeletonLine w="80%" delay={0.2} />
                <SkeletonLine w="45%" delay={0.25} />
                <SkeletonLine w="65%" delay={0.3} />

                {/* Animated cursor */}
                {loading && (
                  <motion.div
                    className="absolute"
                    animate={{ x: [20, 80, 60, 120, 90], y: [20, 40, 70, 55, 90] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="relative">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#6366f1] opacity-80 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                      <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-[#6366f1] animate-ping opacity-40" />
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
