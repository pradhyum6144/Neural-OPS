import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function skip() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function GET(req: NextRequest) {
  if (skip()) return NextResponse.json({ data: [], skipped: true });

  const userId = req.nextUrl.searchParams.get("userId") ?? "anonymous";

  const { data, error } = await supabase
    .from("alert_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
