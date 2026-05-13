import { supabase } from "./supabase";

const isConfigured =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").startsWith("http");

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount_inr: number;
  type: "deduct" | "add" | "topup";
  run_id: string | null;
  model_used: string | null;
  tokens: number | null;
  created_at: string;
}

// ── Get current balance (sum of all transactions) ──────────────────────────
export async function getBalance(userId: string): Promise<number> {
  if (!isConfigured) return 0;

  const { data, error } = await supabase
    .from("credits_transactions")
    .select("amount_inr, type")
    .eq("user_id", userId);

  if (error) {
    console.error("[credits] getBalance error:", error.message);
    return 0;
  }

  return (data ?? []).reduce((sum, row) => {
    const amt = row.type === "deduct" ? -(row.amount_inr as number) : (row.amount_inr as number);
    return Math.round((sum + amt) * 100) / 100;
  }, 50); // base credit ₹50 for demo
}

// ── Deduct credits after a pipeline run ───────────────────────────────────
export async function deductCredits(
  userId: string,
  costINR: number,
  runId?: string,
  modelUsed?: string,
  tokens?: number
): Promise<{ error: string | null }> {
  if (!isConfigured || costINR <= 0) return { error: null };

  const { error } = await supabase.from("credits_transactions").insert({
    user_id: userId,
    amount_inr: costINR,
    type: "deduct",
    run_id: runId ?? null,
    model_used: modelUsed ?? null,
    tokens: tokens ?? null,
  });

  if (error) return { error: error.message };
  return { error: null };
}

// ── Add credits (top-up) ───────────────────────────────────────────────────
export async function addCredits(
  userId: string,
  amountINR: number
): Promise<{ error: string | null }> {
  if (!isConfigured || amountINR <= 0) return { error: null };

  const { error } = await supabase.from("credits_transactions").insert({
    user_id: userId,
    amount_inr: amountINR,
    type: "topup",
    run_id: null,
    model_used: null,
    tokens: null,
  });

  if (error) return { error: error.message };
  return { error: null };
}

// ── Usage history ──────────────────────────────────────────────────────────
export async function getUsageHistory(
  userId: string,
  days = 30
): Promise<CreditTransaction[]> {
  if (!isConfigured) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("credits_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "deduct")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return (data ?? []) as CreditTransaction[];
}
