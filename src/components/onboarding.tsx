"use client";

import { type FormEvent, useState, useSyncExternalStore } from "react";
import { ArrowRight, CalendarCheck, Sparkle, Tray } from "@phosphor-icons/react";
import { Button, SelectField, StatusMessage, TextField } from "@/components/ui/primitives";
import { workTypeLabels, workTypes, type OnboardingState, type WorkType } from "@/lib/onboarding";

type FormState = {
  displayName: string;
  companyName: string;
  workType: WorkType;
  timezone: string;
  locale: string;
};

const defaultWorkType: WorkType = "creator_consultant";
const subscribeToBrowserSettings = () => () => undefined;
const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Etc/UTC";
const browserLocale = () => navigator.language || "en-CA";
const emptyBrowserSetting = () => "";

function messageFromResponse(data: unknown) {
  return typeof data === "object" && data && "error" in data ? String(data.error) : "We couldn't save that yet. Try again.";
}

export function Onboarding({ initialState }: { initialState: OnboardingState }) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<FormState>({
    displayName: initialState.profile.displayName ?? "",
    companyName: initialState.profile.companyName ?? "",
    workType: initialState.profile.workType ?? defaultWorkType,
    timezone: initialState.preferences.timezone ?? "",
    locale: initialState.preferences.locale ?? "",
  });
  const detectedTimezone = useSyncExternalStore(subscribeToBrowserSettings, browserTimeZone, emptyBrowserSetting);
  const detectedLocale = useSyncExternalStore(subscribeToBrowserSettings, browserLocale, emptyBrowserSetting);
  const timezone = form.timezone || detectedTimezone;
  const locale = form.locale || detectedLocale;

  const setField = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => setForm((current) => ({ ...current, [key]: value }));

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/onboarding", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save_profile", profile: { ...form, timezone, locale } }) });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(messageFromResponse(data));
      setStep(2);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn't save that yet. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/onboarding", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete" }) });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(messageFromResponse(data));
      window.location.assign("/today");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn't finish setup yet. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="onboarding-page"><section className="onboarding-panel"><div className="onboarding-progress" aria-label={`Setup step ${step + 1} of 3`}><span className="eyebrow">Slipwell setup</span><span className="onboarding-steps" aria-hidden="true">{[0, 1, 2].map((index) => <i key={index} data-state={index === step ? "current" : index < step ? "done" : "todo"} />)}</span></div>{step === 0 && <div className="onboarding-step"><p className="eyebrow">A calmer way to keep track</p><h1>Capture first. Let the shape come later.</h1><p>Slipwell gives a passing thought a safe place, keeps recurring client work from vanishing at rollover, and surfaces work that needs meaningful attention without turning it into a judgment.</p><div className="onboarding-note"><strong><Sparkle aria-hidden className="mr-1.5 inline align-middle" size={15} weight="fill" />Start simple.</strong><span>You will not need to design a workspace or choose a record type before you can capture something.</span></div><Button className="button-primary mt-8" onClick={() => setStep(1)}>Set up my profile<ArrowRight aria-hidden size={16} weight="bold" /></Button></div>}{step === 1 && <form className="onboarding-step" onSubmit={saveProfile}><p className="eyebrow">Your working context</p><h1>Make the day feel like yours.</h1><p>Your timezone and locale set the foundation for dates, reminders, and later calendar context. You can change them in Settings when that surface is ready.</p><div className="mt-7 grid gap-5"><label className="field-label">Display name<TextField autoComplete="name" maxLength={80} onChange={(event) => setField("displayName", event.target.value)} required value={form.displayName} /></label><label className="field-label">Work type<SelectField onChange={(event) => setField("workType", event.target.value as WorkType)} value={form.workType}>{workTypes.map((type) => <option key={type} value={type}>{workTypeLabels[type]}</option>)}</SelectField></label><label className="field-label">Company or brand <span>Optional</span><TextField maxLength={160} onChange={(event) => setField("companyName", event.target.value)} value={form.companyName} /></label><div className="grid gap-5 sm:grid-cols-2"><label className="field-label">Timezone<TextField aria-describedby="timezone-help" onChange={(event) => setField("timezone", event.target.value)} required value={timezone} /></label><label className="field-label">Locale<TextField aria-describedby="locale-help" onChange={(event) => setField("locale", event.target.value)} required value={locale} /></label></div><p className="form-help" id="timezone-help">Detected from this browser. Confirm or edit it, for example <code>America/Vancouver</code>.</p><p className="form-help -mt-3" id="locale-help">Use a language-region code such as <code>en-CA</code>.</p></div>{message && <StatusMessage tone="error">{message}</StatusMessage>}<div className="mt-8 flex flex-wrap gap-3"><Button className="button-primary" disabled={busy} type="submit">{busy ? "Saving…" : "Continue"}</Button><Button className="button-secondary" disabled={busy} onClick={() => setStep(0)}>Back</Button></div></form>}{step === 2 && <div className="onboarding-step"><p className="eyebrow">Trust comes first</p><h1>Keep the pilot low sensitivity.</h1><p>Slipwell stores your original capture before interpretation. During this pilot, only add material you are comfortable using for testing. When you request interpretation, the configured AI provider receives only that capture, not unrelated account data.</p><div className="onboarding-note"><strong><CalendarCheck aria-hidden className="mr-1.5 inline align-middle" size={15} />Calendar stays in your control.</strong><span>When calendar connection is available, it will be optional and read-only. You will be able to skip it.</span></div><div className="onboarding-note"><strong><Tray aria-hidden className="mr-1.5 inline align-middle" size={15} />The next step is Today.</strong><span>Your Top Three and the day’s tasks live there. Inbox holds the pilot capture and review loop while the durable production pipeline is being built.</span></div>{message && <StatusMessage tone="error">{message}</StatusMessage>}<div className="mt-8 flex flex-wrap gap-3"><Button className="button-primary" disabled={busy} onClick={complete}>{busy ? "Finishing…" : "Finish setup"}</Button><Button className="button-secondary" disabled={busy} onClick={() => setStep(1)}>Back</Button></div></div>}</section></main>;
}
