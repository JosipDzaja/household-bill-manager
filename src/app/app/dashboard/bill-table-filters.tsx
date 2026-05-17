"use client";

import { inputClassName } from "@/components/ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

type Props = {
  tags: { id: string; name: string }[];
  members: { id: string; full_name: string | null }[];
  currentStatus: string;
  currentTag: string;
  currentPayer: string;
  currentSearch: string;
};

const selectCn = `${inputClassName} cursor-pointer py-1.5 text-sm`;

export function BillTableFilters({
  tags,
  members,
  currentStatus,
  currentTag,
  currentPayer,
  currentSearch,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const handleSearch = useCallback(
    (value: string) => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => setParam("search", value), 300);
    },
    [setParam],
  );

  return (
    <div className="flex flex-wrap gap-4">
      <div>
        <label className="mb-1 block text-xs text-muted">Status</label>
        <select
          value={currentStatus}
          onChange={(e) => setParam("status", e.target.value)}
          className={`${selectCn} w-36`}
        >
          <option value="">All</option>
          <option value="upcoming">Upcoming</option>
          <option value="dueSoon">Due soon</option>
          <option value="overdue">Overdue</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {tags.length > 0 && (
        <div>
          <label className="mb-1 block text-xs text-muted">Tag</label>
          <select
            value={currentTag}
            onChange={(e) => setParam("tag", e.target.value)}
            className={`${selectCn} w-40`}
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {members.length > 1 && (
        <div>
          <label className="mb-1 block text-xs text-muted">Payer</label>
          <select
            value={currentPayer}
            onChange={(e) => setParam("payer", e.target.value)}
            className={`${selectCn} w-40`}
          >
            <option value="">All members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name ?? "Member"}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs text-muted">Search</label>
        <input
          type="text"
          defaultValue={currentSearch}
          placeholder="Search bills…"
          onChange={(e) => handleSearch(e.target.value)}
          className={`${inputClassName} w-48 py-1.5 text-sm`}
        />
      </div>
    </div>
  );
}
