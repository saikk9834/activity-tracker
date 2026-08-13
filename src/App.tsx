import { useState } from 'react';
import { Header } from '@/components/Header';
import { Splash } from '@/components/Splash';
import { Tabs } from '@/components/Tabs';
import { useToday } from '@/hooks/useToday';
import { currentStreak } from '@/lib/streak';
import { useTracker } from '@/state/useTracker';
import { CoachView } from '@/views/CoachView';
import { FoodView } from '@/views/FoodView';
import { GuideView } from '@/views/GuideView';
import { ProfileView } from '@/views/ProfileView';
import { StatsView } from '@/views/StatsView';
import { TodayView } from '@/views/TodayView';
import { WeekView } from '@/views/WeekView';
import type { TabId } from '@/types';

interface Props {
  /** Set when the one-time import of pre-account data didn't finish. */
  migrationError?: string | null;
}

export function App({ migrationError = null }: Props) {
  const [tab, setTab] = useState<TabId>('today');
  const { today, todayKey } = useToday();
  const { data, loading, error, dismissError, reload } = useTracker();

  const onChangeTab = (next: TabId) => {
    setTab(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="wrap">
      <Header
        streak={currentStreak(data.done, today)}
        onOpenProfile={() => onChangeTab('profile')}
      />
      <Tabs active={tab} onChange={onChangeTab} />

      {error && (
        <div className="alert" role="alert">
          <span>{error}</span>
          <span className="alert-actions">
            <button type="button" className="linkbtn" onClick={reload}>
              retry
            </button>
            <button type="button" className="linkbtn" onClick={dismissError}>
              dismiss
            </button>
          </span>
        </div>
      )}
      {migrationError && (
        <div className="alert" role="alert">
          <span>
            Couldn’t import the data saved on this device before you signed up. It’s still
            here — sign out and back in to retry. ({migrationError})
          </span>
        </div>
      )}

      <main>
        <section id={`view-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {loading ? (
            <Splash message="Loading your streak…" />
          ) : (
            <>
              {tab === 'today' && <TodayView today={today} todayKey={todayKey} />}
              {tab === 'week' && <WeekView today={today} />}
              {tab === 'coach' && <CoachView todayKey={todayKey} />}
              {tab === 'guide' && <GuideView onOpenProfile={onChangeTab} />}
              {tab === 'food' && <FoodView />}
              {tab === 'stats' && <StatsView today={today} />}
              {tab === 'profile' && <ProfileView />}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
