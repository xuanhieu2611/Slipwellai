"use client";

import { useState, useSyncExternalStore } from "react";
import { ArrowClockwise } from "@phosphor-icons/react";
import { isStrandedCapture } from "@/lib/capture-pipeline";
import type { DestinationCatalog } from "@/lib/proposals/destinations";
import type { DashboardData } from "@/lib/dashboard";
import { Button, StatusMessage } from "@/components/ui/primitives";
import { post } from "@/components/inbox/api";
import { CaptureOrigin } from "@/components/inbox/capture-meta";
import { ManualFile } from "@/components/inbox/manual-file";

const noSubscription = () => () => {};

export function PendingCapture({
  capture,
  catalog,
  done,
}: {
  capture: DashboardData["captures"][number];
  catalog: DestinationCatalog;
  done: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const stranded = useSyncExternalStore(
    noSubscription,
    () => isStrandedCapture(capture),
    () => false,
  );

  async function interpret() {
    setBusy(true);
    setMessage("");
    try {
      await post(`/api/captures/${capture.id}/interpret`, {});
      done();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Interpretation could not start.");
      setBusy(false);
    }
  }

  return (
    <article className="review-card">
      <div className="review-head">
        <CaptureOrigin capture={capture} />
        <span className="tag">{stranded ? "Waiting to interpret" : "Interpreting"}</span>
      </div>
      <blockquote className="review-source">{capture.original_text}</blockquote>
      <div className="review-panel">
        <p className="review-reason">
          {stranded
            ? "Your words are stored. Interpretation did not finish, most likely because the tab closed or the connection dropped. Nothing was lost."
            : "Stored. Slipwell is reading it now; refresh in a moment to review it."}
        </p>
      </div>
      <div className="review-actions">
        <Button className="button-primary" disabled={busy} onClick={interpret}>
          <ArrowClockwise aria-hidden size={16} />
          {busy ? "Interpreting…" : stranded ? "Interpret it now" : "Check again"}
        </Button>
        <ManualFile capture={capture} catalog={catalog} done={done} />
      </div>
      {message && (
        <div className="px-[1.05rem] pb-[1.05rem]">
          <StatusMessage tone="error">{message}</StatusMessage>
        </div>
      )}
    </article>
  );
}
