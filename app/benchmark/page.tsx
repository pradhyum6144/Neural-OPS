"use client";

import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Clock, Star, Zap, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { VOICE_LANGUAGES, type VoiceLanguage } from "@/hooks/useVoiceInput";
import { selectModel } from "@/lib/smartRouter";

// ── Constants ──────────────────────────────────────────────────────────────────

const PLACEHOLDERS = [
  "Summarize a news article in Hindi",
  "Write product descriptions for my saree shop",
  "Analyze my Razorpay sales data",
  "Check symptoms and suggest a doctor visit",
];

const PAGE_MODELS = [
  { id: "sarvam-30b",    name: "Sarvam-30B",    provider: "sarvam.ai", pricePerK: 0.04, accentBg: "rgba(249,115,22,0.12)",  accentColor: "#f97316", abbr: "S30"  },
  { id: "claude-haiku",  name: "Claude Haiku",   provider: "Anthropic", pricePerK: 0.21, accentBg: "rgba(168,85,247,0.12)",  accentColor: "#a855f7", abbr: "CH"   },
  { id: "claude-sonnet", name: "Claude Sonnet",  provider: "Anthropic", pricePerK: 0.94, accentBg: "rgba(99,102,241,0.12)",  accentColor: "#6366f1", abbr: "CS"   },
  { id: "sarvam-105b",   name: "Sarvam-105B",    provider: "sarvam.ai", pricePerK: 0.08, accentBg: "rgba(234,179,8,0.12)",   accentColor: "#eab308", abbr: "S105" },
] as const;

const SONNET_PRICE_PER_K = 0.94;

// ── Types ──────────────────────────────────────────────────────────────────────

interface ModelRun {
  status: "idle" | "streaming" | "done" | "error";
  response: string;
  timeMs: number | null;
  tokens: number | null;
  costINR: number | null;
  score: number | null;
  errorMsg: string | null;
}

interface RunState {
  phase: "idle" | "running" | "done";
  models: Record<string, ModelRun>;
  best: string | null;
  reason: string | null;
}

type RunAction =
  | { type: "RESET" }
  | { type: "RUN_START" }
  | { type: "MODEL_START"; modelId: string }
  | { type: "MODEL_TOKEN"; modelId: string; text: string }
  | { type: "MODEL_DONE"; modelId: string; tokens: number; timeMs: number; costINR: number }
  | { type: "MODEL_ERROR"; modelId: string; errorMsg: string }
  | { type: "JUDGE"; scores: Record<string, number>; best: string; reason: string }
  | { type: "ALL_DONE" };

interface BenchmarkRecord {
  id: string;
  date: string;
  task: string;
  winner: string;
  winnerName: string;
}

// ── State helpers ──────────────────────────────────────────────────────────────

const HISTORY_KEY = "nos_benchmark_history";

function loadHistory(): BenchmarkRecord[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as BenchmarkRecord[]; }
  catch { return []; }
}

function saveHistory(records: BenchmarkRecord[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, 20))); } catch { /* noop */ }
}

function idleModel(): ModelRun {
  return { status: "idle", response: "", timeMs: null, tokens: null, costINR: null, score: null, errorMsg: null };
}

function makeInitialState(): RunState {
  return {
    phase: "idle",
    models: Object.fromEntries(PAGE_MODELS.map(m => [m.id, idleModel()])),
    best: null,
    reason: null,
  };
}

function reducer(state: RunState, action: RunAction): RunState {
  switch (action.type) {
    case "RESET":
      return makeInitialState();

    case "RUN_START":
      return { phase: "running", models: Object.fromEntries(PAGE_MODELS.map(m => [m.id, idleModel()])), best: null, reason: null };

    case "MODEL_START":
      return { ...state, models: { ...state.models, [action.modelId]: { ...state.models[action.modelId], status: "streaming" } } };

    case "MODEL_TOKEN":
      return {
        ...state,
        models: {
          ...state.models,
          [action.modelId]: { ...state.models[action.modelId], response: state.models[action.modelId].response + action.text },
        },
      };

    case "MODEL_DONE":
      return {
        ...state,
        models: {
          ...state.models,
          [action.modelId]: { ...state.models[action.modelId], status: "done", timeMs: action.timeMs, tokens: action.tokens, costINR: action.costINR },
        },
      };

    case "MODEL_ERROR":
      return {
        ...state,
        models: { ...state.models, [action.modelId]: { ...state.models[action.modelId], status: "error", errorMsg: action.errorMsg } },
      };

    case "JUDGE": {
      const updated = { ...state.models };
      for (const [id, score] of Object.entries(action.scores)) {
        if (typeof score === "number" && id in updated) {
          updated[id] = { ...updated[id], score };
        }
      }
      return { ...state, models: updated, best: action.best, reason: action.reason };
    }

    case "ALL_DONE":
      return { ...state, phase: "done" };

    default:
      return state;
  }
}

// ── ModelCard ──────────────────────────────────────────────────────────────────

function ModelCard({
  config,
  run,
  isDone,
  isBest,
  onUse,
}: {
  config: typeof PAGE_MODELS[number];
  run: ModelRun;
  isDone: boolean;
  isBest: boolean;
  onUse: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (run.status === "streaming" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [run.response, run.status]);

  const statusLabel =
    run.status === "idle" ? "Waiting…" :
    run.status === "streaming" ? "Thinking…" :
    run.status === "done" ? "Complete" : "Error";

  const dotColor =
    run.status === "idle" ? "#2a2a4a" :
    run.status === "streaming" ? "#f59e0b" :
    run.status === "done" ? "#22d3a5" : "#f43f5e";

  const multiplier = config.pricePerK < SONNET_PRICE_PER_K
    ? Math.round(SONNET_PRICE_PER_K / config.pricePerK)
    : null;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-4 gap-3 h-full transition-all duration-300 ${
        isBest
          ? "border-[rgba(34,211,165,0.35)] bg-[rgba(34,211,165,0.03)]"
          : "border-[rgba(99,102,241,0.12)] bg-[rgba(99,102,241,0.02)]"
      }`}
    >
      {isBest && (
        <div className="absolute -top-2.5 left-3">
          <span className="rounded-full border border-[rgba(34,211,165,0.4)] bg-[rgba(10,10,15,0.98)]
                           px-2 py-0.5 text-[9px] font-bold text-[#22d3a5] tracking-wide">
            ⭐ BEST MATCH
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[10px] font-bold flex-shrink-0"
          style={{ background: config.accentBg, color: config.accentColor, border: `1px solid ${config.accentColor}33` }}
        >
          {config.abbr}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-[#e0e0ff] leading-tight truncate">{config.name}</div>
          <div className="text-[9px] text-[#4a4a6a] font-mono">{config.provider} · ₹{config.pricePerK}/K</div>
        </div>
      </div>

      {/* Status line */}
      <div className="flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${run.status === "streaming" ? "animate-pulse" : ""}`}
          style={{ background: dotColor }}
        />
        <span className="text-[10px] font-mono" style={{ color: dotColor }}>{statusLabel}</span>
      </div>

      {/* Response area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-[140px] max-h-[140px] overflow-y-auto rounded-xl border border-[rgba(99,102,241,0.08)]
                   bg-[rgba(0,0,0,0.25)] p-3"
      >
        {run.status === "idle" ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#2a2a4a] animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        ) : run.status === "error" ? (
          <p className="text-[10px] text-[#f43f5e] font-mono leading-relaxed">{run.errorMsg ?? "An error occurred"}</p>
        ) : (
          <p className="text-[11px] font-mono text-[#9090b0] leading-relaxed whitespace-pre-wrap">
            {run.response}
            {run.status === "streaming" && (
              <span className="inline-block w-[3px] h-[13px] bg-[#6366f1] ml-0.5 align-middle animate-pulse rounded-sm" />
            )}
          </p>
        )}
      </div>

      {/* Metric badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {run.timeMs !== null && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 rounded-full border border-[rgba(99,102,241,0.14)]
                       bg-[rgba(99,102,241,0.05)] px-2 py-0.5 text-[9px] font-mono text-[#6060a0]"
          >
            <Clock size={8} />
            {(run.timeMs / 1000).toFixed(1)}s
          </motion.span>
        )}
        {run.costINR !== null && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 rounded-full border border-[rgba(34,211,165,0.2)]
                       bg-[rgba(34,211,165,0.05)] px-2 py-0.5 text-[9px] font-mono text-[#22d3a5]"
          >
            ₹{run.costINR < 0.001 ? run.costINR.toFixed(4) : run.costINR.toFixed(3)}
          </motion.span>
        )}
        {multiplier && multiplier > 1 && run.costINR !== null && (
          <span className="flex items-center gap-1 rounded-full border border-[rgba(99,102,241,0.1)]
                           px-2 py-0.5 text-[9px] font-mono text-[#5050a0]">
            <Zap size={7} />
            {multiplier}× cheaper
          </span>
        )}
        {isDone && run.score !== null && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 450, damping: 20 }}
            className="ml-auto flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold"
            style={{
              borderColor: run.score >= 8 ? "rgba(34,211,165,0.4)" : "rgba(99,102,241,0.2)",
              color: run.score >= 8 ? "#22d3a5" : "#7070c0",
              background: run.score >= 8 ? "rgba(34,211,165,0.06)" : "transparent",
            }}
          >
            <Star size={8} fill="currentColor" />
            {run.score}/10
          </motion.span>
        )}
      </div>

      {/* Use this model */}
      {run.status !== "idle" && run.status !== "streaming" && (
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onUse}
          className="w-full rounded-xl border py-2 text-[11px] font-semibold transition-all duration-150"
          style={{
            borderColor: isBest ? "rgba(34,211,165,0.35)" : "rgba(99,102,241,0.18)",
            color: isBest ? "#22d3a5" : "#7070b0",
            background: isBest ? "rgba(34,211,165,0.05)" : "transparent",
          }}
        >
          Use this model
        </motion.button>
      )}
    </div>
  );
}

// ── RecommendationBanner ───────────────────────────────────────────────────────

function RecommendationBanner({
  best,
  reason,
  task,
  onSetDefault,
}: {
  best: string;
  reason: string;
  task: string;
  onSetDefault: (modelId: string) => void;
}) {
  const model = PAGE_MODELS.find(m => m.id === best);
  const routerResult = selectModel(task);
  const multiplier = model && model.pricePerK < SONNET_PRICE_PER_K
    ? Math.round(SONNET_PRICE_PER_K / model.pricePerK)
    : null;

  const defaultLabel = routerResult.isIndianLanguage && routerResult.detectedLanguage
    ? `Set as default for ${routerResult.detectedLanguage} tasks`
    : "Set as my default model";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl border border-[rgba(34,211,165,0.28)] bg-[rgba(34,211,165,0.04)] p-5"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl
                          bg-[rgba(34,211,165,0.12)] border border-[rgba(34,211,165,0.25)]">
            <Trophy size={16} className="text-[#22d3a5]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-[#4a4a6a] uppercase tracking-wider mb-1">
              Best for your task
            </div>
            <div className="text-[16px] font-bold text-[#e0e0ff] mb-1.5">
              {model?.name ?? best}
            </div>
            <p className="text-[12px] text-[#7070a0] leading-relaxed">
              {reason}
              {multiplier && multiplier > 1 && (
                <span className="ml-1 font-semibold text-[#22d3a5]">
                  — {multiplier}× cheaper than Claude Sonnet
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => onSetDefault(best)}
          className="flex items-center gap-2 rounded-xl border border-[rgba(34,211,165,0.28)]
                     bg-[rgba(34,211,165,0.07)] px-4 py-2.5 text-[12px] font-semibold text-[#22d3a5]
                     hover:bg-[rgba(34,211,165,0.13)] transition-all duration-150 whitespace-nowrap flex-shrink-0"
        >
          <Check size={12} />
          {defaultLabel}
        </button>
      </div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function BenchmarkPage() {
  const [task, setTask] = useState("");
  const [language, setLanguage] = useState<VoiceLanguage>(VOICE_LANGUAGES[9]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [history, setHistory] = useState<BenchmarkRecord[]>([]);
  const [runState, dispatch] = useReducer(reducer, undefined, makeInitialState);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  // Cycle placeholder only when textarea is empty
  useEffect(() => {
    if (task) return;
    const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length), 2600);
    return () => clearInterval(id);
  }, [task]);

  const handleUseModel = useCallback((modelId: string) => {
    const model = PAGE_MODELS.find(m => m.id === modelId);
    if (!model) return;
    localStorage.setItem("nos_preferred_model", modelId);
    toast.success(`${model.name} set as your default model`);
  }, []);

  const runBenchmark = useCallback(async () => {
    if (!task.trim() || runState.phase === "running") return;

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    dispatch({ type: "RUN_START" });

    try {
      const res = await fetch("/api/benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, language: language.bcp47 }),
        signal: abort.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line) as {
              type: string; modelId?: string; text?: string;
              tokens?: number; timeMs?: number; costINR?: number;
              scores?: Record<string, number>; best?: string; reason?: string; error?: string;
            };

            if (ev.type === "start" && ev.modelId) {
              dispatch({ type: "MODEL_START", modelId: ev.modelId });
            } else if (ev.type === "token" && ev.modelId && ev.text) {
              dispatch({ type: "MODEL_TOKEN", modelId: ev.modelId, text: ev.text });
            } else if (ev.type === "model_done" && ev.modelId) {
              dispatch({ type: "MODEL_DONE", modelId: ev.modelId, tokens: ev.tokens!, timeMs: ev.timeMs!, costINR: ev.costINR! });
            } else if (ev.type === "model_error" && ev.modelId) {
              dispatch({ type: "MODEL_ERROR", modelId: ev.modelId, errorMsg: ev.error ?? "Error" });
            } else if (ev.type === "judge" && ev.scores && ev.best && ev.reason) {
              dispatch({ type: "JUDGE", scores: ev.scores, best: ev.best, reason: ev.reason });
            } else if (ev.type === "all_done") {
              dispatch({ type: "ALL_DONE" });
            }
          } catch { /* invalid JSON line */ }
        }
      }
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      toast.error("Benchmark failed — please try again.");
      dispatch({ type: "RESET" });
    }
  }, [task, language.bcp47, runState.phase]);

  // Save to history when a run completes
  useEffect(() => {
    if (runState.phase !== "done" || !runState.best) return;
    const winnerModel = PAGE_MODELS.find(m => m.id === runState.best);
    const record: BenchmarkRecord = {
      id: `bm_${Date.now()}`,
      date: new Date().toISOString(),
      task: task.slice(0, 80),
      winner: runState.best,
      winnerName: winnerModel?.name ?? runState.best,
    };
    setHistory(prev => {
      const next = [record, ...prev].slice(0, 20);
      saveHistory(next);
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runState.phase, runState.best]);

  // Most efficient model from history
  const topModel = (() => {
    if (!history.length) return null;
    const wins: Record<string, { name: string; n: number }> = {};
    for (const r of history) {
      wins[r.winner] ??= { name: r.winnerName, n: 0 };
      wins[r.winner].n++;
    }
    const top = Object.entries(wins).sort((a, b) => b[1].n - a[1].n)[0];
    return top ? { name: top[1].name, pct: Math.round((top[1].n / history.length) * 100) } : null;
  })();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e0e0ff]">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg
                            bg-[rgba(234,179,8,0.12)] border border-[rgba(234,179,8,0.25)]">
              <Trophy size={16} className="text-[#eab308]" />
            </div>
            <span className="text-[10px] font-semibold text-[#4a4a6a] uppercase tracking-widest">
              Model Benchmark
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#e0e0ff] leading-tight">
            Find your perfect AI model
          </h1>
          <p className="mt-2 text-sm md:text-base text-[#5050a0]">
            Type any task. We run it on multiple models and show you the results side by side.
          </p>
        </motion.div>

        {/* ── Input section ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="mb-6 rounded-2xl border border-[rgba(99,102,241,0.14)] bg-[rgba(99,102,241,0.03)] p-5"
        >
          {/* Textarea with animated placeholder overlay */}
          <div className="relative mb-4">
            <textarea
              value={task}
              onChange={e => setTask(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-[rgba(99,102,241,0.14)]
                         bg-[rgba(0,0,0,0.3)] px-4 py-3 text-sm font-mono text-[#e0e0ff]
                         focus:outline-none focus:border-[rgba(99,102,241,0.38)] transition-colors
                         placeholder-transparent"
              style={{ caretColor: "#6366f1" }}
              onKeyDown={e => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); runBenchmark(); }
              }}
            />
            <AnimatePresence mode="wait">
              {!task && (
                <motion.div
                  key={placeholderIdx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.22 }}
                  className="pointer-events-none absolute left-4 top-3 text-sm font-mono text-[#35355a]"
                >
                  {PLACEHOLDERS[placeholderIdx]}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Language + run row */}
          <div className="flex items-center gap-3">
            <select
              value={language.bcp47}
              onChange={e => setLanguage(VOICE_LANGUAGES.find(l => l.bcp47 === e.target.value) ?? VOICE_LANGUAGES[9])}
              className="rounded-lg border border-[rgba(99,102,241,0.14)] bg-[rgba(99,102,241,0.06)]
                         px-3 py-2 text-[11px] font-mono text-[#7070b0]
                         focus:outline-none focus:border-[rgba(99,102,241,0.3)] transition-colors cursor-pointer"
            >
              {VOICE_LANGUAGES.map(l => (
                <option key={l.bcp47} value={l.bcp47}>{l.label}</option>
              ))}
            </select>

            <button
              onClick={runBenchmark}
              disabled={!task.trim() || runState.phase === "running"}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#6366f1]
                         px-6 py-2.5 text-sm font-semibold text-white transition-all duration-150
                         hover:bg-[#5254d0] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed
                         shadow-[0_0_24px_rgba(99,102,241,0.22)]"
            >
              {runState.phase === "running" ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                  Running benchmarks…
                </>
              ) : (
                <>
                  <Trophy size={14} />
                  Run benchmark
                </>
              )}
            </button>

            {runState.phase !== "idle" && (
              <button
                title="Reset"
                onClick={() => { abortRef.current?.abort(); dispatch({ type: "RESET" }); }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(99,102,241,0.14)]
                           text-[#4a4a6a] hover:text-[#9090b0] hover:bg-[rgba(99,102,241,0.07)] transition-all"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Results section ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {runState.phase !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-8"
            >
              {/* 4-column model cards (2-col on mobile) */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-5">
                {PAGE_MODELS.map((model, i) => (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex"
                  >
                    <ModelCard
                      config={model}
                      run={runState.models[model.id] ?? idleModel()}
                      isDone={runState.phase === "done"}
                      isBest={runState.phase === "done" && runState.best === model.id}
                      onUse={() => handleUseModel(model.id)}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Recommendation banner */}
              <AnimatePresence>
                {runState.phase === "done" && runState.best && runState.reason && (
                  <RecommendationBanner
                    best={runState.best}
                    reason={runState.reason}
                    task={task}
                    onSetDefault={handleUseModel}
                  />
                )}
              </AnimatePresence>

              {/* Judging in progress notice */}
              {runState.phase === "running" && Object.values(runState.models).every(m => m.status === "done" || m.status === "error") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl border
                             border-[rgba(99,102,241,0.14)] bg-[rgba(99,102,241,0.04)] py-3"
                >
                  <span className="h-3 w-3 rounded-full border-2 border-[rgba(99,102,241,0.3)] border-t-[#6366f1] animate-spin" />
                  <span className="text-[11px] font-mono text-[#5050a0]">Judging quality scores…</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Benchmark history ───────────────────────────────────────────── */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-[rgba(99,102,241,0.1)] bg-[rgba(99,102,241,0.02)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(99,102,241,0.08)]">
              <span className="text-[10px] font-semibold text-[#5050a0] uppercase tracking-widest">
                Your past benchmarks
              </span>
              {topModel && (
                <span className="text-[10px] font-mono text-[#3a3a5a]">
                  Most efficient:{" "}
                  <span className="text-[#22d3a5] font-semibold">{topModel.name}</span>
                  {" "}({topModel.pct}% of wins)
                </span>
              )}
            </div>

            <div className="divide-y divide-[rgba(99,102,241,0.06)]">
              {history.slice(0, 5).map((record) => {
                const winCfg = PAGE_MODELS.find(m => m.id === record.winner);
                const d = new Date(record.date);
                const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
                const relDate = diffDays === 0 ? "Today" : diffDays === 1 ? "Yesterday" : `${diffDays}d ago`;

                return (
                  <div key={record.id}
                       className="flex items-center gap-4 px-5 py-3 hover:bg-[rgba(99,102,241,0.04)] transition-colors cursor-default">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-mono text-[#8080a0] truncate">{record.task}</p>
                      <span className="text-[10px] text-[#3a3a5a] font-mono">{relDate}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[9px] text-[#3a3a5a]">Winner</span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[9px] font-bold"
                        style={{
                          background: winCfg?.accentBg ?? "rgba(99,102,241,0.1)",
                          color: winCfg?.accentColor ?? "#6366f1",
                        }}
                      >
                        {record.winnerName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
