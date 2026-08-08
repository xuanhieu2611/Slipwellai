import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { CheckCircle, Info, Tray, WarningCircle, X } from "@phosphor-icons/react";

const join = (...classes: Array<string | undefined>) => classes.filter(Boolean).join(" ");

export function Button({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={join("button-base", className)} type={type} {...props} />;
}

export function TextField({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={join("field-base", className)} {...props} />;
}

export function SelectField({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={join("field-base", className)} {...props}>{children}</select>;
}

const toneIcon = { neutral: Info, success: CheckCircle, attention: WarningCircle, error: WarningCircle } as const;

export function StatusMessage({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "attention" | "error" }) {
  const Glyph = toneIcon[tone];
  return (
    <p className={`status-message status-message--${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Glyph aria-hidden className="mt-px shrink-0" size={16} weight="fill" />
      <span>{children}</span>
    </p>
  );
}

/* Empty states say what the surface is for and how to fill it, not just that it is empty. */
export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <Tray aria-hidden size={26} />
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={join("skeleton", className)} />;
}

export function Dialog({ title, children, onClose, size = "md" }: { title: string; children: ReactNode; onClose: () => void; size?: "md" | "lg" }) {
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'));
    const firstField = panel.querySelector<HTMLElement>('input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])');
    (firstField ?? focusable()[0])?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener("keydown", onKeyDown);
    return () => {
      panel.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);
  return <div aria-labelledby={titleId} aria-modal="true" className="dialog-backdrop" role="dialog" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><section ref={panelRef} className={join("dialog-panel", size === "lg" ? "dialog-panel--lg" : undefined)}><div className="dialog-heading"><h2 id={titleId}>{title}</h2><Button aria-label="Close dialog" className="button-quiet dialog-close" onClick={onClose}><X aria-hidden size={18} /></Button></div><div className="dialog-content">{children}</div></section></div>;
}
