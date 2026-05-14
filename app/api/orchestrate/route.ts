import { NextRequest, NextResponse } from "next/server";
import { saveRunTokens } from "@/lib/tokenTracker";
import { checkAndFireAlerts } from "@/lib/alertEngine";
import type { AgentBreakdown } from "@/lib/tokenTracker";
import { notifyPipelineComplete } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const startTimeMs = Date.now();

  // Skip silently if Supabase isn't configured yet
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const body = await req.json() as {
      userId?: string;
      command: string;
      agentBreakdown: AgentBreakdown;
      costInr?: number;
      modelUsed?: string;
      savedInr?: number;
      summary?: string;
    };

    const userId = body.userId ?? "anonymous";
    const { command, agentBreakdown, costInr = 0, modelUsed = null, savedInr = 0, summary } = body;

    if (!command || !agentBreakdown) {
      return NextResponse.json(
        { error: "Missing command or agentBreakdown" },
        { status: 400 }
      );
    }

    // SAVE run tokens to Supabase
    const { runId, error } = await saveRunTokens(userId, command, agentBreakdown, costInr, modelUsed);
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    // CHECK & FIRE alerts — fire-and-forget so response isn't delayed
    const totalTokens = Object.values(agentBreakdown).reduce(
      (sum, a) => sum + (a.tokens ?? 0),
      0
    );
    checkAndFireAlerts(userId, totalTokens, agentBreakdown, command).catch((err) => {
      console.error("[orchestrate] alert engine error:", err);
    });

    // SLACK notification — fire-and-forget
    notifyPipelineComplete({
      command,
      modelUsed: modelUsed ?? "Claude Sonnet",
      totalTokens,
      costINR: costInr,
      savedINR: savedInr,
      timeTaken: Date.now() - startTimeMs,
      summary: summary ?? "Pipeline completed successfully",
      agents: {
        planner:  agentBreakdown["planner"]?.tokens  ?? 0,
        research: agentBreakdown["research"]?.tokens ?? 0,
        browser:  agentBreakdown["browser"]?.tokens  ?? 0,
        finance:  agentBreakdown["finance"]?.tokens  ?? 0,
        voice:    agentBreakdown["voice"]?.tokens    ?? 0,
      },
    }).catch((err) => {
      console.error("[orchestrate] notify error:", err);
    });

    return NextResponse.json({ ok: true, runId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
