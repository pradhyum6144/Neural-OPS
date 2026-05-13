import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isConfigured =
  supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://");

// Server-side client (service role — never expose to browser).
// Returns a no-op stub when Supabase env vars are not configured.
export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : createClient("https://placeholder.supabase.co", "placeholder-key");
