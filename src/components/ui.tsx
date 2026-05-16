import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const inputClassName =
  "mt-1 w-full rounded-lg border border-border-strong bg-card px-3 py-2 text-foreground shadow-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-ring/35";

export const btnPrimaryClassName =
  "rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45";

export const btnSecondaryClassName =
  "rounded-lg border border-border-strong bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgb(28_25_23/0.06),0_4px_12px_rgb(28_25_23/0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}
