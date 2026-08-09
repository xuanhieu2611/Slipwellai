"use client";

import { type FormEvent } from "react";
import type { WorkspaceData } from "@/lib/workspace";
import { useToast } from "@/components/ui/toast";
import { formValue } from "@/components/workspace/shared/form-utils";
import type { WorkspaceCommandFn } from "@/components/workspace/shared/use-workspace-command";

export function PersonInteractions({
  personId,
  data,
  onCommand,
}: {
  personId: string;
  data: WorkspaceData;
  onCommand: WorkspaceCommandFn;
}) {
  const notify = useToast();
  const interactions = data.personInteractions
    .filter((interaction) => interaction.person_id === personId)
    .slice(0, 3);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const form = event.currentTarget;
      await onCommand({
        action: "create_person_interaction",
        personId,
        summary: formValue(form, "summary"),
        followUpTitle: formValue(form, "followUpTitle"),
      });
      form.reset();
      notify("Interaction logged.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not log that interaction.", "error");
    }
  }
  return (
    <div className="project-milestones">
      <form className="form-grid" onSubmit={submit}>
        <label className="field-label form-span">
          <span>Interaction</span>
          <textarea
            className="field-base min-h-20"
            name="summary"
            required
            maxLength={4000}
            placeholder="What happened, or what should you remember?"
          />
        </label>
        <label className="field-label">
          <span>Optional follow-up task</span>
          <input
            className="field-base"
            name="followUpTitle"
            maxLength={280}
            placeholder="Send the recap"
          />
        </label>
        <button className="button-base button-secondary form-submit">Log interaction</button>
      </form>
      <div className="mt-3 space-y-2">
        {interactions.map((interaction) => (
          <div className="compact-row" key={interaction.id}>
            <span>{interaction.summary}</span>
            <span className="tag">
              {interaction.follow_up_task_id
                ? "Follow-up added"
                : new Date(interaction.occurred_at).toLocaleDateString()}
            </span>
          </div>
        ))}
        {interactions.length === 0 && <p className="record-meta">No interactions logged yet.</p>}
      </div>
    </div>
  );
}
