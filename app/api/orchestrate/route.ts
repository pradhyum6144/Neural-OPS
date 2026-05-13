import { NextRequest, NextResponse } from "next/server";
import { saveRunTokens } from "@/lib/tokenTracker";
import { checkAndFireAlerts } from "@/lib/alertEngine";
import type { AgentBreakdown } from "@/lib/tokenTracker";

export async function POST(req: NextRequest) {
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
    };

    const userId = body.userId ?? "anonymous";
    const { command, agentBreakdown, costInr = 0, modelUsed = null } = body;

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

    // CHECK & FIRE alerts — runs after save, fire-and-forget so response isn't delayed
    const totalTokens = Object.values(agentBreakdown).reduce(
      (sum, a) => sum + (a.tokens ?? 0),
      0
    );
    checkAndFireAlerts(userId, totalTokens, agentBreakdown, command).catch((err) => {
      console.error("[orchestrate] alert engine error:", err);
    });

    return NextResponse.json({ ok: true, runId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
