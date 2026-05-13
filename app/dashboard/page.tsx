"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useDashboard } from "@/hooks/use-dashboard";
import { useSpeech } from "@/hooks/use-speech";
import { useWorkflowHistory } from "@/hooks/use-workflow-history";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { CommandInput } from "@/components/dashboard/command-input";
import { AgentFleet } from "@/components/dashboard/agent-fleet";
import { LiveLog } from "@/components/dashboard/live-log";
import { BrowserReplay } from "@/components/dashboard/browser-replay";
import { InfraHeatmap } from "@/components/dashboard/infra-heatmap";
import { MemoryNodes } from "@/components/dashboard/memory-nodes";
import { FinalReport } from "@/components/dashboard/final-report";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const prevDoneRef = useRef(false);

  // Speak voice agent output when it completes
  useEffect(() => {
    const voiceAgent = state.agents.find((a) => a.id === "voice");
    if (voiceAgent?.status === "done" && voiceAgent.output) {
      const plainText = voiceAgent.output.replace(/\*\*|##|`/g, "").trim();
      speak(plainText);
    }
  }, [state.agents, speak]);

  // Save to history when pipeline completes
  useEffect(() => {
    if (state.isDone && !prevDoneRef.current) {
      addEntry({
        command: state.command,
        tokens: state.metrics.tokens,
        agentsCompleted: state.agents.filter((a) => a.status === "done").length,
      });
    }
    prevDoneRef.current = state.isDone;
  }, [state.isDone, state.command, state.metrics.tokens, state.agents, addEntry]);

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
      />

      {/* Main — offset for desktop sidebar */}
      <div className="flex flex-1 flex-col md:pl-16">
        <Topbar
          isRunning={state.isRunning}
          isDone={state.isDone}
          onMenuOpen={() => setMobileNavOpen(true)}
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
              />
            </motion.div>

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
                <LiveLog logs={state.logs} />
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
                <InfraHeatmap metrics={state.metrics} />
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
    </div>
  );
}
