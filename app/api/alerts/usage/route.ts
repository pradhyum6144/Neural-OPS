import { NextRequest, NextResponse } from "next/server";
import { getTodayUsage } from "@/lib/tokenTracker";

export async function GET(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ todayTotal: 0 });
  }

  const userId = req.nextUrl.searchParams.get("userId") ?? "anonymous";
  const todayTotal = await getTodayUsage(userId);
  return NextResponse.json({ todayTotal });
}
