"use client";

import { signOut } from "@/app/(auth)/actions";
import { House, LayoutDashboard, LogOut, Receipt, Settings as SettingsIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Home", href: "/app", exact: true, icon: House },
  { label: "Dashboard", href: "/app/dashboard", exact: false, icon: LayoutDashboard },
  { label: "Bills", href: "/app/bills", exact: false, icon: Receipt },
  { label: "Settings", href: "/app/settings", exact: false, icon: SettingsIcon },
] as const satisfies ReadonlyArray<{ label: string; href: string; exact: boolean; icon: LucideIcon }>;

const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M2.273 5.625A4.483 4.483 0 0 1 5.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0 0 18.75 3H5.25a3 3 0 0 0-2.977 2.625ZM2.273 8.625A4.483 4.483 0 0 1 5.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0 0 18.75 6H5.25a3 3 0 0 0-2.977 2.625ZM5.25 9a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h13.5a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3H15a.75.75 0 0 0-.75.75 2.25 2.25 0 0 1-4.5 0A.75.75 0 0 0 9 9H5.25Z" />
      </svg>
    </div>
    <p className="text-base font-semibold text-foreground">Billy</p>
  </div>
);

export function AppNav({ email: _email }: { email: string }) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile header: logo + sign-out icon */}
      <div className="flex w-full items-center justify-between px-4 py-3 md:hidden">
        <Logo />
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </div>

      {/* Desktop header: logo + nav links + sign-out */}
      <div className="mx-auto hidden w-full max-w-6xl items-center justify-between px-4 py-3 md:flex">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          {links.map(({ label, href, exact }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-1.5 no-underline transition-colors ${
                isActive(href, exact)
                  ? "bg-surface font-medium text-foreground"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              {label}
            </Link>
          ))}
          <form action={signOut} className="inline">
            <button
              type="submit"
              className="rounded-lg border border-border-strong bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card md:hidden">
        {links.map(({ label, href, exact, icon: Icon }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium no-underline transition-colors ${
                active ? "text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : "stroke-2"}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
