import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "../(auth)/actions";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-[0_1px_0_rgb(28_25_23/0.04)]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-base font-semibold text-foreground">
              Household Bill Manager
            </h1>
            <p className="text-xs text-muted">{user.email}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-1 text-sm md:gap-2">
            <Link
              href="/app"
              className="rounded-lg px-3 py-1.5 text-foreground no-underline hover:bg-surface"
            >
              Dashboard
            </Link>
            <Link
              href="/app/bills"
              className="rounded-lg px-3 py-1.5 text-foreground no-underline hover:bg-surface"
            >
              Bills
            </Link>
            <Link
              href="/app/settings"
              className="rounded-lg px-3 py-1.5 text-foreground no-underline hover:bg-surface"
            >
              Settings
            </Link>
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
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
