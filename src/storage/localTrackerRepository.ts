import type { ExerciseId, ISODate } from '@/types';
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
      weights: read('weights', EMPTY_DATA.weights),
      links: read('links', EMPTY_DATA.links),
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
}
