import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { useTracker } from '@/state/useTracker';
import type { Exercise } from '@/types';

/** Tap to edit the working weight. A bare number gets " kg" appended. */
export function WeightChip({ exercise }: { exercise: Exercise }) {
  const { data, setWeight } = useTracker();
  const [editing, setEditing] = useState(false);

  if (!exercise.weight) return null;
  const value = data.weights[exercise.id] ?? exercise.weight;

  const commit = (raw: string) => {
    setEditing(false);
    const trimmed = raw.trim();
    if (!trimmed) return;
    setWeight(exercise.id, /^\d+([.,]\d+)?$/.test(trimmed) ? `${trimmed} kg` : trimmed);
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
