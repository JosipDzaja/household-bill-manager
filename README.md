# Household Bill Manager (MVP)

Web app for managing a shared household’s bills: add bills, track due dates, and mark payments as complete.

## MVP Scope (V1)
- **Auth**: Email/password signup + login + password reset.
- **Household**: One user belongs to one household (MVP simplification). Household has multiple members.
- **Bills**: Create/edit/archive bills with amount, due date, recurrence.
- **Recurrence (V1)**: Monthly only.
- **Payments**: Mark bill as paid, store payment date + optional note, show payment history.
- **Dashboard**: Upcoming / Due soon / Overdue / Paid this month.

## Explicitly Out of Scope (for speed)
- Bank/transaction integrations.
- Automatic bill detection or payment matching.
- Advanced budgeting/analytics and multi-currency conversion.
- Native mobile apps (responsive web only).

## Tech Stack
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind
- **Backend**: Supabase (Postgres + Auth + RLS)
- **Hosting**: Vercel (frontend) + Supabase (backend)

## Local Development
1. Install deps:

```bash
npm install
```

2. Create `.env.local` (see `.env.example`).
3. Run dev server:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Database
Schema + RLS are provided under `supabase/` in SQL form so you can apply them to your Supabase project.

Apply `supabase/migrations/0001_household_bill_manager.sql` in your Supabase SQL editor.

## Deploy
- Frontend: deploy this repo to Vercel.
- Backend: create a Supabase project, run the migration SQL, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel env vars.
- Ensure Supabase Auth email provider is configured for password reset emails.

## Smoke Test Checklist
- Sign up a new user, then sign in.
- Create household on first login.
- Add monthly bill, verify it appears in `/app` and `/app/bills`.
- Mark bill paid/unpaid from dashboard.
- Generate invite link as owner and accept from second account.
- Archive a bill and verify it no longer appears as active.
