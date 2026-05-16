import { btnPrimaryClassName } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { acceptInvite } from "../../actions";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=Sign in to accept invite&next=/app/invites/${token}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_rgb(28_25_23/0.06),0_4px_12px_rgb(28_25_23/0.04)]">
        <h2 className="text-xl font-semibold">Join household</h2>
        <p className="mt-1 text-sm text-muted">
          Accept this invite to join the shared household bill workspace.
        </p>
        <form
          action={async () => {
            "use server";
            await acceptInvite(token);
          }}
          className="mt-4"
        >
          <button type="submit" className={btnPrimaryClassName}>
            Accept invite
          </button>
        </form>
      </div>
    </div>
  );
}
