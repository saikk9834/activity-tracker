// Relative, not the `@/` alias — see the note in src/data/plan.ts.
import type { ISODate } from '../types.js';

/** Local-timezone `YYYY-MM-DD`. Never use `toISOString()` here — it shifts to UTC. */
export function iso(d: Date): ISODate {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Parsed at midday so DST shifts can't bump the date across a boundary. */
export function fromIso(key: ISODate): Date {
  return new Date(key + 'T12:00:00');
}

/** Index into PLAN: 0 = Monday … 6 = Sunday. */
export function planIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function formatLongDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
