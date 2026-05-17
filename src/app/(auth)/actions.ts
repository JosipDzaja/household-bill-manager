"use server";

import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/safe-redirect";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const nextRaw = getString(formData, "next");
  const next = safeInternalPath(nextRaw) ?? "/app";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const q = new URLSearchParams({ error: error.message });
    const preserved = safeInternalPath(nextRaw);
    if (preserved) q.set("next", preserved);
    redirect(`/login?${q.toString()}`);
  }

  redirect(next);
}

export async function signUp(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Account created. You can now sign in.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function sendResetPassword(formData: FormData) {
  const email = getString(formData, "email");
  const supabase = await createClient();

  const h = await headers();
  const origin =
    h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/app/settings`,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/forgot-password?message=Reset link sent if that email exists.");
}

export async function signInWithGoogle(formData: FormData) {
  const nextRaw = getString(formData, "next");
  const next = safeInternalPath(nextRaw) ?? "/app";
  const fromSignup = getString(formData, "from") === "signup";
  const errorBase = fromSignup ? "/signup" : "/login";

  const h = await headers();
  const origin =
    h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });

  if (error) {
    const q = new URLSearchParams({ error: error.message });
    if (safeInternalPath(nextRaw)) q.set("next", nextRaw);
    redirect(`${errorBase}?${q.toString()}`);
  }

  if (data.url) {
    redirect(data.url);
  }

  const q = new URLSearchParams({ error: "Could not start Google sign-in." });
  if (safeInternalPath(nextRaw)) q.set("next", nextRaw);
  redirect(`${errorBase}?${q.toString()}`);
}
