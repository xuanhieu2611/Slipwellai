/*
  Slipwell application-shell service worker.

  Privacy rule that governs every branch below: only public, non-personal
  responses may enter the cache. Authenticated HTML, API responses, and auth
  routes are always served from the network and are never stored, so a shared
  or recovered device cannot replay another person's records from a cache.

  Bump CACHE_VERSION whenever the precached shell changes.
*/

const CACHE_VERSION = "slipwell-shell-v1";
const OFFLINE_URL = "/offline";

/* Public, non-personal, and small. Everything else is fetched on demand. */
const PRECACHE_URLS = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png"];

/* Immutable, content-hashed, or static public assets: safe to serve from cache first. */
const CACHE_FIRST_PREFIXES = ["/_next/static/", "/icons/"];

/* Never cached, never intercepted: private data and session-changing routes. */
const NETWORK_ONLY_PREFIXES = ["/api/", "/auth/"];

/**
 * @param {{ method: string, mode?: string, url: string }} request
 * @param {string} scopeOrigin
 * @returns {"cache-first" | "network-with-offline-fallback" | "network-only"}
 */
function strategyFor(request, scopeOrigin) {
  if (request.method !== "GET") return "network-only";

  let url;
  try {
    url = new URL(request.url, scopeOrigin);
  } catch {
    return "network-only";
  }
  if (url.origin !== scopeOrigin) return "network-only";
  if (NETWORK_ONLY_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return "network-only";
  if (CACHE_FIRST_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return "cache-first";
  // A navigation may render private records, so the response is used but never stored.
  if (request.mode === "navigate") return "network-with-offline-fallback";
  return "network-only";
}

self.slipwellServiceWorker = { CACHE_VERSION, OFFLINE_URL, PRECACHE_URLS, strategyFor };

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") await cache.put(request, response.clone());
  return response;
}

async function networkWithOfflineFallback(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE_VERSION);
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response("Slipwell is offline and no offline page is cached yet.", {
      status: 503,
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
    });
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      // A failed precache must not block activation; the app still works online.
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const strategy = strategyFor(event.request, self.location.origin);
  if (strategy === "cache-first") {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  if (strategy === "network-with-offline-fallback") {
    event.respondWith(networkWithOfflineFallback(event.request));
  }
  // network-only: leave the request untouched so the browser handles it normally.
});
