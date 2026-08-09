"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import type { WorkspaceData } from "@/lib/workspace";
import type { PeopleNotesPageData } from "@/lib/workspace-page-data";
import { Dialog } from "@/components/ui/primitives";
import { DomainSelect } from "@/components/workspace/shared/selects";
import { ActionsMenu, type MenuAction } from "@/components/workspace/shared/actions-menu";
import { useWorkspaceCommand } from "@/components/workspace/shared/use-workspace-command";
import { PersonInteractions } from "@/components/workspace/people-notes/person-interactions";

type CreateDialog = "person" | "note" | null;

export function PeopleNotesPage({ data }: { data: PeopleNotesPageData }) {
  const { command, submit, safely } = useWorkspaceCommand();
  const [createDialog, setCreateDialog] = useState<CreateDialog>(null);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const fullData = data as WorkspaceData;

  const activePeople = data.people.filter((person) => !person.archived_at);
  const archivedPeople = data.people.filter((person) => person.archived_at);
  const activeNotes = data.notes.filter((note) => !note.archived_at);
  const archivedNotes = data.notes.filter((note) => note.archived_at);
  const editingPerson = editingPersonId ? data.people.find((person) => person.id === editingPersonId) : undefined;
  const editingNote = editingNoteId ? data.notes.find((note) => note.id === editingNoteId) : undefined;

  return (
    <main className="workspace-page">
      <header className="page-intro page-intro--with-action">
        <div className="page-intro-text">
          <p className="eyebrow">People & Notes</p>
          <h1>Context without turning everything into a task.</h1>
          <p>People and reflective notes remain lightweight, private records.</p>
        </div>
        <div className="page-actions">
          <button className="button-base button-secondary" onClick={() => setCreateDialog("person")}>
            <Plus aria-hidden size={16} weight="bold" />
            New person
          </button>
          <button className="button-base button-primary" onClick={() => setCreateDialog("note")}>
            <Plus aria-hidden size={16} weight="bold" />
            New note
          </button>
        </div>
      </header>
      <Dialog open={createDialog === "person"} title="New person" onClose={() => setCreateDialog(null)}>
        {createDialog === "person" ? (
          <form className="form-grid" onSubmit={(event) => submit(event, "create_person", { name: "name", context: "context", domainId: "domainId" }, "Person added.", () => setCreateDialog(null))}>
            <label className="field-label form-span">
              <span>Name</span>
              <input className="field-base" name="name" required maxLength={160} placeholder="Priya from Rivera Studio" />
            </label>
            <label className="field-label form-span">
              <span>Context</span>
              <input className="field-base" name="context" maxLength={1000} placeholder="Client lead, collaborator, or someone important" />
            </label>
            <DomainSelect domains={data.domains} />
            <button className="button-base button-primary form-submit">Add person</button>
          </form>
        ) : null}
      </Dialog>
      {editingPerson ? (
        <Dialog open title="Edit person" onClose={() => setEditingPersonId(null)}>
          <form
            className="form-grid"
            onSubmit={(event) =>
              submit(
                event,
                "update_person",
                { personId: "personId", name: "name", context: "context", domainId: "domainId" },
                "Person updated.",
                () => setEditingPersonId(null),
              )
            }
          >
            <input type="hidden" name="personId" value={editingPerson.id} readOnly />
            <label className="field-label form-span">
              <span>Name</span>
              <input className="field-base" name="name" required maxLength={160} defaultValue={editingPerson.name} />
            </label>
            <label className="field-label form-span">
              <span>Context</span>
              <input className="field-base" name="context" maxLength={1000} defaultValue={editingPerson.context ?? ""} />
            </label>
            <DomainSelect domains={data.domains} defaultValue={editingPerson.domain_id ?? ""} />
            <div className="record-actions form-span">
              <button className="button-base button-primary" type="submit">Save changes</button>
              <button className="button-base button-quiet" type="button" onClick={() => setEditingPersonId(null)}>Cancel</button>
            </div>
          </form>
        </Dialog>
      ) : null}
      <Dialog open={createDialog === "note"} title="New note" size="lg" onClose={() => setCreateDialog(null)}>
        {createDialog === "note" ? (
          <form className="form-grid" onSubmit={(event) => submit(event, "create_note", { title: "title", body: "body", domainId: "domainId", projectId: "projectId", personId: "personId", reviewOn: "reviewOn" }, "Note saved.", () => setCreateDialog(null))}>
            <label className="field-label form-span">
              <span>Title</span>
              <input className="field-base" name="title" required maxLength={280} placeholder="Rivera Studio call notes" />
            </label>
            <label className="field-label form-span">
              <span>Note</span>
              <textarea className="field-base min-h-32" name="body" maxLength={20000} placeholder="Keep the reflective content intact." />
            </label>
            <DomainSelect domains={data.domains} />
            <label className="field-label">
              <span>Review on</span>
              <input className="field-base" type="date" name="reviewOn" />
            </label>
            <label className="field-label">
              <span>Project</span>
              <select className="field-base" name="projectId" defaultValue="">
                <option value="">No project</option>
                {data.projects.filter((project) => !project.archived_at).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              <span>Person</span>
              <select className="field-base" name="personId" defaultValue="">
                <option value="">No person</option>
                {activePeople.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="button-base button-primary form-submit">Save note</button>
          </form>
        ) : null}
      </Dialog>
      {editingNote ? (
        <Dialog open title="Edit note" size="lg" onClose={() => setEditingNoteId(null)}>
          <form
            className="form-grid"
            onSubmit={(event) =>
              submit(
                event,
                "update_note",
                { noteId: "noteId", title: "title", body: "body", domainId: "domainId", projectId: "projectId", personId: "personId", reviewOn: "reviewOn" },
                "Note updated.",
                () => setEditingNoteId(null),
              )
            }
          >
            <input type="hidden" name="noteId" value={editingNote.id} readOnly />
            <label className="field-label form-span">
              <span>Title</span>
              <input className="field-base" name="title" required maxLength={280} defaultValue={editingNote.title} />
            </label>
            <label className="field-label form-span">
              <span>Note</span>
              <textarea className="field-base min-h-32" name="body" maxLength={20000} defaultValue={editingNote.body ?? ""} />
            </label>
            <DomainSelect domains={data.domains} defaultValue={editingNote.domain_id ?? ""} />
            <label className="field-label">
              <span>Review on</span>
              <input className="field-base" type="date" name="reviewOn" defaultValue={editingNote.review_on ?? ""} />
            </label>
            <label className="field-label">
              <span>Project</span>
              <select className="field-base" name="projectId" defaultValue={editingNote.project_id ?? ""}>
                <option value="">No project</option>
                {data.projects.filter((project) => !project.archived_at).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              <span>Person</span>
              <select className="field-base" name="personId" defaultValue={editingNote.person_id ?? ""}>
                <option value="">No person</option>
                {activePeople.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="record-actions form-span">
              <button className="button-base button-primary" type="submit">Save changes</button>
              <button className="button-base button-quiet" type="button" onClick={() => setEditingNoteId(null)}>Cancel</button>
            </div>
          </form>
        </Dialog>
      ) : null}
      <div className="workspace-columns">
        <section className="workspace-section">
          <div className="section-heading">
            <div>
              <h2>People</h2>
              <p className="section-note">Useful relationship context</p>
            </div>
            <span className="tag">{activePeople.length}</span>
          </div>
          <div className="space-y-3">
            {activePeople.map((person) => {
              const menuActions: MenuAction[] = [
                { label: "Edit", onClick: () => setEditingPersonId(person.id) },
                { label: "Delete", onClick: () => safely(() => command({ action: "delete_person", personId: person.id }), "Person deleted."), tone: "danger" },
              ];
              return (
                <article className="project-card" key={person.id}>
                  <div className="record-card">
                    <div className="min-w-0">
                      <h3>{person.name}</h3>
                      {person.context && <p className="record-copy">{person.context}</p>}
                    </div>
                    <div className="record-actions">
                      <ActionsMenu actions={menuActions} />
                    </div>
                  </div>
                  <PersonInteractions personId={person.id} data={fullData} onCommand={command} />
                </article>
              );
            })}
            {activePeople.length === 0 && <p className="empty-state">Add people when context helps, not as a CRM setup exercise.</p>}
          </div>
          {archivedPeople.length > 0 && (
            <details className="project-activity">
              <summary>Deleted ({archivedPeople.length})</summary>
              <div className="space-y-3">
                {archivedPeople.map((person) => (
                  <article className="record-card" key={person.id}>
                    <div className="min-w-0">
                      <h3>{person.name}</h3>
                    </div>
                    <div className="record-actions">
                      <button className="button-base button-primary" onClick={() => safely(() => command({ action: "restore_person", personId: person.id }), "Person restored.")}>
                        Restore
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          )}
        </section>
        <section className="workspace-section">
          <div className="section-heading">
            <div>
              <h2>Notes</h2>
              <p className="section-note">Thinking worth keeping</p>
            </div>
            <span className="tag">{activeNotes.length}</span>
          </div>
          <div className="space-y-3">
            {activeNotes.map((note) => {
              const menuActions: MenuAction[] = [
                { label: "Edit", onClick: () => setEditingNoteId(note.id) },
                { label: "Delete", onClick: () => safely(() => command({ action: "delete_note", noteId: note.id }), "Note deleted."), tone: "danger" },
              ];
              return (
                <article className="record-card" key={note.id}>
                  <div className="min-w-0">
                    <h3>{note.title}</h3>
                    {note.body && <p className="record-copy whitespace-pre-wrap">{note.body}</p>}
                    <p className="record-meta">{note.review_on ? `Review ${note.review_on}` : "No review date"}</p>
                  </div>
                  <div className="record-actions">
                    <ActionsMenu actions={menuActions} />
                  </div>
                </article>
              );
            })}
            {activeNotes.length === 0 && <p className="empty-state">Notes preserve thinking even when no action follows.</p>}
          </div>
          {archivedNotes.length > 0 && (
            <details className="project-activity">
              <summary>Deleted ({archivedNotes.length})</summary>
              <div className="space-y-3">
                {archivedNotes.map((note) => (
                  <article className="record-card" key={note.id}>
                    <div className="min-w-0">
                      <h3>{note.title}</h3>
                    </div>
                    <div className="record-actions">
                      <button className="button-base button-primary" onClick={() => safely(() => command({ action: "restore_note", noteId: note.id }), "Note restored.")}>
                        Restore
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          )}
        </section>
      </div>
    </main>
  );
}
