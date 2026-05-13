"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, Monitor, TrendingUp, Mic, Volume2, VolumeX } from "lucide-react";
import { clsx } from "clsx";
import type { AgentState, AgentStatus } from "@/hooks/use-dashboard";
import { Waveform } from "./waveform";

const ICONS: Record<string, React.ElementType> = {
  planner:  Brain,
  research: Search,
  browser:  Monitor,
  finance:  TrendingUp,
  voice:    Mic,
};

const STATUS_CONFIG: Record<AgentStatus, { label: string; dotColor: string; badge: string; border: string }> = {
  idle:     { label: "IDLE",     dotColor: "#3a3a5a", badge: "text-[#4a4a6a] bg-[rgba(99,102,241,0.05)] border-[rgba(99,102,241,0.1)]",   border: "border-[rgba(99,102,241,0.08)]" },
  active:   { label: "ACTIVE",   dotColor: "#6366f1", badge: "text-[#6366f1] bg-[rgba(99,102,241,0.12)] border-[rgba(99,102,241,0.3)]",  border: "border-[rgba(99,102,241,0.4)]" },
  thinking: { label: "THINKING", dotColor: "#a78bfa", badge: "text-[#a78bfa] bg-[rgba(167,139,250,0.12)] border-[rgba(167,139,250,0.3)]", border: "border-[rgba(167,139,250,0.3)]" },
  done:     { label: "DONE",     dotColor: "#22d3a5", badge: "text-[#22d3a5] bg-[rgba(34,211,165,0.1)]  border-[rgba(34,211,165,0.3)]",   border: "border-[rgba(34,211,165,0.2)]" },
  error:    { label: "ERROR",    dotColor: "#f43f5e", badge: "text-[#f43f5e] bg-[rgba(244,63,94,0.1)]   border-[rgba(244,63,94,0.3)]",    border: "border-[rgba(244,63,94,0.2)]"  },
};

function ThinkingShimmer() {
  return (
    <div className="mt-1.5 h-1 w-full rounded-full overflow-hidden bg-[rgba(167,139,250,0.08)]">
      <motion.div
        className="h-full w-1/3 rounded-full"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.6), transparent)",
        }}
        animate={{ x: ["-100%", "300%"] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function OutputPreview({ output }: { output: string }) {
  if (!output) return null;
  return (
    <motion.p
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-1.5 font-mono text-[9px] text-[#5050a0] leading-relaxed line-clamp-2 break-words"
    >
      {output}
    </motion.p>
  );
}

function AgentCard({
  agent,
  index,
  isSpeaking,
  onReplaySpeech,
}: {
  agent: AgentState;
  index: number;
  isSpeaking?: boolean;
  onReplaySpeech?: () => void;
}) {
  const Icon = ICONS[agent.id] ?? Brain;
  const cfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
  const isActive = agent.status === "active";
  const isThinking = agent.status === "thinking";
  const isLive = isActive || isThinking;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className={clsx(
        "relative flex flex-col rounded-xl border p-3",
        "bg-[rgba(10,10,20,0.6)] transition-all duration-300",
        cfg.border,
        isActive && "shadow-[0_0_16px_rgba(99,102,241,0.15)]",
        isThinking && "shadow-[0_0_16px_rgba(167,139,250,0.12)]"
      )}
    >
      {/* Active glow overlay */}
      {isLive && (
        <div className={clsx(
          "absolute inset-0 rounded-xl pointer-events-none",
          isThinking ? "bg-[rgba(167,139,250,0.03)]" : "bg-[rgba(99,102,241,0.04)]"
        )} />
      )}

      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={clsx(
          "relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border",
          isActive  ? "bg-[rgba(99,102,241,0.15)]  border-[rgba(99,102,241,0.4)]"
          : isThinking ? "bg-[rgba(167,139,250,0.12)] border-[rgba(167,139,250,0.35)]"
          : "bg-[rgba(99,102,241,0.05)]  border-[rgba(99,102,241,0.1)]"
        )}>
          <Icon
            size={15}
            className={
              isActive ? "text-[#6366f1]"
              : isThinking ? "text-[#a78bfa]"
              : "text-[#4a4a6a]"
            }
          />
          {isLive && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full"
              style={{ background: isThinking ? "#a78bfa" : "#6366f1" }}>
              <span className="absolute inset-0 rounded-full animate-ping opacity-75"
                style={{ background: isThinking ? "#a78bfa" : "#6366f1" }} />
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-xs font-semibold text-[#c0c0e0] truncate">{agent.name}</span>
            <span className={clsx("text-[9px] font-bold rounded-full px-1.5 py-0.5 border flex-shrink-0", cfg.badge)}>
              {cfg.label}
            </span>
          </div>
          <p className="text-[10px] text-[#4a4a6a] truncate">{agent.subStatus}</p>
          {isThinking && <ThinkingShimmer />}
        </div>

        {/* Token counter + duration */}
        <div className="flex-shrink-0 text-right">
          <AnimatePresence mode="wait">
            <motion.span
              key={agent.tokens}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="block font-mono text-[10px] text-[#5a5a7a]"
            >
              {agent.tokens.toLocaleString()}
            </motion.span>
          </AnimatePresence>
          <span className="text-[9px] text-[#3a3a5a]">tkns</span>
          {agent.durationMs !== undefined && agent.status === "done" && (
            <span className="block font-mono text-[9px] text-[#3a3a5a] mt-0.5">
              {agent.durationMs < 1000
                ? `${agent.durationMs}ms`
                : `${(agent.durationMs / 1000).toFixed(1)}s`}
            </span>
          )}
        </div>

        {/* Status dot */}
        <div className="relative flex-shrink-0">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dotColor }} />
          {isLive && (
            <div className="absolute inset-0 h-1.5 w-1.5 rounded-full animate-ping opacity-60"
              style={{ background: cfg.dotColor }} />
          )}
        </div>
      </div>

      {/* Streaming output preview */}
      {isActive && agent.output && <OutputPreview output={agent.output} />}

      {/* Voice waveform + replay */}
      {agent.id === "voice" && (agent.status === "active" || agent.status === "done") && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[rgba(99,102,241,0.08)]">
          <Waveform active={agent.id === "voice" && isSpeaking === true} color="#a78bfa" />
          {agent.status === "done" && onReplaySpeech && (
            <button
              onClick={onReplaySpeech}
              title="Replay narration"
              className="flex h-6 w-6 items-center justify-center rounded-lg
                         hover:bg-[rgba(167,139,250,0.1)] transition-colors"
            >
              {isSpeaking ? (
                <VolumeX size={11} className="text-[#a78bfa]" />
              ) : (
                <Volume2 size={11} className="text-[#6060a0] hover:text-[#a78bfa]" />
              )}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function AgentFleet({
  agents,
  isSpeaking,
  onReplaySpeech,
}: {
  agents: AgentState[];
  isSpeaking?: boolean;
  onReplaySpeech?: () => void;
}) {
  const activeCount = agents.filter((a) => a.status === "active" || a.status === "thinking").length;
  const doneCount = agents.filter((a) => a.status === "done").length;
  const errorCount = agents.filter((a) => a.status === "error").length;

  return (
    <div className="nos-panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(99,102,241,0.08)]">
        <span className="nos-label">Agent Fleet</span>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          {activeCount > 0 && <span className="text-[#6366f1]">{activeCount} active</span>}
          {doneCount > 0 && <span className="text-[#22d3a5]">{doneCount}/{agents.length} done</span>}
          {errorCount > 0 && <span className="text-[#f43f5e]">{errorCount} failed</span>}
          {activeCount === 0 && doneCount === 0 && <span className="text-[#4a4a6a]">idle</span>}
        </div>
      </div>
      <div className="flex flex-col gap-2 p-3 overflow-y-auto">
        {agents.map((a, i) => (
          <AgentCard
            key={a.id}
            agent={a}
            index={i}
            isSpeaking={isSpeaking}
            onReplaySpeech={a.id === "voice" ? onReplaySpeech : undefined}
          />
        ))}
      </div>
    </div>
  );
}
