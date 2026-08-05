import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { canRegisterServiceWorker, describeInstall, detectInstallPlatform } from "./pwa";

const chrome =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const iosSafari =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1";
const macSafari =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15";
const firefox = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0";

describe("install platform detection", () => {
  it("does not mistake a Chromium browser for Safari", () => {
    expect(detectInstallPlatform(chrome)).toBe("generic");
    expect(detectInstallPlatform(macSafari)).toBe("safari");
  });

  it("recognises iOS and Firefox", () => {
    expect(detectInstallPlatform(iosSafari)).toBe("ios");
    expect(detectInstallPlatform(firefox)).toBe("firefox");
  });
});

describe("install guidance", () => {
  it("prefers the browser's own prompt when one is available", () => {
    expect(describeInstall({ standalone: false, promptAvailable: true, userAgent: chrome })).toEqual({ kind: "prompt" });
  });

  it("reports an already-installed app before offering to install it again", () => {
    expect(describeInstall({ standalone: true, promptAvailable: true, userAgent: chrome })).toEqual({ kind: "installed" });
  });

  it("always returns actionable steps when no install prompt exists", () => {
    for (const userAgent of [iosSafari, macSafari, firefox, chrome]) {
      const guidance = describeInstall({ standalone: false, promptAvailable: false, userAgent });
      expect(guidance.kind).toBe("manual");
      if (guidance.kind !== "manual") throw new Error("expected manual guidance");
      expect(guidance.summary.length).toBeGreaterThan(0);
      expect(guidance.steps.length).toBeGreaterThan(0);
    }
  });

  it("treats a browser without service workers as usable", () => {
    expect(canRegisterServiceWorker(undefined)).toBe(false);
    expect(canRegisterServiceWorker({})).toBe(false);
    expect(canRegisterServiceWorker({ serviceWorker: {} })).toBe(true);
  });
});

describe("web app manifest", () => {
  const value = manifest();

  it("carries the fields a browser requires to offer installation", () => {
    expect(value.name).toBe("Slipwell");
    expect(value.short_name).toBe("Slipwell");
    expect(value.start_url).toBe("/today");
    expect(value.scope).toBe("/");
    expect(value.display).toBe("standalone");
    expect(value.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(value.background_color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("declares the installable icon sizes including a maskable icon", () => {
    const icons = value.icons ?? [];
    expect(icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(icons.some((icon) => icon.purpose === "maskable")).toBe(true);
    for (const icon of icons) {
      expect(icon.type).toBe("image/png");
      expect(icon.src.startsWith("/icons/")).toBe(true);
    }
  });

  it("references icon files that exist, because a missing icon silently blocks installation", () => {
    for (const icon of value.icons ?? []) {
      expect(existsSync(path.join(process.cwd(), "public", icon.src)), icon.src).toBe(true);
    }
  });
});
