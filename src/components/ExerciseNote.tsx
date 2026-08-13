import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { MAX_NOTE_LENGTH } from '@/storage';
import { useTracker } from '@/state/useTracker';
import type { ExerciseId, ISODate } from '@/types';

interface Props {
  date: ISODate;
  exerciseId: ExerciseId;
}

/**
 * Optional comment on how one exercise actually went — "lifted 25 instead of
 * 20 kg", "only 8 reps". Saved per day, so it's a record of that session rather
 * than a standing note on the exercise, and the coach reads it as context.
 */
export function ExerciseNote({ date, exerciseId }: Props) {
  const { data, setNote } = useTracker();
  const [editing, setEditing] = useState(false);
  const note = data.notes[date]?.[exerciseId] ?? '';

  // The row sits inside the checklist's <label>, so clicks must not tick the box.
  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const commit = (raw: string) => {
    setEditing(false);
    if (raw.trim() !== note) setNote(date, exerciseId, raw);
  };

  if (editing) {
    return (
      <span className="noterow" onClick={stop}>
        <textarea
          className="ninput"
          rows={2}
          maxLength={MAX_NOTE_LENGTH}
          defaultValue={note}
          placeholder="e.g. lifted 25 instead of 20 kg, only 8 reps"
          aria-label="Comment on this exercise"
          autoFocus
          onFocus={(e) => e.currentTarget.setSelectionRange(note.length, note.length)}
          onBlur={(e) => commit(e.currentTarget.value)}
          onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
            // Enter saves; Shift+Enter is the escape hatch for a second line.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur();
            }
            if (e.key === 'Escape') {
              e.currentTarget.value = note;
              e.currentTarget.blur();
            }
          }}
        />
      </span>
    );
  }

  return (
    <span className="noterow">
      {note && <span className="ntext">{note}</span>}
      <button
        type="button"
        className="vedit"
        onClick={(e) => {
          stop(e);
          setEditing(true);
        }}
      >
        {note ? 'edit' : '+ add comment'}
      </button>
    </span>
  );
}
