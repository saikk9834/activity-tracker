import { LocalTrackerRepository } from './localTrackerRepository';
import { SupabaseTrackerRepository } from './supabaseTrackerRepository';
import type { TrackerRepository } from './types';

export * from './types';
export { LocalTrackerRepository } from './localTrackerRepository';
export { SupabaseTrackerRepository } from './supabaseTrackerRepository';
export { migrateLocalDataIfNeeded } from './migrateLocalData';

/**
 * Single place that decides where data lives. Signed-in users go to Supabase;
 * the local repository is kept for tests and for the one-time migration of data
 * saved before accounts existed.
 */
export function createRepository(userId: string | null): TrackerRepository {
  return userId ? new SupabaseTrackerRepository(userId) : new LocalTrackerRepository();
}
