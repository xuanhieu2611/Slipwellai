"use client";

import type { WorkspaceData } from "@/lib/workspace";

export function NotesToReview({ notes, today }: { notes: WorkspaceData["notes"]; today: string }) {
  const reviewNotes = notes.filter((note) => note.review_on && note.review_on <= today);
  return (
    <section className="workspace-section">
      <div className="section-heading">
        <div>
          <h2>Notes to review</h2>
          <p className="section-note">Keep a thought within reach</p>
        </div>
        <span className="tag">{reviewNotes.length} due</span>
      </div>
      <div className="space-y-3">
        {reviewNotes.map((note) => (
          <article className="record-card" key={note.id}>
            <div>
              <h3>{note.title}</h3>
              {note.body && <p className="record-copy">{note.body}</p>}
              <p className="record-meta">Review date {note.review_on}</p>
            </div>
          </article>
        ))}
        {reviewNotes.length === 0 && (
          <p className="empty-state">No notes are due for review today.</p>
        )}
      </div>
    </section>
  );
}
