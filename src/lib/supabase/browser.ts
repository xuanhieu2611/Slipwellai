import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export const createSupabaseBrowserClient = () =>
  createBrowserClient(env.supabaseUrl(), env.supabasePublishableKey());
