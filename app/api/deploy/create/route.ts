import { NextRequest, NextResponse } from "next/server";
import { createDeployment } from "@/lib/deployments";
import type { DeployType } from "@/lib/deployments";

function randomId(len = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      userId?: string;
      pipelineConfig?: Record<string, unknown>;
      deployType: DeployType;
      whatsappNumber?: string;
    };

    const userId = body.userId ?? "anonymous";
    const deployType: DeployType = body.deployType ?? "api";
    const pipelineConfig = body.pipelineConfig ?? {};
    const whatsappNumber = body.whatsappNumber ?? null;

    const endpointId = randomId(10);

    let endpointUrl: string | null = null;
    let apiKey: string | null = null;

    if (deployType === "api") {
      endpointUrl = `https://api.neural-ops.com/run/${endpointId}`;
      apiKey = `nor_live_${randomId(24)}`;
    }

    // Persist to Supabase (silently no-ops if not configured)
    await createDeployment(
      userId,
      pipelineConfig,
      deployType,
      endpointId,
      endpointUrl,
      apiKey,
      deployType === "whatsapp" ? whatsappNumber : null
    );

    return NextResponse.json({
      ok: true,
      endpointId,
      endpointUrl,
      apiKey,
      whatsappNumber: deployType === "whatsapp" ? "+91-8000-" + randomId(6).toUpperCase() : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
