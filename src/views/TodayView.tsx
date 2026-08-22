import { ExerciseNote } from '@/components/ExerciseNote';
import { CheckIcon } from '@/components/icons';
import { SessionSwap } from '@/components/SessionSwap';
import { VideoLinkRow } from '@/components/VideoLinkRow';
import { WeightChip } from '@/components/WeightChip';
import { PLAN } from '@/data/plan';
import { useCompleteDay } from '@/hooks/useCompleteDay';
import { addDays, formatLongDate, iso, planIndex } from '@/lib/date';
import { currentStreak } from '@/lib/streak';
import { localiseIncrements } from '@/lib/units';
import { useTracker } from '@/state/useTracker';
import { useUnits } from '@/state/useUnits';
import type { ISODate } from '@/types';

interface Props {
  today: Date;
  todayKey: ISODate;
}

export function TodayView({ today, todayKey }: Props) {
  const { data, toggleCheck, setDayDone } = useTracker();
  const { units } = useUnits();
  const completeDay = useCompleteDay();

  const day = PLAN[planIndex(today)]!;
  const checked = data.checks[todayKey] ?? [];
  const isDone = !!data.done[todayKey];
  /** When set, the plan for today is replaced by whatever the user did instead. */
  const substituted = !!data.substitutions[todayKey];

  const yesterday = iso(addDays(today, -1));
  const dayBefore = iso(addDays(today, -2));
  const showNudge = !data.done[yesterday] && !!data.done[dayBefore] && !isDone;

  const onToggle = (exerciseId: string) => {
    const next = toggleCheck(todayKey, exerciseId);
    if (next.length === day.items.length && !isDone) completeDay(todayKey);
  };

  return (
    <>
      {showNudge && (
        <div className="nudge">
          Yesterday slipped. Today makes it noise, not a pattern — never miss twice.
        </div>
      )}

      <div className="card">
        <p className="eyebrow">{formatLongDate(today)}</p>
        <div className="day-head">
          <h2>{day.title}</h2>
          <span className={`tag ${day.tag}`}>{day.tagLabel}</span>
          <span className="count">{day.duration}</span>
        </div>

        {!substituted && (
          <ul className="checklist">
            {day.items.map((item) => (
              <li key={item.id}>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- control is the first child */}
                <label className="checkrow">
                  <input
                    type="checkbox"
                    checked={checked.includes(item.id)}
                    onChange={() => onToggle(item.id)}
                  />
                  <span className="box">
                    <CheckIcon />
                  </span>
                  <span className="ex">
                    <span className="n">{item.name}</span>
                    <br />
                    <span className="d">{item.detail}</span>
                    <VideoLinkRow exerciseId={item.id} />
                    <ExerciseNote date={todayKey} exerciseId={item.id} />
                  </span>
                  <WeightChip exercise={item} />
                </label>
              </li>
            ))}
          </ul>
        )}

        {!substituted && day.progression && (
          <div className="prog-note">{localiseIncrements(day.progression, units)}</div>
        )}
        {!substituted && <p className="plan-note">{day.note}</p>}

        <SessionSwap date={todayKey} />

        {isDone ? (
          <div className="done-banner">
            <span className="t">Day logged. Streak: {currentStreak(data.done, today)} 🔥</span>
            <button type="button" className="linkbtn" onClick={() => setDayDone(todayKey, false)}>
              undo
            </button>
          </div>
        ) : (
          <div className="today-foot">
            <span className="count">
              {substituted ? 'Substituted session' : `${checked.length} / ${day.items.length} done`}
            </span>
            <button type="button" className="btn" onClick={() => completeDay(todayKey)}>
              Mark day complete
            </button>
          </div>
        )}
      </div>

      <p className="small muted" style={{ maxWidth: '60ch' }}>
        Shrunk the session? Mark the day complete anyway — attendance is the habit; the workout is
        just what you do while you’re there.
      </p>
    </>
  );
}
