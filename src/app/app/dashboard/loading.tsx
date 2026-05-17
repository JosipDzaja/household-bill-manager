export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-44 animate-pulse rounded-lg bg-surface" />
        <div className="mt-1 h-4 w-72 animate-pulse rounded bg-surface" />
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 h-5 w-16 animate-pulse rounded bg-surface" />
        <div className="flex flex-wrap gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-36 animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex gap-6 border-b border-border px-4 py-3">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-3 w-16 animate-pulse rounded bg-surface" />
          ))}
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-6 border-b border-border px-4 py-3">
            <div className="h-4 w-32 animate-pulse rounded bg-surface" />
            <div className="h-4 w-16 animate-pulse rounded bg-surface" />
            <div className="h-4 w-20 animate-pulse rounded bg-surface" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-surface" />
            <div className="h-4 w-12 animate-pulse rounded bg-surface" />
            <div className="h-4 w-20 animate-pulse rounded bg-surface" />
            <div className="h-7 w-20 animate-pulse rounded-lg bg-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}
