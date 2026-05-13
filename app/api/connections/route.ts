import { NextRequest, NextResponse } from "next/server";
import { connectTool, getConnectedTools, revokeConnection } from "@/lib/composio";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? "anonymous";
  const tools = await getConnectedTools(userId);
  return NextResponse.json({ tools });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      userId?: string;
      toolName: string;
      displayName: string;
      toolType: string;
      accessToken?: string;
      metadata?: Record<string, unknown>;
    };

    const userId = body.userId ?? "anonymous";
    const { toolName, displayName, toolType, accessToken, metadata } = body;

    if (!toolName || !displayName) {
      return NextResponse.json({ error: "Missing toolName or displayName" }, { status: 400 });
    }

    const { id, error } = await connectTool(
      toolName, displayName, toolType, userId, accessToken, metadata ?? {}
    );
    if (error) return NextResponse.json({ error }, { status: 500 });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as { userId?: string; toolName: string };
    const userId = body.userId ?? "anonymous";
    const { toolName } = body;

    if (!toolName) {
      return NextResponse.json({ error: "Missing toolName" }, { status: 400 });
    }

    const { error } = await revokeConnection(toolName, userId);
    if (error) return NextResponse.json({ error }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
