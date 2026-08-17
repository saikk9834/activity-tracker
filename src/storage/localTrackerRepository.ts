import type { ExerciseId, ISODate, Profile } from '@/types';
import { EMPTY_DATA, type TrackerData, type TrackerRepository } from './types';

/** Same keys the original single-file version used, so existing data carries over. */
const PREFIX = 'sl_';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw) as T | null;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* private mode / quota — ignore, the in-memory state still works */
  }
}

/**
 * Browser-only persistence. Reads the whole blob on load, then writes the one
 * bucket that changed. Mutations return promises purely so the interface can be
 * satisfied by a network-backed implementation later.
 */
export class LocalTrackerRepository implements TrackerRepository {
  async load(): Promise<TrackerData> {
    return {
      done: read('done', EMPTY_DATA.done),
      checks: read('checks', EMPTY_DATA.checks),
      notes: read('notes', EMPTY_DATA.notes),
      substitutions: read('substitutions', EMPTY_DATA.substitutions),
      weights: read('weights', EMPTY_DATA.weights),
      links: read('links', EMPTY_DATA.links),
      profile: read('profile', EMPTY_DATA.profile),
    };
  }

  async setDayDone(date: ISODate, done: boolean): Promise<void> {
    const map = read('done', { ...EMPTY_DATA.done });
    if (done) map[date] = true;
    else delete map[date];
    write('done', map);
  }

  async setChecks(date: ISODate, exerciseIds: ExerciseId[]): Promise<void> {
    const map = read('checks', { ...EMPTY_DATA.checks });
    map[date] = exerciseIds;
    write('checks', map);
  }

  async setNote(date: ISODate, exerciseId: ExerciseId, note: string | null): Promise<void> {
    const map = read('notes', { ...EMPTY_DATA.notes });
    const forDay = { ...map[date] };
    if (note) forDay[exerciseId] = note;
    else delete forDay[exerciseId];
    if (Object.keys(forDay).length) map[date] = forDay;
    else delete map[date];
    write('notes', map);
  }

  async setSubstitution(date: ISODate, activity: string | null): Promise<void> {
    const map = read('substitutions', { ...EMPTY_DATA.substitutions });
    if (activity) map[date] = activity;
    else delete map[date];
    write('substitutions', map);
  }

  async setWeight(exerciseId: ExerciseId, weight: string): Promise<void> {
    const map = read('weights', { ...EMPTY_DATA.weights });
    map[exerciseId] = weight;
    write('weights', map);
  }

  async setLink(exerciseId: ExerciseId, url: string | null): Promise<void> {
    const map = read('links', { ...EMPTY_DATA.links });
    if (url) map[exerciseId] = url;
    else delete map[exerciseId];
    write('links', map);
  }

  async saveProfile(profile: Profile): Promise<void> {
    write('profile', profile);
  }
}
