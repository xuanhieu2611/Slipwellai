"use client";

import Link from "next/link";
import { captureAttentionLabel, capturesNeedingAttention } from "@/lib/capture-pipeline";
import type { WorkspaceData } from "@/lib/workspace";
import { CaptureAge } from "@/components/inbox/capture-meta";

const SNIPPET_LENGTH = 160;

function snippet(text: string) {
  const trimmed = text.trim();
  return trimmed.length > SNIPPET_LENGTH
    ? `${trimmed.slice(0, SNIPPET_LENGTH).trimEnd()}…`
    : trimmed;
}

/* Today surfaces unresolved captures so a stuck one doesn't require a separate trip to
   Inbox to notice. Resolving one — retry, review, discard, manual file — stays entirely an
   Inbox action: this section only surfaces and links, it does not duplicate that logic.
   `captures` is intentionally not used here: it is a recency-capped feed across every status
   (see loadCaptures), so a handful of quickly filed captures could crowd an older stuck one
   out of view. `captureAttention` is queried separately, scoped to the non-terminal statuses,
   so nothing unresolved goes missing just because newer activity outranks it. */
export function NeedsAttention({
  captureAttention,
}: {
  captureAttention: WorkspaceData["captureAttention"];
}) {
  const attention = capturesNeedingAttention(captureAttention);
  return (
    <section className="workspace-section">
      <div className="section-heading">
        <div>
          <h2>Needs your attention</h2>
          <p className="section-note">Captures still waiting on you</p>
        </div>
        {attention.length > 0 && (
          <span className="tag tag--attention">{attention.length} waiting</span>
        )}
      </div>
      <div className="space-y-3">
        {attention.map((capture) => (
          <article className="record-card" key={capture.id}>
            <div>
              <p className="record-copy">{snippet(capture.original_text)}</p>
              <p className="record-meta">
                {captureAttentionLabel(capture)} · <CaptureAge iso={capture.created_at} />
              </p>
            </div>
            <div className="record-actions">
              <Link
                className="button-base button-secondary"
                href="/inbox"
                aria-label={`Resolve “${snippet(capture.original_text)}” in Inbox`}
              >
                Resolve in Inbox
              </Link>
            </div>
          </article>
        ))}
        {attention.length === 0 && (
          <p className="empty-state">
            Nothing needs your attention. New captures land here only if they get stuck.
          </p>
        )}
      </div>
    </section>
  );
}
