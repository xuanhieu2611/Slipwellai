import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyConfigReader, getConfigValue, type ConfigReader } from "@/lib/config";

function readerFor(values: Record<string, unknown>): ConfigReader {
  return {
    async read(key) {
      return key in values ? values[key] : undefined;
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getConfigValue", () => {
  it("falls back to the compiled-in default when the reader has nothing configured", async () => {
    await expect(getConfigValue(emptyConfigReader, "search.result_limit")).resolves.toBe(30);
  });

  it("falls back to the default when the key is simply missing from the backend", async () => {
    const reader = readerFor({});
    await expect(getConfigValue(reader, "search.result_limit")).resolves.toBe(30);
  });

  it("returns a valid stored override instead of the default", async () => {
    const reader = readerFor({ "search.result_limit": 75 });
    await expect(getConfigValue(reader, "search.result_limit")).resolves.toBe(75);
  });

  it("falls back to the default and warns when the stored value fails its schema", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const reader = readerFor({ "search.result_limit": "not a number" });

    await expect(getConfigValue(reader, "search.result_limit")).resolves.toBe(30);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("falls back to the default when the stored value is out of the schema's allowed range", async () => {
    const reader = readerFor({ "search.result_limit": 0 });
    await expect(getConfigValue(reader, "search.result_limit")).resolves.toBe(30);

    const tooLarge = readerFor({ "search.result_limit": 10_000 });
    await expect(getConfigValue(tooLarge, "search.result_limit")).resolves.toBe(30);
  });

  it("falls back to the default when the stored value is a non-integer number", async () => {
    const reader = readerFor({ "search.result_limit": 12.5 });
    await expect(getConfigValue(reader, "search.result_limit")).resolves.toBe(30);
  });

  it("propagates a reader failure instead of silently swallowing it", async () => {
    const reader: ConfigReader = {
      async read() {
        throw new Error("connection reset");
      },
    };
    // getConfigValue does not itself catch reader errors — that is the reader's job (see
    // src/lib/supabase/app-config-repository.ts, which resolves to undefined instead of
    // throwing). This test documents that boundary so the two responsibilities do not blur.
    await expect(getConfigValue(reader, "search.result_limit")).rejects.toThrow("connection reset");
  });
});
