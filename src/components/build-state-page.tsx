import Link from "next/link";
import { ArrowRight, Briefcase, Gear, ListChecks, MagnifyingGlass, Sun, Users } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

const copy: Record<string, { title: string; description: string; icon: Icon }> = {
  today: { title: "A quieter daily view is taking shape.", description: "Today will bring your Top Three, trusted calendar context, routines, and attention signals into one calm place.", icon: Sun },
  tasks: { title: "Tasks will arrive with real context.", description: "The task foundation comes after durable capture and review are ready, so no important work has to be rebuilt later.", icon: ListChecks },
  work: { title: "Projects and retainers are being strengthened.", description: "Finite projects, domains, and production-grade retainer cycles are scheduled after the core capture foundation.", icon: Briefcase },
  search: { title: "Search will be useful when it can be trusted.", description: "Global search will arrive after the records it searches have their durable, permission-safe models.", icon: MagnifyingGlass },
  "people-notes": { title: "Personal context comes later, on purpose.", description: "Lightweight people and notes will stay separate from tasks and respect the same capture and privacy guarantees.", icon: Users },
  settings: { title: "Your core settings are being prepared.", description: "Profile, capture preferences, connections, export, and account controls will arrive with their complete underlying workflows.", icon: Gear },
};

export function BuildStatePage({ surface }: { surface: string }) {
  const content = copy[surface];
  const Glyph = content.icon;
  return (
    <section className="build-state">
      <span className="inline-flex rounded-md bg-[var(--accent-soft)] p-2.5 text-[var(--accent-ink)]">
        <Glyph aria-hidden size={22} />
      </span>
      <h1>{content.title}</h1>
      <p>{content.description}</p>
      <div className="build-state-rule" />
      <p className="text-sm text-[var(--ink-muted)]">Your current pilot capture and review workspace remains available in Inbox.</p>
      <Link className="button-base button-primary mt-6 inline-flex" href="/today">
        Go to Today
        <ArrowRight aria-hidden size={16} weight="bold" />
      </Link>
    </section>
  );
}
