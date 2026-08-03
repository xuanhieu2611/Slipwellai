"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import {
  Briefcase,
  CaretDown,
  DotsThree,
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

const moreNav: ReadonlyArray<readonly [string, string, Icon]> = [
  ["/people-notes", "People & Notes", Users],
  ["/settings", "Settings", Gear],
];

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

  const moreMenu = (
    <details className="more-menu">
      <summary>
        <DotsThree aria-hidden size={18} weight={ICON_WEIGHT} />
        More
        <CaretDown aria-hidden className="ml-auto" size={12} weight={ICON_WEIGHT} />
      </summary>
      <nav aria-label="More navigation">
        {moreNav.map(([href, label, IconGlyph]) => (
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
    </details>
  );

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

        <div className="mt-auto grid gap-2.5">
          <Button className="button-primary w-full" onClick={openCapture}>
            <Plus aria-hidden size={16} weight="bold" />
            Capture
            <kbd>⌘J</kbd>
          </Button>
          {moreMenu}
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
        {moreMenu}
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
