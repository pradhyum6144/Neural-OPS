"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";

interface CommandInputProps {
  value: string;
  onChange: (v: string) => void;
  onExecute: () => void;
  onReset: () => void;
  isRunning: boolean;
  isDone: boolean;
}

export function CommandInput({ value, onChange, onExecute, onReset, isRunning, isDone }: CommandInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onExecute();
    }
  };

  return (
    <div className="px-6 py-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative flex items-center gap-3 rounded-xl border border-[rgba(99,102,241,0.2)]
                   bg-[rgba(10,10,20,0.8)] px-4 py-3
                   focus-within:border-[rgba(99,102,241,0.55)]
                   focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1),0_0_20px_rgba(99,102,241,0.08)]
                   transition-all duration-200"
      >
        {/* Prompt symbol */}
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
        <span className="hidden sm:flex items-center gap-1 text-[10px] text-[#3a3a5a] font-mono flex-shrink-0">
          <kbd className="rounded border border-[rgba(99,102,241,0.2)] px-1.5 py-0.5 text-[#4a4a6a]">⌘</kbd>
          <kbd className="rounded border border-[rgba(99,102,241,0.2)] px-1.5 py-0.5 text-[#4a4a6a]">↵</kbd>
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {(isDone) && (
            <button
              onClick={onReset}
              className="flex h-8 w-8 items-center justify-center rounded-lg
                         text-[#6b6b8a] hover:text-[#e0e0ff] hover:bg-[rgba(99,102,241,0.1)]
                         transition-all duration-150"
              title="Reset"
            >
              <RotateCcw size={14} />
            </button>
          )}

          <button
            onClick={onExecute}
            disabled={isRunning || !value.trim()}
            className="flex items-center gap-2 rounded-lg bg-[#6366f1] hover:bg-indigo-500
                       px-4 py-1.5 text-xs font-semibold text-white
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
            {isRunning ? "Running…" : "Execute"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
