import { useEffect, useRef, type MouseEvent } from 'react';
import { ExerciseNote } from '@/components/ExerciseNote';
import { CheckIcon } from '@/components/icons';
import { SessionSwap } from '@/components/SessionSwap';
import { PLAN } from '@/data/plan';
import { useCompleteDay } from '@/hooks/useCompleteDay';
import { formatLongDate, fromIso, planIndex } from '@/lib/date';
import { useTracker } from '@/state/useTracker';
import type { ExerciseId, ISODate } from '@/types';

interface Props {
  date: ISODate;
  onClose: () => void;
}

/**
 * Compact editor for one day, opened from a calendar cell — the same checklist
 * and comments as the Today tab, so a session logged late is as detailed as one
 * logged on the day.
 *
 * Working weights are shown but not editable here: a weight is a standing value
 * that carries forward, not a fact about the day being edited, so changing it
 * from a week-old entry would quietly rewrite today's plan.
 */
export function DayEditor({ date, onClose }: Props) {
  const { data, toggleCheck, setDayDone } = useTracker();
  const completeDay = useCompleteDay();
  const closeRef = useRef<HTMLButtonElement>(null);

  const day = PLAN[planIndex(fromIso(date))]!;
  const checked = data.checks[date] ?? [];
  const isDone = !!data.done[date];
  /** When set, the plan for this day is replaced by whatever the user did instead. */
  const substituted = !!data.substitutions[date];

  useEffect(() => {
    closeRef.current?.focus();
    // Escape from an open comment box is stopped by ExerciseNote, so it cancels
    // the edit rather than closing the whole sheet.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  // Same rule as the Today tab: ticking the last item logs the day, which fires
  // the streak toast or milestone for the date being edited, not for today.
  const onToggle = (exerciseId: ExerciseId) => {
    const next = toggleCheck(date, exerciseId);
    if (next.length === day.items.length && !isDone) completeDay(date);
  };

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="sheet-wrap" onMouseDown={onBackdrop}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className="sheet-head">
          <div>
            <p className="eyebrow">{formatLongDate(fromIso(date))}</p>
            <h2 id="sheet-title">{day.title}</h2>
          </div>
          <button ref={closeRef} type="button" className="sheet-x" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="sheet-meta">
          <span className={`tag ${day.tag}`}>{day.tagLabel}</span>
          <span className="count">{day.duration}</span>
        </div>

        {!substituted && (
          <ul className="checklist compact">
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
                    <ExerciseNote date={date} exerciseId={item.id} />
                  </span>
                  {item.weight && (
                    <span className="wt static" title="Working weight — change it on the Today tab">
                      {data.weights[item.id] ?? item.weight}
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}

        <SessionSwap date={date} />

        <div className="sheet-foot">
          <span className="count">
            {substituted ? 'Substituted session' : `${checked.length} / ${day.items.length} done`}
          </span>
          {isDone ? (
            <span className="sheet-done">
              Logged 🔥
              <button type="button" className="linkbtn" onClick={() => setDayDone(date, false)}>
                undo
              </button>
            </span>
          ) : (
            <button type="button" className="btn" onClick={() => completeDay(date)}>
              Mark day complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
