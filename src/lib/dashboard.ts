import { DEFAULT_TIMEZONE, localToday } from "@/lib/proposals/dates";
import { loadDestinationCatalog } from "@/lib/proposals/catalog";
import type { DestinationCatalog } from "@/lib/proposals/destinations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProposalApplication = {
  proposal_id: string;
  item_index: number;
  outcome: "filed" | "dismissed";
  record_type: string | null;
  record_id: string | null;
};

export type DashboardData = {
  captures: Array<{
    id: string;
    original_text: string;
    source_type: "text" | "voice";
    status: string;
    failure_code: string | null;
    interpretation_claimed_at: string | null;
    created_at: string;
    proposal?: {
      id: string;
      status: string;
      proposal_json: unknown;
      applications: ProposalApplication[];
    };
  }>;
  records: Array<{ id: string; proposal_id: string | null; record_type: string; title: string; destination_name: string | null; created_at: string }>;
  /* The domains, projects, and people a proposal can be routed into. Review matches
     against this rather than trusting a name the model returned. */
  catalog: DestinationCatalog;
  /* The account's local calendar day, resolved once on the server so review reads a
     proposed date phrase against the same day the server will file it against. */
  today: string;
  signals: Array<{ id: string; entity_type: string; entity_id: string; retainer_id: string | null; cycle_item_id: string | null; reason: string; severity: string; outcome: string }>;
};

export const newestProposalByCapture = <T extends { capture_id: string }>(proposals: T[]) => {
  const proposalByCapture = new Map<string, T>();
  for (const proposal of proposals) {
    if (!proposalByCapture.has(proposal.capture_id)) proposalByCapture.set(proposal.capture_id, proposal);
  }
  return proposalByCapture;
};

type RoutedRecord = { id: string; proposal_id: string | null; title: string; created_at: string; domain_id: string | null; project_id: string | null; person_id: string | null };

/* Where a filed record ended up, for the Recently filed list. Reads the record's own
   foreign keys, so it stays honest if the record is moved later. */
export function filedDestinationLabel(record: Pick<RoutedRecord, "domain_id" | "project_id" | "person_id">, catalog: DestinationCatalog) {
  const names = [
    catalog.projects.find((project) => project.id === record.project_id)?.name,
    catalog.people.find((person) => person.id === record.person_id)?.name,
    catalog.domains.find((domain) => domain.id === record.domain_id)?.name,
  ].filter((name): name is string => Boolean(name));
  return names.length > 0 ? names.join(" · ") : null;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();
  const [capturesResult, proposalsResult, applicationsResult, prototypeRecordsResult, taskRecordsResult, noteRecordsResult, catalog, signalsResult, preferencesResult] = await Promise.all([
    supabase.from("captures").select("id, original_text, source_type, status, failure_code, interpretation_claimed_at, created_at").order("created_at", { ascending: false }).limit(12),
    supabase.from("proposals").select("id, capture_id, status, proposal_json").order("created_at", { ascending: false }),
    supabase.from("proposal_applications").select("proposal_id, item_index, outcome, record_type, record_id"),
    supabase.from("prototype_records").select("id, proposal_id, record_type, title, destination_name, created_at").order("created_at", { ascending: false }).limit(8),
    /* Filing without AI leaves no proposal, so a proposal-only filter made manual filing
       look like nothing had happened. Anything that came from a capture belongs here. */
    supabase.from("tasks").select("id, proposal_id, title, created_at, domain_id, project_id, person_id").not("source_capture_id", "is", null).order("created_at", { ascending: false }).limit(8),
    supabase.from("notes").select("id, proposal_id, title, created_at, domain_id, project_id, person_id").not("source_capture_id", "is", null).order("created_at", { ascending: false }).limit(8),
    loadDestinationCatalog(supabase),
    supabase.from("slipping_signals").select("id, entity_type, entity_id, retainer_id, cycle_item_id, reason, severity, outcome").eq("outcome", "open").order("created_at", { ascending: false }),
    supabase.from("user_preferences").select("timezone").maybeSingle(),
  ]);

  const proposals = (proposalsResult.data ?? []) as Array<{ id: string; capture_id: string; status: string; proposal_json: unknown }>;
  // The query is newest first. A retry creates a new proposal, so retain the newest state for each capture.
  const proposalByCapture = newestProposalByCapture(proposals);
  const applications = (applicationsResult.data ?? []) as ProposalApplication[];
  const routed = (rows: unknown, recordType: "task" | "note") =>
    ((rows ?? []) as RoutedRecord[]).map((record) => ({
      id: record.id,
      proposal_id: record.proposal_id,
      record_type: recordType,
      title: record.title,
      destination_name: filedDestinationLabel(record, catalog),
      created_at: record.created_at,
    }));

  return {
    captures: ((capturesResult.data ?? []) as DashboardData["captures"]).map((capture) => {
      const proposal = proposalByCapture.get(capture.id);
      return {
        ...capture,
        proposal: proposal
          ? { ...proposal, applications: applications.filter((application) => application.proposal_id === proposal.id) }
          : undefined,
      };
    }),
    records: [
      ...((prototypeRecordsResult.data ?? []) as DashboardData["records"]),
      ...routed(taskRecordsResult.data, "task"),
      ...routed(noteRecordsResult.data, "note"),
    ].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8),
    catalog,
    today: localToday(new Date(), preferencesResult.data?.timezone ?? DEFAULT_TIMEZONE),
    signals: (signalsResult.data ?? []) as DashboardData["signals"],
  };
}
