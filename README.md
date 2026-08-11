# Streakline

A 12-week lean-plan tracker: today's session as a checklist, the weekly template, a
lifting/nutrition guide, and a streak calendar. React + TypeScript on Vite, with accounts
and storage on Supabase.

Converted from the original single-file `streakline.html`, which is kept in the repo for
reference.

## Setup

```bash
npm install
```

**1. Create a Supabase project** at [supabase.com](https://supabase.com).

**2. Create the tables.** Open Dashboard → SQL Editor → New query, paste the contents of
`supabase/migrations/0001_init.sql`, and run it. That creates three tables and turns on
row-level security with an `auth.uid() = user_id` policy on each, so a signed-in user can
only ever touch their own rows.

**3. Add credentials.** Copy `.env.example` to `.env` and fill in the two values from
Project Settings → API:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

The anon key belongs in the browser — it's public by design and constrained by RLS. Never
put the `service_role` key in this file; it bypasses RLS entirely.

**4. Email confirmation.** New projects require users to click a confirmation link before
they can sign in. The signup form handles that ("check your inbox"), but for local
development it's easier to turn it off: Authentication → Providers → Email → uncheck
*Confirm email*. Leave it on in production.

```bash
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run typecheck
npm run preview    # serve the built bundle
```

Without `.env`, the app shows setup instructions instead of a blank screen. Vite only reads
env files at startup, so restart the dev server after editing `.env`.

## Layout

```
src/
  main.tsx                 entry — AuthProvider wraps AuthGate
  components/AuthGate.tsx  decides: setup screen / login screen / the app
  App.tsx                  tab shell for a signed-in user
  types.ts                 domain types (PlanDay, Exercise, Milestone, ISODate…)
  data/                    static content: the weekly PLAN, MILESTONES, toasts
  lib/                     pure date + streak math; the Supabase client and DB types
  storage/                 persistence behind an interface  ← swap here, not in components
  state/                   AuthProvider, TrackerProvider (data), FeedbackProvider (toast/modal)
  hooks/                   useToday (midnight rollover), useCompleteDay
  components/              Header, Tabs, WeightChip, VideoLinkRow, AuthScreen, …
  views/                   one file per tab — Today, Week, Guide, Food, Stats
  styles.css               the original stylesheet plus auth/account styles
supabase/migrations/       SQL to run in the dashboard
```

Import with the `@/` alias (`@/lib/streak`), configured in `vite.config.ts` and
`tsconfig.app.json`.

Three rules keep this easy to grow: `lib/` stays pure so it can run on a server too,
components never talk to Supabase directly, and each tab is its own file.

## How accounts fit together

`AuthProvider` holds the Supabase session and exposes `signUp` / `signIn` / `signOut` /
`sendPasswordReset`. It subscribes to `onAuthStateChange`, so a session that expires or is
refreshed in another tab propagates on its own.

`AuthGate` renders the login screen until there's a session, then mounts the app with a
`SupabaseTrackerRepository` scoped to that user id. Every component still talks only to
`TrackerRepository` (`src/storage/types.ts`) — they don't know Supabase exists, which is
what made adding accounts a change in one directory.

**Migration from the pre-account version.** On first sign-in, `migrateLocalDataIfNeeded`
copies anything in `localStorage` (from the original single-file app) into the account,
once per user id. The local copy is left in place as a backup; only a `sl_migrated_<id>`
flag is written, so a failed run retries on the next sign-in.

### Data model

| Table | Holds |
|---|---|
| `logged_days` | one row per completed day — the "X" |
| `day_checks` | one row per exercise ticked on a given day |
| `exercise_settings` | per-user working weight and form-check video per exercise |

Streak math lives in `src/lib/streak.ts` and has no dependencies, so it can run in an edge
function too if you ever compute streaks server-side.

## Adding more features

- **A new tab:** a file in `views/` plus an entry in `TABS` (`src/components/Tabs.tsx`).
- **New persisted state:** a field on `TrackerData`, a method on `TrackerRepository`, an
  implementation in `SupabaseTrackerRepository`, and a table + RLS policy in a new
  `supabase/migrations/000N_*.sql`.
- **Profile fields** (display name, bodyweight history): a `profiles` table keyed by
  `auth.users.id` with the same `auth.uid() = user_id` policy.
- **Social / OAuth login:** add the provider in the Supabase dashboard and call
  `supabase.auth.signInWithOAuth` from `AuthProvider` — the gate needs no changes.
