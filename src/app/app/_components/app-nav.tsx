"use client";

import { signOut } from "@/app/(auth)/actions";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Home", href: "/app", exact: true },
  { label: "Dashboard", href: "/app/dashboard", exact: false },
  { label: "Bills", href: "/app/bills", exact: false },
  { label: "Settings", href: "/app/settings", exact: false },
] as const;

export function AppNav({ email }: { email: string }) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="text-base font-semibold text-foreground">
          Household Bill Manager
        </p>
        <p className="text-xs text-muted">{email}</p>
      </div>
      <nav className="flex flex-wrap items-center gap-1 text-sm md:gap-2">
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
  );
}
