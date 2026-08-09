"use client";

import { Toaster, toast } from "sonner";
import { CheckCircle, Info, WarningCircle } from "@phosphor-icons/react";

export type ToastTone = "success" | "error" | "neutral";

/* Errors linger: they usually ask the person to change an input before retrying. */
const toneDuration = { success: 4_000, neutral: 5_000, error: 9_000 } as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        className="toast-toaster"
        closeButton
        duration={toneDuration.neutral}
        expand={false}
        gap={8}
        offset={{ top: 16 }}
        position="top-center"
        toastOptions={{
          classNames: {
            toast: "toast-item",
            title: "toast-title",
            description: "toast-description",
            closeButton: "toast-close",
            success: "toast-item--success",
            error: "toast-item--error",
          },
        }}
        visibleToasts={3}
      />
    </>
  );
}

export function useToast() {
  return (text: string, tone: ToastTone = "neutral") => {
    const icon =
      tone === "success" ? (
        <CheckCircle aria-hidden size={18} weight="fill" />
      ) : tone === "error" ? (
        <WarningCircle aria-hidden size={18} weight="fill" />
      ) : (
        <Info aria-hidden size={18} weight="fill" />
      );

    if (tone === "success") {
      toast.success(text, { duration: toneDuration.success, icon });
      return;
    }
    if (tone === "error") {
      toast.error(text, { duration: toneDuration.error, icon });
      return;
    }
    toast(text, { duration: toneDuration.neutral, icon });
  };
}
