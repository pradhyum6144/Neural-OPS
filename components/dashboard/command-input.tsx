"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Download, AlertTriangle, Square, Mic, MicOff, ChevronDown, Check } from "lucide-react";
import { clsx } from "clsx";
import { VOICE_LANGUAGES } from "@/hooks/useVoiceInput";
import type { VoiceInputHandle, VoiceLanguage } from "@/hooks/useVoiceInput";

interface CommandInputProps {
  value: string;
  onChange: (v: string) => void;
  onExecute: () => void;
  onReset: () => void;
  onStop?: () => void;
  onExport?: () => void;
  isRunning: boolean;
  isDone: boolean;
  simulateFailure: boolean;
  onSimulateFailureToggle: (v: boolean) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  voiceInput?: VoiceInputHandle;
}

// ── Language selector ─────────────────────────────────────────────────────────
function LangSelector({
  selected,
  onChange,
  disabled,
}: {
  selected: VoiceLanguage;
  onChange: (l: VoiceLanguage) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Short 2-3 char code for the button label
  const code = selected.label.slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "flex items-center gap-0.5 rounded-md px-1.5 py-1 border transition-all duration-150",
          "text-[10px] font-mono font-semibold",
          open
            ? "border-[rgba(99,102,241,0.4)] bg-[rgba(99,102,241,0.1)] text-[#a0a0ff]"
            : "border-[rgba(99,102,241,0.15)] bg-transparent text-[#5050a0] hover:text-[#8080c0] hover:border-[rgba(99,102,241,0.3)]",
          disabled && "opacity-40 cursor-not-allowed"
        )}
        title={`Language: ${selected.label}`}
      >
        <span className="text-[9px]">🇮🇳</span>
        <span>{code}</span>
        <ChevronDown size={8} className={clsx("transition-transform duration-150", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-8 z-50 w-36 rounded-xl border border-[rgba(99,102,241,0.25)]
                       bg-[rgba(12,12,22,0.98)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                       overflow-hidden"
          >
            <div className="px-2.5 py-1.5 border-b border-[rgba(99,102,241,0.1)]">
              <p className="text-[9px] font-semibold text-[#4a4a6a] uppercase tracking-wider">Language</p>
            </div>
            <div className="py-1 max-h-56 overflow-y-auto">
              {VOICE_LANGUAGES.map((lang) => {
                const isActive = lang.bcp47 === selected.bcp47;
                return (
                  <button
                    key={lang.bcp47}
                    onClick={() => { onChange(lang); setOpen(false); }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5
                               hover:bg-[rgba(99,102,241,0.08)] transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px]">🇮🇳</span>
                      <span className={clsx(
                        "text-[11px] font-medium",
                        isActive ? "text-[#6366f1]" : "text-[#c0c0e0]"
                      )}>
                        {lang.label}
                      </span>
                    </div>
                    {isActive && <Check size={10} className="text-[#6366f1]" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Waveform bars ─────────────────────────────────────────────────────────────
function Waveform({ heights, color }: { heights: number[]; color: string }) {
  return (
    <div className="flex items-center gap-[3px]" style={{ height: 20 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-none"
          style={{ height: `${h}px`, background: color }}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function CommandInput({
  value,
  onChange,
  onExecute,
  onReset,
  onStop,
  onExport,
  isRunning,
  isDone,
  simulateFailure,
  onSimulateFailureToggle,
  inputRef: externalRef,
  voiceInput,
}: CommandInputProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? internalRef;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isRunning && value.trim()) onExecute();
    }
  };

  const isRecording   = voiceInput?.isRecording ?? false;
  const waveHeights   = voiceInput?.waveHeights ?? [4, 4, 4, 4, 4];
  const errorMsg      = voiceInput?.errorMsg ?? null;
  const selectedLang  = voiceInput?.selectedLang;

  return (
    <div className="px-4 md:px-6 py-3 md:py-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-2"
      >
        {/* Input row */}
        <div className={clsx(
          "relative flex items-center gap-2 rounded-xl border px-3 md:px-4 py-2.5 md:py-3",
          "bg-[rgba(10,10,20,0.8)] transition-all duration-200",
          isRecording
            ? "border-[rgba(244,63,94,0.5)] shadow-[0_0_0_3px_rgba(244,63,94,0.08),0_0_20px_rgba(244,63,94,0.06)]"
            : "border-[rgba(99,102,241,0.2)] focus-within:border-[rgba(99,102,241,0.55)] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1),0_0_20px_rgba(99,102,241,0.08)]"
        )}>

          {/* ── Voice controls ─────────────────────────────────── */}
          {voiceInput && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Language selector */}
              <LangSelector
                selected={voiceInput.selectedLang}
                onChange={voiceInput.setSelectedLang}
                disabled={isRunning || isRecording}
              />

              {/* Mic button */}
              <button
                type="button"
                onClick={voiceInput.toggleRecording}
                disabled={isRunning}
                title={isRecording ? "Stop recording" : `Record voice (${voiceInput.selectedLang.label})`}
                className={clsx(
                  "relative flex h-7 w-7 items-center justify-center rounded-lg border transition-all duration-150",
                  isRecording
                    ? "border-[rgba(244,63,94,0.5)] bg-[rgba(244,63,94,0.12)] text-[#f43f5e]"
                    : "border-[rgba(99,102,241,0.2)] bg-transparent text-[#5050a0] hover:text-[#a0a0d0] hover:border-[rgba(99,102,241,0.35)] hover:bg-[rgba(99,102,241,0.06)]",
                  isRunning && "opacity-40 cursor-not-allowed"
                )}
              >
                {isRecording ? (
                  <>
                    {/* Red pulse ring */}
                    <span className="absolute inset-0 rounded-lg animate-ping bg-[rgba(244,63,94,0.2)]" />
                    <MicOff size={12} className="relative z-10" />
                  </>
                ) : (
                  <Mic size={12} />
                )}
              </button>

              {/* Vertical divider */}
              <div className="h-4 w-px bg-[rgba(99,102,241,0.12)]" />
            </div>
          )}

          {/* ── Prompt arrow ──────────────────────────────────── */}
          <span className="font-mono text-[#6366f1] text-sm select-none flex-shrink-0">❯</span>

          {/* ── Text input ────────────────────────────────────── */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
            placeholder={
              isRecording && selectedLang
                ? `Listening in ${selectedLang.label}…`
                : "Type a command… e.g. Research NVIDIA stock and summarize latest AI news"
            }
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

            {isRunning && onStop && (
              <button
                onClick={onStop}
                title="Stop pipeline (Esc)"
                className="flex items-center gap-1.5 rounded-lg border border-[rgba(244,63,94,0.4)]
                           bg-[rgba(244,63,94,0.08)] px-3 py-1.5 text-xs font-semibold text-[#f43f5e]
                           hover:bg-[rgba(244,63,94,0.15)] transition-all duration-150"
              >
                <Square size={11} className="fill-current" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Recording status row ────────────────────────────────────────── */}
        <AnimatePresence>
          {isRecording && voiceInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-1 py-1">
                <Waveform heights={waveHeights} color="#f43f5e" />
                <span className="text-[11px] font-mono text-[#f43f5e]">
                  Listening in {voiceInput.selectedLang.label}…
                </span>
                <button
                  onClick={voiceInput.stopRecording}
                  className="ml-auto text-[10px] font-mono text-[#f43f5e] hover:text-[#ff6b6b]
                             border border-[rgba(244,63,94,0.3)] rounded px-2 py-0.5 transition-colors"
                >
                  stop
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error message ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {errorMsg && voiceInput && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center justify-between rounded-lg border border-[rgba(244,63,94,0.2)]
                         bg-[rgba(244,63,94,0.06)] px-3 py-2"
            >
              <span className="text-[11px] font-mono text-[#f43f5e]">{errorMsg}</span>
              <button
                onClick={voiceInput.clearError}
                className="text-[10px] text-[#7a3a4a] hover:text-[#f43f5e] ml-3 transition-colors"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestion chips — only when input is empty and not running */}
        {!value && !isRunning && !isRecording && (
          <div className="flex items-center gap-2 px-1 flex-wrap">
            {[
              "Research NVIDIA stock and summarize latest AI news",
              "Analyze Bitcoin market trends and give a recommendation",
              "Summarize recent breakthroughs in LLM research",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onChange(suggestion)}
                className="rounded-lg border border-[rgba(99,102,241,0.15)] bg-[rgba(99,102,241,0.05)]
                           px-2.5 py-1 text-[10px] text-[#6060a0] hover:text-[#a0a0ff]
                           hover:border-[rgba(99,102,241,0.3)] hover:bg-[rgba(99,102,241,0.1)]
                           transition-all duration-150 font-mono truncate max-w-[260px]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

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
