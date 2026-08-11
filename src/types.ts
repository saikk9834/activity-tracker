/** A calendar day in `YYYY-MM-DD` form, always in the user's local timezone. */
export type ISODate = string;

/** Stable id of an exercise inside the plan, e.g. `"a1"`. */
export type ExerciseId = string;

export type DayTag = 'lift' | 'swim' | 'rest';

export interface Exercise {
  id: ExerciseId;
  name: string;
  /** Sets/reps/rest prescription, shown under the name. */
  detail: string;
  /** Default starting weight, or `null` for bodyweight / swim work. */
  weight: string | null;
}

export interface PlanDay {
  name: string;
  tag: DayTag;
  tagLabel: string;
  title: string;
  duration: string;
  note: string;
  /** Progression rule shown in the highlighted box, when the day has one. */
  progression: string | null;
  items: Exercise[];
}

export interface Milestone {
  days: number;
  quote: string;
}

export type TabId = 'today' | 'week' | 'guide' | 'food' | 'stats';
