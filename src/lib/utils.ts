import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatDateRange(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

/** Nested `tags` from PostgREST may be an object or a single-element array. */
export function billTagNameFromJoin(row: {
  tags: { name: string } | { name: string }[] | null | undefined;
}): string | null {
  const t = row.tags;
  if (!t) return null;
  if (Array.isArray(t)) return t[0]?.name ?? null;
  return t.name;
}
