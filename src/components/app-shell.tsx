"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Briefcase,
  Gear,
  ListChecks,
  MagnifyingGlass,
  Plus,
  Sun,
  Tray,
  UserCircle,
  Users,
  Waves,
  type Icon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/primitives";
import { ToastProvider } from "@/components/ui/toast";
import { CaptureProvider, useCapture } from "@/components/capture-dialog";
import { ThemeToggle } from "@/components/theme-toggle";

// One icon family (Phosphor), one weight, one size scale across the whole shell.
const ICON_WEIGHT = "regular" as const;

const primaryNav: ReadonlyArray<readonly [string, string, Icon]> = [
  ["/today", "Today", Sun],
  ["/inbox", "Inbox", Tray],
  ["/tasks", "Tasks", ListChecks],
  ["/work", "Work", Briefcase],
  ["/search", "Search", MagnifyingGlass],
];

const secondaryNav: ReadonlyArray<readonly [string, string, Icon]> = [
  ["/people-notes", "People & Notes", Users],
  ["/settings", "Settings", Gear],
];

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  return (
    <ToastProvider>
      <CaptureProvider>
        <AppShellFrame email={email}>{children}</AppShellFrame>
      </CaptureProvider>
    </ToastProvider>
  );
}

function AppShellFrame({ children, email }: { children: React.ReactNode; email: string }) {
  const pathname = usePathname();
  const { open: openCapture } = useCapture();

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
          <Link className="brand-mark" href="/inbox">
            <Waves aria-hidden size={22} weight="bold" />
            Slipwell
          </Link>

          <nav aria-label="Primary navigation" className="app-nav">
            {primaryNav.map(([href, label, IconGlyph]) => (
              <Link
                aria-current={isCurrent(pathname, href) ? "page" : undefined}
                className={`app-nav-link ${isCurrent(pathname, href) ? "is-current" : ""}`}
                href={href}
                key={href}
              >
                <IconGlyph aria-hidden size={18} weight={ICON_WEIGHT} />
                {label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Secondary navigation" className="app-nav app-nav-secondary">
            {secondaryNav.map(([href, label, IconGlyph]) => (
              <Link
                aria-current={isCurrent(pathname, href) ? "page" : undefined}
                className={`app-nav-link ${isCurrent(pathname, href) ? "is-current" : ""}`}
                href={href}
                key={href}
              >
                <IconGlyph aria-hidden size={18} weight={ICON_WEIGHT} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto grid gap-2.5">
            <Button className="button-primary w-full" onClick={openCapture}>
              <Plus aria-hidden size={16} weight="bold" />
              Capture
              <kbd>⌘J</kbd>
            </Button>
            <ThemeToggle />
            <p className="sidebar-account">
              <UserCircle aria-hidden size={15} weight={ICON_WEIGHT} />
              <span>{email}</span>
            </p>
          </div>
        </aside>

        <header className="app-mobile-header">
          <Link className="brand-mark" href="/inbox">
            <Waves aria-hidden size={20} weight="bold" />
            Slipwell
          </Link>
          <nav aria-label="Secondary navigation" className="app-mobile-header-links">
            {secondaryNav.map(([href, label, IconGlyph]) => (
              <Link
                aria-current={isCurrent(pathname, href) ? "page" : undefined}
                aria-label={label}
                className={`app-mobile-header-link ${isCurrent(pathname, href) ? "is-current" : ""}`}
                href={href}
                key={href}
              >
                <IconGlyph aria-hidden size={19} weight={isCurrent(pathname, href) ? "fill" : ICON_WEIGHT} />
              </Link>
            ))}
          </nav>
        </header>

        <main className="app-content" id="main-content">{children}</main>

        <nav aria-label="Mobile primary navigation" className="mobile-nav">
          {primaryNav.map(([href, label, IconGlyph]) => (
            <Link
              aria-current={isCurrent(pathname, href) ? "page" : undefined}
              className={`mobile-nav-link ${isCurrent(pathname, href) ? "is-current" : ""}`}
              href={href}
              key={href}
            >
              <IconGlyph aria-hidden size={19} weight={isCurrent(pathname, href) ? "fill" : ICON_WEIGHT} />
              {label}
            </Link>
          ))}
        </nav>
        <Button aria-label="Capture" className="mobile-capture" onClick={openCapture}>
          <Plus aria-hidden size={22} weight="bold" />
        </Button>
      </div>
  );
}
