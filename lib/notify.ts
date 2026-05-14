export async function notifyPipelineComplete(result: {
  command: string;
  modelUsed: string;
  totalTokens: number;
  costINR: number;
  savedINR: number;
  timeTaken: number;
  summary: string;
  agents: {
    planner: number;
    research: number;
    browser: number;
    finance: number;
    voice: number;
  };
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[notify] No SLACK_WEBHOOK_URL found in env");
    return;
  }

  const payload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "✅ Neural OPS — Pipeline Complete",
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Command:*\n${result.command}` },
          { type: "mrkdwn", text: `*Model Used:*\n${result.modelUsed}` },
          { type: "mrkdwn", text: `*Total Tokens:*\n${result.totalTokens.toLocaleString()}` },
          { type: "mrkdwn", text: `*Cost:*\n₹${result.costINR.toFixed(2)}` },
          { type: "mrkdwn", text: `*Saved by Router:*\n₹${result.savedINR.toFixed(2)}` },
          { type: "mrkdwn", text: `*Time Taken:*\n${(result.timeTaken / 1000).toFixed(1)}s` },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Summary:*\n${result.summary}`,
        },
      },
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Agent Breakdown:*\n🧠 Planner: ${result.agents.planner} tokens\n🔍 Research: ${result.agents.research} tokens\n🌐 Browser: ${result.agents.browser} tokens\n📊 Finance: ${result.agents.finance} tokens\n🎤 Voice: ${result.agents.voice} tokens`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Dashboard" },
            style: "primary",
            url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000/dashboard",
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("[notify] Slack notification sent successfully");
    } else {
      console.error("[notify] Slack notification failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("[notify] Slack notification error:", error);
  }
}
