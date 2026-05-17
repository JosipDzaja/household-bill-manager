export default function Loading() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-surface" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-surface" />
      </div>
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="mb-4 h-5 w-20 animate-pulse rounded bg-surface" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-full animate-pulse rounded-lg bg-surface" />
        ))}
        <div className="h-9 w-28 animate-pulse rounded-lg bg-surface" />
      </div>
      <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
        <div className="mb-4 h-5 w-16 animate-pulse rounded bg-surface" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}
