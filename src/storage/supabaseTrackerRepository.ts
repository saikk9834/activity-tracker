import { supabase } from '@/lib/supabase';
import type { ExerciseId, Gender, ISODate, Profile } from '@/types';
import { EMPTY_DATA, MAX_NOTE_LENGTH, type TrackerData, type TrackerRepository } from './types';

function fail(context: string, error: { message: string } | null): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

const GENDERS: Gender[] = ['male', 'female', 'other', 'unspecified'];

/** numeric columns come back as strings from PostgREST when they're wide. */
function toNumber(value: number | string | null): number | null {
  if (value === null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toGender(value: string): Gender {
  return (GENDERS as string[]).includes(value) ? (value as Gender) : 'unspecified';
}

/**
 * Reads and writes the signed-in user's rows. `user_id` is set explicitly on
 * writes because row-level security checks it — the policies also make it
 * impossible to write a row for anyone else, so this is belt and braces.
 */
export class SupabaseTrackerRepository implements TrackerRepository {
  constructor(private readonly userId: string) {}

  async load(): Promise<TrackerData> {
    const [days, checks, notes, settings, profile] = await Promise.all([
      supabase.from('logged_days').select('day').eq('user_id', this.userId),
      supabase.from('day_checks').select('day, exercise_id').eq('user_id', this.userId),
      supabase.from('day_notes').select('day, exercise_id, note').eq('user_id', this.userId),
      supabase
        .from('exercise_settings')
        .select('exercise_id, weight, video_url')
        .eq('user_id', this.userId),
      // maybeSingle: a user with no profile row yet is expected, not an error.
      supabase
        .from('profiles')
        .select('name, age, gender, height_cm, weight_kg')
        .eq('user_id', this.userId)
        .maybeSingle(),
    ]);

    fail('Loading logged days', days.error);
    fail('Loading checklists', checks.error);
    fail('Loading your comments', notes.error);
    fail('Loading exercise settings', settings.error);
    fail('Loading your profile', profile.error);

    const data: TrackerData = {
      ...EMPTY_DATA,
      done: {},
      checks: {},
      notes: {},
      weights: {},
      links: {},
      profile: profile.data
        ? {
            name: profile.data.name ?? '',
            age: toNumber(profile.data.age),
            gender: toGender(profile.data.gender),
            heightCm: toNumber(profile.data.height_cm),
            weightKg: toNumber(profile.data.weight_kg),
          }
        : null,
    };

    for (const row of days.data ?? []) data.done[row.day] = true;

    for (const row of checks.data ?? []) {
      (data.checks[row.day] ??= []).push(row.exercise_id);
    }

    for (const row of notes.data ?? []) {
      (data.notes[row.day] ??= {})[row.exercise_id] = row.note;
    }

    for (const row of settings.data ?? []) {
      if (row.weight) data.weights[row.exercise_id] = row.weight;
      if (row.video_url) data.links[row.exercise_id] = row.video_url;
    }

    return data;
  }

  async setDayDone(date: ISODate, done: boolean): Promise<void> {
    if (done) {
      const { error } = await supabase
        .from('logged_days')
        .upsert({ user_id: this.userId, day: date }, { onConflict: 'user_id,day' });
      fail('Logging the day', error);
    } else {
      const { error } = await supabase
        .from('logged_days')
        .delete()
        .eq('user_id', this.userId)
        .eq('day', date);
      fail('Un-logging the day', error);
    }
  }

  async setChecks(date: ISODate, exerciseIds: ExerciseId[]): Promise<void> {
    // Insert first, then remove what's no longer ticked. A failure between the
    // two leaves an extra checkmark rather than silently losing one.
    if (exerciseIds.length > 0) {
      const { error } = await supabase.from('day_checks').upsert(
        exerciseIds.map((exercise_id) => ({ user_id: this.userId, day: date, exercise_id })),
        { onConflict: 'user_id,day,exercise_id' },
      );
      fail('Saving the checklist', error);
    }

    let query = supabase.from('day_checks').delete().eq('user_id', this.userId).eq('day', date);
    if (exerciseIds.length > 0) {
      const list = exerciseIds.map((id) => `"${id.replace(/"/g, '""')}"`).join(',');
      query = query.not('exercise_id', 'in', `(${list})`);
    }
    const { error } = await query;
    fail('Clearing unchecked items', error);
  }

  async setNote(date: ISODate, exerciseId: ExerciseId, note: string | null): Promise<void> {
    if (note) {
      const { error } = await supabase.from('day_notes').upsert(
        {
          user_id: this.userId,
          day: date,
          exercise_id: exerciseId,
          note: note.slice(0, MAX_NOTE_LENGTH),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,day,exercise_id' },
      );
      fail('Saving your comment', error);
    } else {
      const { error } = await supabase
        .from('day_notes')
        .delete()
        .eq('user_id', this.userId)
        .eq('day', date)
        .eq('exercise_id', exerciseId);
      fail('Removing your comment', error);
    }
  }

  async setWeight(exerciseId: ExerciseId, weight: string): Promise<void> {
    const { error } = await supabase.from('exercise_settings').upsert(
      { user_id: this.userId, exercise_id: exerciseId, weight, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,exercise_id' },
    );
    fail('Saving the weight', error);
  }

  async setLink(exerciseId: ExerciseId, url: string | null): Promise<void> {
    const { error } = await supabase.from('exercise_settings').upsert(
      {
        user_id: this.userId,
        exercise_id: exerciseId,
        video_url: url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,exercise_id' },
    );
    fail('Saving the video link', error);
  }

  async saveProfile(profile: Profile): Promise<void> {
    const { error } = await supabase.from('profiles').upsert(
      {
        user_id: this.userId,
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        height_cm: profile.heightCm,
        weight_kg: profile.weightKg,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    fail('Saving your profile', error);
  }
}
