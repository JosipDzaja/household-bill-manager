import { btnPrimaryClassName, btnSecondaryClassName, Card, SectionTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { billTagNameFromJoin, formatCurrency } from "@/lib/utils";
import { addDays, isAfter, isBefore } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createInviteLink, markPaid, markUnpaid } from "./actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; invite?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("household_members")
    .select("id, household_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const { data: household } = await supabase
    .from("households")
    .select("name")
    .eq("id", membership.household_id)
    .single();

  const { data: bills } = await supabase
    .from("bills")
    .select(
      `
      id,
      title,
      amount,
      due_day,
      currency,
      payer_member_id,
      bill_tags (
        tags ( name )
      )
    `,
    )
    .eq("household_id", membership.household_id)
    .eq("is_active", true)
    .order("due_day", { ascending: true });

  const now = new Date();
  const dueSoonLimit = addDays(now, 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { data: paidThisMonth } = await supabase
    .from("bill_payments")
    .select("id, bill_id")
    .gte("paid_at", monthStart)
    .lte("paid_at", monthEnd);

  const paidBillIds = new Set((paidThisMonth ?? []).map((p) => p.bill_id));

  const states = (bills ?? []).map((bill) => {
    const lastDayInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), Math.min(bill.due_day, lastDayInMonth));
    const isPaid = paidBillIds.has(bill.id);

    let status: "upcoming" | "dueSoon" | "overdue" | "paid" = "upcoming";
    if (isPaid) {
      status = "paid";
    } else if (isBefore(dueDate, now)) {
      status = "overdue";
    } else if (isBefore(dueDate, dueSoonLimit) || dueDate.getTime() === dueSoonLimit.getTime()) {
      status = "dueSoon";
    } else if (isAfter(dueDate, dueSoonLimit)) {
      status = "upcoming";
    }

    return { ...bill, status };
  });

  const upcoming = states.filter((s) => s.status === "upcoming").length;
  const dueSoon = states.filter((s) => s.status === "dueSoon").length;
  const overdue = states.filter((s) => s.status === "overdue").length;
  const paidCount = states.filter((s) => s.status === "paid").length;

  const query = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          {household?.name ?? "Household"}
        </h2>
        <p className="text-sm text-muted">
          Track upcoming and paid monthly bills.
        </p>
      </div>

      {query.error ? (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800 ring-1 ring-red-200/80">
          {query.error}
        </p>
      ) : null}
      {query.message ? (
        <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800 ring-1 ring-emerald-200/80">
          {query.message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-muted">Upcoming</p>
          <p className="text-2xl font-semibold text-foreground">{upcoming}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Due soon</p>
          <p className="text-2xl font-semibold text-foreground">{dueSoon}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Overdue</p>
          <p className="text-2xl font-semibold text-foreground">{overdue}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Paid this month</p>
          <p className="text-2xl font-semibold text-foreground">{paidCount}</p>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Invite household member"
          subtitle="Share link with partner or roommate."
        />
        {membership.role === "owner" ? (
          <form action={createInviteLink} className="flex flex-wrap items-center gap-2">
            <button className={btnPrimaryClassName} type="submit">
              Create invite link
            </button>
            {query.invite ? (
              <p className="text-sm text-foreground">
                Share:{" "}
                <Link href={`/app/invites/${query.invite}`}>
                  {`/app/invites/${query.invite}`}
                </Link>
              </p>
            ) : null}
          </form>
        ) : (
          <p className="text-sm text-muted">
            Only household owners can create invites.
          </p>
        )}
      </Card>

      <Card>
        <SectionTitle
          title="Current bills"
          subtitle="Mark payments complete for this month."
        />
        <div className="space-y-3">
          {states.length === 0 ? (
            <p className="text-sm text-muted">
              No bills yet.{" "}
              <Link href="/app/bills">Add your first bill</Link>.
            </p>
          ) : (
            states.map((bill) => (
              <div
                key={bill.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface/50 p-3"
              >
                <div>
                  <p className="font-medium text-foreground">{bill.title}</p>
                  <p className="text-sm text-muted">
                    Due day {bill.due_day} •{" "}
                    {formatCurrency(Number(bill.amount), bill.currency)}
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
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-badge px-2 py-1 text-xs font-medium uppercase tracking-wide text-foreground ring-1 ring-border">
                    {bill.status}
                  </span>
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
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
