"use client";

import { createContext, type FormEvent, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Microphone } from "@phosphor-icons/react";
import { validateVoiceCapture } from "@/lib/voice";
import { Button, Dialog, StatusMessage } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

async function post(path: string, body: unknown) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data: unknown = await response.json();
  if (!response.ok) throw new Error(typeof data === "object" && data && "error" in data ? String(data.error) : "Request failed.");
  return data;
}

function captureId(payload: unknown) {
  return typeof payload === "object" && payload && "captureId" in payload ? String(payload.captureId) : null;
}

/* The capture is already stored by the time this runs, so interpretation is deliberately
   fire-and-forget: if it never lands the Inbox shows the capture as waiting to be
   interpreted rather than losing it. */
function startInterpretation(id: string, onSettled: () => void) {
  void fetch(`/api/captures/${id}/interpret`, { method: "POST", keepalive: true })
    .catch(() => {})
    .finally(onSettled);
}

function VoiceRecorder({ onCaptured }: { onCaptured: (captureId: string | null) => void }) {
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
      onCaptured(captureId(payload));
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

  if (capability === "unsupported") return <p className="form-help">Voice capture is unavailable in this browser. Text capture is always available.</p>;

  const canRecord = state === "idle" || state === "failed";
  return <div className="flex flex-col items-center gap-3 py-2 text-center">
    {state !== "recording" && state !== "paused" && <Button disabled={capability !== "ready" || !canRecord} onClick={begin} className="button-primary h-14 rounded-full px-8 text-base">
      {state === "transcribing" ? <span className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--accent-on)]/35 border-t-[var(--accent-on)]" aria-hidden="true" />Transcribing…</span> : <><Microphone aria-hidden size={20} weight="fill" />Record voice</>}
    </Button>}
    {(state === "recording" || state === "paused") && <div className="flex items-center gap-3">
      <span className="flex items-center gap-2 text-sm font-medium text-[var(--danger)]"><span className={`h-2.5 w-2.5 rounded-full bg-[var(--danger)] ${state === "recording" ? "animate-pulse" : ""}`} aria-hidden="true" />{state === "paused" ? "Paused" : "Recording"}</span>
      <Button onClick={pauseOrResume} className="button-secondary">{state === "paused" ? "Resume" : "Pause"}</Button>
      <Button onClick={stop} className="button-primary h-14 rounded-full px-8 text-base">Done</Button>
    </div>}
    <p className="form-help">{permission === "denied" ? "Microphone access is blocked" : state === "recording" ? "Recording, click Done when you're finished." : state === "transcribing" ? "Turning your words into an inbox item…" : "One click. Speak. It lands in review, transcribed."}</p>
    {message && <StatusMessage tone="error">{message}</StatusMessage>}
  </div>;
}

const DRAFT_KEY = "slipwell.capture-draft";

type CaptureDraft = { text: string; idempotencyKey: string };

/* An unsent capture survives an offline submission, a refresh, and a closed tab. The
   idempotency key travels with the draft, so resending it converges on the one capture
   instead of creating a second. */
function readDraft(): CaptureDraft | null {
  try {
    const stored = window.localStorage.getItem(DRAFT_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || !parsed || !("text" in parsed) || !("idempotencyKey" in parsed)) return null;
    return { text: String(parsed.text), idempotencyKey: String(parsed.idempotencyKey) };
  } catch {
    return null;
  }
}

function writeDraft(draft: CaptureDraft | null) {
  try {
    if (draft) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // A blocked or full storage must not stop the capture itself.
  }
}

function CaptureForm({ onCaptured }: { onCaptured: (captureId: string | null) => void }) {
  /* Safe as initial state: the dialog only mounts on an interaction, so this never runs
     during server rendering or hydration. */
  const [saved] = useState(() => (typeof window === "undefined" ? null : readDraft()));
  const hasSavedDraft = Boolean(saved?.text.trim());
  const [text, setText] = useState(saved?.text ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showText, setShowText] = useState(hasSavedDraft);
  const [restored, setRestored] = useState(hasSavedDraft);
  const keyRef = useRef<string | null>(saved?.idempotencyKey ?? null);

  function onTextChange(value: string) {
    setText(value);
    setRestored(false);
    keyRef.current ??= crypto.randomUUID();
    writeDraft(value.trim() ? { text: value, idempotencyKey: keyRef.current } : null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const idempotencyKey = (keyRef.current ??= crypto.randomUUID());
    try {
      const payload = await post("/api/captures", { text, idempotencyKey });
      keyRef.current = null;
      writeDraft(null);
      setText("");
      onCaptured(captureId(payload));
    } catch (error) {
      // The draft and its key stay on disk, so this exact capture can be resent safely.
      setMessage(error instanceof Error ? error.message : "Capture failed.");
      setBusy(false);
    }
  }

  return <div>
    <p className="section-note">Your words are stored before any interpretation runs.</p>
    <div className="mt-3 rounded-[var(--r-md)] bg-[var(--surface-sunken)] p-4"><VoiceRecorder onCaptured={onCaptured} /></div>
    <div className="mt-4 flex items-center gap-3"><div className="h-px flex-1 bg-[var(--line)]" /><Button className="button-quiet" onClick={() => setShowText((value) => !value)}>{showText ? "Hide text capture" : "Type it instead"}</Button><div className="h-px flex-1 bg-[var(--line)]" /></div>
    {showText && <form className="mt-4" onSubmit={submit}>
      <label className="field-label" htmlFor="capture"><span>Capture text</span><textarea autoFocus className="field-base min-h-20" id="capture" required maxLength={10000} value={text} onChange={(event) => onTextChange(event.target.value)} placeholder="Send Rivera Studio the July analytics by Friday…" /></label>
      {restored && <p className="form-help">This capture was kept from your last unsent draft. Send it when you&apos;re ready.</p>}
      <div className="mt-3 flex justify-end"><Button className="button-primary" disabled={busy || !text.trim()} type="submit">{busy ? "Saving…" : "Capture it"}</Button></div>
    </form>}
    {message && <StatusMessage tone="error">{message}</StatusMessage>}
  </div>;
}

type CaptureContextValue = { open: () => void; close: () => void };

const CaptureContext = createContext<CaptureContextValue | null>(null);

export function CaptureProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const notify = useToast();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const onCaptured = useCallback((id: string | null) => {
    setIsOpen(false);
    notify("Captured. Review it in your inbox.", "success");
    router.refresh();
    // Interpretation runs after the acknowledgement; refresh again once it lands.
    if (id) startInterpretation(id, () => router.refresh());
  }, [notify, router]);

  return (
    <CaptureContext.Provider value={{ open, close }}>
      {children}
      <Dialog open={isOpen} title="What needs a place?" onClose={close}>
        {isOpen ? <CaptureForm onCaptured={onCaptured} /> : null}
      </Dialog>
    </CaptureContext.Provider>
  );
}

export function useCapture() {
  const context = useContext(CaptureContext);
  if (!context) throw new Error("useCapture must be used inside a CaptureProvider.");
  return context;
}
