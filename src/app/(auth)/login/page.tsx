import { GoogleOAuthGlyph } from "@/components/google-oauth-glyph";
import { btnPrimaryClassName, inputClassName } from "@/components/ui";
import { safeInternalPath } from "@/lib/safe-redirect";
import Link from "next/link";
import { signIn, signInWithGoogle } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const query = await searchParams;
  const error = query.error;
  const message = query.message;
  const next = query.next;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted">Access your household dashboard.</p>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800 ring-1 ring-red-200/80">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800 ring-1 ring-emerald-200/80">
          {message}
        </p>
      ) : null}

      <form action={signIn} className="space-y-3">
        {safeInternalPath(next) ? (
          <input type="hidden" name="next" value={next} />
        ) : null}
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
            required
            className={inputClassName}
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className={`w-full ${btnPrimaryClassName}`}>
          Sign in
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
        {safeInternalPath(next) ? (
          <input type="hidden" name="next" value={next} />
        ) : null}
        <input type="hidden" name="from" value="login" />
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-strong bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
        >
          <GoogleOAuthGlyph />
          Continue with Google
        </button>
      </form>

      <div className="text-sm text-muted">
        <Link href="/forgot-password">Forgot password?</Link>
        <span className="mx-2 text-muted">•</span>
        <Link href="/signup">Create account</Link>
      </div>
    </div>
  );
}
