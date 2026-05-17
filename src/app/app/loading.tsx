export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface" />
        <div className="mt-1 h-4 w-72 animate-pulse rounded bg-surface" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="h-4 w-20 animate-pulse rounded bg-surface" />
            <div className="mt-2 h-8 w-12 animate-pulse rounded bg-surface" />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-32 animate-pulse rounded-lg bg-surface" />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-surface" />
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 h-5 w-40 animate-pulse rounded bg-surface" />
        <div className="mb-4 h-4 w-64 animate-pulse rounded bg-surface" />
        <div className="h-9 w-36 animate-pulse rounded-lg bg-surface" />
      </div>
    </div>
  );
}
