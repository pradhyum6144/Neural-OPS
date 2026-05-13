export const APP_NAME = "Neural OPS";
export const APP_DESCRIPTION = "AI Agent Orchestration Platform";

export const AGENT_STATUS = {
  IDLE: "idle",
  RUNNING: "running",
  SUCCESS: "success",
  FAILED: "failed",
  PAUSED: "paused",
} as const;

export type AgentStatus = (typeof AGENT_STATUS)[keyof typeof AGENT_STATUS];

export const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: "nos-badge-accent",
  running: "nos-badge-green",
  success: "nos-badge-green",
  failed: "nos-badge-red",
  paused: "nos-badge-amber",
};
