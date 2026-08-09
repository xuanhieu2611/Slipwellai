"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { localDayRolledOver, nextRolloverCheckDelayMs } from "@/lib/local-day-rollover";
import { dateInZone } from "@/components/workspace/shared/form-utils";

/* How long to wait for router.refresh() to land fresh server data before treating the page as
   stale. Generous enough to absorb normal request latency, short enough that a real stall (e.g.
   the network dropped right at midnight) surfaces to the user instead of leaving yesterday's
   Today rendered indefinitely with no indication anything is off. */
const STALE_GRACE_MS = 8_000;

/**
 * Keeps a Today-shaped page current across local midnight while the tab stays open.
 *
 * `today-page.tsx` already recomputes "today" from `dateInZone(data.timezone)` on every render,
 * so once fresh `data` exists nothing else needs to change — the only real gap is that nothing
 * causes a re-render at the moment local midnight passes. This hook watches for that boundary and
 * calls `router.refresh()`, which produces a new `data` object reference from a fresh Server
 * Component fetch — the exact signal `TodayBoard` already uses to reset its own optimistic
 * drag state, so no other component needs to change to pick this up.
 *
 * `data` is taken as a dependency purely as a "did the refresh land" signal, not read for its
 * contents, so any object reference works.
 */
export function useLocalMidnightRollover(timezone: string, data: unknown) {
  const router = useRouter();
  const knownDayRef = useRef(dateInZone(timezone));
  const staleTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [isStale, setIsStale] = useState(false);

  const refreshNow = useCallback(() => {
    if (staleTimeoutRef.current) clearTimeout(staleTimeoutRef.current);
    router.refresh();
    staleTimeoutRef.current = setTimeout(() => setIsStale(true), STALE_GRACE_MS);
  }, [router]);

  // Any new `data` reference (a successful refresh, or an unrelated command that also calls
  // router.refresh()) is proof the view is current again. The state half of that (clearing
  // `isStale`) is adjusted directly during render — the same pattern TodayBoard already uses to
  // notice a new `data` reference — rather than in an effect, since it only needs to run once per
  // `data` change. Refs must not be written during render, though, so their half of the same
  // "data landed" reaction lives in the effect below, keyed on the same `data` dependency.
  const [prevData, setPrevData] = useState(data);
  if (data !== prevData) {
    setPrevData(data);
    setIsStale(false);
  }

  useEffect(() => {
    knownDayRef.current = dateInZone(timezone);
    if (staleTimeoutRef.current) clearTimeout(staleTimeoutRef.current);
  }, [data, timezone]);

  useEffect(() => {
    let checkTimeoutId: ReturnType<typeof setTimeout>;

    function check() {
      const currentDay = dateInZone(timezone);
      if (localDayRolledOver(currentDay, knownDayRef.current)) refreshNow();
    }

    function scheduleNext() {
      checkTimeoutId = setTimeout(() => {
        check();
        scheduleNext();
      }, nextRolloverCheckDelayMs(new Date()));
    }

    scheduleNext();

    // A backgrounded tab can throttle setTimeout well past a minute, or a laptop can sleep
    // through the boundary entirely; re-check immediately whenever the tab becomes visible again
    // instead of waiting for the next scheduled tick.
    function handleVisibility() {
      if (document.visibilityState === "visible") check();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimeout(checkTimeoutId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [timezone, refreshNow]);

  return { isStale, refreshNow };
}
