import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function skip() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function GET(req: NextRequest) {
  if (skip()) return NextResponse.json({ data: null, skipped: true });

  const userId = req.nextUrl.searchParams.get("userId") ?? "anonymous";

  const { data, error } = await supabase
    .from("alert_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? null });
}

export async function POST(req: NextRequest) {
  if (skip()) return NextResponse.json({ ok: true, skipped: true });

  try {
    const body = await req.json();
    const userId = body.userId ?? "anonymous";

    const payload = {
      user_id: userId,
      daily_limit: Number(body.daily_limit ?? 50000),
      per_run_limit: Number(body.per_run_limit ?? 10000),
      spike_threshold: Number(body.spike_threshold ?? 15000),
      email_enabled: Boolean(body.email_enabled),
      email_address: body.email_address ?? null,
      discord_enabled: Boolean(body.discord_enabled),
      discord_webhook_url: body.discord_webhook_url ?? null,
      slack_enabled: Boolean(body.slack_enabled),
      slack_webhook_url: body.slack_webhook_url ?? null,
    };

    const { error } = await supabase
      .from("alert_settings")
      .upsert(payload, { onConflict: "user_id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
