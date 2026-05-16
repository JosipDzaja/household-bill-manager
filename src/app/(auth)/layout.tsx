export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
        <div className="w-full rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_rgb(28_25_23/0.06),0_4px_12px_rgb(28_25_23/0.04)]">
          {children}
        </div>
      </main>
    </div>
  );
}
