import { BillScannerForm } from "@/components/bill-scanner-form";
import { btnPrimaryClassName, Card, inputClassName, SectionTitle } from "@/components/ui";
import { createClient, getAuthUser, getMembership } from "@/lib/supabase/server";
import type { MemberOption } from "@/lib/types";
import { billTagNameFromJoin, formatCurrency, formatDateRange } from "@/lib/utils";
import { redirect } from "next/navigation";
import { archiveBill, createBill } from "../actions";

const selectClassName = `${inputClassName} cursor-pointer`;

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const {
    data: { user },
  } = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: membership } = await getMembership(user.id);

  if (!membership) {
    redirect("/onboarding");
  }

  const [{ data: members }, { data: householdTags }, { data: bills }] = await Promise.all([
    supabase
      .from("household_members")
      .select("id, user_id")
      .eq("household_id", membership.household_id),
    supabase
      .from("tags")
      .select("id, name")
      .eq("household_id", membership.household_id)
      .order("name"),
    supabase
      .from("bills")
      .select(
        `
        id,
        title,
        amount,
        due_date,
        start_date,
        end_date,
        currency,
        is_active,
        description,
        bill_tags (
          tags ( name )
        )
      `,
      )
      .eq("household_id", membership.household_id)
      .order("created_at", { ascending: false }),
  ]);

  const profileIds = (members ?? []).map((member) => member.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", profileIds.length > 0 ? profileIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));

  const memberOptions: MemberOption[] = (members ?? []).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    full_name: profileMap.get(m.user_id) ?? null,
  }));

  const query = await searchParams;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <BillScannerForm
          createBillAction={createBill}
          members={memberOptions}
          householdTags={householdTags ?? []}
          defaultPayerMemberId={membership.id}
        />
      </Card>
      <Card>
        <SectionTitle
          title="Add bill"
          subtitle="Pick saved tags and/or add new ones below."
        />
        {query.error ? (
          <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-800 ring-1 ring-red-200/80">
            {query.error}
          </p>
        ) : null}
        {query.message ? (
          <p className="mb-3 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800 ring-1 ring-emerald-200/80">
            {query.message}
          </p>
        ) : null}

        <form action={createBill} className="space-y-3">
          <label className="block text-sm">
            Title
            <input name="title" required className={inputClassName} />
          </label>
          <label className="block text-sm">
            Description
            <textarea name="description" rows={2} className={inputClassName} />
          </label>
          <label className="block text-sm">
            Amount
            <input
              name="amount"
              required
              type="number"
              step="0.01"
              min="0.01"
              className={inputClassName}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm">
              Due date
              <input
                name="due_date"
                required
                type="date"
                className={inputClassName}
              />
            </label>
            <label className="block text-sm">
              Currency
              <input
                name="currency"
                defaultValue="EUR"
                className={inputClassName}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm">
              Start date
              <input name="start_date" required type="date" className={inputClassName} />
            </label>
            <label className="block text-sm">
              End date
              <input name="end_date" required type="date" className={inputClassName} />
            </label>
          </div>

          <label className="block text-sm">
            Tags
            {(householdTags ?? []).length > 0 ? (
              <select
                name="tag_ids"
                multiple
                size={Math.min(8, (householdTags ?? []).length)}
                className={selectClassName}
              >
                {(householdTags ?? []).map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1 text-xs text-muted">No saved tags yet — add some with the field below.</p>
            )}
            <span className="mt-1 block text-xs text-muted">
              Hold Cmd (Mac) or Ctrl (Windows) to select multiple.
            </span>
          </label>
          <label className="block text-sm">
            New tags
            <input
              name="new_tags"
              placeholder="e.g. utilities, rent"
              className={inputClassName}
            />
            <span className="mt-1 block text-xs text-muted">Comma-separated; stored case-insensitively.</span>
          </label>

          <label className="block text-sm">
            Payer
            <select
              name="payer_member_id"
              defaultValue={membership.id}
              className={selectClassName}
            >
              {(members ?? []).map((member) => (
                <option key={member.id} value={member.id}>
                  {profileMap.get(member.user_id) || "Household member"}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className={btnPrimaryClassName}>
            Create bill
          </button>
        </form>
      </Card>

      <Card>
        <SectionTitle title="Bills" subtitle="Archive bills you no longer track." />
        <div className="space-y-3">
          {(bills ?? []).length === 0 ? (
            <p className="text-sm text-muted">No bills added yet.</p>
          ) : (
            (bills ?? []).map((bill) => (
              <div
                key={bill.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface/50 p-3"
              >
                <div>
                  <p className="font-medium text-foreground">{bill.title}</p>
                  {bill.description ? (
                    <p className="text-xs text-muted">{bill.description}</p>
                  ) : null}
                  <p className="text-sm text-muted">
                    Due {bill.due_date} • {formatCurrency(Number(bill.amount), bill.currency)} •{" "}
                    {formatDateRange(bill.start_date, bill.end_date)}
                  </p>
                  {Array.isArray(bill.bill_tags) && bill.bill_tags.length > 0 ? (
                    <p className="mt-1 flex flex-wrap gap-1">
                      {bill.bill_tags.map((row, i) => {
                        const label = billTagNameFromJoin(row);
                        if (!label) return null;
                        return (
                          <span
                            key={`${bill.id}-${label}-${i}`}
                            className="rounded-md bg-surface px-1.5 py-0.5 text-xs text-muted ring-1 ring-border"
                          >
                            {label}
                          </span>
                        );
                      })}
                    </p>
                  ) : null}
                </div>
                {bill.is_active ? (
                  <form action={archiveBill}>
                    <input type="hidden" name="bill_id" value={bill.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-border-strong bg-card px-2 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                    >
                      Archive
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-muted">Archived</span>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
