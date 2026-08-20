import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { formatStoredWeight, toStoredWeight } from '@/lib/units';
import { useTracker } from '@/state/useTracker';
import { useUnits } from '@/state/useUnits';
import type { Exercise } from '@/types';

/**
 * Tap to edit the working weight. Shown in the user's chosen units and read back
 * in them — a bare number typed while reading pounds is pounds — but always
 * stored in kg, so toggling units never rewrites what's saved.
 */
export function WeightChip({ exercise }: { exercise: Exercise }) {
  const { data, setWeight } = useTracker();
  const { units } = useUnits();
  const [editing, setEditing] = useState(false);

  if (!exercise.weight) return null;
  const stored = data.weights[exercise.id] ?? exercise.weight;
  const value = formatStoredWeight(stored, units);

  const commit = (raw: string) => {
    setEditing(false);
    const trimmed = raw.trim();
    // Skipping an unchanged value matters here: re-saving a converted figure
    // would round-trip kg → lb → kg and drift the stored weight every time.
    if (!trimmed || trimmed === value) return;
    setWeight(exercise.id, toStoredWeight(trimmed, units));
  };

  // The chip sits inside the row's <label>, so clicks must not toggle the checkbox.
  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (editing) {
    return (
      <span className="wt" onClick={stop}>
        <input
          type="text"
          defaultValue={value}
          aria-label="Weight"
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => commit(e.currentTarget.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              e.currentTarget.value = value;
              e.currentTarget.blur();
            }
          }}
        />
      </span>
    );
  }

  return (
    <button
      type="button"
      className="wt"
      title="Tap to update weight"
      onClick={(e) => {
        stop(e);
        setEditing(true);
      }}
    >
      {value}
    </button>
  );
}
