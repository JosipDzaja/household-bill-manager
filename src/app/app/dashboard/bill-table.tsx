import { btnPrimaryClassName, btnSecondaryClassName, Card, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import type { MemberOption, TagOption } from "@/lib/types";
import { billTagNameFromJoin, formatCurrency } from "@/lib/utils";
import { addDays, isBefore } from "date-fns";
import { Suspense } from "react";
import { markPaid, markUnpaid } from "../actions";
import { BillTableFilters } from "./bill-table-filters";

type Status = "upcoming" | "dueSoon" | "overdue" | "paid";

const statusConfig: Record<Status, { label: string; cls: string }> = {
  upcoming: {
    label: "Upcoming",
    cls: "bg-badge text-foreground ring-1 ring-border",
  },
  dueSoon: {
    label: "Due soon",
    cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80",
  },
  overdue: {
    label: "Overdue",
    cls: "bg-red-50 text-red-700 ring-1 ring-red-200/80",
  },
  paid: {
    label: "Paid",
    cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
  },
};


export async function BillTable({
  householdId,
  searchParamsPromise,
}: {
  householdId: string;
  searchParamsPromise: Promise<{ status?: string; tag?: string; payer?: string; search?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParamsPromise;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  let billsQuery = supabase
    .from("bills")
    .select(
      `
      id,
      title,
      amount,
      due_date,
      currency,
      payer_member_id,
      start_date,
      end_date,
      bill_tags (
        tag_id,
        tags ( name )
      )
    `,
    )
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("due_date", { ascending: true });

  if (params.payer) {
    billsQuery = billsQuery.eq("payer_member_id", params.payer);
  }

  const [{ data: bills }, { data: paidThisMonth }, { data: tags }, { data: members }] =
    await Promise.all([
      billsQuery,
      supabase
        .from("bill_payments")
        .select("id, bill_id")
        .gte("paid_at", monthStart)
        .lte("paid_at", monthEnd),
      supabase
        .from("tags")
        .select("id, name")
        .eq("household_id", householdId)
        .order("name"),
      supabase
        .from("household_members")
        .select("id, user_id")
        .eq("household_id", householdId),
    ]);

  const profileIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", profileIds.length > 0 ? profileIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const memberOptions: MemberOption[] = (members ?? []).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    full_name: profileMap.get(m.user_id) ?? null,
  }));

  const dueSoonLimit = addDays(now, 7);
  const paidBillIds = new Set((paidThisMonth ?? []).map((p) => p.bill_id));

  let rows = (bills ?? []).map((bill) => {
    const dueDate = new Date(bill.due_date + "T00:00:00");
    const isPaid = paidBillIds.has(bill.id);

    let status: Status = "upcoming";
    if (isPaid) {
      status = "paid";
    } else if (isBefore(dueDate, now)) {
      status = "overdue";
    } else if (isBefore(dueDate, dueSoonLimit) || dueDate.getTime() === dueSoonLimit.getTime()) {
      status = "dueSoon";
    }

    const payer = memberOptions.find((m) => m.id === bill.payer_member_id);
    return { ...bill, status, payerName: payer?.full_name ?? null };
  });

  if (params.status) {
    rows = rows.filter((r) => r.status === params.status);
  }

  if (params.tag) {
    const tagId = params.tag;
    rows = rows.filter(
      (r) =>
        Array.isArray(r.bill_tags) &&
        r.bill_tags.some((bt) => (bt as { tag_id: string }).tag_id === tagId),
    );
  }

  if (params.search) {
    const q = params.search.toLowerCase();
    rows = rows.filter((r) => r.title.toLowerCase().includes(q));
  }

  const tagOptions: TagOption[] = tags ?? [];

  return (
    <>
      <Card>
        <SectionTitle title="Filters" />
        <Suspense fallback={<div className="h-10 animate-pulse rounded bg-surface" />}>
          <BillTableFilters
            tags={tagOptions}
            members={memberOptions}
            currentStatus={params.status ?? ""}
            currentTag={params.tag ?? ""}
            currentPayer={params.payer ?? ""}
            currentSearch={params.search ?? ""}
          />
        </Suspense>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  Due date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  Tags
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  Payer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
                    {params.status || params.tag || params.payer || params.search
                      ? "No bills match the current filters."
                      : "No active bills."}
                  </td>
                </tr>
              ) : (
                rows.map((bill) => {
                  const { label, cls } = statusConfig[bill.status];
                  return (
                    <tr key={bill.id} className="transition-colors hover:bg-surface/60">
                      <td className="px-4 py-3 font-medium text-foreground">{bill.title}</td>
                      <td className="px-4 py-3 text-foreground">
                        {formatCurrency(Number(bill.amount), bill.currency)}
                      </td>
                      <td className="px-4 py-3 text-foreground">{bill.due_date}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(bill.bill_tags) && bill.bill_tags.length > 0 ? (
                            bill.bill_tags.map((row, i) => {
                              const name = billTagNameFromJoin(row);
                              if (!name) return null;
                              return (
                                <span
                                  key={`${bill.id}-${name}-${i}`}
                                  className="rounded-md bg-surface px-1.5 py-0.5 text-xs text-muted ring-1 ring-border"
                                >
                                  {name}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">{bill.payerName ?? "—"}</td>
                      <td className="px-4 py-3">
                        {bill.status === "paid" ? (
                          <form action={markUnpaid}>
                            <input type="hidden" name="bill_id" value={bill.id} />
                            <button className={btnSecondaryClassName} type="submit">
                              Mark unpaid
                            </button>
                          </form>
                        ) : (
                          <form action={markPaid}>
                            <input type="hidden" name="bill_id" value={bill.id} />
                            <button
                              className={`${btnPrimaryClassName} px-2 py-1 text-xs`}
                              type="submit"
                            >
                              Mark paid
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {rows.length > 0 && (
          <p className="border-t border-border px-4 py-2 text-xs text-muted">
            {rows.length} bill{rows.length !== 1 ? "s" : ""}
          </p>
        )}
      </Card>
    </>
  );
}
