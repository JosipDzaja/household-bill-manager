@AGENTS.md

# Household Bill Manager

Shared household bills: create/track bills, record payments, manage household membership, AI-assisted bill scanning via photo upload.

## Tech Stack

- **Next.js 16.2.1** — App Router, Server Components, Server Actions (see AGENTS.md)
- **React 19.2.4**
- **Tailwind CSS v4** — PostCSS plugin (`@tailwindcss/postcss`), not the v3 CLI
- **Zod v4** — breaking API changes from v3; check docs before using
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) — Postgres + Auth + RLS
- **OpenAI SDK v6** — server-side only, bill photo scanning
- **date-fns v4**

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY   # preferred (new publishable key)
NEXT_PUBLIC_SUPABASE_ANON_KEY                  # legacy fallback
OPENAI_API_KEY                                 # server-only — never add NEXT_PUBLIC_ prefix
```

See `.env.example`.

## Dev

```bash
npm run dev   # http://localhost:3000
```

## Architecture

### Supabase clients

- **Server:** `createClient()` from `src/lib/supabase/server.ts` — async, awaits cookies
- **Browser:** `createBrowserClient()` from `src/lib/supabase/browser.ts`
- **Cached helpers:** `getAuthUser()` and `getMembership()` in `server.ts` — use these instead of re-querying

### Server Actions

All actions live in `actions.ts` files co-located with their route. Every authenticated action starts with one of:

- `requireUser()` — redirects to `/login` if not authenticated
- `requireMembership()` — redirects to `/onboarding` if not in a household

Error convention: `redirect('/path?error=...')` — no thrown errors, no returned error objects. Success also uses `redirect()` with optional `?message=`. After mutations call `revalidatePath('/app')` and/or `revalidatePath('/app/bills')`.

### UI Components

`src/components/ui.tsx` — use and extend these; do not add shadcn or another component library:

- `Card` — content container
- `inputClassName`, `btnPrimaryClassName`, `btnSecondaryClassName` — exported className strings, compose with `cn()` from `src/lib/utils.ts`

### Route Structure

```
src/app/
  (auth)/          # login, signup, forgot-password — no sidebar
  app/             # all authenticated pages — app-nav.tsx sidebar
  onboarding/      # household creation on first login
  api/scan-bill/   # OpenAI bill scanning route handler
```

### Data Model

Key tables: `households`, `household_members` (role: `owner | member`), `bills` (`is_active` for archiving), `bill_payments`, `tags`, `bill_tags`, `invites`
