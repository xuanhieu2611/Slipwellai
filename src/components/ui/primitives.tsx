"use client";

import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { CheckCircle, Info, Tray, WarningCircle, X } from "@phosphor-icons/react";
import clsx from "clsx";

export function Button({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={clsx("button-base", className)} type={type} {...props} />;
}

export function TextField({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx("field-base", className)} {...props} />;
}

export function SelectField({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx("field-base", className)} {...props}>{children}</select>;
}

const toneIcon = { neutral: Info, success: CheckCircle, attention: WarningCircle, error: WarningCircle } as const;

export function StatusMessage({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "attention" | "error" }) {
  const Glyph = toneIcon[tone];
  return (
    <p className={clsx("status-message", `status-message--${tone}`)} role={tone === "error" ? "alert" : "status"}>
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
  return <div aria-hidden="true" className={clsx("skeleton", className)} />;
}

export function Dialog({
  open = true,
  title,
  children,
  onClose,
  size = "md",
}: {
  open?: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  size?: "md" | "lg";
}) {
  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="dialog-backdrop" />
        <BaseDialog.Popup className={clsx("dialog-panel", size === "lg" && "dialog-panel--lg")}>
          <div className="dialog-heading">
            <BaseDialog.Title className="dialog-title">{title}</BaseDialog.Title>
            <BaseDialog.Close aria-label="Close dialog" className="button-base button-quiet dialog-close">
              <X aria-hidden size={18} />
            </BaseDialog.Close>
          </div>
          <div className="dialog-content">{children}</div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
