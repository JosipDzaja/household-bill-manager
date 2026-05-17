import { btnPrimaryClassName, Card, SectionTitle } from "@/components/ui";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { addDays, isBefore } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createInviteLink } from "./actions";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; invite?: string }>;
}) {
  const {
    data: { user },
  } = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("household_members")
    .select("id, household_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  ).toISOString();

  const [{ data: household }, { data: bills }, { data: paidThisMonth }] =
    await Promise.all([
      supabase
        .from("households")
        .select("name")
        .eq("id", membership.household_id)
        .single(),
      supabase
        .from("bills")
        .select("id, due_date")
        .eq("household_id", membership.household_id)
        .eq("is_active", true),
      supabase
        .from("bill_payments")
        .select("id, bill_id")
        .gte("paid_at", monthStart)
        .lte("paid_at", monthEnd),
    ]);

  const dueSoonLimit = addDays(now, 7);
  const paidBillIds = new Set((paidThisMonth ?? []).map((p) => p.bill_id));

  let upcoming = 0;
  let dueSoon = 0;
  let overdue = 0;
  let paid = 0;

  for (const bill of bills ?? []) {
    if (paidBillIds.has(bill.id)) {
      paid++;
      continue;
    }
    const dueDate = new Date(bill.due_date + "T00:00:00");
    if (isBefore(dueDate, now)) {
      overdue++;
    } else if (
      isBefore(dueDate, dueSoonLimit) ||
      dueDate.getTime() === dueSoonLimit.getTime()
    ) {
      dueSoon++;
    } else {
      upcoming++;
    }
  }

  const query = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          {household?.name ?? "Household"}
        </h2>
        <p className="text-sm text-muted">
          Welcome back. Here&apos;s your billing overview for this month.
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
        <Link
          href="/app/dashboard?status=upcoming"
          className="no-underline"
        >
          <Card className="transition-shadow hover:shadow-md">
            <p className="text-sm text-muted">Upcoming</p>
            <p className="text-2xl font-semibold text-foreground">{upcoming}</p>
          </Card>
        </Link>
        <Link
          href="/app/dashboard?status=dueSoon"
          className="no-underline"
        >
          <Card className="transition-shadow hover:shadow-md">
            <p className="text-sm text-muted">Due soon</p>
            <p className="text-2xl font-semibold text-foreground">{dueSoon}</p>
          </Card>
        </Link>
        <Link
          href="/app/dashboard?status=overdue"
          className="no-underline"
        >
          <Card className="transition-shadow hover:shadow-md">
            <p className="text-sm text-muted">Overdue</p>
            <p className="text-2xl font-semibold text-foreground">{overdue}</p>
          </Card>
        </Link>
        <Link
          href="/app/dashboard?status=paid"
          className="no-underline"
        >
          <Card className="transition-shadow hover:shadow-md">
            <p className="text-sm text-muted">Paid this month</p>
            <p className="text-2xl font-semibold text-foreground">{paid}</p>
          </Card>
        </Link>
      </div>

      <div className="flex gap-3">
        <Link href="/app/dashboard" className={`${btnPrimaryClassName} no-underline`}>
          View all bills →
        </Link>
        <Link
          href="/app/bills"
          className="rounded-lg border border-border-strong bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm no-underline transition-colors hover:bg-surface"
        >
          Add a bill
        </Link>
      </div>

      <Card>
        <SectionTitle
          title="Invite household member"
          subtitle="Share a link with a partner or roommate."
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
    </div>
  );
}
