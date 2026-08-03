"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Button } from "@/components/ui/primitives";

const primaryNav = [
  ["/today", "Today"],
  ["/inbox", "Inbox"],
  ["/tasks", "Tasks"],
  ["/work", "Work"],
  ["/search", "Search"],
] as const;

const moreNav = [
  ["/people-notes", "People & Notes"],
  ["/settings", "Settings"],
] as const;

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const openCapture = useCallback(() => router.push("/inbox?compose=1"), [router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        openCapture();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openCapture]);

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="app-sidebar">
        <Link className="brand-mark" href="/inbox"><span>Slipwell</span><small>Private pilot</small></Link>
        <nav aria-label="Primary navigation" className="app-nav">{primaryNav.map(([href, label]) => <Link aria-current={isCurrent(pathname, href) ? "page" : undefined} className={`app-nav-link ${isCurrent(pathname, href) ? "is-current" : ""}`} href={href} key={href}>{label}</Link>)}</nav>
        <div className="mt-auto space-y-4"><Button className="button-primary w-full" onClick={openCapture}>Capture <kbd>⌘ / Ctrl J</kbd></Button><details className="more-menu"><summary>More</summary><nav aria-label="More navigation">{moreNav.map(([href, label]) => <Link className={`app-nav-link ${isCurrent(pathname, href) ? "is-current" : ""}`} href={href} key={href}>{label}</Link>)}</nav></details><p className="truncate text-xs text-[var(--ink-muted)]">{email}</p></div>
      </aside>
      <header className="app-mobile-header"><Link className="brand-mark" href="/inbox"><span>Slipwell</span><small>Pilot</small></Link><details className="more-menu"><summary>More</summary><nav aria-label="More navigation">{moreNav.map(([href, label]) => <Link className="app-nav-link" href={href} key={href}>{label}</Link>)}</nav></details></header>
      <main className="app-content" id="main-content">{children}</main>
      <nav aria-label="Mobile primary navigation" className="mobile-nav">{primaryNav.slice(0, 2).map(([href, label]) => <Link aria-current={isCurrent(pathname, href) ? "page" : undefined} className={`mobile-nav-link ${isCurrent(pathname, href) ? "is-current" : ""}`} href={href} key={href}>{label}</Link>)}<Button aria-label="Capture" className="mobile-capture" onClick={openCapture}>+</Button>{primaryNav.slice(2).map(([href, label]) => <Link aria-current={isCurrent(pathname, href) ? "page" : undefined} className={`mobile-nav-link ${isCurrent(pathname, href) ? "is-current" : ""}`} href={href} key={href}>{label}</Link>)}</nav>
    </div>
  );
}
