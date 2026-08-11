import { useEffect, useMemo, useState } from 'react';
import { AuthScreen } from './AuthScreen';
import { SetupScreen } from './SetupScreen';
import { Splash } from './Splash';
import { App } from '@/App';
import { isSupabaseConfigured } from '@/lib/supabase';
import { migrateLocalDataIfNeeded, SupabaseTrackerRepository } from '@/storage';
import { FeedbackProvider } from '@/state/FeedbackProvider';
import { TrackerProvider } from '@/state/TrackerProvider';
import { useAuth } from '@/state/useAuth';

/** Chooses what to render: setup instructions, the login screen, or the app. */
export function AuthGate() {
  const { session, loading } = useAuth();

  if (!isSupabaseConfigured) return <SetupScreen />;
  if (loading) return <Splash />;
  if (!session) return <AuthScreen />;
  return <SignedInApp userId={session.user.id} />;
}

function SignedInApp({ userId }: { userId: string }) {
  const repository = useMemo(() => new SupabaseTrackerRepository(userId), [userId]);
  const [ready, setReady] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  // Runs once per user: pulls anything saved before this device had an account.
  useEffect(() => {
    let active = true;
    setReady(false);
    migrateLocalDataIfNeeded(repository, userId)
      .catch((err: unknown) => {
        // Not fatal — the account still works, the old local data just stays put.
        if (active) setMigrationError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [repository, userId]);

  if (!ready) return <Splash message="Setting up your account…" />;

  return (
    <TrackerProvider repository={repository}>
      <FeedbackProvider>
        <App migrationError={migrationError} />
      </FeedbackProvider>
    </TrackerProvider>
  );
}
