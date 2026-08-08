"use client";

import { useSyncExternalStore } from "react";
import { Keyboard, Microphone } from "@phosphor-icons/react";
import type { DashboardData } from "@/lib/dashboard";

function captureAge(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days <= 1 ? "yesterday" : `${days} days ago`;
}

const noSubscription = () => () => {};

/* Client-only so a relative label never disagrees with the server-rendered markup. */
export function CaptureAge({ iso }: { iso: string }) {
  const label = useSyncExternalStore(noSubscription, () => captureAge(iso), () => "");
  return label ? <time dateTime={iso}>{label}</time> : null;
}

export const failureCopy: Record<string, string> = {
  proposal_timeout: "Interpreting this capture took too long. Try again, or discard it if you no longer need it.",
  proposal_invalid_output: "Slipwell could not read a usable record out of these words. Try again, or discard this and capture it with a little more context.",
  proposal_provider_error: "The interpretation service did not respond. Your words are saved. Try again in a moment.",
};

export const recordTypeLabels = { task: "Task", note: "Note", retainer_update: "Retainer update" } as const;

export function CaptureOrigin({ capture }: { capture: DashboardData["captures"][number] }) {
  return <span className="review-origin">
    {capture.source_type === "voice" ? <Microphone aria-hidden size={15} /> : <Keyboard aria-hidden size={15} />}
    {capture.source_type === "voice" ? "Voice transcript" : "Typed"}
    <CaptureAge iso={capture.created_at} />
  </span>;
}
