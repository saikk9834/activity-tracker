// Relative, not the `@/` alias: this module is pulled into the Vercel Function,
// whose TypeScript build doesn't apply the app's path mapping.
import type { PlanDay } from '../types.js';

/**
 * The weekly template, indexed Monday..Sunday. It repeats for all 12 weeks.
 * When plans become per-account this moves behind the repository; for now it is
 * static content, so it lives here.
 */
export const PLAN: PlanDay[] = [
  {
    name: 'Monday',
    tag: 'lift',
    tagLabel: 'Lift',
    title: 'Workout A — Push',
    duration: '45–50 min',
    note: 'Warm-up: 5 min brisk incline walk + 1 light set of the first two moves.',
    progression: 'Hit the top of every rep range? Add 2.5 kg (or next dumbbell) next session.',
    items: [
      { id: 'a1', name: 'Goblet squat', detail: '3 × 10–12 · rest 2 min', weight: '12 kg' },
      { id: 'a2', name: 'Machine chest press', detail: '3 × 8–12 · rest 2 min', weight: '27.5 kg' },
      { id: 'a3', name: 'Incline dumbbell press', detail: '3 × 8–12 · rest 2 min', weight: '10 kg/hand' },
      { id: 'a4', name: 'Seated DB shoulder press', detail: '3 × 8–12 · rest 90 s', weight: '8 kg/hand' },
      { id: 'a5', name: 'Dumbbell lateral raise', detail: '3 × 12–15 · rest 60 s', weight: '5 kg' },
      { id: 'a6', name: 'Cable triceps pushdown', detail: '2 × 10–15 · rest 60 s', weight: '17.5 kg' },
      { id: 'a7', name: 'Forearm plank', detail: '3 × 30–45 s · rest 60 s', weight: null },
    ],
  },
  {
    name: 'Tuesday',
    tag: 'swim',
    tagLabel: 'Swim',
    title: 'Interval swim',
    duration: '~25 min',
    note: 'Recovered before the rest ends? Swim harder next round. 30 s not enough? Ease off a notch. This is the fat-loss engine — hard on purpose.',
    progression: null,
    items: [
      { id: 't1', name: 'Warm-up', detail: '2 lengths, very easy (4/10)', weight: null },
      { id: 't2', name: 'Main set', detail: '8 × (1 length @ 7/10 → rest 20–30 s)', weight: null },
      { id: 't3', name: 'Cool-down', detail: '1–2 lengths, dead easy', weight: null },
    ],
  },
  {
    name: 'Wednesday',
    tag: 'lift',
    tagLabel: 'Lift',
    title: 'Workout B — Pull',
    duration: '45–50 min',
    note: 'Warm-up: 5 min brisk incline walk + 1 light set of the first two moves.',
    progression: 'Hit the top of every rep range? Add 2.5 kg (or next dumbbell) next session.',
    items: [
      { id: 'b1', name: 'Romanian deadlift (dumbbells)', detail: '3 × 10–12 · rest 2 min', weight: '14 kg/hand' },
      { id: 'b2', name: 'Lat pulldown', detail: '3 × 8–12 · rest 2 min', weight: '37.5 kg' },
      { id: 'b3', name: 'Seated cable row', detail: '3 × 8–12 · rest 2 min', weight: '37.5 kg' },
      { id: 'b4', name: 'Facepull (cable)', detail: '3 × 12–15 · rest 60 s', weight: '17.5 kg' },
      { id: 'b5', name: 'Dumbbell curl', detail: '2 × 10–15 · rest 60 s', weight: '7.5 kg/hand' },
      { id: 'b6', name: 'Deadbug', detail: '3 × 8/side · rest 60 s', weight: null },
      { id: 'b7', name: 'Hanging knee raise', detail: '2 × 8–12 · rest 90 s', weight: null },
    ],
  },
  {
    name: 'Thursday',
    tag: 'swim',
    tagLabel: 'Swim',
    title: 'Recovery swim + core',
    duration: '~30 min',
    note: 'Deliberately the easiest session of the week. No counting, no targets — and no turning it into a workout: Friday needs fresh legs.',
    progression: null,
    items: [
      { id: 'h1', name: 'Easy swim', detail: '15–20 min @ 4–5/10, rest whenever', weight: null },
      { id: 'h2', name: 'Core circuit', detail: '3 × (deadbug 8/side · side plank 20 s/side · hollow hold 15 s)', weight: null },
    ],
  },
  {
    name: 'Friday',
    tag: 'lift',
    tagLabel: 'Lift',
    title: 'Workout C — Legs + full body',
    duration: '45–50 min',
    note: 'Warm-up: 5 min brisk incline walk + 1 light set of the first two moves.',
    progression: 'Hit the top of every rep range? Add 5 kg on leg press/machines, 2.5 kg elsewhere.',
    items: [
      { id: 'c1', name: 'Leg press', detail: '3 × 10–12 · rest 2 min', weight: '70 kg' },
      { id: 'c2', name: 'Leg curl machine', detail: '3 × 10–15 · rest 90 s', weight: '27.5 kg' },
      { id: 'c3', name: 'Step-ups onto bench', detail: '3 × 8/leg · rest 90 s', weight: '7 kg/hand' },
      { id: 'c4', name: 'Standing calf raise', detail: '3 × 12–15 · rest 60 s', weight: '40 kg' },
      { id: 'c5', name: 'Machine chest fly or push-ups', detail: '2 × 10–15 · rest 90 s', weight: '20 kg' },
      { id: 'c6', name: 'Cable woodchoppers', detail: '3 × 10/side · rest 60 s', weight: '12.5 kg' },
      { id: 'c7', name: 'Side plank', detail: '2 × 20–30 s/side · rest 60 s', weight: null },
    ],
  },
  {
    name: 'Saturday',
    tag: 'swim',
    tagLabel: 'Swim',
    title: 'Pyramid swim',
    duration: '~30 min',
    note: 'All at a steady 6–7/10 — a pace you could hold, not a sprint. Add a length to the peak every 2 weeks.',
    progression: null,
    items: [
      { id: 's1', name: 'Pyramid up', detail: '1 → 2 → 3 → 4 lengths · 30 s rest between', weight: null },
      { id: 's2', name: 'Pyramid down', detail: '3 → 2 → 1 lengths · 30 s rest between', weight: null },
    ],
  },
  {
    name: 'Sunday',
    tag: 'rest',
    tagLabel: 'Active rest',
    title: 'Walk + stretch',
    duration: '45–60 min',
    note: 'Outside, podcast on. Rest days are part of the program — muscle is built here, not in the gym.',
    progression: null,
    items: [
      { id: 'r1', name: 'Walk', detail: '45–60 min, easy pace', weight: null },
      { id: 'r2', name: 'Stretch', detail: '10 min full body', weight: null },
    ],
  },
];

const ITEMS_BY_ID = new Map(PLAN.flatMap((day) => day.items).map((item) => [item.id, item]));

export function findExercise(id: string) {
  return ITEMS_BY_ID.get(id);
}
