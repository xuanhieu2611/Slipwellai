"use client";

import { type FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Sending your secure link…");
    const { error } = await createSupabaseBrowserClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback`, shouldCreateUser: false },
    });
    setMessage(error ? "That address is not invited yet. Ask the pilot host for access." : "Check your inbox for a one-time sign-in link.");
  }

  return <main className="mx-auto flex min-h-screen max-w-xl items-center px-5"><section className="w-full rounded-3xl border border-[var(--line)] bg-white p-8 shadow-[0_20px_60px_rgba(26,43,34,0.08)] sm:p-10"><p className="text-sm font-semibold tracking-[0.18em] text-[var(--moss)] uppercase">Slipwell · Phase 0</p><h1 className="mt-5 text-4xl font-semibold tracking-tight">Capture the thing before it disappears.</h1><p className="mt-4 leading-7 text-[var(--ink-muted)]">Private pilot access for testing capture review, retainer rollover, and calm Slipping explanations. Please use low-sensitivity test data.</p><form className="mt-8 space-y-3" onSubmit={submit}><label className="block text-sm font-medium" htmlFor="email">Invited email</label><input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-[var(--line)] px-4 outline-none focus:border-[var(--moss)] focus:ring-4 focus:ring-[var(--moss-light)]" placeholder="you@example.com" /><button className="h-12 w-full rounded-xl bg-[var(--moss)] font-semibold text-white hover:bg-[#174b37]" type="submit">Send magic link</button></form>{message && <p className="mt-4 rounded-xl bg-[var(--moss-light)] px-4 py-3 text-sm text-[#174b37]">{message}</p>}</section></main>;
}
