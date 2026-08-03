import { NextRequest, NextResponse } from "next/server";
import { interpretCapture } from "@/lib/captures";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { proposalActionSchema, proposalEnvelopeSchema } from "@/lib/proposals/schema";
import { requireUser } from "@/lib/supabase/server";

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
    const { data: capture } = await supabase.from("captures").select("id, original_text, transcript_text").eq("id", proposal.capture_id).single();
    if (!capture) return badRequest("Original capture not found.");
    const sourceText = capture.original_text ?? capture.transcript_text;
    if (!sourceText) return badRequest("This voice capture has no transcript yet. Retry transcription instead.");
    await supabase.from("proposals").update({ status: "superseded" }).eq("id", proposal.id);
    const result = await interpretCapture({ supabase, capture: { id: capture.id, original_text: sourceText } });
    return NextResponse.json({ ok: true, warning: result.error });
  }

  if (parsed.data.action === "undo") {
    if (!parsed.data.recordId) return badRequest("Choose the accepted record to undo.");
    const [taskResult, noteResult, prototypeResult] = await Promise.all([
      supabase.from("tasks").delete().eq("id", parsed.data.recordId).eq("proposal_id", proposal.id),
      supabase.from("notes").delete().eq("id", parsed.data.recordId).eq("proposal_id", proposal.id),
      supabase.from("prototype_records").delete().eq("id", parsed.data.recordId).eq("proposal_id", proposal.id),
    ]);
    if (taskResult.error || noteResult.error || prototypeResult.error) return serverError();
    await Promise.all([
      supabase.from("proposals").update({ status: "ready" }).eq("id", proposal.id),
      supabase.from("captures").update({ status: "needs_review" }).eq("id", proposal.capture_id),
      supabase.from("activity_events").insert({ entity_type: "proposal", entity_id: proposal.id, event_type: "undone", metadata: { recordId: parsed.data.recordId } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const envelope = proposalEnvelopeSchema.safeParse(proposal.proposal_json);
  if (!envelope.success) return badRequest("This proposal cannot be applied. Retry it instead.");
  const item = parsed.data.edited ?? envelope.data.proposals[parsed.data.proposalIndex];
  if (!item) return badRequest("Proposal item not found.");
  const insert = item.recordType === "task"
    ? supabase.from("tasks").insert({ proposal_id: proposal.id, source_capture_id: proposal.capture_id, title: item.title, details: item.body ?? null, due_on: item.dueOn ?? null }).select("id").single()
    : item.recordType === "note"
      ? supabase.from("notes").insert({ proposal_id: proposal.id, source_capture_id: proposal.capture_id, title: item.title, body: item.body ?? null }).select("id").single()
      : supabase.from("prototype_records").insert({ proposal_id: proposal.id, record_type: item.recordType, title: item.title, body: item.body ?? null, destination_name: item.destinationName ?? null, due_on: item.dueOn ?? null }).select("id").single();
  const { data: record, error: recordError } = await insert;
  if (recordError || !record) return serverError();
  const wasEdited = Boolean(parsed.data.edited);
  await Promise.all([
    supabase.from("proposals").update({ status: "accepted" }).eq("id", proposal.id),
    supabase.from("captures").update({ status: "filed" }).eq("id", proposal.capture_id),
    supabase.from("activity_events").insert({
      entity_type: "proposal",
      entity_id: proposal.id,
      event_type: wasEdited ? "corrected" : "accepted",
      metadata: { recordId: record.id },
    }),
  ]);
  return NextResponse.json({ ok: true, recordId: record.id });
}
