import type { Metadata } from "next";
import Link from "next/link";
import { ArrowClockwise, CloudSlash } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Offline · Slipwell",
  description: "Slipwell cannot reach the network right now.",
};

/**
 * Precached shell page shown when a navigation fails offline. It is public and
 * contains no account data, which is why it is safe to store in the cache.
 */
export default function OfflinePage() {
  return (
    <main className="build-state">
      <span className="inline-flex rounded-md bg-[var(--accent-soft)] p-2.5 text-[var(--accent-ink)]">
        <CloudSlash aria-hidden size={22} />
      </span>
      <p className="eyebrow">Offline</p>
      <h1>Slipwell cannot reach the network.</h1>
      <p>
        Your saved captures and records are safe on the server. Slipwell keeps your data online rather than on this device, so
        the app needs a connection to show it.
      </p>
      <div className="build-state-rule" />
      <p className="text-sm text-[var(--ink-muted)]">
        A capture you typed but did not send is not stored yet. Keep this tab open until you reconnect, or copy the text
        somewhere safe before closing it.
      </p>
      <Link className="button-base button-primary mt-6 inline-flex" href="/today">
        <ArrowClockwise aria-hidden size={16} weight="bold" />
        Try again
      </Link>
    </main>
  );
}
