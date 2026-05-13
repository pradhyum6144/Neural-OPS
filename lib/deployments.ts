import { supabase } from "./supabase";

export type DeployType = "api" | "whatsapp";

export interface Deployment {
  id: string;
  user_id: string;
  pipeline_config: Record<string, unknown>;
  deploy_type: DeployType;
  endpoint_id: string | null;
  endpoint_url: string | null;
  api_key: string | null;
  whatsapp_number: string | null;
  total_calls: number;
  created_at: string;
  is_active: boolean;
}

const isConfigured =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").startsWith("http");

export async function createDeployment(
  userId: string,
  pipelineConfig: Record<string, unknown>,
  deployType: DeployType,
  endpointId: string,
  endpointUrl: string | null,
  apiKey: string | null,
  whatsappNumber: string | null
): Promise<{ id: string | null; error: string | null }> {
  if (!isConfigured) return { id: null, error: null };

  const { data, error } = await supabase
    .from("deployments")
    .insert({
      user_id: userId,
      pipeline_config: pipelineConfig,
      deploy_type: deployType,
      endpoint_id: endpointId,
      endpoint_url: endpointUrl,
      api_key: apiKey,
      whatsapp_number: whatsappNumber,
      total_calls: 0,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[deployments] createDeployment error:", error.message);
    return { id: null, error: error.message };
  }
  return { id: (data as { id: string }).id, error: null };
}

export async function getDeployments(userId: string): Promise<Deployment[]> {
  if (!isConfigured) return [];

  const { data, error } = await supabase
    .from("deployments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[deployments] getDeployments error:", error.message);
    return [];
  }
  return (data ?? []) as Deployment[];
}

export async function setDeploymentActive(
  endpointId: string,
  userId: string,
  isActive: boolean
): Promise<{ error: string | null }> {
  if (!isConfigured) return { error: null };

  const { error } = await supabase
    .from("deployments")
    .update({ is_active: isActive })
    .eq("endpoint_id", endpointId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function incrementCallCount(
  endpointId: string
): Promise<void> {
  if (!isConfigured) return;
  try {
    await supabase.rpc("increment_deployment_calls", { p_endpoint_id: endpointId });
  } catch { /* noop */ }
}
