import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEmailAlert, sendDiscordAlert, sendSlackAlert } from "@/lib/notifications";

const TEST_DATA = {
  command: "Test alert from Neural OPS",
  totalTokens: 52413,
  limit: 50000,
  userId: "test-user",
  agentBreakdown: {
    planner:  { name: "Planner",  tokens: 730,  status: "done" },
    research: { name: "Research", tokens: 2212, status: "done" },
    browser:  { name: "Browser",  tokens: 1067, status: "done" },
    finance:  { name: "Finance",  tokens: 4211, status: "done" },
    voice:    { name: "Voice",    tokens: 4717, status: "done" },
  },
};

export async function POST(req: NextRequest) {
  try {
    const { channel, userId } = await req.json() as {
      channel: "email" | "discord" | "slack";
      userId: string;
    };

    const { data: settings, error } = await supabase
      .from("alert_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!settings) {
      return NextResponse.json(
        { error: "No alert settings found. Configure alerts first." },
        { status: 400 }
      );
    }

    if (channel === "email") {
      if (!settings.email_address) {
        return NextResponse.json({ error: "No email address in settings" }, { status: 400 });
      }
      await sendEmailAlert(settings.email_address, "critical", TEST_DATA);
    } else if (channel === "discord") {
      if (!settings.discord_webhook_url) {
        return NextResponse.json({ error: "No Discord webhook URL in settings" }, { status: 400 });
      }
      await sendDiscordAlert(settings.discord_webhook_url, "critical", TEST_DATA);
    } else if (channel === "slack") {
      if (!settings.slack_webhook_url) {
        return NextResponse.json({ error: "No Slack webhook URL in settings" }, { status: 400 });
      }
      await sendSlackAlert(settings.slack_webhook_url, "critical", TEST_DATA);
    } else {
      return NextResponse.json({ error: "Unknown channel" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Test sent to ${channel}` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
