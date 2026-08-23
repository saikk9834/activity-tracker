import { useEffect, useRef, useState, type MouseEvent, type TouchEvent } from 'react';
import { formatLongDate, fromIso } from '@/lib/date';
import type { Photo, PhotoDay } from '@/lib/photos';

interface Props {
  /** The day being viewed, with every photo taken on it. */
  day: PhotoDay;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  onDelete: (photo: Photo) => void;
}

/** Below the smallest swipe that should count as "next", in pixels. */
const SWIPE_THRESHOLD = 48;

/**
 * Full-screen viewer for one day's photos, over a translucent backdrop so the
 * gallery stays visible behind it. Arrow keys, on-screen arrows and a horizontal
 * swipe all move through the day; Escape closes.
 */
export function PhotoViewer({ day, index, onIndex, onClose, onDelete }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const photo = day.photos[index];
  const count = day.photos.length;

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Re-registered as the index moves, so the handler always sees the current one.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < count - 1) onIndex(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, count, onIndex, onClose]);

  // A photo deleted out from under the viewer closes it.
  useEffect(() => {
    setConfirmDelete(false);
  }, [index, day.day]);

  if (!photo) return null;

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    const end = e.changedTouches[0]?.clientX;
    if (start === null || end === undefined) return;
    const dx = end - start;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0 && index < count - 1) onIndex(index + 1);
    if (dx > 0 && index > 0) onIndex(index - 1);
  };

  return (
    <div className="viewer-wrap" onMouseDown={onBackdrop}>
      <div
        className="viewer"
        role="dialog"
        aria-modal="true"
        aria-label={`Photos from ${formatLongDate(fromIso(day.day))}`}
      >
        <div className="viewer-head">
          <div>
            <p className="eyebrow">{formatLongDate(fromIso(day.day))}</p>
            {count > 1 && (
              <p className="small muted">
                {index + 1} of {count}
              </p>
            )}
          </div>
          <button ref={closeRef} type="button" className="sheet-x" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="viewer-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {photo.url ? (
            <img src={photo.url} alt={photo.caption || `Progress photo ${index + 1}`} />
          ) : (
            <p className="small muted viewer-missing">
              This photo’s file is missing from storage.
            </p>
          )}

          {count > 1 && (
            <>
              <button
                type="button"
                className="viewer-nav prev"
                aria-label="Previous photo"
                disabled={index === 0}
                onClick={() => onIndex(index - 1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="viewer-nav next"
                aria-label="Next photo"
                disabled={index === count - 1}
                onClick={() => onIndex(index + 1)}
              >
                ›
              </button>
            </>
          )}
        </div>

        {photo.caption && <p className="viewer-caption">{photo.caption}</p>}

        <div className="viewer-foot">
          {count > 1 ? (
            <span className="viewer-dots" aria-hidden="true">
              {day.photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  className={i === index ? 'on' : ''}
                  tabIndex={-1}
                  onClick={() => onIndex(i)}
                />
              ))}
            </span>
          ) : (
            <span />
          )}

          {confirmDelete ? (
            <span className="viewer-actions">
              <span className="small muted">Delete this photo?</span>
              <button type="button" className="linkbtn" onClick={() => onDelete(photo)}>
                delete
              </button>
              <button type="button" className="linkbtn" onClick={() => setConfirmDelete(false)}>
                cancel
              </button>
            </span>
          ) : (
            <button type="button" className="linkbtn" onClick={() => setConfirmDelete(true)}>
              delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
