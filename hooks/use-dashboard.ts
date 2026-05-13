"use client";

import { useReducer, useCallback, useRef } from "react";

export type AgentStatus = "idle" | "active" | "done" | "error" | "thinking";
export type LogLevel = "info" | "success" | "warn" | "error";

export interface AgentState {
  id: string;
  name: string;
  status: AgentStatus;
  subStatus: string;
  tokens: number;
  output: string;
  durationMs?: number;
}

export interface LogEntry {
  id: string;
  ts: string;
  level: LogLevel;
  message: string;
}

export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
}

export interface MetricState {
  tokens: number;
  latency: number;
  gpu: number;
  retries: number;
}

export interface AgentReport {
  agentId: string;
  agentName: string;
  output: string;
}

export interface DashboardState {
  agents: AgentState[];
  logs: LogEntry[];
  memories: MemoryEntry[];
  metrics: MetricState;
  isRunning: boolean;
  isDone: boolean;
  command: string;
  browserUrl: string;
  browserLoading: boolean;
  activeNodeId: string | null;
  finalReports: AgentReport[];
  reportOpen: boolean;
  retryingAgentId: string | null;
  simulateFailure: boolean;
  pipelineStartedAt: number | null;
  pipelineElapsedMs: number | null;
}

type Action =
  | { type: "SET_COMMAND"; payload: string }
  | { type: "SET_SIMULATE_FAILURE"; payload: boolean }
  | { type: "START" }
  | { type: "SET_PIPELINE_ELAPSED"; ms: number }
  | { type: "AGENT"; id: string; status: AgentStatus; subStatus: string; tokens?: number; output?: string; durationMs?: number }
  | { type: "LOG"; level: LogLevel; message: string }
  | { type: "MEMORY"; key: string; value: string }
  | { type: "METRICS"; patch: Partial<MetricState> }
  | { type: "BROWSER"; url?: string; loading: boolean }
  | { type: "ACTIVE_NODE"; id: string | null }
  | { type: "ADD_REPORT"; report: AgentReport }
  | { type: "SET_REPORT_OPEN"; open: boolean }
  | { type: "SET_RETRYING"; id: string | null }
  | { type: "COMPLETE" }
  | { type: "RESET" }
  | { type: "CLEAR_LOGS" };

const INITIAL_AGENTS: AgentState[] = [
  { id: "planner",  name: "Planner",  status: "idle", subStatus: "Awaiting input",      tokens: 0, output: "", durationMs: undefined },
  { id: "research", name: "Research", status: "idle", subStatus: "Awaiting activation", tokens: 0, output: "", durationMs: undefined },
  { id: "browser",  name: "Browser",  status: "idle", subStatus: "Awaiting URL",        tokens: 0, output: "", durationMs: undefined },
  { id: "finance",  name: "Finance",  status: "idle", subStatus: "Awaiting data",       tokens: 0, output: "", durationMs: undefined },
  { id: "voice",    name: "Voice",    status: "idle", subStatus: "Standby",             tokens: 0, output: "", durationMs: undefined },
];

const INITIAL_STATE: DashboardState = {
  agents: INITIAL_AGENTS,
  logs: [],
  memories: [],
  metrics: { tokens: 0, latency: 0, gpu: 0, retries: 0 },
  isRunning: false,
  isDone: false,
  command: "",
  browserUrl: "about:blank",
  browserLoading: false,
  activeNodeId: null,
  finalReports: [],
  reportOpen: false,
  retryingAgentId: null,
  simulateFailure: false,
  pipelineStartedAt: null,
  pipelineElapsedMs: null,
};

let logSeq = 0;
let memSeq = 0;

function now() {
  return new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case "SET_COMMAND":
      return { ...state, command: action.payload };

    case "SET_SIMULATE_FAILURE":
      return { ...state, simulateFailure: action.payload };

    case "START":
      logSeq = 0;
      memSeq = 0;
      return { ...INITIAL_STATE, command: state.command, simulateFailure: state.simulateFailure, isRunning: true, pipelineStartedAt: Date.now() };

    case "SET_PIPELINE_ELAPSED":
      return { ...state, pipelineElapsedMs: action.ms };

    case "AGENT":
      return {
        ...state,
        agents: state.agents.map((a) =>
          a.id === action.id
            ? {
                ...a,
                status: action.status,
                subStatus: action.subStatus,
                tokens: action.tokens ?? a.tokens,
                output: action.output ?? a.output,
                durationMs: action.durationMs ?? a.durationMs,
              }
            : a
        ),
      };

    case "LOG":
      return {
        ...state,
        logs: [
          ...state.logs,
          { id: String(logSeq++), ts: now(), level: action.level, message: action.message },
        ].slice(-80),
      };

    case "MEMORY":
      return {
        ...state,
        memories: [
          ...state.memories,
          { id: String(memSeq++), key: action.key, value: action.value },
        ],
      };

    case "METRICS":
      return { ...state, metrics: { ...state.metrics, ...action.patch } };

    case "BROWSER":
      return {
        ...state,
        browserUrl: action.url ?? state.browserUrl,
        browserLoading: action.loading,
      };

    case "ACTIVE_NODE":
      return { ...state, activeNodeId: action.id };

    case "ADD_REPORT":
      return { ...state, finalReports: [...state.finalReports, action.report] };

    case "SET_REPORT_OPEN":
      return { ...state, reportOpen: action.open };

    case "SET_RETRYING":
      return { ...state, retryingAgentId: action.id };

    case "COMPLETE":
      return {
        ...state,
        isRunning: false,
        isDone: true,
        reportOpen: true,
        pipelineElapsedMs: state.pipelineStartedAt ? Date.now() - state.pipelineStartedAt : null,
      };

    case "RESET":
      return { ...INITIAL_STATE };

    case "CLEAR_LOGS":
      return { ...state, logs: [] };

    default:
      return state;
  }
}

async function streamAgent(
  agentType: string,
  task: string,
  context: string,
  onToken: (text: string) => void,
  signal: AbortSignal
): Promise<{ output: string; tokens: number }> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentType, task, context }),
    signal,
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let output = "";
  let tokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split("\n").filter(Boolean);
    for (const line of lines) {
      let msg: { type: string; text?: string; content?: string; error?: string; usage?: { input_tokens?: number; output_tokens?: number } };
      try {
        msg = JSON.parse(line);
      } catch {
        continue;
      }
      if (msg.type === "token" && msg.text) {
        output += msg.text;
        onToken(msg.text);
      } else if (msg.type === "done" && msg.content) {
        output = msg.content;
        tokens = (msg.usage?.input_tokens ?? 0) + (msg.usage?.output_tokens ?? 0);
      } else if (msg.type === "error") {
        throw new Error(msg.error ?? "Unknown stream error");
      }
    }
  }

  return { output, tokens };
}

export function useDashboard() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    if (!state.command.trim()) return;

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    const willSimulateFailure = state.simulateFailure;

    dispatch({ type: "START" });

    const log = (level: LogLevel, message: string) => dispatch({ type: "LOG", level, message });
    const agent = (id: string, status: AgentStatus, subStatus: string, tokens?: number, output?: string, durationMs?: number) =>
      dispatch({ type: "AGENT", id, status, subStatus, tokens, output, durationMs });
    const mem = (key: string, value: string) => dispatch({ type: "MEMORY", key, value });
    const metrics = (patch: Partial<MetricState>) => dispatch({ type: "METRICS", patch });
    const node = (id: string | null) => dispatch({ type: "ACTIVE_NODE", id });
    const addReport = (agentId: string, agentName: string, output: string) =>
      dispatch({ type: "ADD_REPORT", report: { agentId, agentName, output } });

    let totalTokens = 0;
    let context = "";
    let browserSimFailed = false;

    const runAgent = async (
      id: string,
      name: string,
      agentType: string,
      task: string,
      browserUrl?: string
    ) => {
      node(id);
      agent(id, "thinking", "Waiting for Claude...");
      log("info", `[${id}] Connecting to Claude (${agentType})...`);

      if (browserUrl) {
        dispatch({ type: "BROWSER", url: browserUrl, loading: true });
      }

      let streamedOutput = "";
      const t0 = Date.now();

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) {
            dispatch({ type: "SET_RETRYING", id });
            dispatch({ type: "METRICS", patch: { retries: 1 } });
            log("warn", `[${id}] Retrying after error...`);
            await new Promise((r) => setTimeout(r, 800));
          }

          // Simulated failure for browser agent on first attempt
          if (willSimulateFailure && id === "browser" && attempt === 0 && !browserSimFailed) {
            browserSimFailed = true;
            agent(id, "active", "Connecting to target...");
            await new Promise((r) => setTimeout(r, 1200));
            log("warn", "[browser] ⚠ Connection timeout — switching to backup mirror");
            throw new Error("Simulated: connection timeout");
          }

          // Switch to active once first token arrives
          let firstToken = true;
          const { output, tokens } = await streamAgent(
            agentType,
            task,
            context,
            (text) => {
              if (firstToken) {
                firstToken = false;
                agent(id, "active", "Streaming response...");
                if (browserUrl) dispatch({ type: "BROWSER", loading: false });
              }
              streamedOutput += text;
              agent(id, "active", "Streaming response...", undefined, streamedOutput);
            },
            signal
          );

          totalTokens += tokens || Math.floor(streamedOutput.length / 3.5);
          const latency = Date.now() - t0;

          agent(id, "done", "Complete", totalTokens, output, Date.now() - t0);
          addReport(id, name, output);
          log("success", `[${id}] Done — ${tokens} tokens · ${latency}ms`);
          metrics({
            tokens: totalTokens,
            latency: Math.round(latency),
            gpu: Math.min(30 + totalTokens / 80, 95),
          });

          context += `\n\n[${name}]: ${output}`;
          dispatch({ type: "SET_RETRYING", id: null });
          return output;
        } catch (err) {
          if (signal.aborted) return "";
          if (attempt === 1) {
            agent(id, "error", "Failed after retry");
            log("error", `[${id}] Error: ${err instanceof Error ? err.message : "Unknown"}`);
            addReport(id, name, `[Error] Agent failed. Fallback: Could not complete ${agentType} analysis.`);
            dispatch({ type: "SET_RETRYING", id: null });
            return "";
          }
        }
      }
      return "";
    };

    // ── Pipeline ────────────────────────────────────────────────────────────
    log("info", `[pipeline] Starting — command: "${state.command}"`);

    await runAgent("planner", "Planner", "planner", state.command);
    if (signal.aborted) return;

    mem("query_intent", state.command.slice(0, 80));
    metrics({ gpu: 22 });

    // Research + Browser in parallel
    await Promise.all([
      runAgent("research", "Research", "research", state.command, undefined),
      runAgent("browser", "Browser", "browser", state.command, "https://finance.yahoo.com/quote/NVDA"),
    ]);
    if (signal.aborted) return;

    mem("parallel_complete", "Research + Browser agents finished");

    await runAgent("finance", "Finance", "finance", state.command);
    if (signal.aborted) return;

    mem("finance_signal", "Technical analysis complete");

    await runAgent("voice", "Voice", "voice", state.command);
    if (signal.aborted) return;

    // Summary agent compiles full report
    log("info", "[summary] Generating final report...");
    const summaryOutput = await runAgent("summary", "Summary", "summary", state.command);
    if (signal.aborted) return;

    mem("final_summary", summaryOutput.slice(0, 120));

    log("success", "[pipeline] All agents complete");

    // Save token usage to Supabase (fire-and-forget — never blocks the UI)
    const agentBreakdown = Object.fromEntries(
      state.agents.map((a) => [
        a.id,
        { name: a.name, tokens: a.tokens, status: a.status },
      ])
    );
    fetch("/api/orchestrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "anonymous",
        command: state.command,
        agentBreakdown,
      }),
    }).catch(() => {});

    node(null);
    dispatch({ type: "COMPLETE" });
  }, [state.command, state.simulateFailure]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "RESET" });
  }, []);

  return { state, dispatch, execute, reset };
}
