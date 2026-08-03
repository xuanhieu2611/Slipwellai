import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DashboardData = {
  captures: Array<{
    id: string;
    original_text: string;
    status: string;
    created_at: string;
    proposal?: {
      id: string;
      status: string;
      proposal_json: unknown;
    };
  }>;
  records: Array<{ id: string; proposal_id: string | null; record_type: string; title: string; destination_name: string | null; created_at: string }>;
  retainers: Array<{ id: string; name: string; timezone: string; cycle_day: number; status: string }>;
  cycles: Array<{ id: string; retainer_id: string; cycle_start: string; cycle_end: string }>;
  cycleItems: Array<{ id: string; cycle_id: string; title: string; expected_on: string; status: string; carried_from_item_id: string | null }>;
  signals: Array<{ id: string; retainer_id: string; cycle_item_id: string | null; reason: string; severity: string; outcome: string }>;
};

export const newestProposalByCapture = <T extends { capture_id: string }>(proposals: T[]) => {
  const proposalByCapture = new Map<string, T>();
  for (const proposal of proposals) {
    if (!proposalByCapture.has(proposal.capture_id)) proposalByCapture.set(proposal.capture_id, proposal);
  }
  return proposalByCapture;
};

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();
  const [capturesResult, proposalsResult, prototypeRecordsResult, taskRecordsResult, noteRecordsResult, retainersResult, cyclesResult, cycleItemsResult, signalsResult] = await Promise.all([
    supabase.from("captures").select("id, original_text, status, created_at").order("created_at", { ascending: false }).limit(12),
    supabase.from("proposals").select("id, capture_id, status, proposal_json").order("created_at", { ascending: false }),
    supabase.from("prototype_records").select("id, proposal_id, record_type, title, destination_name, created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("tasks").select("id, proposal_id, title, created_at").not("proposal_id", "is", null).order("created_at", { ascending: false }).limit(8),
    supabase.from("notes").select("id, proposal_id, title, created_at").not("proposal_id", "is", null).order("created_at", { ascending: false }).limit(8),
    supabase.from("retainers").select("id, name, timezone, cycle_day, status").order("created_at", { ascending: false }),
    supabase.from("retainer_cycles").select("id, retainer_id, cycle_start, cycle_end").order("cycle_start", { ascending: false }),
    supabase.from("retainer_cycle_items").select("id, cycle_id, title, expected_on, status, carried_from_item_id").order("expected_on", { ascending: false }),
    supabase.from("slipping_signals").select("id, retainer_id, cycle_item_id, reason, severity, outcome").eq("outcome", "open").order("created_at", { ascending: false }),
  ]);

  const proposals = (proposalsResult.data ?? []) as Array<{ id: string; capture_id: string; status: string; proposal_json: unknown }>;
  // The query is newest first. A retry creates a new proposal, so retain the newest state for each capture.
  const proposalByCapture = newestProposalByCapture(proposals);

  return {
    captures: ((capturesResult.data ?? []) as DashboardData["captures"]).map((capture) => ({
      ...capture,
      proposal: proposalByCapture.get(capture.id),
    })),
    records: [
      ...((prototypeRecordsResult.data ?? []) as DashboardData["records"]),
      ...((taskRecordsResult.data ?? []).map((record) => ({ ...record, record_type: "task", destination_name: null })) as DashboardData["records"]),
      ...((noteRecordsResult.data ?? []).map((record) => ({ ...record, record_type: "note", destination_name: null })) as DashboardData["records"]),
    ].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8),
    retainers: (retainersResult.data ?? []) as DashboardData["retainers"],
    cycles: (cyclesResult.data ?? []) as DashboardData["cycles"],
    cycleItems: (cycleItemsResult.data ?? []) as DashboardData["cycleItems"],
    signals: (signalsResult.data ?? []) as DashboardData["signals"],
  };
}
