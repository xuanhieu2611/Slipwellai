"use client";

import { type FormEvent, useState } from "react";
import { authCallbackUrl } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button, StatusMessage, TextField } from "@/components/ui/primitives";

type Screen = "sign_in" | "sign_up" | "recovery";

const copy: Record<Screen, { eyebrow: string; title: string; submit: string }> = {
  sign_in: { eyebrow: "Welcome back", title: "Pick up what matters.", submit: "Sign in" },
  sign_up: { eyebrow: "Start with a thought", title: "Give it a safe place to land.", submit: "Create account" },
  recovery: { eyebrow: "Account recovery", title: "Set a new password from your inbox.", submit: "Send reset link" },
};

export function SignIn({ initialError }: { initialError?: string }) {
  const [screen, setScreen] = useState<Screen>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(initialError ?? "");
  const [tone, setTone] = useState<"error" | "success" | "neutral">(initialError ? "error" : "neutral");
  const [busy, setBusy] = useState(false);

  function changeScreen(next: Screen) {
    setScreen(next);
    setMessage("");
    setTone("neutral");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const supabase = createSupabaseBrowserClient();

    if (screen === "recovery") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: authCallbackUrl(window.location.origin, "/auth/reset"),
      });
      setBusy(false);
      setTone(error ? "error" : "success");
      setMessage(error ? "We could not send a reset link. Please try again shortly." : "If that address has an account, a reset link is on its way.");
      return;
    }

    const result = screen === "sign_up"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setBusy(false);
    if (result.error || !result.data.session) {
      setTone("error");
      setMessage(screen === "sign_up" ? "We could not create that account. Try a different email or sign in instead." : "That email or password did not work.");
      return;
    }
    window.location.assign("/");
  }

  async function signInWithGoogle() {
    setBusy(true);
    setMessage("");
    const { error } = await createSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: authCallbackUrl(window.location.origin) },
    });
    if (error) {
      setBusy(false);
      setTone("error");
      setMessage("We could not start Google sign-in. Please try again shortly.");
    }
  }

  const details = copy[screen];
  return <main className="mx-auto flex min-h-screen max-w-xl items-center px-5"><section className="w-full rounded-3xl border border-[var(--line)] bg-white p-8 shadow-[0_20px_60px_rgba(26,43,34,0.08)] sm:p-10"><p className="text-sm font-semibold tracking-[0.18em] text-[var(--moss)] uppercase">Slipwell</p><p className="mt-5 text-sm font-semibold text-[var(--moss)]">{details.eyebrow}</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">{details.title}</h1><p className="mt-4 leading-7 text-[var(--ink-muted)]">Capture what is on your mind first. Slipwell helps you bring order to it after.</p>{screen !== "recovery" && <Button className="button-secondary mt-7 w-full" disabled={busy} onClick={signInWithGoogle}>Continue with Google</Button>}<div className="my-6 flex items-center gap-3 text-xs text-[var(--ink-muted)]" aria-hidden="true"><span className="h-px flex-1 bg-[var(--line)]" /><span>{screen === "recovery" ? "Password reset" : "or use email"}</span><span className="h-px flex-1 bg-[var(--line)]" /></div><form className="space-y-4" onSubmit={submit}><label className="field-label" htmlFor="email">Email address<TextField autoComplete="email" id="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>{screen !== "recovery" && <label className="field-label" htmlFor="password">Password<TextField autoComplete={screen === "sign_up" ? "new-password" : "current-password"} id="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>}<Button className="button-primary mt-2 w-full" disabled={busy} type="submit">{busy ? "Working…" : details.submit}</Button></form>{message && <StatusMessage tone={tone}>{message}</StatusMessage>}<div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">{screen === "sign_in" && <><button className="text-[var(--moss)] underline underline-offset-4" disabled={busy} onClick={() => changeScreen("sign_up")} type="button">Create an account</button><button className="text-[var(--moss)] underline underline-offset-4" disabled={busy} onClick={() => changeScreen("recovery")} type="button">Forgot password?</button></>}{screen !== "sign_in" && <button className="text-[var(--moss)] underline underline-offset-4" disabled={busy} onClick={() => changeScreen("sign_in")} type="button">Back to sign in</button>}</div></section></main>;
}
