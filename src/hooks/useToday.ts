import { useEffect, useState } from 'react';
import { iso } from '@/lib/date';
import type { ISODate } from '@/types';

/**
 * Today's date key, re-checked when the tab regains focus and once a minute, so
 * a phone left open overnight rolls over to the new day's workout.
 */
export function useToday(): { today: Date; todayKey: ISODate } {
  const [todayKey, setTodayKey] = useState<ISODate>(() => iso(new Date()));

  useEffect(() => {
    const check = () => {
      const now = iso(new Date());
      setTodayKey((prev) => (prev === now ? prev : now));
    };
    const onVisible = () => {
      if (!document.hidden) check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    const timer = window.setInterval(check, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
      window.clearInterval(timer);
    };
  }, []);

  // Midday keeps the Date away from DST edges; only the calendar date matters.
  return { today: new Date(todayKey + 'T12:00:00'), todayKey };
}
