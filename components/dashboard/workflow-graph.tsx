"use client";

import { useMemo } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  MarkerType,
  type NodeProps,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { Brain, Search, Monitor, TrendingUp, Mic, User, FileText } from "lucide-react";
import { clsx } from "clsx";
import type { AgentState, AgentStatus } from "@/hooks/use-dashboard";

/* ── Custom node ──────────────────────────────────────────────────────────── */

interface FlowNodeData {
  label: string;
  icon: React.ElementType;
  status: AgentStatus | "neutral";
  isSource?: boolean;
  isTarget?: boolean;
}

const STATUS_NODE: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  idle:    { border: "rgba(99,102,241,0.15)", bg: "rgba(16,16,28,0.9)",       text: "#4a4a6a", dot: "#3a3a5a" },
  active:  { border: "rgba(99,102,241,0.7)",  bg: "rgba(99,102,241,0.12)",    text: "#a0a0ff", dot: "#6366f1" },
  done:    { border: "rgba(34,211,165,0.4)",  bg: "rgba(34,211,165,0.08)",    text: "#22d3a5", dot: "#22d3a5" },
  error:   { border: "rgba(244,63,94,0.4)",   bg: "rgba(244,63,94,0.08)",     text: "#f43f5e", dot: "#f43f5e" },
  neutral: { border: "rgba(99,102,241,0.25)", bg: "rgba(16,16,28,0.9)",       text: "#8080b0", dot: "#6366f1" },
};

function FlowNode({ data }: NodeProps<FlowNodeData>) {
  const Icon = data.icon;
  const st = STATUS_NODE[data.status] ?? STATUS_NODE.idle;
  const isActive = data.status === "active";

  return (
    <div
      className="relative flex flex-col items-center gap-1.5 rounded-xl px-4 py-3 min-w-[88px]"
      style={{
        background: st.bg,
        border: `1px solid ${st.border}`,
        boxShadow: isActive ? `0 0 20px ${st.border}` : "none",
        transition: "all 0.3s ease",
      }}
    >
      {!data.isSource && <Handle type="target" position={Position.Top} style={{ background: st.dot, border: "none", width: 6, height: 6 }} />}

      {/* Icon */}
      <div
        className="flex h-7 w-7 items-center justify-center rounded-lg"
        style={{ background: `${st.dot}22`, border: `1px solid ${st.dot}44` }}
      >
        <Icon size={13} style={{ color: st.dot }} />
      </div>

      {/* Label */}
      <span className="text-[10px] font-semibold" style={{ color: st.text }}>{data.label}</span>

      {/* Status dot */}
      <div className="relative">
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} />
        {isActive && (
          <div className="absolute inset-0 h-1.5 w-1.5 rounded-full animate-ping" style={{ background: st.dot, opacity: 0.6 }} />
        )}
      </div>

      {!data.isTarget && <Handle type="source" position={Position.Bottom} style={{ background: st.dot, border: "none", width: 6, height: 6 }} />}
    </div>
  );
}

const NODE_TYPES = { agentNode: FlowNode };

/* ── Static node positions ───────────────────────────────────────────────── */

interface BaseNodeDef {
  id: string;
  agentId: string;
  position: { x: number; y: number };
  type: string;
}

const BASE_NODES: BaseNodeDef[] = [
  { id: "query",    agentId: "",         position: { x: 140, y: 10  }, type: "agentNode" },
  { id: "planner",  agentId: "planner",  position: { x: 140, y: 110 }, type: "agentNode" },
  { id: "research", agentId: "research", position: { x: 30,  y: 220 }, type: "agentNode" },
  { id: "browser",  agentId: "browser",  position: { x: 250, y: 220 }, type: "agentNode" },
  { id: "finance",  agentId: "finance",  position: { x: 140, y: 330 }, type: "agentNode" },
  { id: "voice",    agentId: "voice",    position: { x: 30,  y: 440 }, type: "agentNode" },
  { id: "summary",  agentId: "",         position: { x: 250, y: 440 }, type: "agentNode" },
];

const NODE_META: Record<string, { label: string; icon: React.ElementType; isSource?: boolean; isTarget?: boolean }> = {
  query:    { label: "User Query",  icon: User,       isSource: true },
  planner:  { label: "Planner",     icon: Brain },
  research: { label: "Research",    icon: Search },
  browser:  { label: "Browser",     icon: Monitor },
  finance:  { label: "Finance",     icon: TrendingUp },
  voice:    { label: "Voice",       icon: Mic },
  summary:  { label: "Summary",     icon: FileText, isTarget: true },
};

const STATIC_EDGES: Edge[] = [
  { id: "q-p",  source: "query",    target: "planner",  type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "p-r",  source: "planner",  target: "research", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "p-b",  source: "planner",  target: "browser",  type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "r-f",  source: "research", target: "finance",  type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "b-f",  source: "browser",  target: "finance",  type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "f-v",  source: "finance",  target: "voice",    type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "f-s",  source: "finance",  target: "summary",  type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
];

/* ── Component ───────────────────────────────────────────────────────────── */

export function WorkflowGraph({ agents, activeNodeId }: { agents: AgentState[]; activeNodeId: string | null }) {
  const statusMap = useMemo(() => {
    const m: Record<string, AgentStatus> = {};
    agents.forEach((a) => { m[a.id] = a.status; });
    return m;
  }, [agents]);

  const nodes: Node<FlowNodeData>[] = useMemo(() =>
    BASE_NODES.map((n) => {
      const meta = NODE_META[n.id];
      const agentStatus = n.agentId ? (statusMap[n.agentId] ?? "idle") : "neutral";
      return {
        id: n.id,
        position: n.position,
        type: n.type,
        data: {
          label: meta.label,
          icon: meta.icon,
          status: agentStatus,
          isSource: meta.isSource,
          isTarget: meta.isTarget,
        },
      };
    }), [statusMap]);

  const edges: Edge[] = useMemo(() =>
    STATIC_EDGES.map((e) => {
      const srcAgentId = BASE_NODES.find((n) => n.id === e.source)?.agentId ?? "";
      const isActive = srcAgentId ? statusMap[srcAgentId] === "active" : false;
      return {
        ...e,
        animated: isActive,
        style: {
          stroke: isActive ? "rgba(99,102,241,0.7)" : "rgba(99,102,241,0.15)",
          strokeWidth: isActive ? 2 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isActive ? "rgba(99,102,241,0.7)" : "rgba(99,102,241,0.2)",
        },
      };
    }), [statusMap]);

  return (
    <div className="nos-panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(99,102,241,0.08)]">
        <span className="nos-label">Workflow Graph</span>
        <span className="text-[10px] font-mono text-[#4a4a6a]">ReactFlow · live</span>
      </div>

      <div style={{ width: "100%", height: 480 }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            zoomOnScroll={false}
            style={{ background: "transparent", width: "100%", height: "100%" }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="rgba(99,102,241,0.12)"
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
