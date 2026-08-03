import { useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

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

export function StatusMessage({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "error" }) {
  return <p className={`status-message status-message--${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</p>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={join("skeleton", className)} />;
}

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'));
    focusable()[0]?.focus();
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
    return () => panel.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  return <div aria-labelledby="dialog-title" aria-modal="true" className="dialog-backdrop" role="dialog"><section ref={panelRef} className="dialog-panel"><div className="flex items-start justify-between gap-4"><h2 id="dialog-title" className="text-xl font-semibold tracking-tight">{title}</h2><Button aria-label="Close dialog" className="button-quiet" onClick={onClose}>Close</Button></div><div className="mt-5">{children}</div></section></div>;
}

export function Toast({ children, onDismiss }: { children: ReactNode; onDismiss: () => void }) {
  return <div className="toast" role="status"><span>{children}</span><Button className="button-quiet" onClick={onDismiss}>Dismiss</Button></div>;
}
