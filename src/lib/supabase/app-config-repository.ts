import type { ConfigReader } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Reads public.app_config through the service-role client. Resolves to `undefined`
 * (falls back to the compiled-in default in src/lib/config.ts) whenever the
 * service-role key is not configured for this environment, the row does not exist
 * yet, or the read fails, rather than throwing and breaking the calling request —
 * a remote-config lookup is never allowed to be why a page fails to render.
 */
export const appConfigReader: ConfigReader = {
  async read(key) {
    const admin = createSupabaseAdminClient();
    if (!admin) return undefined;

    const { data, error } = await admin
      .from("app_config")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return undefined;
    return data.value;
  },
};
