import { btnPrimaryClassName, inputClassName } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createHousehold } from "../app/actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: member } = await supabase
    .from("household_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (member) {
    redirect("/app");
  }

  const query = await searchParams;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
        <div className="w-full rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_rgb(28_25_23/0.06),0_4px_12px_rgb(28_25_23/0.04)]">
          <h1 className="text-2xl font-semibold">Create your household</h1>
          <p className="mt-1 text-sm text-muted">
            You need a household before adding bills.
          </p>
          {query.error ? (
            <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-800 ring-1 ring-red-200/80">
              {query.error}
            </p>
          ) : null}
          <form action={createHousehold} className="mt-4 space-y-3">
            <label className="block text-sm">
              Household name
              <input
                name="household_name"
                required
                className={inputClassName}
                placeholder="Apartment 4B"
                autoComplete="organization"
              />
            </label>
            <button type="submit" className={`w-full ${btnPrimaryClassName}`}>
              Create household
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
