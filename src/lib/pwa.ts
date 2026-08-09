/**
 * Installability and offline capability rules.
 *
 * These are pure so the UI can stay a thin renderer and so the browser
 * fallbacks are testable without a real browser. No capability here is
 * assumed: every branch must produce something honest and actionable,
 * because a core workflow may never depend on an optional browser feature.
 */

export type InstallPlatform = "ios" | "safari" | "firefox" | "generic";

export type InstallGuidance =
  | { kind: "installed" }
  | { kind: "prompt" }
  | { kind: "manual"; platform: InstallPlatform; summary: string; steps: readonly string[] };

type InstallInputs = {
  /** The document is already running as an installed application. */
  standalone: boolean;
  /** The browser offered a deferred `beforeinstallprompt` event. */
  promptAvailable: boolean;
  userAgent: string;
};

const manualSteps: Record<InstallPlatform, { summary: string; steps: readonly string[] }> = {
  ios: {
    summary: "Safari on iPhone and iPad installs Slipwell from the Share menu.",
    steps: [
      "Tap the Share button in the Safari toolbar.",
      "Choose Add to Home Screen.",
      "Confirm with Add.",
    ],
  },
  safari: {
    summary: "Safari on macOS installs Slipwell from the Share menu.",
    steps: [
      "Open the Share menu in the Safari toolbar.",
      "Choose Add to Dock.",
      "Confirm with Add.",
    ],
  },
  firefox: {
    summary: "Firefox does not install web apps. Slipwell still works fully in a normal tab.",
    steps: [
      "Pin the Slipwell tab, or bookmark it for quick access.",
      "Use Chrome, Edge, or Safari if you want an installed window.",
    ],
  },
  generic: {
    summary: "Your browser can usually install Slipwell from its own menu.",
    steps: [
      "Open the browser menu.",
      "Choose Install app or Add to Home screen.",
      "Confirm the install.",
    ],
  },
};

export function detectInstallPlatform(userAgent: string): InstallPlatform {
  const agent = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(agent)) return "ios";
  if (agent.includes("firefox/") || agent.includes("fxios")) return "firefox";
  // Chromium-based browsers all claim Safari, so exclude them before trusting the token.
  const chromium = /chrome\/|chromium\/|crios|edg\/|edgios|opr\//.test(agent);
  if (!chromium && agent.includes("safari/")) return "safari";
  return "generic";
}

export function describeInstall({
  standalone,
  promptAvailable,
  userAgent,
}: InstallInputs): InstallGuidance {
  if (standalone) return { kind: "installed" };
  if (promptAvailable) return { kind: "prompt" };
  const platform = detectInstallPlatform(userAgent);
  return { kind: "manual", platform, ...manualSteps[platform] };
}

/**
 * Offline support is optional. A browser without a service worker still gets
 * the full online product, so registration must never be a hard requirement.
 */
export function canRegisterServiceWorker(
  navigatorLike: { serviceWorker?: unknown } | undefined,
): boolean {
  return Boolean(navigatorLike && "serviceWorker" in navigatorLike && navigatorLike.serviceWorker);
}
