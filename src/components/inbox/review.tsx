"use client";

import { useState } from "react";
import { ArrowClockwise, TrashSimple, WarningCircle } from "@phosphor-icons/react";
import { parseProposalEnvelope } from "@/lib/proposals/schema";
import type { DestinationCatalog } from "@/lib/proposals/destinations";
import type { DashboardData } from "@/lib/dashboard";
import { Button, StatusMessage } from "@/components/ui/primitives";
import { post } from "@/components/inbox/api";
import { CaptureOrigin, failureCopy } from "@/components/inbox/capture-meta";
import { ManualFile } from "@/components/inbox/manual-file";
import { ProposedItem } from "@/components/inbox/proposed-item";

export function Review({
  capture,
  catalog,
  today,
  done,
}: {
  capture: DashboardData["captures"][number];
  catalog: DestinationCatalog;
  today: string;
  done: () => void;
}) {
  const parsed = capture.proposal ? parseProposalEnvelope(capture.proposal.proposal_json) : null;
  const items = parsed?.proposals ?? [];
  const applications = capture.proposal?.applications ?? [];
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  if (capture.status !== "needs_review") return null;

  async function action(choice: "retry" | "discard") {
    if (!capture.proposal) return;
    setBusy(true);
    setMessage("");
    try {
      await post(`/api/proposals/${capture.proposal.id}`, { action: choice });
      done();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That action did not go through.");
      setBusy(false);
      setConfirmingDiscard(false);
    }
  }

  const outcomeByIndex = new Map(
    applications.map((application) => [application.item_index, application]),
  );
  const undecided = items.filter((_, index) => !outcomeByIndex.has(index));

  return (
    <article className={`review-card${items.length > 0 ? "" : " review-card--attention"}`}>
      <div className="review-head">
        <CaptureOrigin capture={capture} />
        {/* A multi-intent capture is not finished when the first record is filed; say how many are left. */}
        <span className="tag tag--attention">
          {items.length > 1 ? `${undecided.length} of ${items.length} to decide` : "Needs review"}
        </span>
      </div>

      <blockquote className="review-source">{capture.original_text}</blockquote>

      {items.length > 0 ? (
        items.map((item, index) => {
          const outcome = outcomeByIndex.get(index);
          if (!outcome)
            return (
              <ProposedItem
                catalog={catalog}
                done={done}
                index={index}
                item={item}
                key={index}
                proposalId={capture.proposal!.id}
                today={today}
                total={items.length}
              />
            );
          return (
            <div className="review-panel" key={index}>
              <div className="review-panel-head">
                <h4>{items.length > 1 ? `Record ${index + 1} of ${items.length}` : "Decided"}</h4>
                <span className="tag">
                  {outcome.outcome === "filed" ? "Filed" : "Not this one"}
                </span>
              </div>
              <p className="review-reason">{item.title}</p>
            </div>
          );
        })
      ) : (
        <div className="review-panel">
          <div className="review-panel-head">
            <h4>
              <WarningCircle
                aria-hidden
                className="mb-0.5 mr-1.5 inline text-[var(--attention)]"
                size={16}
                weight="fill"
              />
              Not interpreted
            </h4>
          </div>
          <p className="review-reason">
            {(capture.failure_code && failureCopy[capture.failure_code]) ??
              failureCopy.proposal_provider_error}
          </p>
        </div>
      )}

      {confirmingDiscard ? (
        <div className="review-confirm" role="group" aria-label="Confirm discard">
          <p>
            Discard this capture? It leaves your inbox and Today’s attention list. Your original
            words are kept, never deleted.
          </p>
          <Button
            autoFocus
            className="button-danger"
            disabled={busy}
            onClick={() => action("discard")}
          >
            {busy ? "Discarding…" : "Discard it"}
          </Button>
          <Button
            className="button-secondary"
            disabled={busy}
            onClick={() => setConfirmingDiscard(false)}
          >
            Keep it
          </Button>
        </div>
      ) : (
        <div className="review-actions">
          {capture.proposal && (
            <Button
              className={items.length > 0 ? "button-secondary" : "button-primary"}
              disabled={busy}
              onClick={() => action("retry")}
            >
              <ArrowClockwise aria-hidden size={16} />
              Interpret again
            </Button>
          )}
          {items.length === 0 && <ManualFile capture={capture} catalog={catalog} done={done} />}
          {capture.proposal ? (
            <Button
              className="button-danger review-discard"
              disabled={busy}
              onClick={() => setConfirmingDiscard(true)}
            >
              <TrashSimple aria-hidden size={16} />
              Discard
            </Button>
          ) : (
            <p className="form-help">
              Slipwell has not returned a proposal for this capture yet. Reload in a moment.
            </p>
          )}
        </div>
      )}

      {message && (
        <div className="px-[1.05rem] pb-[1.05rem]">
          <StatusMessage tone="error">{message}</StatusMessage>
        </div>
      )}
    </article>
  );
}
