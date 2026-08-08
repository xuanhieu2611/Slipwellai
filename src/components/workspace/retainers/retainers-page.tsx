"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import type { WorkspaceData } from "@/lib/workspace";
import type { RetainersPageData } from "@/lib/workspace-page-data";
import { Dialog } from "@/components/ui/primitives";
import { useWorkspaceCommand } from "@/components/workspace/shared/use-workspace-command";
import { defaultRetainerFilters, filterRetainers, RetainerFilters, type RetainerFilterState } from "@/components/workspace/retainers/retainer-filters";
import { NewRetainerForm } from "@/components/workspace/retainers/retainer-forms";
import { RetainerList } from "@/components/workspace/retainers/retainer-list";

export function RetainersPage({ data }: { data: RetainersPageData }) {
  const { command, checkRetainerSlipping } = useWorkspaceCommand();
  const [createOpen, setCreateOpen] = useState(false);
  const [retainerFilters, setRetainerFilters] = useState<RetainerFilterState>(defaultRetainerFilters);
  const filteredRetainers = filterRetainers(data.retainers, retainerFilters);
  const fullData = data as WorkspaceData;

  return (
    <main className="workspace-page">
      <header className="page-intro page-intro--with-action">
        <div className="page-intro-text">
          <p className="eyebrow">Retainers</p>
          <h1>Ongoing engagements, not projects with a finish line.</h1>
          <p>Each cycle is a versioned, inspectable record. Incomplete work never silently disappears at rollover.</p>
        </div>
        <button className="button-base button-primary" onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden size={16} weight="bold" />
          New retainer
        </button>
      </header>
      {createOpen && (
        <Dialog title="New retainer" size="lg" onClose={() => setCreateOpen(false)}>
          <NewRetainerForm data={fullData} onCommand={command} onDone={() => setCreateOpen(false)} />
        </Dialog>
      )}
      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <h2>Retainers</h2>
            <p className="section-note">Deliverables, cycles, and history</p>
          </div>
          <span className="tag">{filteredRetainers.length} shown</span>
        </div>
        <RetainerFilters filters={retainerFilters} onChange={setRetainerFilters} />
        <RetainerList retainers={filteredRetainers} data={fullData} onCommand={command} onCheckSlipping={checkRetainerSlipping} />
      </section>
    </main>
  );
}
