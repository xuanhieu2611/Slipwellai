"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { proposalEnvelopeSchema } from "@/lib/proposals/schema";
import { nextCycleMonth } from "@/lib/retainers";
import type { DashboardData } from "@/lib/dashboard";

const control = "rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-50";

async function post(path: string, body: unknown) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data: unknown = await response.json();
  if (!response.ok) throw new Error(typeof data === "object" && data && "error" in data ? String(data.error) : "Request failed.");
  return data;
}

function Pill({ children, warning = false }: { children: React.ReactNode; warning?: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${warning ? "bg-[#fff0d6] text-[#8a5200]" : "bg-[var(--moss-light)] text-[#174b37]"}`}>{children}</span>;
}

function Composer({ done, focusOnLoad }: { done: () => void; focusOnLoad: boolean }) {
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (focusOnLoad) inputRef.current?.focus();
  }, [focusOnLoad]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await post("/api/captures", { text, idempotencyKey: crypto.randomUUID() }); setText(""); done(); } catch (error) { setMessage(error instanceof Error ? error.message : "Capture failed."); setBusy(false); }
  }
  return <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-[var(--moss)]">Universal capture</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">What needs a place?</h2></div><Pill>Review-first</Pill></div><form className="mt-5" onSubmit={submit}><label className="sr-only" htmlFor="capture">Capture text</label><textarea ref={inputRef} id="capture" required maxLength={10000} value={text} onChange={(event) => setText(event.target.value)} className="min-h-28 w-full rounded-xl border border-[var(--line)] bg-[#fbfbf8] p-4 outline-none focus:border-[var(--moss)] focus:ring-4 focus:ring-[var(--moss-light)]" placeholder="For Acme, send July analytics by Friday…" /><div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-[var(--ink-muted)]">Original words are stored before AI runs.</p><button disabled={busy || !text.trim()} className={`${control} bg-[var(--moss)] text-white hover:bg-[#174b37]`} type="submit">{busy ? "Interpreting…" : "Create proposal"}</button></div></form>{message && <p role="alert" className="mt-3 text-sm text-[#9b2c17]">{message}</p>}</section>;
}

function Review({ capture, done }: { capture: DashboardData["captures"][number]; done: () => void }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [title, setTitle] = useState(""); const [recordType, setRecordType] = useState(""); const [destination, setDestination] = useState("");
  const parsed = capture.proposal ? proposalEnvelopeSchema.safeParse(capture.proposal.proposal_json) : null;
  const item = parsed?.success ? parsed.data.proposals[0] : null;
  if (capture.status !== "needs_review") return null;
  async function action(action: "accept" | "retry" | "discard") { if (!capture.proposal) return; setBusy(true); try { await post(`/api/proposals/${capture.proposal.id}`, action === "accept" && item ? { action, proposalIndex: 0, edited: { recordType: recordType || item.recordType, title: title || item.title, body: item.body, destinationName: destination || item.destinationName, dueOn: item.dueOn } } : { action }); done(); } catch (error) { setMessage(error instanceof Error ? error.message : "Action failed."); setBusy(false); } }
  return <article className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h3 className="font-semibold">Review capture</h3><Pill warning>Needs review</Pill></div><blockquote className="mt-4 border-l-2 border-[var(--moss)] pl-3 text-sm leading-6">{capture.original_text}</blockquote>{item ? <div className="mt-4 rounded-xl bg-[#f6f8f4] p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold capitalize">{item.recordType.replace("_", " ")}: {item.title}</p><p className="mt-1 text-sm text-[var(--ink-muted)]">{item.reason}</p></div><Pill>{Math.round(item.confidence.title * 100)}% title</Pill></div><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_130px]"><input aria-label="Proposal title" value={title || item.title} onChange={(event) => setTitle(event.target.value)} className="h-10 rounded-lg border border-[var(--line)] bg-white px-3 text-sm" /><select aria-label="Proposal record type" value={recordType || item.recordType} onChange={(event) => setRecordType(event.target.value)} className="h-10 rounded-lg border border-[var(--line)] bg-white px-3 text-sm"><option value="task">Task</option><option value="note">Note</option><option value="retainer_update">Retainer update</option></select><input aria-label="Proposal destination" value={destination || item.destinationName || ""} onChange={(event) => setDestination(event.target.value)} className="h-10 rounded-lg border border-[var(--line)] bg-white px-3 text-sm sm:col-span-2" placeholder="Optional destination" /></div><div className="mt-3 flex flex-wrap gap-2"><button disabled={busy} onClick={() => action("accept")} className={`${control} bg-[var(--moss)] text-white`}>Accept changes</button><button disabled={busy} onClick={() => action("retry")} className={`${control} border border-[var(--line)]`}>Retry</button><button disabled={busy} onClick={() => action("discard")} className={`${control} text-[#9b2c17]`}>Discard</button></div></div> : <div className="mt-4 rounded-xl bg-[#fff0d6] p-4"><p className="text-sm text-[#8a5200]">The proposal service did not return a safe result. Your source capture is preserved.</p>{capture.proposal && <button disabled={busy} onClick={() => action("retry")} className={`${control} mt-3 border border-[#e7c48b] text-[#8a5200]`}>Retry proposal</button>}</div>}{message && <p role="alert" className="mt-3 text-sm text-[#9b2c17]">{message}</p>}</article>;
}

function RetainerLab({ data, done }: { data: DashboardData; done: () => void }) {
  const [name, setName] = useState("");
  const [deliverable, setDeliverable] = useState("");
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [message, setMessage] = useState("");
  const cycleById = new Map(data.cycles.map((cycle) => [cycle.id, cycle]));
  const itemById = new Map(data.cycleItems.map((item) => [item.id, item]));

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await post("/api/retainers", { name, deliverableTitle: deliverable, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Vancouver", cycleDay: 1, expectedDay: 15 });
      setName("");
      setDeliverable("");
      done();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create the retainer.");
      setBusy(false);
    }
  }

  async function cycle(retainerId: string, cycleMonth: string) {
    setBusy(true);
    setMessage("");
    try {
      await post(`/api/retainers/${retainerId}/cycles`, { cycleMonth });
      done();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not generate the cycle.");
      setBusy(false);
    }
  }

  async function slipping(retainerId: string) {
    setBusy(true);
    setMessage("");
    try {
      await post("/api/slipping/evaluate", { retainerId });
      done();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not check Slipping.");
      setBusy(false);
    }
  }

  return <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-[var(--moss)]">Retainer lab</p><h2 className="mt-1 text-xl font-semibold">Rollover with a memory</h2><p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">Cycle generation is idempotent. Incomplete work carries into the next cycle with a visible link back.</p><form className="mt-4 grid gap-2" onSubmit={create}><input required value={name} onChange={(event) => setName(event.target.value)} className="h-10 rounded-lg border border-[var(--line)] px-3 text-sm" placeholder="Acme monthly retainer" /><input required value={deliverable} onChange={(event) => setDeliverable(event.target.value)} className="h-10 rounded-lg border border-[var(--line)] px-3 text-sm" placeholder="Monthly analytics" /><button disabled={busy} className={`${control} bg-[#1d2823] text-white`} type="submit">Create retainer</button></form><div className="mt-5 space-y-3">{data.retainers.map((retainer) => { const cycles = data.cycles.filter((cycleData) => cycleData.retainer_id === retainer.id); const latestCycle = cycles[0]; return <article className="rounded-xl border border-[var(--line)] p-4" key={retainer.id}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{retainer.name}</p><p className="text-xs text-[var(--ink-muted)]">Monthly on day {retainer.cycle_day}</p></div><div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[minmax(0,1fr)_auto_auto]"><label className="sr-only" htmlFor={`cycle-month-${retainer.id}`}>Cycle month</label><input id={`cycle-month-${retainer.id}`} type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="h-10 min-w-0 rounded-lg border border-[var(--line)] bg-white px-3 text-sm" /><button type="button" disabled={busy} onClick={() => cycle(retainer.id, month)} className={`${control} border border-[var(--line)]`}>Generate selected</button><button type="button" disabled={busy} onClick={() => cycle(retainer.id, nextCycleMonth(month))} className={`${control} border border-[var(--line)]`}>Generate next</button></div></div><button type="button" disabled={busy || !latestCycle} onClick={() => slipping(retainer.id)} className={`${control} mt-3 bg-[#fff0d6] text-[#8a5200]`}>Check Slipping</button>{cycles.length > 0 && <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-3"><p className="text-sm font-semibold">Cycle history</p>{cycles.map((cycleData) => <section id={`cycle-${cycleData.id}`} className="rounded-lg bg-[#f6f8f4] p-3" key={cycleData.id}><p className="text-sm font-medium">{cycleData.cycle_start} to {cycleData.cycle_end}</p><ul className="mt-2 space-y-2">{data.cycleItems.filter((item) => item.cycle_id === cycleData.id).map((item) => { const sourceItem = item.carried_from_item_id ? itemById.get(item.carried_from_item_id) : undefined; const sourceCycle = sourceItem ? cycleById.get(sourceItem.cycle_id) : undefined; return <li id={`cycle-${cycleData.id}-item-${item.id}`} className="flex flex-wrap items-center justify-between gap-2 text-sm" key={item.id}><span>{item.title}{sourceItem && sourceCycle && <a className="ml-2 text-xs font-semibold text-[var(--moss)] underline" href={`#cycle-${sourceCycle.id}-item-${sourceItem.id}`}>Carried from {sourceCycle.cycle_start}</a>}</span><Pill warning={item.status === "open"}>{item.status}</Pill></li>; })}</ul></section>)}</div>}</article>; })}{data.retainers.length === 0 && <p className="rounded-xl bg-[#f6f8f4] p-3 text-sm text-[var(--ink-muted)]">Create a small test retainer to explore its lifecycle.</p>}</div>{message && <p role="alert" className="mt-3 text-sm text-[#9b2c17]">{message}</p>}</section>;
}

export function Dashboard({ data, email }: { data: DashboardData; email: string }) {
  const [refreshing, setRefreshing] = useState(false); const refresh = () => { setRefreshing(true); window.location.reload(); };
  const searchParams = useSearchParams();
  async function resolveSignal(id: string, outcome: "marked_attention" | "deferred" | "dismissed") { await post(`/api/slipping/${id}`, { outcome }); refresh(); }
  async function undoRecord(record: DashboardData["records"][number]) { if (!record.proposal_id) return; await post(`/api/proposals/${record.proposal_id}`, { action: "undo", recordId: record.id }); refresh(); }
  async function signOut() { await createSupabaseBrowserClient().auth.signOut(); window.location.assign("/"); }
  return <div className="mx-auto max-w-6xl px-4 py-6 sm:px-7 sm:py-8"><header className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold tracking-[0.16em] text-[var(--moss)] uppercase">Inbox / Phase 0 validation</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Nothing important slips through.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">This is the active pilot loop for capture, review, retainer rollover, and Slipping while production record models are built.</p></div><div className="flex items-center gap-3"><span className="hidden text-sm text-[var(--ink-muted)] sm:block">{email}</span><button onClick={signOut} className={`${control} border border-[var(--line)] bg-white`}>Sign out</button></div></header><div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]"><div className="space-y-5"><Composer done={refresh} focusOnLoad={searchParams.get("compose") === "1"} /><section><div className="mb-3 flex justify-between"><h2 className="text-lg font-semibold">Review inbox</h2><span className="text-sm text-[var(--ink-muted)]">{refreshing ? "Refreshing…" : "Originals stay in reach"}</span></div><div className="space-y-3">{data.captures.map((capture) => <Review key={capture.id} capture={capture} done={refresh} />)}{data.captures.filter((capture) => capture.status === "needs_review").length === 0 && <p className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-6 text-sm text-[var(--ink-muted)]">Your review inbox is calm.</p>}</div></section></div><aside className="space-y-5"><section className="rounded-2xl bg-[#1d2823] p-5 text-white"><p className="text-sm font-semibold text-[#c9e3cd]">Slipping</p><h2 className="mt-1 text-xl font-semibold">Attention, not shame.</h2><p className="mt-2 text-sm leading-6 text-[#cad3cd]">Each signal explains what needs attention and gives you an intentional next step.</p><div className="mt-4 space-y-3">{data.signals.map((signal) => <article className="rounded-xl bg-white/10 p-3" key={signal.id}><Pill warning>{signal.severity}</Pill><p className="mt-2 text-sm leading-5">{signal.reason}</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => resolveSignal(signal.id, "marked_attention")} className={`${control} bg-white text-[#174b37]`}>Mark attention</button><button onClick={() => resolveSignal(signal.id, "deferred")} className={`${control} border border-white/30`}>Defer</button><button onClick={() => resolveSignal(signal.id, "dismissed")} className={`${control} text-[#d9e0db]`}>Dismiss</button></div></article>)}{data.signals.length === 0 && <p className="rounded-xl bg-white/10 p-3 text-sm text-[#d9e0db]">No active signals. Generate a cycle with an overdue open deliverable to test one.</p>}</div></section><RetainerLab data={data} done={refresh} /><section className="rounded-2xl border border-[var(--line)] bg-white p-5"><h2 className="font-semibold">Recently filed</h2><ul className="mt-3 space-y-3">{data.records.map((record) => <li key={record.id} className="flex items-start justify-between gap-3 text-sm"><div><p className="font-medium">{record.title}</p><p className="text-xs text-[var(--ink-muted)]">{record.record_type.replace("_", " ")}{record.destination_name ? ` · ${record.destination_name}` : ""}</p></div>{record.proposal_id && <button onClick={() => undoRecord(record)} className={`${control} border border-[var(--line)] text-xs`}>Undo</button>}</li>)}{data.records.length === 0 && <li className="text-sm text-[var(--ink-muted)]">Accepted proposals appear here.</li>}</ul></section></aside></div></div>;
}
