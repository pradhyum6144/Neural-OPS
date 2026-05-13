import { Resend } from "resend";
import type { AgentBreakdown } from "./tokenTracker";

const resend = new Resend(process.env.RESEND_API_KEY);

export type AlertType = "warning" | "critical" | "spike";

export interface AlertData {
  command: string;
  totalTokens: number;
  limit: number;
  todayTotal?: number;
  agentBreakdown: AgentBreakdown;
  userId: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatAgentBreakdownText(breakdown: AgentBreakdown): string {
  return Object.values(breakdown)
    .map((a) => `${a.name}: ${a.tokens.toLocaleString()} tkns [${a.status}]`)
    .join("\n");
}

function alertColor(type: AlertType): string {
  return type === "critical" ? "#f87171" : type === "warning" ? "#fbbf24" : "#6366f1";
}

function alertEmoji(type: AlertType): string {
  return type === "critical" ? "🔴" : type === "warning" ? "⚠️" : "📈";
}

// ── Email (Resend) ─────────────────────────────────────────────────────────

export async function sendEmailAlert(
  emailAddress: string,
  alertType: AlertType,
  data: AlertData
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const color = alertColor(alertType);
  const agentRows = Object.values(data.agentBreakdown)
    .map(
      (a) => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #1e1e2e;color:#c0c0e0;">${a.name}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #1e1e2e;color:#a0a0ff;font-family:monospace;">${a.tokens.toLocaleString()}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #1e1e2e;color:${a.status === "done" ? "#22d3a5" : "#f43f5e"};">${a.status}</td>
        </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#0f0f1a;border:1px solid ${color}33;border-radius:16px;overflow:hidden;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,${color}22,transparent);padding:28px 32px;border-bottom:1px solid ${color}33;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;background:#6366f1;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;">⬡</div>
        <div>
          <div style="color:#e0e0ff;font-size:16px;font-weight:600;">Neural OPS</div>
          <div style="color:${color};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">${alertType} Token Alert</div>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <div style="background:${color}11;border:1px solid ${color}33;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <div style="color:#9090b0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Command</div>
        <div style="color:#e0e0ff;font-family:monospace;font-size:13px;">❯ ${data.command}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
        <div style="background:#1a1a2e;border-radius:10px;padding:14px 16px;">
          <div style="color:#6060a0;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Run Tokens</div>
          <div style="color:${color};font-size:20px;font-weight:700;font-family:monospace;">${data.totalTokens.toLocaleString()}</div>
        </div>
        <div style="background:#1a1a2e;border-radius:10px;padding:14px 16px;">
          <div style="color:#6060a0;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">${alertType === "spike" ? "Spike Threshold" : "Daily Limit"}</div>
          <div style="color:#e0e0ff;font-size:20px;font-weight:700;font-family:monospace;">${data.limit.toLocaleString()}</div>
        </div>
      </div>

      <div style="margin-bottom:24px;">
        <div style="color:#6060a0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;">Agent Breakdown</div>
        <table style="width:100%;border-collapse:collapse;background:#1a1a2e;border-radius:10px;overflow:hidden;">
          <thead>
            <tr style="background:#151525;">
              <th style="padding:8px 12px;text-align:left;color:#6060a0;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;">Agent</th>
              <th style="padding:8px 12px;text-align:left;color:#6060a0;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;">Tokens</th>
              <th style="padding:8px 12px;text-align:left;color:#6060a0;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;">Status</th>
            </tr>
          </thead>
          <tbody>${agentRows}</tbody>
        </table>
      </div>

      <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard"
         style="display:block;text-align:center;background:#6366f1;color:white;text-decoration:none;
                padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;">
        View Dashboard →
      </a>
    </div>

    <div style="padding:16px 32px;border-top:1px solid #1e1e2e;text-align:center;">
      <p style="color:#3a3a5a;font-size:11px;margin:0;">Neural OPS Command Center · Token Monitoring</p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: "Neural OPS <noreply@neural-ops.com>",
    to: emailAddress,
    subject: `${alertEmoji(alertType)} Neural OPS — ${alertType.charAt(0).toUpperCase() + alertType.slice(1)} Token Alert`,
    html,
  });
}

// ── Discord Webhook ────────────────────────────────────────────────────────

export async function sendDiscordAlert(
  webhookUrl: string,
  alertType: AlertType,
  data: AlertData
): Promise<void> {
  const colorMap: Record<AlertType, number> = {
    critical: 0xf87171,
    warning:  0xfbbf24,
    spike:    0x6366f1,
  };

  const breakdownText = formatAgentBreakdownText(data.agentBreakdown);

  const body = {
    embeds: [
      {
        title: `${alertEmoji(alertType)} Neural OPS — Token Limit ${alertType.charAt(0).toUpperCase() + alertType.slice(1)}`,
        color: colorMap[alertType],
        fields: [
          {
            name: "Command",
            value: `\`\`\`${data.command}\`\`\``,
          },
          {
            name: "Tokens Used",
            value: `**${data.totalTokens.toLocaleString()}** / ${data.limit.toLocaleString()}`,
            inline: true,
          },
          {
            name: "Today Total",
            value: `**${(data.todayTotal ?? 0).toLocaleString()}**`,
            inline: true,
          },
          {
            name: "Agent Breakdown",
            value: `\`\`\`${breakdownText}\`\`\``,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Neural OPS Command Center" },
      },
    ],
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Slack Block Kit ────────────────────────────────────────────────────────

export async function sendSlackAlert(
  webhookUrl: string,
  alertType: AlertType,
  data: AlertData
): Promise<void> {
  const breakdownLines = Object.values(data.agentBreakdown)
    .map((a) => `• *${a.name}*: ${a.tokens.toLocaleString()} tokens  [${a.status}]`)
    .join("\n");

  const dashboardUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard`;

  const body = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${alertEmoji(alertType)} Neural OPS — ${alertType.charAt(0).toUpperCase() + alertType.slice(1)} Token Alert`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Command*\n\`${data.command}\``,
          },
          {
            type: "mrkdwn",
            text: `*Tokens Used / Limit*\n${data.totalTokens.toLocaleString()} / ${data.limit.toLocaleString()}`,
          },
          {
            type: "mrkdwn",
            text: `*Alert Type*\n${alertType.toUpperCase()}`,
          },
          {
            type: "mrkdwn",
            text: `*Today Total*\n${(data.todayTotal ?? 0).toLocaleString()} tokens`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Agent Breakdown*\n${breakdownLines}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Dashboard →" },
            url: dashboardUrl,
            style: "primary",
          },
        ],
      },
      { type: "divider" },
    ],
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
