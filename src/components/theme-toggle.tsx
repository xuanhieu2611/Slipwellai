"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

type Theme = "light" | "dark";

const STORAGE_KEY = "slipwell-theme";
const CHANGE_EVENT = "slipwell-theme-change";

function darkQuery() {
  return window.matchMedia("(prefers-color-scheme: dark)");
}

/* The active theme lives on the document and in localStorage, so it is read as
   external state rather than mirrored into React state. */
function subscribe(onChange: () => void) {
  const media = darkQuery();
  media.addEventListener("change", onChange);
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function getSnapshot(): Theme {
  const override = document.documentElement.dataset.theme;
  if (override === "light" || override === "dark") return override;
  return darkQuery().matches ? "dark" : "light";
}

// The server cannot know the viewer's preference; light matches the CSS default.
const getServerSnapshot = (): Theme => "light";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const next: Theme = theme === "dark" ? "light" : "dark";

  function toggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing can reject writes. The in-session theme still applies.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <button
      aria-label={`Switch to ${next} mode`}
      className="theme-toggle"
      onClick={toggle}
      type="button"
    >
      {theme === "dark" ? <Sun aria-hidden size={16} /> : <Moon aria-hidden size={16} />}
      <span>{next === "dark" ? "Dark mode" : "Light mode"}</span>
    </button>
  );
}
