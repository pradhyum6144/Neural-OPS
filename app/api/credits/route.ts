import { NextRequest, NextResponse } from "next/server";
import { getBalance, deductCredits, addCredits, getUsageHistory } from "@/lib/credits";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? "anonymous";
  const balance = await getBalance(userId);
  const history = await getUsageHistory(userId, 30);
  return NextResponse.json({ balance, history });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      userId?: string;
      type: "add" | "deduct";
      amountINR: number;
      runId?: string;
      modelUsed?: string;
      tokens?: number;
    };

    const userId = body.userId ?? "anonymous";

    if (body.type === "add") {
      const { error } = await addCredits(userId, body.amountINR);
      if (error) return NextResponse.json({ error }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (body.type === "deduct") {
      const { error } = await deductCredits(userId, body.amountINR, body.runId, body.modelUsed, body.tokens);
      if (error) return NextResponse.json({ error }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
