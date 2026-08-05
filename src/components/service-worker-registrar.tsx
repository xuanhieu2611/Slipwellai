"use client";

import { useEffect } from "react";
import { canRegisterServiceWorker } from "@/lib/pwa";

/**
 * Registers the application-shell service worker where the browser supports
 * it. A browser without service workers loses only the offline fallback, so a
 * failed registration is never surfaced as a product error.
 *
 * Development is excluded on purpose: caching the dev server's assets makes
 * local changes look stale.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!canRegisterServiceWorker(navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);

  return null;
}
