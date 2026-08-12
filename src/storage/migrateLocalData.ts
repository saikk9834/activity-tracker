import { LocalTrackerRepository } from './localTrackerRepository';
import type { TrackerData, TrackerRepository } from './types';

const flagKey = (userId: string) => `sl_migrated_${userId}`;

function isEmpty(data: TrackerData): boolean {
  return (
    Object.keys(data.done).length === 0 &&
    Object.keys(data.checks).length === 0 &&
    Object.keys(data.weights).length === 0 &&
    Object.keys(data.links).length === 0 &&
    data.profile === null
  );
}

/**
 * Copies whatever the browser-only version saved into the account, once per
 * user. The local copy is left untouched as a backup — only a flag is written,
 * so re-running is a no-op and a failed run is retried on the next sign-in.
 */
export async function migrateLocalDataIfNeeded(
  target: TrackerRepository,
  userId: string,
): Promise<number> {
  if (localStorage.getItem(flagKey(userId))) return 0;

  const local = await new LocalTrackerRepository().load();
  if (isEmpty(local)) {
    localStorage.setItem(flagKey(userId), new Date().toISOString());
    return 0;
  }

  let moved = 0;
  for (const [day, done] of Object.entries(local.done)) {
    if (!done) continue;
    await target.setDayDone(day, true);
    moved++;
  }
  for (const [day, ids] of Object.entries(local.checks)) {
    if (ids.length) await target.setChecks(day, ids);
  }
  for (const [exerciseId, weight] of Object.entries(local.weights)) {
    await target.setWeight(exerciseId, weight);
  }
  for (const [exerciseId, url] of Object.entries(local.links)) {
    await target.setLink(exerciseId, url);
  }
  if (local.profile) await target.saveProfile(local.profile);

  localStorage.setItem(flagKey(userId), new Date().toISOString());
  return moved;
}
