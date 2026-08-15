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

**2. Create the tables.** Open Dashboard → SQL Editor → New query and run each file in
`supabase/migrations/` in order (`0001_init.sql`, `0002_profiles.sql`, then
`0003_day_notes.sql`). Every table
gets row-level security with an `auth.uid() = user_id` policy, so a signed-in user can only
ever touch their own rows.

**3. Add credentials.** Create a `.env` with the two values from Project Settings → API:

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

## The coach (AI chat)

The **Coach** tab answers questions about the user's own training — today's
session, streak and attendance patterns, whether to add weight, how to scale a
session. It runs on Claude (`claude-opus-5`) through a Vercel Function at
`/api/chat`.

It sees the last 28 days of attendance *and* the per-exercise comments from that
window, which is what makes progression advice specific: "lifted 25 instead of
20 kg" is the signal a bare checkmark can't carry.

**The Anthropic API key never reaches the browser.** Vite inlines every `VITE_*`
variable into the client bundle, so a key there would be public — which is
exactly why the key must *not* carry that prefix. As a plain Vercel environment
variable it is only readable server-side. The browser posts to `/api/chat` with
the user's Supabase access token; the function holds the key, reads that user's
rows with the same token (so row-level security still decides what's visible —
the service-role key is deliberately unused), and calls Claude server-side.

```
browser ──access token──▶ /api/chat (Vercel) ──ANTHROPIC_API_KEY──▶ Claude
                                │
                                └── reads logged_days / day_checks / day_notes /
                                    exercise_settings / profiles under RLS
```

### Setup

Add one environment variable in **Vercel → Project → Settings → Environment
Variables**, then redeploy:

```
ANTHROPIC_API_KEY = sk-ant-...        # from console.anthropic.com
```

**No `VITE_` prefix** — that prefix is what would publish it to the browser.

The function also needs the Supabase URL and anon key. It falls back to the
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` you already have set for the
client build, so there is normally nothing else to add. To keep the server's
config separate, set `SUPABASE_URL` and `SUPABASE_ANON_KEY` as well — they take
precedence.

**Local development:** `npm run dev` serves the app but not `/api`, so the Coach
tab will report that it can't reach the coach. Run `vercel dev` instead (needs
the Vercel CLI) to serve both on one origin.

### How it's put together

| Piece | What it does |
|---|---|
| `api/chat.ts` | Auth gate, request validation, the Claude call, error mapping |
| `api/_context.ts` | Turns the user's rows into the data half of the system prompt |
| `src/lib/coach.ts` | Client-side caller (`fetch('/api/chat')`) |
| `src/views/CoachView.tsx` | The chat UI |

Files under `api/` prefixed with `_` are modules, not routes — Vercel doesn't
expose them as endpoints. The handler uses the Web `Request`/`Response`
signature, so it needs no Vercel-specific types.

The function imports `src/data/plan.ts` and `src/lib/streak.ts` directly, so the
coach's view of the plan and the streak math are the *same code* the UI uses and
can't drift.

The system prompt is two blocks: stable instructions plus the plan (with a
`cache_control` breakpoint, so repeat questions in a session read from cache
instead of re-billing ~5.7K tokens), then the user's current data. Requests use
`effort: "medium"` — the dataset is small and the questions are everyday ones —
and `fallbacks: "default"`, so a request Claude's safety classifiers decline gets
re-run on Anthropic's recommended fallback model instead of erroring.

Conversation history lives in React state only, so it resets on reload.

### Natural next steps

- **Streaming** — replies currently arrive all at once behind a typing
  indicator. Streaming the SSE through the function is the biggest UX win.
- **Tools instead of a data dump** — right now every request ships a fixed
  context block. Giving Claude tools (`get_history(range)`, `get_weights()`)
  would let it pull only what a question needs and reach further back.
- **Persisted conversations** — a `chat_messages` table keyed by `user_id`,
  same RLS pattern as everything else.
- **A spend cap** — nothing currently limits how many questions a user can ask.

## Layout

```
src/
  main.tsx                 entry — AuthProvider wraps AuthGate
  components/AuthGate.tsx  decides: setup screen / login screen / the app
  App.tsx                  tab shell for a signed-in user
  types.ts                 domain types (PlanDay, Exercise, Milestone, ISODate…)
  data/                    static content: the weekly PLAN, MILESTONES, toasts
  lib/                     pure date, streak and body math; the Supabase client and DB types
  storage/                 persistence behind an interface  ← swap here, not in components
  state/                   AuthProvider, TrackerProvider (data), FeedbackProvider (toast/modal)
  hooks/                   useToday (midnight rollover), useCompleteDay
  components/              Header, Tabs, WeightChip, VideoLinkRow, ExerciseNote, DayEditor, AuthScreen, …
  views/                   one file per tab — Today, Week, Coach, Guide, Food, Stats, Profile
  styles.css               the original stylesheet plus auth/account/chat styles
supabase/migrations/       SQL to run in the dashboard
api/                       Vercel Functions — the AI coach's server side
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
| `day_notes` | the user's optional comment on one exercise on one day |
| `exercise_settings` | per-user working weight and form-check video per exercise |
| `profiles` | name, age, gender, height, weight — one row per user |

### Derived numbers

The Guide and Food tabs don't hardcode targets; `src/lib/body.ts` computes them from the
profile:

- **BMI** — weight / height², with the standard category labels.
- **TDEE** — Mifflin-St Jeor BMR × 1.375 (desk job plus this plan's sessions), rounded to
  the nearest 50. Gender changes the formula's constant; "prefer not to say" splits the
  difference between the male and female values.
- **Calorie target** — TDEE minus 200–300.
- **Protein target** — 1.6–1.8 g/kg, rounded out to the nearest 10 g.

Until a profile is saved, both tabs fall back to `DEFAULT_PROFILE`
(`src/data/profileDefaults.ts`), which reproduces the figures the plan was originally
written around: 82 kg at 183 cm → BMI 24.5, ~2,500 kcal, 2,200–2,300 kcal, 130–150 g.

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
