import type { ExerciseId, ISODate, Profile } from '@/types';

/** Everything the app persists for one user. */
export interface TrackerData {
  /** Days marked complete: `{ "2026-08-11": true }` */
  done: Record<ISODate, boolean>;
  /** Ticked exercises per day: `{ "2026-08-11": ["a1", "a2"] }` */
  checks: Record<ISODate, ExerciseId[]>;
  /** User's working weight, overriding the plan default: `{ "a1": "14 kg" }` */
  weights: Record<ExerciseId, string>;
  /** Form-check video links per exercise. */
  links: Record<ExerciseId, string>;
  /** Body stats, or null when the user hasn't filled the profile in yet. */
  profile: Profile | null;
}

export const EMPTY_DATA: TrackerData = {
  done: {},
  checks: {},
  weights: {},
  links: {},
  profile: null,
};

/**
 * The only way the UI touches persistence. Every method is async so that
 * swapping `LocalTrackerRepository` for an HTTP-backed one (once there are
 * accounts) requires no component changes — see README.md.
 */
export interface TrackerRepository {
  load(): Promise<TrackerData>;
  setDayDone(date: ISODate, done: boolean): Promise<void>;
  setChecks(date: ISODate, exerciseIds: ExerciseId[]): Promise<void>;
  setWeight(exerciseId: ExerciseId, weight: string): Promise<void>;
  /** `null` removes the link. */
  setLink(exerciseId: ExerciseId, url: string | null): Promise<void>;
  saveProfile(profile: Profile): Promise<void>;
}
