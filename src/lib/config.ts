import { z } from "zod";

/**
 * Centrally managed feature flags and remotely configurable product defaults
 * (MVP-BUILD-TRACKER.md Step 1, "Application and environments"). Backed by the
 * server-only public.app_config table (see
 * supabase/migrations/20260809100000_app_config.sql).
 *
 * Add a new setting by giving it an entry in `configRegistry` with its validation
 * schema and a compiled-in default, then read it from server code with
 * `getConfigValue(reader, key)`, passing `appConfigReader` from
 * src/lib/supabase/app-config-repository.ts for a real request.
 *
 * This module has no Supabase dependency on purpose: `ConfigReader` is the only
 * seam it needs, so the validation/fallback logic below is unit-testable with a
 * fake in-memory reader instead of a real database connection. A lookup failure
 * of any kind on the real reader (service-role key not configured, no row yet,
 * database unreachable) surfaces here as `undefined`, which resolves to the
 * default the same way a stored value that fails its schema does — an
 * app_config outage degrades the affected feature to its safe default instead
 * of breaking the request.
 */

interface ConfigDefinition<T> {
  schema: z.ZodType<T>;
  defaultValue: T;
}

const configRegistry = {
  "search.result_limit": {
    schema: z.number().int().min(1).max(200),
    defaultValue: 30,
  } satisfies ConfigDefinition<number>,
} satisfies Record<string, ConfigDefinition<unknown>>;

type ConfigRegistry = typeof configRegistry;
export type ConfigKey = keyof ConfigRegistry;
type ConfigValue<K extends ConfigKey> = ConfigRegistry[K]["defaultValue"];

/** What any storage backend needs to provide: the raw JSON value stored for a key, or
 * `undefined` when there is nothing usable to read (no row, no configured backend, a
 * failed request). Kept minimal and storage-agnostic on purpose. */
export interface ConfigReader {
  read(key: string): Promise<unknown>;
}

/** A reader with nothing behind it: every key resolves to its compiled-in default.
 * Useful as an explicit choice in tests and in any code path that intentionally wants
 * defaults only. */
export const emptyConfigReader: ConfigReader = {
  async read() {
    return undefined;
  },
};

export async function getConfigValue<K extends ConfigKey>(
  reader: ConfigReader,
  key: K,
): Promise<ConfigValue<K>> {
  const definition = configRegistry[key] as ConfigDefinition<ConfigValue<K>>;
  const raw = await reader.read(key);
  if (raw === undefined) return definition.defaultValue;

  const parsed = definition.schema.safeParse(raw);
  if (!parsed.success) {
    console.warn(`app_config: stored value for "${key}" failed validation, using default.`);
    return definition.defaultValue;
  }
  return parsed.data;
}
