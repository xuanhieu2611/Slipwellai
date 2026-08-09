"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

const emptySubscribe = () => () => undefined;

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  /* Avoid mismatched icon markup between SSR (unknown theme) and the client. */
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const isDark = mounted && resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";

  return (
    <button
      aria-label={`Switch to ${next} mode`}
      className={compact ? "theme-toggle theme-toggle--compact" : "theme-toggle"}
      onClick={() => setTheme(next)}
      type="button"
    >
      {isDark ? <Sun aria-hidden size={16} /> : <Moon aria-hidden size={16} />}
      <span className={compact ? "sr-only" : undefined}>
        {next === "dark" ? "Dark mode" : "Light mode"}
      </span>
    </button>
  );
}
