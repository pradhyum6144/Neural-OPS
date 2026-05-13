import { supabase } from "./supabase";

export interface AgentBreakdown {
  [agentId: string]: {
    name: string;
    tokens: number;
    status: string;
  };
}

export interface AlertSettings {
  user_id: string;
  daily_limit: number;
  per_run_limit: number;
  spike_threshold: number;
  email_enabled: boolean;
  email_address: string | null;
  discord_enabled: boolean;
  discord_webhook_url: string | null;
  slack_enabled: boolean;
  slack_webhook_url: string | null;
}

export interface TokenUsageRow {
  id: string;
  user_id: string;
  command: string;
  total_tokens: number;
  agent_breakdown: AgentBreakdown;
  run_id: string;
  created_at: string;
}

// ── Save a completed pipeline run to token_usage ───────────────────────────
export async function saveRunTokens(
  userId: string,
  command: string,
  agentBreakdown: AgentBreakdown
): Promise<{ runId: string | null; error: string | null }> {
  const totalTokens = Object.values(agentBreakdown).reduce(
    (sum, a) => sum + (a.tokens ?? 0),
    0
  );

  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const { error } = await supabase.from("token_usage").insert({
    user_id: userId,
    command,
    total_tokens: totalTokens,
    agent_breakdown: agentBreakdown,
    run_id: runId,
  });

  if (error) {
    console.error("[tokenTracker] saveRunTokens error:", error.message);
    return { runId: null, error: error.message };
  }

  return { runId, error: null };
}

// ── Get total tokens used today for a user ─────────────────────────────────
export async function getTodayUsage(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("token_usage")
    .select("total_tokens")
    .eq("user_id", userId)
    .gte("created_at", startOfDay.toISOString());

  if (error) {
    console.error("[tokenTracker] getTodayUsage error:", error.message);
    return 0;
  }

  return (data ?? []).reduce((sum, row) => sum + (row.total_tokens ?? 0), 0);
}

// ── Get alert settings for a user ─────────────────────────────────────────
export async function getUserAlertSettings(
  userId: string
): Promise<AlertSettings | null> {
  const { data, error } = await supabase
    .from("alert_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      // PGRST116 = no rows found — not an error
      console.error("[tokenTracker] getUserAlertSettings error:", error.message);
    }
    return null;
  }

  return data as AlertSettings;
}

// ── Fire an alert and log it ───────────────────────────────────────────────
export async function fireAlert(
  userId: string,
  alertType: "warning" | "critical" | "spike",
  message: string,
  tokensUsed: number,
  limitUsed: number,
  settings: AlertSettings
): Promise<void> {
  // Log to alert_logs table
  await supabase.from("alert_logs").insert({
    user_id: userId,
    alert_type: alertType,
    message,
    tokens_used: tokensUsed,
    limit_used: limitUsed,
  });

  // Discord webhook
  if (settings.discord_enabled && settings.discord_webhook_url) {
    await fetch(settings.discord_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `🚨 **Neural OPS Alert** [${alertType.toUpperCase()}]\n${message}\nTokens used: **${tokensUsed.toLocaleString()}** / limit: **${limitUsed.toLocaleString()}**`,
      }),
    }).catch(() => {});
  }

  // Slack webhook
  if (settings.slack_enabled && settings.slack_webhook_url) {
    await fetch(settings.slack_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🚨 *Neural OPS Alert* [${alertType.toUpperCase()}]\n${message}\nTokens used: *${tokensUsed.toLocaleString()}* / limit: *${limitUsed.toLocaleString()}*`,
      }),
    }).catch(() => {});
  }
}

// ── Check thresholds and fire alerts if needed ─────────────────────────────
export async function checkAndFireAlerts(
  userId: string,
  runTokens: number
): Promise<void> {
  const settings = await getUserAlertSettings(userId);
  if (!settings) return;

  const todayTotal = await getTodayUsage(userId);

  // Per-run limit check
  if (settings.per_run_limit > 0 && runTokens >= settings.per_run_limit) {
    const pct = Math.round((runTokens / settings.per_run_limit) * 100);
    await fireAlert(
      userId,
      pct >= 100 ? "critical" : "warning",
      `Single run used ${runTokens.toLocaleString()} tokens (${pct}% of per-run limit)`,
      runTokens,
      settings.per_run_limit,
      settings
    );
  }

  // Daily limit check
  if (settings.daily_limit > 0 && todayTotal >= settings.daily_limit * 0.8) {
    const pct = Math.round((todayTotal / settings.daily_limit) * 100);
    await fireAlert(
      userId,
      pct >= 100 ? "critical" : "warning",
      `Daily usage at ${pct}% — ${todayTotal.toLocaleString()} / ${settings.daily_limit.toLocaleString()} tokens`,
      todayTotal,
      settings.daily_limit,
      settings
    );
  }

  // Spike threshold (single run vs yesterday average) — simple heuristic
  if (settings.spike_threshold > 0 && runTokens >= settings.spike_threshold) {
    await fireAlert(
      userId,
      "spike",
      `Token spike detected — single run used ${runTokens.toLocaleString()} tokens`,
      runTokens,
      settings.spike_threshold,
      settings
    );
  }
}
