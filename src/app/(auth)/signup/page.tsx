import { GoogleOAuthGlyph } from "@/components/google-oauth-glyph";
import { btnPrimaryClassName, inputClassName } from "@/components/ui";
import Link from "next/link";
import { signInWithGoogle, signUp } from "../actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-muted">
          Start managing your household bills in minutes.
        </p>
      </div>

      {query.error ? (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800 ring-1 ring-red-200/80">
          {query.error}
        </p>
      ) : null}

      <form action={signUp} className="space-y-3">
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
        <label className="block text-sm">
          Password
          <input
            name="password"
            type="password"
            minLength={6}
            required
            className={inputClassName}
            autoComplete="new-password"
          />
        </label>
        <button type="submit" className={`w-full ${btnPrimaryClassName}`}>
          Create account
        </button>
      </form>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs font-medium uppercase tracking-wide text-muted">
          <span className="bg-card px-2">Or</span>
        </div>
      </div>

      <form action={signInWithGoogle} className="space-y-3">
        <input type="hidden" name="from" value="signup" />
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-strong bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
        >
          <GoogleOAuthGlyph />
          Continue with Google
        </button>
      </form>

      <p className="text-sm text-muted">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
