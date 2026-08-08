"use client";

import { useEffect, useRef, useState } from "react";
import { DotsThreeVertical } from "@phosphor-icons/react";

export type MenuAction = { label: string; onClick: () => void; tone?: "danger" };

export function ActionsMenu({ actions }: { actions: MenuAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);
  return <div className="task-menu" ref={ref}><button className="button-base button-quiet task-menu-trigger" type="button" aria-label="More actions" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}><DotsThreeVertical aria-hidden size={18} weight="bold" /></button>{open && <div className="task-menu-panel" role="menu">{actions.map((action) => <button className={action.tone === "danger" ? "task-menu-item task-menu-item--danger" : "task-menu-item"} key={action.label} role="menuitem" type="button" onClick={() => { setOpen(false); action.onClick(); }}>{action.label}</button>)}</div>}</div>;
}
