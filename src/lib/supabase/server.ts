import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}

export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});
