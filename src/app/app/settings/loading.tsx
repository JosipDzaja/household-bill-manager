export default function Loading() {
  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-4">
      <div className="h-5 w-24 animate-pulse rounded bg-surface" />
      <div className="space-y-2">
        <div className="h-4 w-80 animate-pulse rounded bg-surface" />
        <div className="h-4 w-64 animate-pulse rounded bg-surface" />
      </div>
    </div>
  );
}
