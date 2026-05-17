import { AppNav } from "./_components/app-nav";
import { getAuthUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const {
    data: { user },
  } = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-[0_1px_0_rgb(28_25_23/0.04)]">
        <AppNav email={user.email ?? ""} />
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-6">{children}</main>
    </div>
  );
}
