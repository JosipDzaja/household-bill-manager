import { getAuthUser, getMembership } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BillTable } from "./bill-table";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    tag?: string;
    payer?: string;
    search?: string;
  }>;
}) {
  const {
    data: { user },
  } = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await getMembership(user.id);

  if (!membership) {
    redirect("/onboarding");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Bills dashboard</h2>
        <p className="text-sm text-muted">
          Filter and manage all active household bills.
        </p>
      </div>
      <BillTable
        householdId={membership.household_id}
        searchParamsPromise={searchParams}
      />
    </div>
  );
}
