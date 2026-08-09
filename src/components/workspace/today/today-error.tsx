"use client";

import { useEffect } from "react";
import { StatusMessage } from "@/components/ui/primitives";

/* Next's error boundary contract for a route segment: catches a render/data error thrown while
   loading Today (e.g. an unexpected Supabase failure) and offers a recoverable path instead of a
   blank page. Deliberately does not log error.message/stack — a thrown query error can echo back
   private record content, and AGENTS.md requires monitoring output to be redacted by default —
   so only the opaque digest Next generates is logged, which is enough to correlate with server
   logs without exposing anything sensitive. */
export function TodayError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Today failed to load", { digest: error.digest ?? null });
  }, [error]);

  return (
    <main className="workspace-page">
      <header className="page-intro">
        <p className="eyebrow">Today</p>
        <h1>Today couldn’t load</h1>
        <p>
          Nothing was lost. This is a loading problem with this page, not with your captures, tasks,
          or projects — try again, or reload the page if it keeps happening.
        </p>
      </header>
      <StatusMessage tone="error">
        {error.digest
          ? `Something went wrong loading Today. Reference: ${error.digest}`
          : "Something went wrong loading Today."}
      </StatusMessage>
      <div className="record-actions mt-4">
        <button className="button-base button-primary" onClick={reset} type="button">
          Try again
        </button>
        <button
          className="button-base button-secondary"
          onClick={() => window.location.reload()}
          type="button"
        >
          Reload page
        </button>
      </div>
    </main>
  );
}
