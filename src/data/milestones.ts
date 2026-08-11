import type { Milestone } from '@/types';

export const MILESTONES: Milestone[] = [
  { days: 1, quote: 'Day one is the hardest rep of the whole program. It’s done.' },
  { days: 3, quote: 'Three days. The couch gap between laptop and gym bag is losing.' },
  { days: 7, quote: 'A full week of X’s. Every one is a vote for the person you’re becoming.' },
  { days: 14, quote: 'Two weeks. Your nervous system is learning fast — the mirror is next.' },
  { days: 30, quote: 'One month. You’re not starting anymore. You’re continuing.' },
  { days: 60, quote: 'Two months. This is the week people start noticing. Let them.' },
  { days: 90, quote: 'Twelve weeks — the whole arc you planned. Open the logbook and look at week one.' },
  { days: 180, quote: 'Six months. Abs territory. The kitchen got you here — keep it honest.' },
  { days: 365, quote: 'One year of showing up. The habit isn’t the plan anymore. It’s you.' },
];

export const TOASTS: string[] = [
  'Logged. Attendance is the habit.',
  'Another X on the calendar.',
  'Showed up. That was the whole job.',
  'Logbook fed. See you tomorrow.',
];

export function milestoneFor(streak: number): Milestone | null {
  return MILESTONES.find((m) => m.days === streak) ?? null;
}

export function nextMilestoneAfter(streak: number): Milestone | null {
  return MILESTONES.find((m) => m.days > streak) ?? null;
}

export function randomToast(): string {
  return TOASTS[Math.floor(Math.random() * TOASTS.length)] ?? TOASTS[0]!;
}
