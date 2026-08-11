import { useCallback } from 'react';
import { milestoneFor, randomToast } from '@/data/milestones';
import { currentStreak } from '@/lib/streak';
import { useFeedback } from '@/state/useFeedback';
import { useTracker } from '@/state/useTracker';
import type { ISODate } from '@/types';

/**
 * Marks a day complete and fires the reward: a milestone modal if the streak
 * just landed on one, otherwise a toast. Idempotent — re-logging a day is a
 * no-op, so ticking the last checkbox after tapping the button stays quiet.
 */
export function useCompleteDay() {
  const { data, setDayDone } = useTracker();
  const { showToast, celebrate } = useFeedback();

  return useCallback(
    (dateKey: ISODate) => {
      if (data.done[dateKey]) return;

      const done = { ...data.done, [dateKey]: true };
      setDayDone(dateKey, true);

      const streak = currentStreak(done, new Date(dateKey + 'T12:00:00'));
      const milestone = milestoneFor(streak);
      if (milestone) celebrate(milestone);
      else showToast(randomToast());
    },
    [data.done, setDayDone, celebrate, showToast],
  );
}
