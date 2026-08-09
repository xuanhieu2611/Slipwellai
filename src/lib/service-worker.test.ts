import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

type Strategy = "cache-first" | "network-with-offline-fallback" | "network-only";
type RequestLike = { method: string; url: string; mode?: string };

/**
 * The shipped service worker is plain JavaScript served from `public/`, so it
 * is evaluated here in a sandbox with a stub `self`. That keeps the caching
 * rules under test as the exact file the browser runs.
 */
function loadServiceWorker() {
  const source = readFileSync(path.join(process.cwd(), "public", "sw.js"), "utf8");
  const listeners: string[] = [];
  const sandbox = {
    self: {
      addEventListener: (type: string) => listeners.push(type),
      location: { origin: "https://app.example.com" },
    } as Record<string, unknown>,
    caches: undefined,
    fetch: undefined,
    // A fresh vm context has no web globals; the worker only needs URL at load time.
    URL,
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  const api = sandbox.self.slipwellServiceWorker as {
    CACHE_VERSION: string;
    OFFLINE_URL: string;
    PRECACHE_URLS: string[];
    strategyFor: (request: RequestLike, origin: string) => Strategy;
  };
  return { api, listeners };
}

const origin = "https://app.example.com";
const { api, listeners } = loadServiceWorker();
const strategy = (request: RequestLike) => api.strategyFor(request, origin);

describe("application-shell service worker", () => {
  it("installs the lifecycle handlers it needs", () => {
    expect(listeners).toEqual(expect.arrayContaining(["install", "activate", "fetch"]));
  });

  it("precaches only the public offline shell and icons", () => {
    expect(api.PRECACHE_URLS).toContain(api.OFFLINE_URL);
    for (const url of api.PRECACHE_URLS) {
      expect(url === "/offline" || url.startsWith("/icons/")).toBe(true);
    }
  });

  it("serves immutable build assets from the cache", () => {
    expect(strategy({ method: "GET", url: `${origin}/_next/static/chunks/main.js` })).toBe(
      "cache-first",
    );
    expect(strategy({ method: "GET", url: `${origin}/icons/icon-192.png` })).toBe("cache-first");
  });

  it("never caches account data: API, auth, and non-GET requests go straight to the network", () => {
    expect(strategy({ method: "GET", url: `${origin}/api/workspace` })).toBe("network-only");
    expect(strategy({ method: "GET", url: `${origin}/api/export` })).toBe("network-only");
    expect(strategy({ method: "GET", url: `${origin}/auth/callback` })).toBe("network-only");
    expect(strategy({ method: "POST", url: `${origin}/api/captures` })).toBe("network-only");
    expect(strategy({ method: "DELETE", url: `${origin}/api/proposals/1` })).toBe("network-only");
  });

  it("uses the network for authenticated pages and only falls back to the offline shell", () => {
    for (const pathname of ["/today", "/inbox", "/settings", "/people-notes"]) {
      expect(strategy({ method: "GET", url: `${origin}${pathname}`, mode: "navigate" })).toBe(
        "network-with-offline-fallback",
      );
    }
  });

  it("leaves cross-origin requests alone", () => {
    expect(strategy({ method: "GET", url: "https://project.supabase.co/auth/v1/user" })).toBe(
      "network-only",
    );
    expect(
      strategy({ method: "GET", url: "https://cdn.example.com/_next/static/chunks/main.js" }),
    ).toBe("network-only");
  });

  it("falls through to the network for anything it does not recognise", () => {
    expect(strategy({ method: "GET", url: "::not a url::" })).toBe("network-only");
    expect(strategy({ method: "GET", url: `${origin}/manifest.webmanifest` })).toBe("network-only");
    expect(strategy({ method: "GET", url: `${origin}/some-asset.json` })).toBe("network-only");
  });
});
