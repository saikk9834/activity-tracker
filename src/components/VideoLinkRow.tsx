import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { PlayIcon } from './icons';
import { useTracker } from '@/state/useTracker';
import type { ExerciseId } from '@/types';

/** "watch" link + an inline editor for attaching a form-check video. */
export function VideoLinkRow({ exerciseId }: { exerciseId: ExerciseId }) {
  const { data, setLink } = useTracker();
  const [editing, setEditing] = useState(false);
  const url = data.links[exerciseId] ?? '';

  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const commit = (raw: string) => {
    setEditing(false);
    let next = raw.trim();
    if (next && !/^https?:\/\//i.test(next)) next = 'https://' + next;
    setLink(exerciseId, next || null);
  };

  if (editing) {
    return (
      <span className="vidrow" onClick={stop}>
        <input
          className="vinput"
          type="url"
          defaultValue={url}
          placeholder="Paste a YouTube or web link"
          aria-label="Video link"
          autoFocus
          onBlur={(e) => commit(e.currentTarget.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              e.currentTarget.value = url;
              e.currentTarget.blur();
            }
          }}
        />
      </span>
    );
  }

  return (
    <span className="vidrow">
      {url && (
        <a
          className="vlink"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <PlayIcon />
          watch
        </a>
      )}
      <button
        type="button"
        className="vedit"
        onClick={(e) => {
          stop(e);
          setEditing(true);
        }}
      >
        {url ? 'change' : '+ add video'}
      </button>
    </span>
  );
}
