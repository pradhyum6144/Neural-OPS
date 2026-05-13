"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, ChevronDown, Check } from "lucide-react";
import { clsx } from "clsx";
import {
  type RouterResult,
  type ModelKey,
  MODEL_CONFIGS,
  allModelKeys,
  formatCostINR,
} from "@/lib/smartRouter";

interface RouterBadgeProps {
  result: RouterResult;
  override: ModelKey | null;
  onOverride: (model: ModelKey | null) => void;
}

export function RouterBadge({ result, override, onOverride }: RouterBadgeProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeModel  = override ?? result.model;
  const activeConfig = MODEL_CONFIGS[activeModel];
  const isOverridden = override !== null && override !== result.model;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Recalculate displayed cost when model is overridden
  const displayedCost = override
    ? Math.round((result.estimatedTokens / 1000) * MODEL_CONFIGS[override].pricePerK * 100) / 100
    : result.estimatedCostINR;

  const defaultCost = Math.round(
    (result.estimatedTokens / 1000) * MODEL_CONFIGS["Claude Sonnet"].pricePerK * 100
  ) / 100;

  const displayedSavings = Math.max(0, Math.round((defaultCost - displayedCost) * 100) / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="mx-4 md:mx-6 mb-1"
    >
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 rounded-xl border border-[rgba(34,211,165,0.2)] bg-[rgba(34,211,165,0.04)] px-4 py-2.5">

        {/* Brain icon + label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[rgba(34,211,165,0.15)]">
            <Cpu size={11} className="text-[#22d3a5]" />
          </div>
          <span className="text-[11px] font-semibold text-[#22d3a5] uppercase tracking-wider">
            Smart Router
          </span>
          {isOverridden && (
            <span className="text-[9px] font-mono text-[#f59e0b] border border-[rgba(245,158,11,0.3)] rounded px-1.5 py-0.5">
              overridden
            </span>
          )}
        </div>

        {/* Main info */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap gap-y-1">
          <span className="text-[11px] text-[#c0c0e0]">
            Using{" "}
            <span className="font-semibold text-[#e0e0ff]">{activeConfig.label}</span>
            {" "}for this{" "}
            {result.isIndianLanguage ? `${result.detectedLanguage} ` : ""}task
          </span>

          <span className="text-[#3a3a5a] text-[10px] hidden sm:inline">·</span>

          <span className="font-mono text-[10px] text-[#7070a0]">
            ~{result.estimatedTokens.toLocaleString()} tokens
          </span>

          <span className="text-[#3a3a5a] text-[10px] hidden sm:inline">·</span>

          <span className="font-mono text-[10px] text-[#22d3a5] font-semibold">
            {formatCostINR(displayedCost)}
          </span>

          {displayedSavings > 0 && (
            <>
              <span className="text-[#3a3a5a] text-[10px] hidden sm:inline">·</span>
              <span className="font-mono text-[10px] text-[#22d3a5]">
                saving {formatCostINR(displayedSavings)} vs Claude Sonnet
              </span>
            </>
          )}
        </div>

        {/* Override button */}
        <div ref={dropdownRef} className="relative flex-shrink-0">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-1 text-[10px] font-medium text-[#6060a0] hover:text-[#a0a0d0] transition-colors"
          >
            Override
            <ChevronDown size={10} className={clsx("transition-transform duration-150", dropdownOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-6 z-50 w-60 rounded-xl border border-[rgba(99,102,241,0.25)]
                           bg-[rgba(12,12,22,0.98)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                           overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-[rgba(99,102,241,0.1)]">
                  <p className="text-[10px] font-semibold text-[#4a4a6a] uppercase tracking-wider">Choose model</p>
                </div>

                <div className="py-1 max-h-72 overflow-y-auto">
                  {/* Reset option */}
                  <button
                    onClick={() => { onOverride(null); setDropdownOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-[rgba(99,102,241,0.08)] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4" />
                      <div>
                        <p className="text-[11px] font-medium text-[#c0c0e0]">Auto (recommended)</p>
                        <p className="text-[9px] text-[#5050a0]">{MODEL_CONFIGS[result.model].label}</p>
                      </div>
                    </div>
                    {!isOverridden && <Check size={11} className="text-[#22d3a5] flex-shrink-0" />}
                  </button>

                  <div className="border-t border-[rgba(99,102,241,0.06)] my-1" />

                  {allModelKeys().map((key) => {
                    const cfg       = MODEL_CONFIGS[key];
                    const isActive  = activeModel === key;
                    const cost      = Math.round((result.estimatedTokens / 1000) * cfg.pricePerK * 100) / 100;
                    return (
                      <button
                        key={key}
                        onClick={() => { onOverride(key); setDropdownOpen(false); }}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[rgba(99,102,241,0.08)] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-4" />
                          <div className="text-left">
                            <p className={clsx("text-[11px] font-medium", isActive ? "text-[#6366f1]" : "text-[#c0c0e0]")}>
                              {cfg.label}
                            </p>
                            <p className="text-[9px] text-[#5050a0]">{cfg.provider} · {formatCostINR(cost)} est.</p>
                          </div>
                        </div>
                        {isActive && <Check size={11} className="text-[#6366f1] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Reason tooltip */}
      <p className="mt-1 px-1 text-[10px] text-[#4a4a6a] font-mono">
        {result.reason}
      </p>
    </motion.div>
  );
}
