import { btnPrimaryClassName, inputClassName } from "@/components/ui";
import Link from "next/link";
import { sendResetPassword } from "../actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const query = await searchParams;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="text-sm text-muted">
          We will send you a reset link by email.
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

      <form action={sendResetPassword} className="space-y-3">
        <label className="block text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            className={inputClassName}
            autoComplete="email"
          />
        </label>
        <button type="submit" className={`w-full ${btnPrimaryClassName}`}>
          Send reset link
        </button>
      </form>

      <p className="text-sm text-muted">
        <Link href="/login">Back to sign in</Link>
      </p>
    </div>
  );
}
