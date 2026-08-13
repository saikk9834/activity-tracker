import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PLAN } from '../src/data/plan';
import { addDays, iso, planIndex } from '../src/lib/date';
import { bestStreak, currentStreak, totalSessions } from '../src/lib/streak';
import type { DoneMap } from '../src/lib/streak';

/**
 * Files prefixed with `_` are not routed as endpoints by Vercel, so this is a
 * plain module the handler imports.
 *
 * Everything here reuses the app's own `src/lib` modules — the serverless
 * function and the browser share one implementation of the streak math and one
 * copy of the plan, so they cannot drift.
 */

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** How far back the attendance history and the session comments both reach. */
const HISTORY_DAYS = 28;
/** Hard ceiling on comments pulled into the prompt, newest window first. */
const MAX_NOTES = 120;

/**
 * Server-side Supabase config. Vercel already has the `VITE_`-prefixed values
 * for the client build, so those are the fallback — only ANTHROPIC_API_KEY has
 * to be added. Both are public by design; the secret is the Anthropic key.
 */
export function supabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

/**
 * A client bound to the caller's access token, so every query runs under
 * row-level security. The service-role key is deliberately never used.
 */
export function clientForToken(url: string, anonKey: string, authorization: string): SupabaseClient {
  return createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** The weekly schedule, rendered from the same PLAN the app displays. */
export function planSchedule(): string {
  return PLAN.map((day) => {
    const items = day.items
      .map((i) => `${i.name} (${i.detail}${i.weight ? `, default ${i.weight}` : ''})`)
      .join('; ');
    return `- ${day.name} — ${day.title} [${day.tagLabel}, ${day.duration}]: ${items}. ${day.note}`;
  }).join('\n');
}

interface ProfileRow {
  name: string | null;
  age: number | null;
  gender: string | null;
  height_cm: number | string | null;
  weight_kg: number | string | null;
}

const num = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Builds the "here is this user's actual data" half of the system prompt. */
export async function buildUserContext(
  supabase: SupabaseClient,
  todayKey: string,
): Promise<string> {
  const today = new Date(todayKey + 'T12:00:00');
  const historyStart = iso(addDays(today, -(HISTORY_DAYS - 1)));

  const [days, checks, notes, settings, profile] = await Promise.all([
    supabase.from('logged_days').select('day'),
    supabase.from('day_checks').select('day, exercise_id'),
    // Same window as the attendance history below — enough for the coach to
    // spot a trend without dragging a year of comments into every prompt.
    supabase
      .from('day_notes')
      .select('day, exercise_id, note')
      .gte('day', historyStart)
      .lte('day', todayKey)
      .order('day', { ascending: true })
      .limit(MAX_NOTES),
    supabase.from('exercise_settings').select('exercise_id, weight'),
    supabase.from('profiles').select('name, age, gender, height_cm, weight_kg').maybeSingle(),
  ]);

  const failure = days.error ?? checks.error ?? notes.error ?? settings.error ?? profile.error;
  if (failure) throw new Error(failure.message);

  const done: DoneMap = {};
  for (const row of (days.data ?? []) as { day: string }[]) done[row.day] = true;

  const lines: string[] = [];

  // ---- profile ----
  const p = (profile.data ?? null) as ProfileRow | null;
  const heightCm = num(p?.height_cm);
  const weightKg = num(p?.weight_kg);
  if (p) {
    const bits = [
      p.name ? `name ${p.name}` : null,
      p.age ? `age ${p.age}` : null,
      p.gender && p.gender !== 'unspecified' ? `gender ${p.gender}` : null,
      heightCm ? `height ${heightCm} cm` : null,
      weightKg ? `weight ${weightKg} kg` : null,
    ].filter(Boolean);
    lines.push(`Profile: ${bits.length ? bits.join(', ') : 'not filled in yet'}.`);
    if (heightCm && weightKg) {
      lines.push(`BMI: ${(weightKg / (heightCm / 100) ** 2).toFixed(1)}.`);
    }
  } else {
    lines.push('Profile: not filled in yet.');
  }

  // ---- attendance ----
  const todaysPlan = PLAN[planIndex(today)]!;
  lines.push(
    `Today is ${DAY_NAMES[planIndex(today)]} ${todayKey}. Today's scheduled session is "${todaysPlan.title}".`,
    `Current streak: ${currentStreak(done, today)} days. Best streak: ${bestStreak(done)} days. Total sessions logged: ${totalSessions(done)}.`,
    `Today is ${done[todayKey] ? 'already logged' : 'not logged yet'}.`,
  );

  // ---- recent history ----
  const recent: string[] = [];
  for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    recent.push(
      `${iso(d)} ${DAY_NAMES[planIndex(d)]!.slice(0, 3)} ${done[iso(d)] ? 'done' : 'missed'}`,
    );
  }
  lines.push(`Last ${HISTORY_DAYS} days (oldest first):\n${recent.join('\n')}`);

  // ---- weekday reliability over the last 12 weeks ----
  const byWeekday = DAY_NAMES.map(() => ({ done: 0, total: 0 }));
  for (let i = 0; i < 84; i++) {
    const d = addDays(today, -i);
    const slot = byWeekday[planIndex(d)]!;
    slot.total++;
    if (done[iso(d)]) slot.done++;
  }
  lines.push(
    `Attendance by weekday over the last 12 weeks: ${byWeekday
      .map((s, i) => `${DAY_NAMES[i]} ${s.done}/${s.total}`)
      .join(', ')}.`,
  );

  // ---- today's checklist ----
  const ticked = ((checks.data ?? []) as { day: string; exercise_id: string }[])
    .filter((r) => r.day === todayKey)
    .map((r) => r.exercise_id);
  const nameFor = (id: string) =>
    PLAN.flatMap((d) => d.items).find((i) => i.id === id)?.name ?? id;
  lines.push(
    ticked.length
      ? `Exercises ticked off today: ${ticked.map(nameFor).join(', ')}.`
      : 'No exercises ticked off today yet.',
  );

  // ---- session comments ----
  // What the user typed about how a given exercise actually went. Free text, so
  // it's fenced off and the system prompt tells the model to treat it as data.
  const noteRows = (notes.data ?? []) as { day: string; exercise_id: string; note: string }[];
  if (noteRows.length) {
    const byDay = new Map<string, string[]>();
    for (const row of noteRows) {
      const text = row.note.replace(/\s+/g, ' ').trim().slice(0, 300);
      if (!text) continue;
      const bucket = byDay.get(row.day) ?? [];
      bucket.push(`${nameFor(row.exercise_id)}: ${text}`);
      byDay.set(row.day, bucket);
    }
    const rendered = [...byDay.entries()].map(
      ([day, items]) =>
        `${day}${day === todayKey ? ' (today)' : ''} — ${items.join(' | ')}`,
    );
    lines.push(
      `The user's own comments on individual exercises, last ${HISTORY_DAYS} days (oldest first).`,
      `These say how a set actually went — a different weight, fewer reps, how it felt — and override the plan defaults and the saved working weight for that day:`,
      rendered.join('\n'),
    );
  } else {
    lines.push(`No per-exercise comments logged in the last ${HISTORY_DAYS} days.`);
  }

  // ---- working weights ----
  const weights = ((settings.data ?? []) as { exercise_id: string; weight: string | null }[])
    .filter((r) => r.weight)
    .map((r) => `${nameFor(r.exercise_id)} ${r.weight}`);
  lines.push(
    weights.length
      ? `Current working weights (these override the plan defaults): ${weights.join(', ')}.`
      : 'No custom working weights saved — still on the plan defaults.',
  );

  return lines.join('\n');
}
