import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Service-role Supabase client for server-only, account-wide reads that must bypass
 * row-level security entirely. Used today only for public.app_config (see
 * supabase/migrations/20260809100000_app_config.sql), which deliberately grants
 * nothing to anon/authenticated, so this is the only client that can read it.
 *
 * Never import this module from a client component, and never let
 * SUPABASE_SERVICE_ROLE_KEY reach the browser bundle — it is not a NEXT_PUBLIC_ value.
 * Unlike src/lib/supabase/server.ts, this client is not tied to a signed-in user's
 * session and carries no cookies; it is a fixed, project-wide credential.
 *
 * Returns null when the key is not configured for the current environment so callers
 * can fall back to a safe default (see src/lib/config.ts) instead of crashing a request
 * that happens to touch an optional, remotely configurable setting.
 */
export function createSupabaseAdminClient() {
  const serviceRoleKey = env.supabaseServiceRoleKey();
  if (!serviceRoleKey) return null;
  return createClient(env.supabaseUrl(), serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
