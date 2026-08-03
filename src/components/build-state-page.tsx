import Link from "next/link";

const copy: Record<string, { eyebrow: string; title: string; description: string }> = {
  today: { eyebrow: "Today", title: "A quieter daily view is taking shape.", description: "Today will bring your Top Three, trusted calendar context, routines, and attention signals into one calm place." },
  tasks: { eyebrow: "Tasks", title: "Tasks will arrive with real context.", description: "The task foundation comes after durable capture and review are ready, so no important work has to be rebuilt later." },
  work: { eyebrow: "Work", title: "Projects and retainers are being strengthened.", description: "Finite projects, domains, and production-grade retainer cycles are scheduled after the core capture foundation." },
  search: { eyebrow: "Search", title: "Search will be useful when it can be trusted.", description: "Global search will arrive after the records it searches have their durable, permission-safe models." },
  "people-notes": { eyebrow: "People & Notes", title: "Personal context comes later, on purpose.", description: "Lightweight people and notes will stay separate from tasks and respect the same capture and privacy guarantees." },
  settings: { eyebrow: "Settings", title: "Your core settings are being prepared.", description: "Profile, capture preferences, connections, export, and account controls will arrive with their complete underlying workflows." },
};

export function BuildStatePage({ surface }: { surface: string }) {
  const content = copy[surface];
  return <section className="build-state"><p className="eyebrow">{content.eyebrow}</p><h1>{content.title}</h1><p>{content.description}</p><div className="build-state-rule" /><p className="text-sm text-[var(--ink-muted)]">Your current pilot capture and review workspace remains available in Inbox.</p><Link className="button-base button-primary mt-7 inline-flex" href="/inbox">Go to Inbox</Link></section>;
}
