import { Skeleton } from "@/components/ui/primitives";

/* Mirrors Today's actual section layout (header, Today/Top Three grid, Routines, Notes to
   review, Slipping, Needs your attention) so the loading state doesn't jump or reflow once real
   content lands — a calm placeholder, not a generic spinner. */
export function TodayLoading() {
  return (
    <main aria-busy="true" className="workspace-page">
      <span className="sr-only">Loading today’s view…</span>
      <header className="page-intro">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-9 w-3/4" />
        <Skeleton className="mt-3 h-4 w-1/2" />
      </header>
      <div className="today-grid">
        <section className="workspace-section today-all-tasks">
          <div className="section-heading">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </section>
        <aside className="workspace-section today-priority-panel">
          <div className="section-heading">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </aside>
      </div>
      {["Routines", "Notes to review", "Slipping", "Needs your attention"].map((label) => (
        <section className="workspace-section" key={label}>
          <div className="section-heading">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
          </div>
        </section>
      ))}
    </main>
  );
}
