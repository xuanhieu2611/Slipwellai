"use client";

import { type FormEvent, useState } from "react";
import { authCallbackUrl } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ArrowRight, LockKey, Microphone, Waves, type Icon } from "@phosphor-icons/react";
import { Button, StatusMessage, TextField } from "@/components/ui/primitives";

type Screen = "sign_in" | "sign_up" | "recovery";

const copy: Record<Screen, { eyebrow: string; title: string; submit: string }> = {
  sign_in: { eyebrow: "Welcome back", title: "Pick up what matters.", submit: "Sign in" },
  sign_up: {
    eyebrow: "Start with a thought",
    title: "Give it a safe place to land.",
    submit: "Create account",
  },
  recovery: {
    eyebrow: "Account recovery",
    title: "Set a new password from your inbox.",
    submit: "Send reset link",
  },
};

const highlights: ReadonlyArray<readonly [Icon, string]> = [
  [Microphone, "Capture by text or voice in one keystroke, before the thought is gone."],
  [Waves, "Recurring client work carries forward instead of vanishing at rollover."],
  [LockKey, "Your original capture is stored before any interpretation happens."],
];

/* Google's mark is reproduced from its own brand colors, not restyled to ours. */
function GoogleMark() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 18 18" width="16">
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function SignIn({ initialError }: { initialError?: string }) {
  const [screen, setScreen] = useState<Screen>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(initialError ?? "");
  const [tone, setTone] = useState<"error" | "success" | "neutral">(
    initialError ? "error" : "neutral",
  );
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
      setMessage(
        error
          ? "We could not send a reset link. Please try again shortly."
          : "If that address has an account, a reset link is on its way.",
      );
      return;
    }

    const result =
      screen === "sign_up"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setBusy(false);
    if (result.error || !result.data.session) {
      setTone("error");
      setMessage(
        screen === "sign_up"
          ? "We could not create that account. Try a different email or sign in instead."
          : "That email or password did not work.",
      );
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
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <p className="brand-mark">
          <Waves aria-hidden size={22} weight="bold" />
          Slipwell
        </p>
        <div>
          <h2>Capture anything. Nothing important slips through.</h2>
          <div className="auth-points">
            {highlights.map(([Glyph, text]) => (
              <p className="auth-point" key={text}>
                <Glyph aria-hidden size={18} />
                {text}
              </p>
            ))}
          </div>
        </div>
        <p className="text-xs text-[var(--ink-muted)]">Private pilot</p>
      </aside>

      <main className="auth-main">
        <section className="auth-card">
          <p className="eyebrow">{details.eyebrow}</p>
          <h1 className="mt-2">{details.title}</h1>
          <p>Capture what is on your mind first. Slipwell helps you bring order to it after.</p>

          {screen !== "recovery" && (
            <Button
              className="button-secondary mt-6 w-full"
              disabled={busy}
              onClick={signInWithGoogle}
            >
              <GoogleMark />
              Continue with Google
            </Button>
          )}

          <div className="auth-divider" aria-hidden="true">
            <span />
            <span>{screen === "recovery" ? "Password reset" : "or use email"}</span>
            <span />
          </div>

          <form className="grid gap-4" onSubmit={submit}>
            <label className="field-label" htmlFor="email">
              Email address
              <TextField
                autoComplete="email"
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@studio.com"
                required
                type="email"
                value={email}
              />
            </label>
            {screen !== "recovery" && (
              <label className="field-label" htmlFor="password">
                Password
                <TextField
                  autoComplete={screen === "sign_up" ? "new-password" : "current-password"}
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </label>
            )}
            <Button className="button-primary mt-1 w-full" disabled={busy} type="submit">
              {busy ? "Working…" : details.submit}
              {!busy && <ArrowRight aria-hidden size={16} weight="bold" />}
            </Button>
          </form>

          {message && <StatusMessage tone={tone}>{message}</StatusMessage>}

          <div className="auth-alt-actions">
            {screen === "sign_in" && (
              <>
                <button disabled={busy} onClick={() => changeScreen("sign_up")} type="button">
                  Create an account
                </button>
                <button disabled={busy} onClick={() => changeScreen("recovery")} type="button">
                  Forgot password?
                </button>
              </>
            )}
            {screen !== "sign_in" && (
              <button disabled={busy} onClick={() => changeScreen("sign_in")} type="button">
                Back to sign in
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
