"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useDashboard } from "@/hooks/use-dashboard";
import { useSpeech } from "@/hooks/use-speech";
import { useWorkflowHistory } from "@/hooks/use-workflow-history";
import { useSavings } from "@/hooks/use-savings";
import { useCredits } from "@/hooks/use-credits";
import { useRunHistory } from "@/hooks/use-run-history";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { selectModel, MODEL_CONFIGS } from "@/lib/smartRouter";
import type { ModelKey } from "@/lib/smartRouter";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { CommandInput } from "@/components/dashboard/command-input";
import { AgentFleet } from "@/components/dashboard/agent-fleet";
import { LiveLog } from "@/components/dashboard/live-log";
import { BrowserReplay } from "@/components/dashboard/browser-replay";
import { InfraHeatmap } from "@/components/dashboard/infra-heatmap";
import { MemoryNodes } from "@/components/dashboard/memory-nodes";
import { FinalReport } from "@/components/dashboard/final-report";
import { RouterBadge } from "@/components/dashboard/RouterBadge";
import { DeployModal } from "@/components/dashboard/DeployModal";
import { GridPattern } from "@/components/ui/grid-pattern";
import type { AgentReport } from "@/hooks/use-dashboard";

const WorkflowGraph = dynamic(
  () => import("@/components/dashboard/workflow-graph").then((m) => m.WorkflowGraph),
  {
    ssr: false,
    loading: () => (
      <div className="nos-panel flex items-center justify-center" style={{ minHeight: 520 }}>
        <span className="text-xs font-mono text-[#3a3a5a]">Loading graph…</span>
      </div>
    ),
  }
);

function buildMarkdown(reports: AgentReport[], command: string): string {
  const ts = new Date().toISOString();
  const lines: string[] = [
    `# Neural OPS — Agent Report`,
    ``,
    `**Command:** ${command}`,
    `**Generated:** ${ts}`,
    ``,
    `---`,
    ``,
  ];

  for (const r of reports) {
    lines.push(`## ${r.agentName}`);
    lines.push(``);

    if (r.agentId === "summary") {
      try {
        const jsonMatch = r.output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as {
            title?: string;
            keyFindings?: string[];
            recommendation?: string;
            confidence?: number;
          };
          if (parsed.title) lines.push(`**${parsed.title}**`, ``);
          if (parsed.keyFindings?.length) {
            lines.push(`### Key Findings`, ``);
            parsed.keyFindings.forEach((f) => lines.push(`- ${f}`));
            lines.push(``);
          }
          if (parsed.recommendation) lines.push(`**Recommendation:** ${parsed.recommendation}`, ``);
          if (parsed.confidence !== undefined) lines.push(`**Confidence:** ${parsed.confidence}%`, ``);
        }
      } catch {
        lines.push(r.output, ``);
      }
    } else {
      lines.push(r.output, ``);
    }

    lines.push(`---`, ``);
  }

  return lines.join("\n");
}

function downloadMarkdown(content: string, filename = "report.md") {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const { state, dispatch, execute, reset } = useDashboard();
  const { speak, replay, isSpeaking } = useSpeech();
  const { history, addEntry, clearHistory } = useWorkflowHistory();
  const { savedToday, addRun } = useSavings();
  const credits = useCredits();
  const runHistory = useRunHistory();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [modelOverride, setModelOverride] = useState<ModelKey | null>(null);
  const [deployOpen, setDeployOpen] = useState(false);
  const prevDoneRef = useRef(false);

  // Voice input — transcription lands directly in the command field
  const voiceInput = useVoiceInput((transcript) =>
    dispatch({ type: "SET_COMMAND", payload: transcript })
  );

  const routerResult = useMemo(
    () => (state.command.trim() ? selectModel(state.command) : null),
    [state.command]
  );

  // Speak voice agent output when it completes (in the selected input language)
  useEffect(() => {
    const voiceAgent = state.agents.find((a) => a.id === "voice");
    if (voiceAgent?.status === "done" && voiceAgent.output) {
      const plainText = voiceAgent.output.replace(/\*\*|##|`/g, "").trim();
      speak(plainText, voiceInput.selectedLang.bcp47);
    }
  // voiceInput.selectedLang intentionally not in deps — we read it at fire time
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.agents, speak]);

  // Save to history and record costs when pipeline completes
  useEffect(() => {
    if (state.isDone && !prevDoneRef.current) {
      addEntry({
        command: state.command,
        tokens: state.metrics.tokens,
        agentsCompleted: state.agents.filter((a) => a.status === "done").length,
      });

      if (routerResult) {
        const activeModel = modelOverride ?? routerResult.model;
        const costINR = Math.round(
          (state.metrics.tokens / 1000) * MODEL_CONFIGS[activeModel].pricePerK * 100
        ) / 100;
        const defaultCostINR = Math.round(
          (state.metrics.tokens / 1000) * MODEL_CONFIGS["Claude Sonnet"].pricePerK * 100
        ) / 100;
        const savingsINR = Math.max(0, Math.round((defaultCostINR - costINR) * 100) / 100);

        dispatch({ type: "SET_RUN_COST", costINR, modelUsed: MODEL_CONFIGS[activeModel].label });
        addRun(costINR, savingsINR);
        credits.deduct(costINR);
        runHistory.addRecord({
          command: state.command,
          model: MODEL_CONFIGS[activeModel].label,
          tokens: state.metrics.tokens,
          costINR,
          savedINR: savingsINR,
        });

        const newBalance = Math.max(0, Math.round((credits.balance - costINR) * 100) / 100);
        toast.success(`Run cost ₹${costINR.toFixed(2)}. Balance: ₹${newBalance.toFixed(2)}`, {
          duration: 4000,
        });
      }
    }
    prevDoneRef.current = state.isDone;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isDone, state.command, state.metrics.tokens, state.agents, addEntry, routerResult, modelOverride, dispatch, addRun, credits.deduct, runHistory.addRecord]);

  // Export handler
  const handleExport = useCallback(() => {
    const md = buildMarkdown(state.finalReports, state.command);
    downloadMarkdown(md, `nos-report-${Date.now()}.md`);
  }, [state.finalReports, state.command]);

  // Replay history entry
  const handleReplayHistory = useCallback((command: string) => {
    dispatch({ type: "SET_COMMAND", payload: command });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [dispatch]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      // ⌘K — focus input
      if (meta && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      // ⌘↵ — execute
      if (meta && e.key === "Enter") {
        e.preventDefault();
        if (!state.isRunning && state.command.trim()) execute();
        return;
      }

      // ⌘E — export report
      if (meta && e.key === "e" && state.isDone) {
        e.preventDefault();
        handleExport();
        return;
      }

      // Escape — stop or close modal
      if (e.key === "Escape") {
        if (state.reportOpen) {
          dispatch({ type: "SET_REPORT_OPEN", open: false });
        } else if (state.isRunning) {
          reset();
        }
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.isRunning, state.command, state.isDone, state.reportOpen, execute, reset, handleExport, dispatch]);

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-[#e0e0ff]">
      <Sidebar
        history={history}
        onReplayHistory={handleReplayHistory}
        onClearHistory={clearHistory}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        savedToday={savedToday}
      />

      {/* Main — offset for desktop sidebar */}
      <div className="flex flex-1 flex-col md:pl-16">
        <Topbar
          isRunning={state.isRunning}
          isDone={state.isDone}
          agentsDone={state.agents.filter((a) => a.status === "done" || a.status === "error").length}
          agentsTotal={state.agents.length}
          pipelineElapsedMs={state.pipelineElapsedMs}
          onMenuOpen={() => setMobileNavOpen(true)}
          onSpeakSummary={() => replay()}
          isSpeaking={isSpeaking}
          creditsBalance={credits.balance}
        />

        <main className="relative flex-1 overflow-y-auto">
          <GridPattern fade className="opacity-20 fixed" />

          {/* Ambient accent */}
          <div className="pointer-events-none fixed left-1/2 top-1/3 -translate-x-1/2
                          h-[500px] w-[700px] rounded-full bg-[#6366f1]
                          opacity-[0.03] blur-[160px]" />

          <div className="relative z-10 flex flex-col gap-3 md:gap-4 p-3 md:p-6">

            {/* Command input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="-mx-3 md:-mx-6 px-0"
            >
              <CommandInput
                value={state.command}
                onChange={(v) => dispatch({ type: "SET_COMMAND", payload: v })}
                onExecute={execute}
                onReset={reset}
                onStop={reset}
                onExport={handleExport}
                isRunning={state.isRunning}
                isDone={state.isDone}
                simulateFailure={state.simulateFailure}
                onSimulateFailureToggle={(v) => dispatch({ type: "SET_SIMULATE_FAILURE", payload: v })}
                inputRef={inputRef}
                voiceInput={voiceInput}
              />
            </motion.div>

            {/* Router badge — shown when command is typed and not mid-run */}
            <AnimatePresence>
              {routerResult && !state.isRunning && (
                <RouterBadge
                  result={routerResult}
                  override={modelOverride}
                  onOverride={setModelOverride}
                />
              )}
            </AnimatePresence>

            {/* Deploy button — only after pipeline completes */}
            <AnimatePresence>
              {state.isDone && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="mx-4 md:mx-6"
                >
                  <button
                    onClick={() => setDeployOpen(true)}
                    className="flex items-center gap-2 rounded-xl border border-[rgba(99,102,241,0.4)]
                               bg-[rgba(99,102,241,0.06)] px-5 py-2.5 text-sm font-semibold text-[#8080d0]
                               hover:border-[rgba(99,102,241,0.7)] hover:bg-[rgba(99,102,241,0.12)]
                               hover:text-[#a0a0ff] transition-all duration-150
                               shadow-[0_0_16px_rgba(99,102,241,0.08)]"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1L10 5H8V9H6V5H4L7 1Z" fill="currentColor" />
                      <rect x="2" y="11" width="10" height="2" rx="1" fill="currentColor" opacity="0.6" />
                    </svg>
                    Deploy this pipeline
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Main grid: 2 cols on xl ───────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">

              {/* LEFT */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="flex flex-col gap-3 md:gap-4"
              >
                <AgentFleet
                  agents={state.agents}
                  isSpeaking={isSpeaking}
                  onReplaySpeech={replay}
                />
                <LiveLog logs={state.logs} onClear={() => dispatch({ type: "CLEAR_LOGS" })} />
              </motion.div>

              {/* RIGHT */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4 }}
                className="flex flex-col gap-3 md:gap-4"
              >
                <WorkflowGraph agents={state.agents} activeNodeId={state.activeNodeId} />
                <BrowserReplay url={state.browserUrl} loading={state.browserLoading} />
              </motion.div>
            </div>

            {/* ── Bottom grid ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.4 }}
              >
                <InfraHeatmap
                  metrics={state.metrics}
                  costThisRun={state.costThisRun}
                  savedToday={savedToday}
                  modelUsed={state.modelUsed}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.4 }}
              >
                <MemoryNodes memories={state.memories} />
              </motion.div>
            </div>

          </div>
        </main>
      </div>

      <FinalReport
        reports={state.finalReports}
        open={state.reportOpen}
        onClose={() => dispatch({ type: "SET_REPORT_OPEN", open: false })}
        onExport={handleExport}
      />

      <AnimatePresence>
        {deployOpen && (
          <DeployModal
            command={state.command}
            onClose={() => setDeployOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
