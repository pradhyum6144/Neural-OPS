import { supabase } from "./supabase";
import { sendEmailAlert, sendDiscordAlert, sendSlackAlert } from "./notifications";
import type { AlertType, AlertData } from "./notifications";
import type { AgentBreakdown, AlertSettings } from "./tokenTracker";
import { getTodayUsage, getUserAlertSettings } from "./tokenTracker";

// ── Main entry point called after every pipeline run ──────────────────────

export async function checkAndFireAlerts(
  userId: string,
  runTokens: number,
  agentBreakdown: AgentBreakdown,
  command: string
): Promise<void> {
  // STEP 1 — fetch alert settings
  const settings = await getUserAlertSettings(userId);
  if (!settings) return; // no settings configured → skip

  // STEP 2 — fetch today's total token usage
  const todayTotal = await getTodayUsage(userId);

  // STEP 3 — evaluate conditions
  const alerts: { type: AlertType; message: string; limit: number }[] = [];

  // SPIKE: single run exceeded threshold
  if (settings.spike_threshold > 0 && runTokens > settings.spike_threshold) {
    alerts.push({
      type: "spike",
      message: `Single run used ${runTokens.toLocaleString()} tokens, exceeding spike threshold of ${settings.spike_threshold.toLocaleString()}`,
      limit: settings.spike_threshold,
    });
  }

  // CRITICAL: today's total >= daily limit
  if (settings.daily_limit > 0 && todayTotal >= settings.daily_limit) {
    alerts.push({
      type: "critical",
      message: `Daily token limit reached — ${todayTotal.toLocaleString()} / ${settings.daily_limit.toLocaleString()} tokens used today`,
      limit: settings.daily_limit,
    });
  }
  // WARNING: today's total between 80% and 100% of daily limit (only if critical not already firing)
  else if (
    settings.daily_limit > 0 &&
    todayTotal > settings.daily_limit * 0.8 &&
    todayTotal < settings.daily_limit
  ) {
    const pct = Math.round((todayTotal / settings.daily_limit) * 100);
    alerts.push({
      type: "warning",
      message: `Daily usage at ${pct}% — ${todayTotal.toLocaleString()} / ${settings.daily_limit.toLocaleString()} tokens`,
      limit: settings.daily_limit,
    });
  }

  if (alerts.length === 0) return;

  // STEP 4 — fire each triggered alert through enabled channels
  for (const alert of alerts) {
    const data: AlertData = {
      command,
      totalTokens: runTokens,
      limit: alert.limit,
      todayTotal,
      agentBreakdown,
      userId,
    };

    await Promise.allSettled([
      // Email
      settings.email_enabled && settings.email_address
        ? sendEmailAlert(settings.email_address, alert.type, data)
        : Promise.resolve(),

      // Discord
      settings.discord_enabled && settings.discord_webhook_url
        ? sendDiscordAlert(settings.discord_webhook_url, alert.type, data)
        : Promise.resolve(),

      // Slack
      settings.slack_enabled && settings.slack_webhook_url
        ? sendSlackAlert(settings.slack_webhook_url, alert.type, data)
        : Promise.resolve(),
    ]);

    // STEP 5 — log fired alert to alert_logs table
    await logAlert(userId, alert.type, alert.message, runTokens, alert.limit);
  }
}

// ── Write to alert_logs ────────────────────────────────────────────────────

async function logAlert(
  userId: string,
  alertType: AlertType,
  message: string,
  tokensUsed: number,
  limitUsed: number
): Promise<void> {
  const { error } = await supabase.from("alert_logs").insert({
    user_id: userId,
    alert_type: alertType,
    message,
    tokens_used: tokensUsed,
    limit_used: limitUsed,
  });

  if (error) {
    console.error("[alertEngine] logAlert error:", error.message);
  }
}
