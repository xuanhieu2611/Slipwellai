import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { applyDestinationSelection } from "@/lib/proposals/catalog";
import { fileManuallySchema, parseProposalEnvelope } from "@/lib/proposals/schema";
import { requireUser } from "@/lib/supabase/server";

/* Filing without AI. A capture must never depend on the proposal service to become a
   usable record, so this route files the stored words directly when interpretation is
   unavailable, has failed, or simply is not wanted. */
export async function POST(request: NextRequest, context: { params: Promise<{ captureId: string }> }) {
  const { captureId } = await context.params;
  const parsed = fileManuallySchema.safeParse(await request.json());
  if (!parsed.success) return badRequest("Give the record a title of up to 280 characters.");
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const { data: capture } = await supabase.from("captures").select("id, status").eq("id", captureId).maybeSingle();
  if (!capture) return badRequest("That capture was not found.");

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, status, proposal_json")
    .eq("capture_id", captureId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  /* A live proposal may hold several intents. Filing over it would close the capture and
     take the unreviewed ones with it, so route the user back to review instead. */
  if (proposal?.status === "ready" && parseProposalEnvelope(proposal.proposal_json)) {
    return badRequest("This capture already has a proposal. Accept, edit, or dismiss it in review instead.");
  }

  /* Resolved before the capture is claimed so a rejected destination leaves the capture
     filable rather than stuck. Ownership of each identifier is proved here. */
  const destinationResult = await applyDestinationSelection(supabase, parsed.data.destination);
  if (!destinationResult.ok) return badRequest(destinationResult.message);
  const destination = destinationResult.destination;

  // Conditional claim: a double submission finds the capture already filed and stops.
  const { data: claimed } = await supabase
    .from("captures")
    .update({ status: "filed" })
    .eq("id", captureId)
    .in("status", ["queued", "interpreting", "needs_review", "failed"])
    .select("id")
    .maybeSingle();
  if (!claimed) return badRequest("This capture has already been filed or discarded.");

  const item = parsed.data;
  const insert = item.recordType === "task"
    ? supabase.from("tasks").insert({ source_capture_id: captureId, title: item.title, details: item.body ?? null, due_on: item.dueOn ?? null, due_time: item.dueTime ?? null, domain_id: destination.domainId, project_id: destination.projectId, person_id: destination.personId }).select("id").single()
    : supabase.from("notes").insert({ source_capture_id: captureId, title: item.title, body: item.body ?? null, domain_id: destination.domainId, project_id: destination.projectId, person_id: destination.personId }).select("id").single();
  const { data: record, error: recordError } = await insert;
  if (recordError || !record) {
    // Give the capture back so it stays actionable rather than looking filed with nothing behind it.
    await supabase.from("captures").update({ status: capture.status }).eq("id", captureId);
    return serverError();
  }

  await Promise.all([
    proposal && proposal.status !== "accepted"
      ? supabase.from("proposals").update({ status: "superseded" }).eq("id", proposal.id)
      : Promise.resolve(),
    supabase.from("activity_events").insert({
      entity_type: "capture",
      entity_id: captureId,
      event_type: "manually_filed",
      metadata: { recordId: record.id, recordType: item.recordType },
    }),
  ]);

  return NextResponse.json({ ok: true, recordId: record.id, recordType: item.recordType });
}
