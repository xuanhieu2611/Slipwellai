"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle, Info, WarningCircle, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/primitives";

export type ToastTone = "success" | "error" | "neutral";

type ToastItem = { id: number; tone: ToastTone; text: string };

const toneIcon = { success: CheckCircle, error: WarningCircle, neutral: Info } as const;

/* Errors linger: they usually ask the person to change an input before retrying. */
const toneDuration = { success: 4_000, neutral: 5_000, error: 9_000 } as const;

const ToastContext = createContext<((text: string, tone?: ToastTone) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, number>());
  const lastId = useRef(0);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((text: string, tone: ToastTone = "neutral") => {
    const id = (lastId.current += 1);
    /* Keep at most three on screen so a burst of failures cannot bury the newest one. */
    setToasts((current) => [...current.slice(-2), { id, tone, text }]);
    timers.current.set(id, window.setTimeout(() => dismiss(id), toneDuration[tone]));
  }, [dismiss]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div aria-live="polite" className="toast-stack">
        {toasts.map((toast) => {
          const Glyph = toneIcon[toast.tone];
          return (
            <div className={`toast toast--${toast.tone}`} key={toast.id} role={toast.tone === "error" ? "alert" : "status"}>
              <Glyph aria-hidden className="mt-px shrink-0" size={18} weight="fill" />
              <span>{toast.text}</span>
              <Button aria-label="Dismiss notification" className="button-quiet toast-dismiss" onClick={() => dismiss(toast.id)}>
                <X aria-hidden size={14} weight="bold" />
              </Button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast must be used inside a ToastProvider.");
  return notify;
}
