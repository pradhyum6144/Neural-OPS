"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, Download, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

interface CommandInputProps {
  value: string;
  onChange: (v: string) => void;
  onExecute: () => void;
  onReset: () => void;
  onExport?: () => void;
  isRunning: boolean;
  isDone: boolean;
  simulateFailure: boolean;
  onSimulateFailureToggle: (v: boolean) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function CommandInput({
  value,
  onChange,
  onExecute,
  onReset,
  onExport,
  isRunning,
  isDone,
  simulateFailure,
  onSimulateFailureToggle,
  inputRef: externalRef,
}: CommandInputProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? internalRef;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isRunning && value.trim()) onExecute();
    }
  };

  return (
    <div className="px-4 md:px-6 py-3 md:py-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-2"
      >
        {/* Input row */}
        <div className="relative flex items-center gap-3 rounded-xl border border-[rgba(99,102,241,0.2)]
                        bg-[rgba(10,10,20,0.8)] px-3 md:px-4 py-2.5 md:py-3
                        focus-within:border-[rgba(99,102,241,0.55)]
                        focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1),0_0_20px_rgba(99,102,241,0.08)]
                        transition-all duration-200">
          <span className="font-mono text-[#6366f1] text-sm select-none flex-shrink-0">❯</span>

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
            placeholder="Type a command… e.g. Research NVIDIA stock and summarize latest AI news"
            className="flex-1 bg-transparent font-mono text-sm text-[#e0e0ff] placeholder:text-[#3a3a5a]
                       outline-none disabled:opacity-60 min-w-0"
          />

          {/* Shortcut hint */}
          <span className="hidden lg:flex items-center gap-1 text-[10px] text-[#3a3a5a] font-mono flex-shrink-0">
            <kbd className="rounded border border-[rgba(99,102,241,0.2)] px-1.5 py-0.5 text-[#4a4a6a]">⌘</kbd>
            <kbd className="rounded border border-[rgba(99,102,241,0.2)] px-1.5 py-0.5 text-[#4a4a6a]">↵</kbd>
          </span>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {isDone && onExport && (
              <button
                onClick={onExport}
                title="Export Report (⌘E)"
                className="flex h-8 items-center gap-1.5 rounded-lg border border-[rgba(99,102,241,0.2)]
                           px-2.5 text-[#6366f1] hover:bg-[rgba(99,102,241,0.1)]
                           transition-all duration-150 text-[11px] font-semibold"
              >
                <Download size={12} />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            {isDone && (
              <button
                onClick={onReset}
                title="Reset (Esc)"
                className="flex h-8 w-8 items-center justify-center rounded-lg
                           text-[#6b6b8a] hover:text-[#e0e0ff] hover:bg-[rgba(99,102,241,0.1)]
                           transition-all duration-150"
              >
                <RotateCcw size={14} />
              </button>
            )}

            <button
              onClick={onExecute}
              disabled={isRunning || !value.trim()}
              title="Execute (⌘↵)"
              className="flex items-center gap-2 rounded-lg bg-[#6366f1] hover:bg-indigo-500
                         px-3 md:px-4 py-1.5 text-xs font-semibold text-white
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-150
                         shadow-[0_0_12px_rgba(99,102,241,0.3)]
                         hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
            >
              {isRunning ? (
                <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Play size={12} className="fill-current" />
              )}
              <span className="hidden sm:inline">{isRunning ? "Running…" : "Execute"}</span>
            </button>
          </div>
        </div>

        {/* Toolbar row */}
        <div className="flex items-center gap-3 px-1">
          <button
            onClick={() => onSimulateFailureToggle(!simulateFailure)}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 border text-[10px] font-semibold transition-all duration-150",
              simulateFailure
                ? "border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.08)] text-[#f59e0b]"
                : "border-[rgba(99,102,241,0.1)] text-[#4a4a6a] hover:text-[#8080a0] hover:border-[rgba(99,102,241,0.2)]"
            )}
          >
            <AlertTriangle size={10} />
            Simulate failure
            <span className={clsx(
              "ml-1 inline-block h-3.5 w-6 rounded-full transition-all duration-200 relative",
              simulateFailure ? "bg-[#f59e0b]" : "bg-[rgba(99,102,241,0.15)]"
            )}>
              <span className={clsx(
                "absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all duration-200",
                simulateFailure ? "left-3" : "left-0.5"
              )} />
            </span>
          </button>

          <span className="text-[10px] text-[#3a3a5a] font-mono hidden md:inline">
            ⌘K focus · Esc stop · ⌘E export
          </span>
        </div>
      </motion.div>
    </div>
  );
}
