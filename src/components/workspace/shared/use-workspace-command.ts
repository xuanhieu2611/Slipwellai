"use client";

import { type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { formValue, tagsValue } from "@/components/workspace/shared/form-utils";

export type WorkspaceCommandFn = (body: Record<string, unknown>) => Promise<void>;

/* A plain string names the form field to read as trimmed text (the common case). Pass
   { source, array: true } instead when the field is a comma-separated tags input that needs
   tagsValue's split/trim/cap handling rather than a single text value. */
export type SubmitFieldSpec = string | { source: string; array: true };

export function useWorkspaceCommand() {
  const router = useRouter();
  const notify = useToast();

  async function command(body: Record<string, unknown>) {
    const response = await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload: unknown = await response.json();
    if (!response.ok)
      throw new Error(
        typeof payload === "object" && payload && "error" in payload
          ? String(payload.error)
          : "Could not save that change.",
      );
    router.refresh();
  }

  async function safely(operation: () => Promise<void>, success?: string) {
    try {
      await operation();
      if (success) notify(success, "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save that change.", "error");
    }
  }

  async function refreshAttention() {
    await safely(async () => {
      const response = await fetch("/api/slipping/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "core" }),
      });
      const payload: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          typeof payload === "object" && payload && "error" in payload
            ? String(payload.error)
            : "Could not refresh attention.",
        );
      router.refresh();
    }, "Attention signals refreshed.");
  }

  async function resolveSignal(
    signalId: string,
    outcome: "marked_attention" | "deferred" | "dismissed" | "cadence_changed",
    extra?: Record<string, unknown>,
    success = "Signal resolved.",
  ) {
    await safely(async () => {
      const response = await fetch(`/api/slipping/${signalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, ...extra }),
      });
      const payload: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          typeof payload === "object" && payload && "error" in payload
            ? String(payload.error)
            : "Could not resolve that signal.",
        );
      router.refresh();
    }, success);
  }

  async function checkRetainerSlipping(retainerId: string) {
    const response = await fetch("/api/slipping/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retainerId }),
    });
    const payload: unknown = await response.json();
    if (!response.ok)
      throw new Error(
        typeof payload === "object" && payload && "error" in payload
          ? String(payload.error)
          : "Could not check Slipping.",
      );
    router.refresh();
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
    action: string,
    fields: Record<string, SubmitFieldSpec>,
    success: string,
    onSuccess?: () => void,
  ) {
    event.preventDefault();
    try {
      const form = event.currentTarget;
      const payload: Record<string, unknown> = { action };
      for (const [key, spec] of Object.entries(fields))
        payload[key] =
          typeof spec === "string" ? formValue(form, spec) : tagsValue(form, spec.source);
      await command(payload);
      form.reset();
      notify(success, "success");
      onSuccess?.();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save that change.", "error");
    }
  }

  return {
    command,
    safely,
    refreshAttention,
    resolveSignal,
    checkRetainerSlipping,
    submit,
    notify,
  };
}
