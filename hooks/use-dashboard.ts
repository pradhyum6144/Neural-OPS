"use client";

import { useReducer, useCallback, useRef } from "react";

export type AgentStatus = "idle" | "active" | "done" | "error";
export type LogLevel = "info" | "success" | "warn" | "error";

export interface AgentState {
  id: string;
  name: string;
  status: AgentStatus;
  subStatus: string;
  tokens: number;
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
}

type Action =
  | { type: "SET_COMMAND"; payload: string }
  | { type: "START" }
  | { type: "AGENT"; id: string; status: AgentStatus; subStatus: string; tokens?: number }
  | { type: "LOG"; level: LogLevel; message: string }
  | { type: "MEMORY"; key: string; value: string }
  | { type: "METRICS"; patch: Partial<MetricState> }
  | { type: "BROWSER"; url?: string; loading: boolean }
  | { type: "ACTIVE_NODE"; id: string | null }
  | { type: "COMPLETE" }
  | { type: "RESET" };

const INITIAL_AGENTS: AgentState[] = [
  { id: "planner",  name: "Planner",  status: "idle", subStatus: "Awaiting input",       tokens: 0 },
  { id: "research", name: "Research", status: "idle", subStatus: "Awaiting activation",  tokens: 0 },
  { id: "browser",  name: "Browser",  status: "idle", subStatus: "Awaiting URL",         tokens: 0 },
  { id: "finance",  name: "Finance",  status: "idle", subStatus: "Awaiting data",        tokens: 0 },
  { id: "voice",    name: "Voice",    status: "idle", subStatus: "Standby",              tokens: 0 },
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

    case "START":
      return { ...INITIAL_STATE, command: state.command, isRunning: true };

    case "AGENT":
      return {
        ...state,
        agents: state.agents.map((a) =>
          a.id === action.id
            ? { ...a, status: action.status, subStatus: action.subStatus, tokens: action.tokens ?? a.tokens }
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

    case "COMPLETE":
      return { ...state, isRunning: false, isDone: true };

    case "RESET":
      return { ...INITIAL_STATE };

    default:
      return state;
  }
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function useDashboard() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const abortRef = useRef(false);

  const execute = useCallback(async () => {
    if (!state.command.trim()) return;
    abortRef.current = false;
    dispatch({ type: "START" });

    const d = (ms: number) => delay(ms);
    const log = (level: LogLevel, message: string) => dispatch({ type: "LOG", level, message });
    const agent = (id: string, status: AgentStatus, subStatus: string, tokens?: number) =>
      dispatch({ type: "AGENT", id, status, subStatus, tokens });
    const mem = (key: string, value: string) => dispatch({ type: "MEMORY", key, value });
    const metrics = (patch: Partial<MetricState>) => dispatch({ type: "METRICS", patch });
    const browser = (url: string, loading: boolean) => dispatch({ type: "BROWSER", url, loading });
    const node = (id: string | null) => dispatch({ type: "ACTIVE_NODE", id });

    // ── Step 1: Planner activates ──────────────────────────────────────────
    node("planner");
    agent("planner", "active", "Parsing query intent...", 120);
    log("info", `[planner] Received command: "${state.command}"`);
    log("info", "[planner] Decomposing into sub-tasks...");
    metrics({ tokens: 120, latency: 42, gpu: 18 });
    await d(900);

    agent("planner", "active", "Routing to Research + Browser", 340);
    log("info", "[planner] Identified 2 parallel tracks: data + web");
    mem("query_intent", "NVIDIA stock analysis + AI news summary");
    metrics({ tokens: 340, latency: 55, gpu: 24 });
    await d(700);

    // ── Step 2: Research + Browser activate in parallel ───────────────────
    node("research");
    agent("planner", "done", "Sub-tasks dispatched", 340);
    agent("research", "active", "Querying financial APIs...", 80);
    agent("browser", "active", "Navigating to finance.yahoo.com", 60);
    log("success", "[planner] Plan dispatched — 2 agents running in parallel");
    log("info", "[research] Fetching NVDA price history (90d)...");
    log("info", "[browser] Opening https://finance.yahoo.com/quote/NVDA");
    browser("https://finance.yahoo.com/quote/NVDA", true);
    metrics({ tokens: 480, latency: 61, gpu: 38 });
    await d(1000);

    // ── Step 3: Browser navigating ────────────────────────────────────────
    node("browser");
    agent("browser", "active", "Extracting DOM content...", 210);
    browser("https://finance.yahoo.com/quote/NVDA", false);
    log("info", "[browser] Page loaded — scraping price table");
    log("info", "[browser] Extracted: NVDA $875.40 (+3.2%) · Vol 48.2M");
    log("info", "[research] arxiv.org: fetching 'nvidia llm' papers (2024)...");
    metrics({ tokens: 690, latency: 78, gpu: 51 });
    mem("nvda_price", "NVDA $875.40 · +3.2% · Vol 48.2M");
    await d(900);

    // ── Step 4: Finance activates ─────────────────────────────────────────
    node("finance");
    agent("research", "active", "Summarising 14 papers...", 1420);
    agent("finance", "active", "Running technical analysis...", 200);
    log("info", "[research] LLM call — summarising abstracts (14 papers)...");
    log("info", "[finance] Computing RSI, MACD, Bollinger Bands...");
    log("warn", "[finance] High volatility detected — flagging for summary");
    browser("https://arxiv.org/search/?query=nvidia+llm", false);
    metrics({ tokens: 1620, latency: 88, gpu: 67, retries: 1 });
    await d(1100);

    // ── Step 5: Research done, Finance wrapping ───────────────────────────
    node("research");
    agent("research", "done", "14 papers summarised", 2180);
    log("success", "[research] Summary complete — 14 papers indexed");
    mem("research_context", "Key themes: LLM reasoning, inference efficiency, CUDA kernels");
    metrics({ tokens: 2180, latency: 94, gpu: 72 });
    await d(700);

    // ── Step 6: Browser done, Finance done ───────────────────────────────
    agent("browser", "done", "3 pages scraped", 540);
    agent("finance", "done", "Analysis complete", 880);
    log("success", "[browser] Scraping complete — 3 sources indexed");
    log("success", "[finance] Technical analysis complete — signal: BUY");
    mem("finance_signal", "RSI: 58.4 · MACD: bullish crossover · Signal: BUY");
    metrics({ tokens: 2720, latency: 91, gpu: 58 });
    await d(600);

    // ── Step 7: Voice agent narrates, Summary builds ──────────────────────
    node("voice");
    agent("voice", "active", "Generating audio summary...", 380);
    log("info", "[voice] Synthesising narration from research context...");
    log("info", "[summary] Aggregating all agent outputs...");
    metrics({ tokens: 3100, latency: 86, gpu: 44 });
    await d(900);

    // ── Step 8: All done ──────────────────────────────────────────────────
    agent("voice", "done", "Narration ready", 380);
    log("success", "[summary] Final report generated successfully");
    log("success", "[pipeline] All 5 agents completed · Total: 3,100 tokens");
    mem("final_summary", "NVDA: strong buy signal · AI sector momentum accelerating");
    metrics({ tokens: 3100, latency: 82, gpu: 31, retries: 1 });
    node(null);
    dispatch({ type: "COMPLETE" });
  }, [state.command]);

  const reset = useCallback(() => {
    abortRef.current = true;
    dispatch({ type: "RESET" });
  }, []);

  return { state, dispatch, execute, reset };
}
