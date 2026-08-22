/**
 * Hand-written to match the files in supabase/migrations/.
 *
 * Once the project exists you can regenerate this instead of maintaining it:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */
export interface Database {
  public: {
    Tables: {
      logged_days: {
        Row: { user_id: string; day: string; created_at: string };
        Insert: { user_id: string; day: string; created_at?: string };
        Update: { user_id?: string; day?: string; created_at?: string };
        Relationships: [];
      };
      day_checks: {
        Row: { user_id: string; day: string; exercise_id: string };
        Insert: { user_id: string; day: string; exercise_id: string };
        Update: { user_id?: string; day?: string; exercise_id?: string };
        Relationships: [];
      };
      day_notes: {
        Row: {
          user_id: string;
          day: string;
          exercise_id: string;
          note: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          day: string;
          exercise_id: string;
          note: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          day?: string;
          exercise_id?: string;
          note?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      day_substitutions: {
        Row: {
          user_id: string;
          day: string;
          activity: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          day: string;
          activity: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          day?: string;
          activity?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      coach_chats: {
        Row: {
          session_id: string;
          user_id: string;
          user_name: string;
          chat_name: string;
          chat: unknown;
          bookmark: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          session_id: string;
          user_id: string;
          user_name?: string;
          chat_name?: string;
          chat?: unknown;
          bookmark?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          session_id?: string;
          user_id?: string;
          user_name?: string;
          chat_name?: string;
          chat?: unknown;
          bookmark?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          name: string;
          age: number | null;
          gender: string;
          height_cm: number | null;
          weight_kg: number | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name?: string;
          age?: number | null;
          gender?: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          name?: string;
          age?: number | null;
          gender?: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercise_settings: {
        Row: {
          user_id: string;
          exercise_id: string;
          weight: string | null;
          video_url: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          exercise_id: string;
          weight?: string | null;
          video_url?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          exercise_id?: string;
          weight?: string | null;
          video_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
