"use client";

import { useState, useSyncExternalStore } from "react";
import { DeviceMobile } from "@phosphor-icons/react";
import { describeInstall, type InstallGuidance as Guidance } from "@/lib/pwa";
import { Button, StatusMessage } from "@/components/ui/primitives";

/** Chromium's deferred install event. It is not in the DOM lib and is absent in other browsers. */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

/*
  Installability is browser state, not React state, so it is read through an
  external store. The server cannot know it, so the first paint says "checking"
  instead of guessing instructions for the wrong browser.
*/
let deferredPrompt: InstallPromptEvent | null = null;
let snapshot: Guidance | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function sameGuidance(a: Guidance, b: Guidance) {
  return (
    a.kind === b.kind && (a.kind !== "manual" || b.kind !== "manual" || a.platform === b.platform)
  );
}

// useSyncExternalStore compares snapshots by identity, so an unchanged result must keep its object.
function getSnapshot(): Guidance {
  const next = describeInstall({
    standalone: isStandalone(),
    promptAvailable: deferredPrompt !== null,
    userAgent: navigator.userAgent,
  });
  if (!snapshot || !sameGuidance(snapshot, next)) snapshot = next;
  return snapshot;
}

function getServerSnapshot(): Guidance | null {
  return null;
}

function subscribe(onChange: () => void) {
  const onBeforeInstallPrompt = (event: Event) => {
    // Preventing the default keeps the browser's own banner from competing with this screen.
    event.preventDefault();
    deferredPrompt = event as InstallPromptEvent;
    emit();
  };
  const onInstalled = () => {
    deferredPrompt = null;
    emit();
  };
  const displayMode = window.matchMedia?.("(display-mode: standalone)");

  listeners.add(onChange);
  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", onInstalled);
  displayMode?.addEventListener("change", emit);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.removeEventListener("appinstalled", onInstalled);
    displayMode?.removeEventListener("change", emit);
  };
}

export function InstallGuidance() {
  const guidance = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [message, setMessage] = useState("");

  async function install() {
    const prompt = deferredPrompt;
    if (!prompt) return;
    setMessage("");
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome !== "accepted")
        setMessage("Install was dismissed. You can install Slipwell later from this screen.");
    } catch {
      setMessage(
        "Your browser did not open the install dialog. Use its own menu to install Slipwell.",
      );
    } finally {
      // A deferred prompt can only be used once, so fall back to written steps afterwards.
      deferredPrompt = null;
      emit();
    }
  }

  return (
    <section className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <DeviceMobile aria-hidden size={19} />
        Install Slipwell
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
        Installing gives Slipwell its own window or home-screen icon so capture is one tap away.
        Slipwell works the same in a normal browser tab; installing is optional.
      </p>

      {guidance === null ? (
        <p className="mt-4 text-sm text-[var(--ink-muted)]">Checking what this browser supports…</p>
      ) : guidance.kind === "installed" ? (
        <StatusMessage tone="success">Slipwell is already installed on this device.</StatusMessage>
      ) : guidance.kind === "prompt" ? (
        <Button className="button-secondary mt-5" onClick={install}>
          Install Slipwell
        </Button>
      ) : (
        <div className="mt-4">
          <p className="text-sm leading-6 text-[var(--ink-muted)]">{guidance.summary}</p>
          <ol className="mt-3 grid list-decimal gap-1.5 pl-5 text-sm leading-6 text-[var(--ink-muted)]">
            {guidance.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">
        Slipwell keeps your records on the server, so it needs a connection. Offline, it shows a
        clear offline screen instead of stale data.
      </p>
      {message && <StatusMessage tone="neutral">{message}</StatusMessage>}
    </section>
  );
}
