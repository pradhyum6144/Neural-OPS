import { supabase } from "./supabase";

export interface UserConnection {
  id: string;
  user_id: string;
  tool_name: string;
  tool_type: string;
  display_name: string;
  access_token: string | null;
  metadata: Record<string, unknown>;
  connected_at: string;
  is_active: boolean;
}

const isConfigured =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").startsWith("http");

// ── Connect a tool ─────────────────────────────────────────────────────────
export async function connectTool(
  toolName: string,
  displayName: string,
  toolType: string,
  userId: string,
  accessToken?: string,
  metadata: Record<string, unknown> = {}
): Promise<{ id: string | null; error: string | null }> {
  if (!isConfigured) return { id: null, error: null };

  const { data, error } = await supabase
    .from("user_connections")
    .upsert(
      {
        user_id: userId,
        tool_name: toolName,
        display_name: displayName,
        tool_type: toolType,
        access_token: accessToken ?? null,
        metadata,
        is_active: true,
        connected_at: new Date().toISOString(),
      },
      { onConflict: "user_id,tool_name" }
    )
    .select("id")
    .single();

  if (error) {
    console.error("[composio] connectTool error:", error.message);
    return { id: null, error: error.message };
  }
  return { id: (data as { id: string }).id, error: null };
}

// ── Fetch all active connections for a user ────────────────────────────────
export async function getConnectedTools(userId: string): Promise<UserConnection[]> {
  if (!isConfigured) return [];

  const { data, error } = await supabase
    .from("user_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("connected_at", { ascending: false });

  if (error) {
    console.error("[composio] getConnectedTools error:", error.message);
    return [];
  }
  return (data ?? []) as UserConnection[];
}

// ── Revoke a connection ────────────────────────────────────────────────────
export async function revokeConnection(
  toolName: string,
  userId: string
): Promise<{ error: string | null }> {
  if (!isConfigured) return { error: null };

  const { error } = await supabase
    .from("user_connections")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("tool_name", toolName);

  if (error) {
    console.error("[composio] revokeConnection error:", error.message);
    return { error: error.message };
  }
  return { error: null };
}

// ── Build a context string for agent system prompts ────────────────────────
export async function getToolsContextString(userId: string): Promise<string> {
  const tools = await getConnectedTools(userId);
  if (tools.length === 0) return "";

  const lines = tools.map((t) => {
    switch (t.tool_name) {
      case "razorpay":
        return "User has Razorpay connected. Finance agent can reference real sales data, revenue figures, and transaction history.";
      case "whatsapp_business":
        return "User has WhatsApp Business connected. Any agent can send key results and summaries via WhatsApp.";
      case "google_workspace":
        return "User has Google Workspace connected. Research agent can read Google Docs, Sheets, and Gmail for context.";
      case "notion":
        return "User has Notion connected. Agents can read and write to the user's Notion workspace.";
      case "slack":
        return "User has Slack connected. Agents can post results and alerts to Slack channels.";
      case "github":
        return "User has GitHub connected. Code agent can read repositories, issues, and pull requests.";
      default:
        return `User has ${t.display_name} connected (${t.tool_type} integration).`;
    }
  });

  return `\n\n[Connected Tools]\n${lines.join("\n")}`;
}
