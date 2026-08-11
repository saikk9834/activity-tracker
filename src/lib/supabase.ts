import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env['VITE_SUPABASE_URL'];
const anonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'];

/**
 * False until `.env` is filled in. The app shows setup instructions rather than
 * a blank screen, so a fresh clone runs before it has credentials.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * The anon key is meant to be public — it only grants what row-level security
 * allows, and every table's policy is `auth.uid() = user_id`.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  url ?? 'http://localhost',
  anonKey ?? 'missing-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
