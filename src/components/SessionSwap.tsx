import { useState, type KeyboardEvent } from 'react';
import { MAX_SUBSTITUTION_LENGTH } from '@/storage';
import { useTracker } from '@/state/useTracker';
import type { ISODate } from '@/types';

/**
 * Records that the day's scheduled session didn't happen and says what the user
 * did instead — gym closed, travelling, no equipment.
 *
 * A day is substituted exactly when it has non-empty text, so there is no
 * separate flag to keep in sync: clearing the text restores the plan. The day
 * still counts as attendance either way; only what it contains changes.
 */
export function SessionSwap({ date }: { date: ISODate }) {
  const { data, setSubstitution } = useTracker();
  const [editing, setEditing] = useState(false);
  const activity = data.substitutions[date] ?? '';

  const commit = (raw: string) => {
    setEditing(false);
    if (raw.trim() !== activity) setSubstitution(date, raw);
  };

  if (editing) {
    return (
      <div className="swap-edit">
        <label className="swap-label" htmlFor={`swap-${date}`}>
          What did you do instead?
        </label>
        <textarea
          id={`swap-${date}`}
          className="sinput"
          rows={3}
          maxLength={MAX_SUBSTITUTION_LENGTH}
          defaultValue={activity}
          placeholder="e.g. gym closed after the storm — home circuit: pushups 4×15, DB rows 4×12, plank 3×45 s, ~35 min"
          autoFocus
          onFocus={(e) => e.currentTarget.setSelectionRange(activity.length, activity.length)}
          onBlur={(e) => commit(e.currentTarget.value)}
          onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur();
            }
            if (e.key === 'Escape') {
              // Inside the day editor, cancel this edit rather than close the sheet.
              e.stopPropagation();
              e.currentTarget.value = activity;
              e.currentTarget.blur();
            }
          }}
        />
        <p className="small muted">
          Saving this replaces the scheduled session for the day. The day still counts towards your
          streak, and your coach reads it as a substitution.
        </p>
      </div>
    );
  }

  if (activity) {
    return (
      <div className="swap-panel">
        <div className="swap-head">
          <span className="tag swap">Substituted</span>
          <span className="swap-actions">
            <button type="button" className="vedit" onClick={() => setEditing(true)}>
              edit
            </button>
            <button type="button" className="vedit" onClick={() => setSubstitution(date, '')}>
              restore session
            </button>
          </span>
        </div>
        <p className="swap-text">{activity}</p>
      </div>
    );
  }

  return (
    <button type="button" className="swap-open" onClick={() => setEditing(true)}>
      Couldn’t do this session? Log what you did instead
    </button>
  );
}
