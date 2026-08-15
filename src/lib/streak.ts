// Relative, not the `@/` alias — see the note in src/data/plan.ts.
import type { ISODate } from '../types.js';
// `.js` extension: this module is also imported by the Vercel Function, which
// runs as native ESM. Vite resolves it to date.ts for the browser build.
import { addDays, daysBetween, fromIso, iso } from './date.js';

export type DoneMap = Record<ISODate, boolean>;

/** Length of the unbroken run of done days ending on (and including) `end`. */
export function streakEnding(done: DoneMap, end: Date): number {
  let n = 0;
  let d = end;
  while (done[iso(d)]) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/**
 * Today's streak. A day that hasn't been logged yet doesn't break the streak —
 * it only ends once yesterday is missed too.
 */
export function currentStreak(done: DoneMap, today: Date = new Date()): number {
  return done[iso(today)] ? streakEnding(done, today) : streakEnding(done, addDays(today, -1));
}

export function bestStreak(done: DoneMap): number {
  const keys = Object.keys(done)
    .filter((k) => done[k])
    .sort();
  let best = 0;
  let run = 0;
  let prev: ISODate | null = null;
  for (const k of keys) {
    run = prev && daysBetween(fromIso(prev), fromIso(k)) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = k;
  }
  return best;
}

export function totalSessions(done: DoneMap): number {
  return Object.keys(done).filter((k) => done[k]).length;
}
