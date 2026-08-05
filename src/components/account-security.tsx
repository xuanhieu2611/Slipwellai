"use client";

import { type FormEvent, useEffect, useState } from "react";
import { authCallbackUrl } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button, StatusMessage, TextField } from "@/components/ui/primitives";
import { InstallGuidance } from "@/components/install-guidance";

type Props = {
  email: string;
  hasEmailPassword: boolean;
  hasGoogle: boolean;
  revokeAfterGoogle: boolean;
};

export function AccountSecurity({ email, hasEmailPassword, hasGoogle, revokeAfterGoogle }: Props) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function signOutLocal() {
    setBusy(true);
    const { error } = await createSupabaseBrowserClient().auth.signOut({ scope: "local" });
    if (error) {
      setBusy(false);
      setMessage("We could not sign out this browser. Please try again.");
      return;
    }
    window.location.assign("/");
  }

  async function revokeAllSessions() {
    const { error } = await createSupabaseBrowserClient().auth.signOut({ scope: "global" });
    if (error) {
      setBusy(false);
      setMessage("We could not sign out every session. Please try again.");
      return;
    }
    window.location.assign("/");
  }

  async function confirmPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await createSupabaseBrowserClient().auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      setMessage("That password did not work.");
      return;
    }
    await revokeAllSessions();
  }

  async function confirmWithGoogle() {
    setBusy(true);
    setMessage("");
    const { error } = await createSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authCallbackUrl(window.location.origin, "/settings?revoke=google"),
        queryParams: { prompt: "login" },
      },
    });
    if (error) {
      setBusy(false);
      setMessage("We could not start Google verification. Please try again.");
    }
  }

  function downloadExport() {
    window.location.assign("/api/export");
  }

  if (revokeAfterGoogle) return <GoogleSessionRevocation />;

  return <section className="build-state max-w-2xl"><p className="eyebrow">Settings / Security</p><h1>Your account stays in your hands.</h1><p>Sign out of this browser when you are done, or verify your identity before ending every active session.</p><div className="build-state-rule" /><section className="mt-7 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"><h2 className="text-lg font-semibold">This browser</h2><p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">Signed in as {email}.</p><Button className="button-secondary mt-5" disabled={busy} onClick={signOutLocal}>Sign out of this browser</Button></section><section className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"><h2 className="text-lg font-semibold">Export your data</h2><p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">Download the records currently stored by the working prototype as a private JSON file. This direct export is best for normal-size accounts; large asynchronous exports, CSV/Markdown, media manifests, and account deletion are still being built.</p><Button className="button-secondary mt-5" onClick={downloadExport}>Download JSON export</Button></section><InstallGuidance /><section className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"><h2 className="text-lg font-semibold">Sign out everywhere</h2><p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">This ends active refresh sessions on your other browsers and devices, too.</p>{hasEmailPassword && <form className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={confirmPassword}><label className="field-label" htmlFor="security-password">Confirm your password<TextField autoComplete="current-password" id="security-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label><Button className="button-primary self-end" disabled={busy} type="submit">Sign out everywhere</Button></form>}{hasGoogle && <Button className="button-secondary mt-5" disabled={busy} onClick={confirmWithGoogle}>Verify with Google and sign out everywhere</Button>}{!hasEmailPassword && !hasGoogle && <p className="mt-5 text-sm text-[var(--ink-muted)]">Use password recovery to add a sign-in method before managing all sessions.</p>}</section>{message && <StatusMessage tone="error">{message}</StatusMessage>}</section>;
}

function GoogleSessionRevocation() {
  useEffect(() => {
    void createSupabaseBrowserClient().auth.signOut({ scope: "global" }).then(({ error }) => {
      window.location.assign(error ? "/settings?revocation=failed" : "/");
    });
  }, []);

  return <section className="build-state max-w-2xl"><p className="eyebrow">Settings / Security</p><h1>Signing out everywhere…</h1><p>Google verification is complete. We are ending active sessions now.</p></section>;
}
