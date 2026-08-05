import { NextRequest, NextResponse } from "next/server";
import { captureStatusAfterApplications } from "@/lib/capture-pipeline";
import { claimCaptureForInterpretation, interpretCapture } from "@/lib/captures";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { applyDestinationSelection } from "@/lib/proposals/catalog";
import { acceptedDate, acceptedRecurrence, DEFAULT_TIMEZONE, localToday, resolveProposalDate, resolveProposalRecurrence } from "@/lib/proposals/dates";
import { filedDateColumns, parseProposalEnvelope, proposalActionSchema } from "@/lib/proposals/schema";
import { requireUser } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof import("@/lib/supabase/server").createSupabaseServerClient>>;

/* One capture can propose several records, so the capture is only finished once every
   proposed item has an outcome. This recomputes that from the recorded outcomes rather
   than assuming the accepted item was the only one. */
async function syncCaptureState(supabase: SupabaseClient, proposal: { id: string; capture_id: string }, proposedItemCount: number) {
  const { data: applications } = await supabase.from("proposal_applications").select("outcome").eq("proposal_id", proposal.id);
  const status = captureStatusAfterApplications(proposedItemCount, (applications ?? []) as Array<{ outcome: string }>);
  await Promise.all([
    supabase.from("captures").update({ status }).eq("id", proposal.capture_id),
    supabase.from("proposals").update({ status: status === "needs_review" ? "ready" : "accepted" }).eq("id", proposal.id),
  ]);
  return status;
}

export async function POST(request: NextRequest, context: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await context.params;
  const parsed = proposalActionSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest("That review action was not valid.");
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("id, capture_id, proposal_json, status")
    .eq("id", proposalId)
    .single();
  if (error || !proposal) return badRequest("Proposal not found.");

  if (parsed.data.action === "discard") {
    await Promise.all([
      supabase.from("proposals").update({ status: "discarded" }).eq("id", proposal.id),
      supabase.from("captures").update({ status: "discarded" }).eq("id", proposal.capture_id),
      supabase.from("activity_events").insert({ entity_type: "proposal", entity_id: proposal.id, event_type: "discarded" }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "retry") {
    /* Re-interpreting replaces every proposed item. Any item already filed came from the
       proposal being replaced, so ask for that decision to be undone first instead of
       leaving a filed record pointing at a superseded proposal. */
    const { count: filedCount } = await supabase
      .from("proposal_applications")
      .select("id", { count: "exact", head: true })
      .eq("proposal_id", proposal.id)
      .eq("outcome", "filed");
    if ((filedCount ?? 0) > 0) return badRequest("Undo the record you already filed from this capture before interpreting it again.");

    const claimed = await claimCaptureForInterpretation({ supabase, captureId: proposal.capture_id, reason: "retry" });
    if (!claimed) return badRequest("This capture is being interpreted right now. Give it a moment.");
    await Promise.all([
      supabase.from("proposals").update({ status: "superseded" }).eq("id", proposal.id),
      supabase.from("proposal_applications").delete().eq("proposal_id", proposal.id),
    ]);
    const result = await interpretCapture({ supabase, capture: claimed });
    return NextResponse.json({ ok: true, warning: result.error });
  }

  const envelope = parseProposalEnvelope(proposal.proposal_json);

  if (parsed.data.action === "dismiss_item") {
    if (!envelope) return badRequest("This proposal cannot be reviewed item by item. Retry it instead.");
    if (!envelope.proposals[parsed.data.proposalIndex]) return badRequest("Proposal item not found.");
    const { error: dismissError } = await supabase
      .from("proposal_applications")
      .insert({ proposal_id: proposal.id, item_index: parsed.data.proposalIndex, outcome: "dismissed" });
    // 23505 means this item already has an outcome; the request is a repeat, not a failure.
    if (dismissError && dismissError.code !== "23505") return serverError();
    await supabase.from("activity_events").insert({
      entity_type: "proposal",
      entity_id: proposal.id,
      event_type: "item_dismissed",
      metadata: { proposalIndex: parsed.data.proposalIndex },
    });
    const status = await syncCaptureState(supabase, proposal, envelope.proposals.length);
    return NextResponse.json({ ok: true, captureStatus: status });
  }

  if (parsed.data.action === "undo") {
    if (!parsed.data.recordId) return badRequest("Choose the accepted record to undo.");
    const [taskResult, noteResult, prototypeResult] = await Promise.all([
      supabase.from("tasks").delete().eq("id", parsed.data.recordId).eq("proposal_id", proposal.id),
      supabase.from("notes").delete().eq("id", parsed.data.recordId).eq("proposal_id", proposal.id),
      supabase.from("prototype_records").delete().eq("id", parsed.data.recordId).eq("proposal_id", proposal.id),
    ]);
    if (taskResult.error || noteResult.error || prototypeResult.error) return serverError();
    // Releasing the outcome is what makes the item reviewable again.
    await supabase.from("proposal_applications").delete().eq("proposal_id", proposal.id).eq("record_id", parsed.data.recordId);
    await supabase.from("activity_events").insert({ entity_type: "proposal", entity_id: proposal.id, event_type: "undone", metadata: { recordId: parsed.data.recordId } });
    if (envelope) {
      await syncCaptureState(supabase, proposal, envelope.proposals.length);
    } else {
      await Promise.all([
        supabase.from("proposals").update({ status: "ready" }).eq("id", proposal.id),
        supabase.from("captures").update({ status: "needs_review" }).eq("id", proposal.capture_id),
      ]);
    }
    return NextResponse.json({ ok: true });
  }

  if (!envelope) return badRequest("This proposal cannot be applied. Retry it instead.");
  const itemIndex = parsed.data.proposalIndex;
  const proposed = envelope.proposals[itemIndex];
  if (!proposed) return badRequest("Proposal item not found.");
  const item = parsed.data.edited ?? proposed;

  /* The model's own date never reaches a record on its own. An edited accept carries what
     the user confirmed in review; an unedited one is re-resolved here against the
     account's local today, and anything the resolver could not settle — an ambiguous
     phrase, a date with no words behind it, a repeat Slipwell cannot express — is left off
     the record rather than guessed at. */
  const dateColumns = parsed.data.edited
    ? filedDateColumns(parsed.data.edited)
    : await (async () => {
        const { data: preferences } = await supabase.from("user_preferences").select("timezone").maybeSingle();
        const today = localToday(new Date(), preferences?.timezone ?? DEFAULT_TIMEZONE);
        const resolvedDate = resolveProposalDate(proposed, today);
        return filedDateColumns({
          dateKind: resolvedDate.kind,
          date: acceptedDate(resolvedDate),
          time: proposed.time,
          recurrenceRule: acceptedRecurrence(resolveProposalRecurrence(proposed.recurrence, resolvedDate)),
        });
      })();

  /* Destinations are resolved before the item is claimed, so a rejected identifier leaves
     the item reviewable instead of burning its one outcome. Ownership of every chosen
     domain, project, and person is proved here: the record foreign keys do not check who
     owns the row they point at. */
  const destinationResult = await applyDestinationSelection(supabase, parsed.data.edited?.destination);
  if (!destinationResult.ok) return badRequest(destinationResult.message);
  const destination = destinationResult.destination;

  /* Claim the item before creating anything. The unique (proposal_id, item_index) index
     is what makes a duplicate apply impossible under retry, double submission, or two
     open tabs — the client's disabled button is not the guarantee. */
  const { data: application, error: claimError } = await supabase
    .from("proposal_applications")
    .insert({ proposal_id: proposal.id, item_index: itemIndex, outcome: "filed", record_type: item.recordType })
    .select("id")
    .single();
  if (claimError?.code === "23505") {
    const { data: existing } = await supabase
      .from("proposal_applications")
      .select("record_id")
      .eq("proposal_id", proposal.id)
      .eq("item_index", itemIndex)
      .maybeSingle();
    return NextResponse.json({ ok: true, recordId: existing?.record_id ?? null, alreadyApplied: true });
  }
  if (claimError || !application) return serverError();

  /* A retainer update has no canonical home yet (Step 6), so it still lands in
     `prototype_records`, which carries only a destination label. */
  const prototypeDestinationName =
    proposed.destination?.projectName ?? proposed.destination?.personName ?? proposed.destination?.domainName ?? null;

  const insert = item.recordType === "task"
    ? supabase.from("tasks").insert({ proposal_id: proposal.id, source_capture_id: proposal.capture_id, title: item.title, details: item.body ?? null, ...dateColumns, domain_id: destination.domainId, project_id: destination.projectId, person_id: destination.personId }).select("id").single()
    /* A note has no deadline; a date on one is when it comes back for review. */
    : item.recordType === "note"
      ? supabase.from("notes").insert({ proposal_id: proposal.id, source_capture_id: proposal.capture_id, title: item.title, body: item.body ?? null, review_on: dateColumns.due_on ?? dateColumns.scheduled_for, domain_id: destination.domainId, project_id: destination.projectId, person_id: destination.personId }).select("id").single()
      : supabase.from("prototype_records").insert({ proposal_id: proposal.id, record_type: item.recordType, title: item.title, body: item.body ?? null, destination_name: prototypeDestinationName, due_on: dateColumns.due_on ?? dateColumns.scheduled_for, due_time: dateColumns.due_time }).select("id").single();
  const { data: record, error: recordError } = await insert;
  if (recordError || !record) {
    // Release the claim so the item can be filed again rather than looking resolved.
    await supabase.from("proposal_applications").delete().eq("id", application.id);
    return serverError();
  }

  const wasEdited = Boolean(parsed.data.edited);
  await Promise.all([
    supabase.from("proposal_applications").update({ record_id: record.id }).eq("id", application.id),
    supabase.from("activity_events").insert({
      entity_type: "proposal",
      entity_id: proposal.id,
      event_type: wasEdited ? "corrected" : "accepted",
      /* Identifiers and shape only — never the title or body of what was filed. */
      metadata: {
        recordId: record.id,
        proposalIndex: itemIndex,
        routedTo: {
          domain: Boolean(destination.domainId),
          project: Boolean(destination.projectId),
          person: Boolean(destination.personId),
        },
      },
    }),
  ]);
  const status = await syncCaptureState(supabase, proposal, envelope.proposals.length);
  return NextResponse.json({ ok: true, recordId: record.id, captureStatus: status });
}
