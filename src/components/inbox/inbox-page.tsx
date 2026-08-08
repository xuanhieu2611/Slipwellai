"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import type { DashboardData } from "@/lib/dashboard";
import { Button, EmptyState } from "@/components/ui/primitives";
import { useCapture } from "@/components/capture-dialog";
import { post } from "@/components/inbox/api";
import { PendingCapture } from "@/components/inbox/pending-capture";
import { Review } from "@/components/inbox/review";

export function InboxPage({ data }: { data: DashboardData }) {
  const [refreshing, setRefreshing] = useState(false);
    const refresh = () => { setRefreshing(true); window.location.reload(); };
    const { open: openCapture } = useCapture();
    async function resolveSignal(id: string, outcome: "marked_attention" | "deferred" | "dismissed") { await post(`/api/slipping/${id}`, { outcome }); refresh(); }
    async function undoRecord(record: DashboardData["records"][number]) { if (!record.proposal_id) return; await post(`/api/proposals/${record.proposal_id}`, { action: "undo", recordId: record.id }); refresh(); }
    const needsReview = data.captures.filter((capture) => capture.status === "needs_review");
    /* Stored but not yet interpreted. These used to be invisible, which made a capture
       look lost whenever interpretation did not finish. */
    const pending = data.captures.filter((capture) => capture.status === "queued" || capture.status === "interpreting");
  
    return <main className="workspace-page">
      <header className="page-intro">
        <p className="eyebrow">Inbox</p>
        <h1>Capture it now, decide in one pass.</h1>
        <p>Slipwell keeps your original words and proposes where each one belongs. Accept it, edit it, or discard it. Nothing files itself.</p>
      </header>
  
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="space-y-4">
          <section className="workspace-section mt-0">
            <div className="section-heading">
              <div><h2>What needs a place?</h2><p className="section-note">Press ⌘J anywhere, or start here. Your words are stored before any interpretation runs.</p></div>
            </div>
            <Button className="button-primary" onClick={openCapture}><Plus aria-hidden size={16} weight="bold" />New capture<kbd>⌘J</kbd></Button>
          </section>
          <section className="workspace-section mt-0">
            <div className="section-heading">
              <div><h2>Waiting on you</h2><p className="section-note">{refreshing ? "Refreshing…" : "Originals stay in reach"}</p></div>
              {needsReview.length > 0 && <span className="tag">{needsReview.length} to review</span>}
            </div>
            <div className="space-y-3">
              {pending.map((capture) => <PendingCapture key={capture.id} capture={capture} catalog={data.catalog} done={refresh} />)}
              {needsReview.map((capture) => <Review key={capture.id} capture={capture} catalog={data.catalog} today={data.today} done={refresh} />)}
              {needsReview.length === 0 && pending.length === 0 && <EmptyState>Your inbox is clear. Capture the next thing before it slips.</EmptyState>}
            </div>
          </section>
        </div>
  
        <aside className="space-y-4">
          <section className="workspace-section mt-0">
            <div className="section-heading"><div><h2>Attention, not shame</h2><p className="section-note">Slipping</p></div></div>
            <div className="space-y-3">
              {data.signals.map((signal) => <article className="record-card flex-col items-stretch" key={signal.id}>
                <div><span className="tag tag--attention">{signal.severity}</span><p className="record-copy">{signal.reason}</p></div>
                <div className="record-actions justify-start">
                  <Button className="button-primary" onClick={() => resolveSignal(signal.id, "marked_attention")}>Mark attention</Button>
                  <Button className="button-secondary" onClick={() => resolveSignal(signal.id, "deferred")}>Defer</Button>
                  <Button className="button-quiet" onClick={() => resolveSignal(signal.id, "dismissed")}>Dismiss</Button>
                </div>
              </article>)}
              {data.signals.length === 0 && <p className="empty-state">No active signals right now.</p>}
            </div>
          </section>
  
          <section className="workspace-section mt-0">
            <div className="section-heading"><div><h2>Recently filed</h2><p className="section-note">Undo puts a record back in review</p></div></div>
            <div className="space-y-2">
              {data.records.map((record) => <div className="compact-row" key={record.id}>
                <span className="flex-col items-start"><span className="font-medium">{record.title}</span><span className="record-meta">{record.record_type.replace("_", " ")}{record.destination_name ? ` · ${record.destination_name}` : ""}</span></span>
                {record.proposal_id && <Button className="button-quiet" onClick={() => undoRecord(record)}>Undo</Button>}
              </div>)}
              {data.records.length === 0 && <p className="empty-state">Accepted proposals appear here.</p>}
            </div>
          </section>
        </aside>
      </div>
    </main>;
  }
  
