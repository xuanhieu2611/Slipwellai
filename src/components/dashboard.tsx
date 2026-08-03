"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { proposalEnvelopeSchema } from "@/lib/proposals/schema";
import { nextCycleMonth } from "@/lib/retainers";
import type { DashboardData } from "@/lib/dashboard";
import { validateVoiceCapture } from "@/lib/voice";

const control = "rounded-md px-3 py-2 text-sm font-semibold transition disabled:opacity-50";

async function post(path: string, body: unknown) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data: unknown = await response.json();
  if (!response.ok) throw new Error(typeof data === "object" && data && "error" in data ? String(data.error) : "Request failed.");
  return data;
}

function Pill({ children, warning = false }: { children: React.ReactNode; warning?: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${warning ? "bg-[var(--attention-soft)] text-[var(--attention)]" : "bg-[var(--accent-soft)] text-[var(--accent-ink)]"}`}>{children}</span>;
}

function VoiceRecorder({ done }: { done: () => void }) {
  const [capability, setCapability] = useState<"checking" | "ready" | "unsupported">("checking");
  const [permission, setPermission] = useState("unknown");
  const [state, setState] = useState<"idle" | "recording" | "paused" | "transcribing" | "failed">("idle");
  const [message, setMessage] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const supported = typeof window !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== "undefined";
    const timer = window.setTimeout(() => setCapability(supported ? "ready" : "unsupported"), 0);
    if (!supported || !navigator.permissions?.query) return () => window.clearTimeout(timer);
    void navigator.permissions.query({ name: "microphone" as PermissionName }).then((result) => {
      setPermission(result.state);
      result.onchange = () => setPermission(result.state);
    }).catch(() => setPermission("unknown"));
    return () => window.clearTimeout(timer);
  }, []);

  async function transcribe(audio: Blob, durationMs: number) {
    const validated = validateVoiceCapture({ mimeType: audio.type, byteSize: audio.size, durationMs });
    if (!validated.ok) { setState("failed"); setMessage(validated.error); return; }
    setState("transcribing");
    setMessage("");
    try {
      idempotencyKeyRef.current ??= crypto.randomUUID();
      const formData = new FormData();
      formData.set("audio", new Blob([audio], { type: validated.mimeType }), "capture.webm");
      formData.set("durationMs", String(durationMs));
      formData.set("idempotencyKey", idempotencyKeyRef.current);
      const response = await fetch("/api/voice-captures", { method: "POST", body: formData });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "Voice transcription failed. Please use text capture instead.");
      idempotencyKeyRef.current = null;
      setState("idle");
      done();
    } catch (error) {
      idempotencyKeyRef.current = null;
      setState("failed");
      setMessage(error instanceof Error ? error.message : "Voice transcription failed. Please use text capture instead.");
    }
  }

  async function begin() {
    if (capability !== "ready") return;
    setMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const candidates = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"];
      const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        void transcribe(audio, Date.now() - startedAtRef.current);
      };
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setState("recording");
    } catch (error) {
      setPermission("denied");
      setState("failed");
      setMessage(error instanceof DOMException && error.name === "NotAllowedError" ? "Microphone access was denied. You can still use text capture." : "Slipwell could not start the microphone. You can still use text capture.");
    }
  }

  function pauseOrResume() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") { recorder.pause(); setState("paused"); }
    else if (recorder.state === "paused") { recorder.resume(); setState("recording"); }
  }

  function stop() { recorderRef.current?.stop(); }

  if (capability === "unsupported") return <p className="text-sm text-[var(--ink-muted)]">Voice capture is unavailable in this browser. Text capture is always available.</p>;

  const canRecord = state === "idle" || state === "failed";
  return <div className="flex flex-col items-center gap-3 py-2 text-center">
    {state !== "recording" && state !== "paused" && <button type="button" disabled={capability !== "ready" || !canRecord} onClick={begin} className={`${control} h-14 rounded-full bg-[var(--accent)] px-8 text-base text-[var(--accent-on)] hover:bg-[var(--accent-hover)] disabled:hover:bg-[var(--accent)]`}>
      {state === "transcribing" ? <span className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--accent-on)]/35 border-t-[var(--accent-on)]" aria-hidden="true" />Transcribing…</span> : "Record voice"}
    </button>}
    {(state === "recording" || state === "paused") && <div className="flex items-center gap-3">
      <span className="flex items-center gap-2 text-sm font-medium text-[var(--danger)]"><span className={`h-2.5 w-2.5 rounded-full bg-[var(--danger)] ${state === "recording" ? "animate-pulse" : ""}`} aria-hidden="true" />{state === "paused" ? "Paused" : "Recording"}</span>
      <button type="button" onClick={pauseOrResume} className={`${control} border border-[var(--line)] bg-[var(--surface)]`}>{state === "paused" ? "Resume" : "Pause"}</button>
      <button type="button" onClick={stop} className={`${control} h-14 rounded-full bg-[var(--accent)] px-8 text-base text-[var(--accent-on)] hover:bg-[var(--accent-hover)]`}>Done</button>
    </div>}
    <p className="text-xs text-[var(--ink-muted)]">{permission === "denied" ? "Microphone access is blocked" : state === "recording" ? "Recording, click Done when you're finished." : state === "transcribing" ? "Turning your words into an inbox item…" : "One click. Speak. It lands in review, transcribed."}</p>
    {message && <p role="alert" className="text-sm text-[var(--danger)]">{message}</p>}
  </div>;
}

function Composer({ done, focusOnLoad }: { done: () => void; focusOnLoad: boolean }) {
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const [showText, setShowText] = useState(focusOnLoad);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (focusOnLoad) inputRef.current?.focus();
  }, [focusOnLoad]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await post("/api/captures", { text, idempotencyKey: crypto.randomUUID() }); setText(""); done(); } catch (error) { setMessage(error instanceof Error ? error.message : "Capture failed."); setBusy(false); }
  }
  return <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
    <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-[var(--accent)]">Universal capture</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">What needs a place?</h2></div><Pill>Review-first</Pill></div>
    <div className="mt-5 rounded-md bg-[var(--surface-sunken)] p-4"><VoiceRecorder done={done} /></div>
    <div className="mt-4 flex items-center gap-3"><div className="h-px flex-1 bg-[var(--line)]" /><button type="button" onClick={() => setShowText((value) => !value)} className="text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--accent)]">{showText ? "Hide text capture" : "Type it instead"}</button><div className="h-px flex-1 bg-[var(--line)]" /></div>
    {showText && <form className="mt-4" onSubmit={submit}><label className="sr-only" htmlFor="capture">Capture text</label><textarea ref={inputRef} id="capture" required maxLength={10000} value={text} onChange={(event) => setText(event.target.value)} className="min-h-20 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] p-4 text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]" placeholder="Send Rivera Studio the July analytics by Friday…" /><div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-[var(--ink-muted)]">Original words are stored before AI runs.</p><button disabled={busy || !text.trim()} className={`${control} border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)] hover:text-[var(--accent)]`} type="submit">{busy ? "Interpreting…" : "Create proposal"}</button></div></form>}
    {message && <p role="alert" className="mt-3 text-sm text-[var(--danger)]">{message}</p>}
  </section>;
}

function Review({ capture, done }: { capture: DashboardData["captures"][number]; done: () => void }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [title, setTitle] = useState(""); const [recordType, setRecordType] = useState(""); const [destination, setDestination] = useState(""); const [dueOn, setDueOn] = useState(""); const [dueTime, setDueTime] = useState("");
  const parsed = capture.proposal ? proposalEnvelopeSchema.safeParse(capture.proposal.proposal_json) : null;
  const item = parsed?.success ? parsed.data.proposals[0] : null;
  if (capture.status !== "needs_review") return null;
  async function action(action: "accept" | "retry" | "discard") { if (!capture.proposal) return; setBusy(true); try { await post(`/api/proposals/${capture.proposal.id}`, action === "accept" && item ? { action, proposalIndex: 0, edited: { recordType: recordType || item.recordType, title: title || item.title, body: item.body, destinationName: destination || item.destinationName, dueOn: dueOn || item.dueOn, dueTime: (dueTime || item.dueTime) || undefined } } : { action }); done(); } catch (error) { setMessage(error instanceof Error ? error.message : "Action failed."); setBusy(false); } }
  return <article className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm"><div className="flex items-center justify-between"><h3 className="font-semibold">Review capture</h3><Pill warning>Needs review</Pill></div>{capture.source_type === "voice" && <p className="mt-4 text-sm font-medium text-[var(--ink-muted)]">Voice transcript (the recording was not saved)</p>}<blockquote className="mt-2 border-l-2 border-[var(--accent)] pl-3 text-sm leading-6">{capture.original_text}</blockquote>{item ? <div className="mt-4 rounded-md bg-[var(--surface-sunken)] p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold capitalize">{item.recordType.replace("_", " ")}: {item.title}</p><p className="mt-1 text-sm text-[var(--ink-muted)]">{item.reason}</p></div><Pill>{Math.round(item.confidence.title * 100)}% title</Pill></div><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_130px]"><input aria-label="Proposal title" value={title || item.title} onChange={(event) => setTitle(event.target.value)} className="h-10 rounded-sm border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]" /><select aria-label="Proposal record type" value={recordType || item.recordType} onChange={(event) => setRecordType(event.target.value)} className="h-10 rounded-sm border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]"><option value="task">Task</option><option value="note">Note</option><option value="retainer_update">Retainer update</option></select><input aria-label="Proposal destination" value={destination || item.destinationName || ""} onChange={(event) => setDestination(event.target.value)} className="h-10 rounded-sm border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] sm:col-span-2" placeholder="Optional destination" /><input aria-label="Due date" type="date" value={dueOn || item.dueOn || ""} onChange={(event) => setDueOn(event.target.value)} className="h-10 rounded-sm border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]" /><input aria-label="Due time" type="time" value={dueTime || item.dueTime || ""} onChange={(event) => setDueTime(event.target.value)} className="h-10 rounded-sm border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]" /></div><div className="mt-3 flex flex-wrap gap-2"><button disabled={busy} onClick={() => action("accept")} className={`${control} bg-[var(--accent)] text-[var(--accent-on)]`}>Accept changes</button><button disabled={busy} onClick={() => action("retry")} className={`${control} border border-[var(--line)]`}>Retry</button><button disabled={busy} onClick={() => action("discard")} className={`${control} text-[var(--danger)]`}>Discard</button></div></div> : <div className="mt-4 rounded-md bg-[var(--attention-soft)] p-4"><p className="text-sm text-[var(--attention)]">The proposal service did not return a safe result. Your source capture is preserved.</p>{capture.proposal && <button disabled={busy} onClick={() => action("retry")} className={`${control} mt-3 border border-[var(--attention-line)] text-[var(--attention)]`}>Retry proposal</button>}</div>}{message && <p role="alert" className="mt-3 text-sm text-[var(--danger)]">{message}</p>}</article>;
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

  return <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm"><p className="text-sm font-semibold text-[var(--accent)]">Retainer lab</p><h2 className="mt-1 text-xl font-semibold">Rollover with a memory</h2><p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">Cycle generation is idempotent. Incomplete work carries into the next cycle with a visible link back.</p><form className="mt-4 grid gap-2" onSubmit={create}><input required value={name} onChange={(event) => setName(event.target.value)} className="h-10 rounded-sm border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]" placeholder="Rivera Studio monthly retainer" /><input required value={deliverable} onChange={(event) => setDeliverable(event.target.value)} className="h-10 rounded-sm border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]" placeholder="Monthly analytics" /><button disabled={busy} className={`${control} bg-[var(--accent)] text-[var(--accent-on)] hover:bg-[var(--accent-hover)]`} type="submit">Create retainer</button></form><div className="mt-5 space-y-3">{data.retainers.map((retainer) => { const cycles = data.cycles.filter((cycleData) => cycleData.retainer_id === retainer.id); const latestCycle = cycles[0]; return <article className="rounded-md border border-[var(--line)] p-4" key={retainer.id}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{retainer.name}</p><p className="text-xs text-[var(--ink-muted)]">Monthly on day {retainer.cycle_day}</p></div><div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[minmax(0,1fr)_auto_auto]"><label className="sr-only" htmlFor={`cycle-month-${retainer.id}`}>Cycle month</label><input id={`cycle-month-${retainer.id}`} type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="h-10 min-w-0 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" /><button type="button" disabled={busy} onClick={() => cycle(retainer.id, month)} className={`${control} border border-[var(--line)]`}>Generate selected</button><button type="button" disabled={busy} onClick={() => cycle(retainer.id, nextCycleMonth(month))} className={`${control} border border-[var(--line)]`}>Generate next</button></div></div><button type="button" disabled={busy || !latestCycle} onClick={() => slipping(retainer.id)} className={`${control} mt-3 bg-[var(--attention-soft)] text-[var(--attention)]`}>Check Slipping</button>{cycles.length > 0 && <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-3"><p className="text-sm font-semibold">Cycle history</p>{cycles.map((cycleData) => <section id={`cycle-${cycleData.id}`} className="rounded-lg bg-[var(--surface-sunken)] p-3" key={cycleData.id}><p className="text-sm font-medium">{cycleData.cycle_start} to {cycleData.cycle_end}</p><ul className="mt-2 space-y-2">{data.cycleItems.filter((item) => item.cycle_id === cycleData.id).map((item) => { const sourceItem = item.carried_from_item_id ? itemById.get(item.carried_from_item_id) : undefined; const sourceCycle = sourceItem ? cycleById.get(sourceItem.cycle_id) : undefined; return <li id={`cycle-${cycleData.id}-item-${item.id}`} className="flex flex-wrap items-center justify-between gap-2 text-sm" key={item.id}><span>{item.title}{sourceItem && sourceCycle && <a className="ml-2 text-xs font-semibold text-[var(--accent)] underline" href={`#cycle-${sourceCycle.id}-item-${sourceItem.id}`}>Carried from {sourceCycle.cycle_start}</a>}</span><Pill warning={item.status === "open"}>{item.status}</Pill></li>; })}</ul></section>)}</div>}</article>; })}{data.retainers.length === 0 && <p className="rounded-md bg-[var(--surface-sunken)] p-3 text-sm text-[var(--ink-muted)]">Create a small test retainer to explore its lifecycle.</p>}</div>{message && <p role="alert" className="mt-3 text-sm text-[var(--danger)]">{message}</p>}</section>;
}

export function Dashboard({ data, email }: { data: DashboardData; email: string }) {
  const [refreshing, setRefreshing] = useState(false); const refresh = () => { setRefreshing(true); window.location.reload(); };
  const searchParams = useSearchParams();
  async function resolveSignal(id: string, outcome: "marked_attention" | "deferred" | "dismissed") { await post(`/api/slipping/${id}`, { outcome }); refresh(); }
  async function undoRecord(record: DashboardData["records"][number]) { if (!record.proposal_id) return; await post(`/api/proposals/${record.proposal_id}`, { action: "undo", recordId: record.id }); refresh(); }
  async function signOut() { await createSupabaseBrowserClient().auth.signOut({ scope: "local" }); window.location.assign("/"); }
  return <div className="mx-auto max-w-6xl px-4 py-6 sm:px-7 sm:py-8"><header className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight">Nothing important slips through.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">This is the active pilot loop for capture, review, retainer rollover, and Slipping while production record models are built.</p></div><div className="flex items-center gap-3"><span className="hidden text-sm text-[var(--ink-muted)] sm:block">{email}</span><button onClick={signOut} className={`${control} border border-[var(--line)] bg-[var(--surface)]`}>Sign out</button></div></header><div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]"><div className="space-y-5"><Composer done={refresh} focusOnLoad={searchParams.get("compose") === "1"} /><section><div className="mb-3 flex justify-between"><h2 className="text-lg font-semibold">Review inbox</h2><span className="text-sm text-[var(--ink-muted)]">{refreshing ? "Refreshing…" : "Originals stay in reach"}</span></div><div className="space-y-3">{data.captures.map((capture) => <Review key={capture.id} capture={capture} done={refresh} />)}{data.captures.filter((capture) => capture.status === "needs_review").length === 0 && <p className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] p-6 text-sm text-[var(--ink-muted)]">Your review inbox is calm.</p>}</div></section></div><aside className="space-y-5"><section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"><p className="text-sm font-semibold text-[var(--accent)]">Slipping</p><h2 className="mt-1 text-xl font-semibold">Attention, not shame.</h2><p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">Each signal explains what needs attention and gives you an intentional next step.</p><div className="mt-4 space-y-3">{data.signals.map((signal) => <article className="rounded-md bg-[var(--surface-soft)] p-3" key={signal.id}><Pill warning>{signal.severity}</Pill><p className="mt-2 text-sm leading-5">{signal.reason}</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => resolveSignal(signal.id, "marked_attention")} className={`${control} bg-[var(--surface)] text-[var(--accent-ink)]`}>Mark attention</button><button onClick={() => resolveSignal(signal.id, "deferred")} className={`${control} border border-[var(--line-strong)]`}>Defer</button><button onClick={() => resolveSignal(signal.id, "dismissed")} className={`${control} text-[var(--ink-muted)]`}>Dismiss</button></div></article>)}{data.signals.length === 0 && <p className="rounded-md bg-[var(--surface-soft)] p-3 text-sm text-[var(--ink-muted)]">No active signals. Generate a cycle with an overdue open deliverable to test one.</p>}</div></section><RetainerLab data={data} done={refresh} /><section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"><h2 className="font-semibold">Recently filed</h2><ul className="mt-3 space-y-3">{data.records.map((record) => <li key={record.id} className="flex items-start justify-between gap-3 text-sm"><div><p className="font-medium">{record.title}</p><p className="text-xs text-[var(--ink-muted)]">{record.record_type.replace("_", " ")}{record.destination_name ? ` · ${record.destination_name}` : ""}</p></div>{record.proposal_id && <button onClick={() => undoRecord(record)} className={`${control} border border-[var(--line)] text-xs`}>Undo</button>}</li>)}{data.records.length === 0 && <li className="text-sm text-[var(--ink-muted)]">Accepted proposals appear here.</li>}</ul></section></aside></div></div>;
}
