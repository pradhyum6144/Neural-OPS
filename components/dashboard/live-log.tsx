"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { Copy, Check } from "lucide-react";
import type { LogEntry, LogLevel } from "@/hooks/use-dashboard";

const LEVEL_STYLE: Record<LogLevel, string> = {
  info:    "text-[#6366f1]",
  success: "text-[#22d3a5]",
  warn:    "text-[#f59e0b]",
  error:   "text-[#f43f5e]",
};

const LEVEL_LABEL: Record<LogLevel, string> = {
  info:    "INFO ",
  success: "OK   ",
  warn:    "WARN ",
  error:   "ERR  ",
};

export function LiveLog({ logs }: { logs: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleCopy = () => {
    const text = logs.map((e) => `${e.ts} [${e.level.toUpperCase()}] ${e.message}`).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="nos-panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(99,102,241,0.08)]">
        <span className="nos-label">Live Log</span>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-[#22d3a5] animate-pulse" />
              <button
                onClick={handleCopy}
                title="Copy all logs"
                className="flex items-center gap-1 text-[10px] font-mono text-[#4a4a6a]
                           hover:text-[#9090b0] transition-colors"
              >
                {copied ? <Check size={10} className="text-[#22d3a5]" /> : <Copy size={10} />}
                {copied ? "copied" : "copy"}
              </button>
            </>
          )}
          <span className="text-[10px] font-mono text-[#4a4a6a]">{logs.length} entries</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 min-h-0" style={{ maxHeight: 220 }}>
        {logs.length === 0 ? (
          <p className="text-[11px] font-mono text-[#2a2a4a] text-center py-6">
            Awaiting pipeline execution…
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {logs.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2 font-mono text-[10px] leading-[1.7]"
              >
                <span className="text-[#2a2a4a] flex-shrink-0">{entry.ts}</span>
                <span className={clsx("font-bold flex-shrink-0", LEVEL_STYLE[entry.level])}>
                  {LEVEL_LABEL[entry.level]}
                </span>
                <span className="text-[#8080a0]">{entry.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
