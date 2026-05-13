"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useDashboard } from "@/hooks/use-dashboard";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { CommandInput } from "@/components/dashboard/command-input";
import { AgentFleet } from "@/components/dashboard/agent-fleet";
import { LiveLog } from "@/components/dashboard/live-log";
import { BrowserReplay } from "@/components/dashboard/browser-replay";
import { InfraHeatmap } from "@/components/dashboard/infra-heatmap";
import { MemoryNodes } from "@/components/dashboard/memory-nodes";
import { GridPattern } from "@/components/ui/grid-pattern";

// SSR-off for ReactFlow (relies on browser APIs)
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

export default function DashboardPage() {
  const { state, dispatch, execute, reset } = useDashboard();

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-[#e0e0ff]">
      <Sidebar />

      {/* Main */}
      <div className="flex flex-1 flex-col pl-16">
        <Topbar isRunning={state.isRunning} isDone={state.isDone} />

        {/* Scrollable content */}
        <main className="relative flex-1 overflow-y-auto">
          <GridPattern fade className="opacity-20 fixed" />

          {/* Ambient accent */}
          <div className="pointer-events-none fixed left-1/2 top-1/3 -translate-x-1/2
                          h-[500px] w-[700px] rounded-full bg-[#6366f1]
                          opacity-[0.03] blur-[160px]" />

          <div className="relative z-10 flex flex-col gap-4 p-6">

            {/* Command input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="-mx-6 px-6"
            >
              <CommandInput
                value={state.command}
                onChange={(v) => dispatch({ type: "SET_COMMAND", payload: v })}
                onExecute={execute}
                onReset={reset}
                isRunning={state.isRunning}
                isDone={state.isDone}
              />
            </motion.div>

            {/* ── Main grid: 2 cols ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

              {/* LEFT: Agent Fleet + Live Log */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="flex flex-col gap-4"
              >
                <AgentFleet agents={state.agents} />
                <LiveLog logs={state.logs} />
              </motion.div>

              {/* RIGHT: Workflow Graph + Browser Replay */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4 }}
                className="flex flex-col gap-4"
              >
                <WorkflowGraph agents={state.agents} activeNodeId={state.activeNodeId} />
                <BrowserReplay url={state.browserUrl} loading={state.browserLoading} />
              </motion.div>
            </div>

            {/* ── Bottom grid: 2 cols ───────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
    </div>
  );
}
