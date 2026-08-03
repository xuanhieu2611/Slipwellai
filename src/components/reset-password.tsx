"use client";

import { type FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button, StatusMessage, TextField } from "@/components/ui/primitives";

export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setMessage("Those passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await createSupabaseBrowserClient().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMessage("We could not update your password. Request a new reset link and try again.");
      return;
    }
    window.location.assign("/");
  }

  return <main className="mx-auto flex min-h-screen max-w-xl items-center px-5"><section className="w-full rounded-3xl border border-[var(--line)] bg-white p-8 shadow-[0_20px_60px_rgba(26,43,34,0.08)] sm:p-10"><p className="text-sm font-semibold tracking-[0.18em] text-[var(--moss)] uppercase">Slipwell</p><h1 className="mt-5 text-4xl font-semibold tracking-tight">Choose a new password.</h1><p className="mt-4 leading-7 text-[var(--ink-muted)]">After saving it, you can continue where you left off.</p><form className="mt-8 space-y-4" onSubmit={submit}><label className="field-label" htmlFor="new-password">New password<TextField autoComplete="new-password" id="new-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label><label className="field-label" htmlFor="confirm-password">Confirm new password<TextField autoComplete="new-password" id="confirm-password" onChange={(event) => setConfirmation(event.target.value)} required type="password" value={confirmation} /></label><Button className="button-primary mt-2 w-full" disabled={busy} type="submit">{busy ? "Saving…" : "Save new password"}</Button></form>{message && <StatusMessage tone="error">{message}</StatusMessage>}</section></main>;
}
