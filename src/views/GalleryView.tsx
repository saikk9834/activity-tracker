import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { PhotoViewer } from '@/components/PhotoViewer';
import { daysBetween, formatShortDate, fromIso, iso } from '@/lib/date';
import { prepareImage } from '@/lib/images';
import {
  deletePhoto,
  groupByDay,
  loadPhotos,
  uploadPhoto,
  MAX_CAPTION_LENGTH,
  type Photo,
} from '@/lib/photos';
import { useAuth } from '@/state/useAuth';
import type { ISODate } from '@/types';

interface Props {
  todayKey: ISODate;
}

/** A picked file, downscaled and waiting for the user to confirm its day. */
interface Staged {
  key: string;
  file: File;
  previewUrl: string;
  day: ISODate;
  caption: string;
}

/** Which photo the viewer is showing. */
interface Opened {
  day: ISODate;
  index: number;
}

/**
 * The gallery: one tile per day, newest first by default, with every extra
 * photo from that day stacked underneath the first. The point is the long view —
 * flip the order to oldest-first and the grid reads as a transformation instead
 * of a pile of snapshots.
 */
export function GalleryView({ todayKey }: Props) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newestFirst, setNewestFirst] = useState(true);
  const [staged, setStaged] = useState<Staged[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [opened, setOpened] = useState<Opened | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const stagedRef = useRef<Staged[]>([]);

  useEffect(() => {
    stagedRef.current = staged;
  }, [staged]);

  // Object URLs outlive the component unless they're revoked by hand.
  useEffect(
    () => () => {
      for (const item of stagedRef.current) URL.revokeObjectURL(item.previewUrl);
    },
    [],
  );

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    loadPhotos(userId)
      .then((list) => {
        if (active) setPhotos(list);
      })
      .catch((err: unknown) => {
        if (active) setError(describe(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const days = useMemo(() => groupByDay(photos, newestFirst), [photos, newestFirst]);
  const openedDay = opened ? (days.find((d) => d.day === opened.day) ?? null) : null;

  // Deleting the last photo of a day leaves nothing to show.
  useEffect(() => {
    if (opened && !openedDay) setOpened(null);
  }, [opened, openedDay]);

  /** A file's own timestamp is the best guess at when it was taken. */
  const dayFor = (date: Date): ISODate => {
    const key = iso(date);
    return key > todayKey ? todayKey : key;
  };

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])];
    // Cleared so picking the very same file again still fires a change event.
    e.target.value = '';
    if (files.length === 0) return;

    setPreparing(true);
    setError(null);

    // allSettled, not all: one unreadable file shouldn't discard the rest of
    // the batch the user just picked.
    const results = await Promise.allSettled(
      files.map(async (file): Promise<Staged> => {
        const prepared = await prepareImage(file);
        return {
          key: crypto.randomUUID(),
          file: prepared.file,
          previewUrl: prepared.previewUrl,
          day: dayFor(prepared.takenAt),
          caption: '',
        };
      }),
    );

    const ready = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failed = results.flatMap((r) => (r.status === 'rejected' ? [describe(r.reason)] : []));
    if (ready.length > 0) setStaged((prev) => [...prev, ...ready]);
    if (failed.length > 0) setError(failed.join(' '));
    setPreparing(false);
  };

  const editStaged = (key: string, patch: Partial<Staged>) => {
    setStaged((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const dropStaged = (key: string) => {
    setStaged((prev) => {
      const going = prev.find((item) => item.key === key);
      if (going) URL.revokeObjectURL(going.previewUrl);
      return prev.filter((item) => item.key !== key);
    });
  };

  const upload = async () => {
    if (!userId || staged.length === 0) return;
    setUploading(true);
    setError(null);

    // One at a time: a failure halfway through keeps everything already
    // uploaded and leaves the rest staged to retry.
    const uploaded = new Set<string>();
    try {
      for (const item of staged) {
        const photo = await uploadPhoto(userId, item.file, item.day, item.caption.trim());
        setPhotos((list) => [...list, photo]);
        uploaded.add(item.key);
      }
    } catch (err) {
      setError(describe(err));
    } finally {
      setStaged((prev) =>
        prev.filter((item) => {
          if (!uploaded.has(item.key)) return true;
          URL.revokeObjectURL(item.previewUrl);
          return false;
        }),
      );
      setUploading(false);
    }
  };

  const onDelete = (photo: Photo) => {
    if (!userId) return;
    const remaining = photos.filter((p) => p.day === photo.day && p.id !== photo.id).length;
    setPhotos((list) => list.filter((p) => p.id !== photo.id));
    setOpened((o) =>
      !o ? o : remaining === 0 ? null : { ...o, index: Math.min(o.index, remaining - 1) },
    );
    deletePhoto(userId, photo).catch((err: unknown) => setError(describe(err)));
  };

  const span =
    days.length > 1
      ? daysBetween(
          fromIso(newestFirst ? days[days.length - 1]!.day : days[0]!.day),
          fromIso(newestFirst ? days[0]!.day : days[days.length - 1]!.day),
        )
      : 0;

  return (
    <div className="gallery">
      <div className="gal-head">
        <div>
          <p className="eyebrow">Gallery</p>
          <h2>One photo a day, and the year does the rest.</h2>
          {photos.length > 0 && (
            <p className="small muted">
              {photos.length} photo{photos.length === 1 ? '' : 's'} across {days.length} day
              {days.length === 1 ? '' : 's'}
              {span > 0 ? ` · ${span} days from first to last` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="gal-bar">
        <div className="seg" role="group" aria-label="Order">
          <button
            type="button"
            className={newestFirst ? 'on' : ''}
            aria-pressed={newestFirst}
            onClick={() => setNewestFirst(true)}
          >
            Newest
          </button>
          <button
            type="button"
            className={newestFirst ? '' : 'on'}
            aria-pressed={!newestFirst}
            onClick={() => setNewestFirst(false)}
          >
            Oldest
          </button>
        </div>

        <button
          type="button"
          className="btn"
          disabled={preparing || uploading}
          onClick={() => fileRef.current?.click()}
        >
          {preparing ? 'Reading…' : 'Add photos'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          tabIndex={-1}
          className="visually-hidden"
          onChange={(e) => void onPick(e)}
        />
      </div>

      {error && (
        <div className="alert" role="alert">
          <span>{error}</span>
          <span className="alert-actions">
            <button type="button" className="linkbtn" onClick={() => setError(null)}>
              dismiss
            </button>
          </span>
        </div>
      )}

      {staged.length > 0 && (
        <div className="card stage">
          <p className="eyebrow">
            {staged.length} to add — check the date each one belongs to
          </p>
          <ul className="stage-list">
            {staged.map((item) => (
              <li key={item.key}>
                <img src={item.previewUrl} alt="" className="stage-thumb" />
                <div className="stage-fields">
                  <label className="stage-label">
                    Date
                    <input
                      type="date"
                      value={item.day}
                      max={todayKey}
                      onChange={(e) => editStaged(item.key, { day: e.target.value })}
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="Caption (optional)"
                    value={item.caption}
                    maxLength={MAX_CAPTION_LENGTH}
                    onChange={(e) => editStaged(item.key, { caption: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  className="linkbtn"
                  disabled={uploading}
                  onClick={() => dropStaged(item.key)}
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
          <div className="stage-foot">
            <button type="button" className="btn" disabled={uploading} onClick={() => void upload()}>
              {uploading ? 'Uploading…' : `Add ${staged.length} photo${staged.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      )}

      {loading && <p className="small muted">Loading your photos…</p>}

      {!loading && days.length === 0 && staged.length === 0 && (
        <div className="card">
          <p>
            Nothing here yet. Add a photo on a training day — same spot, same light, same time
            of day if you can.
          </p>
          <p className="small muted">
            One a week is enough. The point isn’t any single photo; it’s what six months of
            them look like side by side.
          </p>
        </div>
      )}

      {days.length > 0 && (
        <ul className="pgrid">
          {days.map((entry) => {
            const top = entry.photos[0]!;
            const extra = entry.photos.length - 1;
            return (
              <li key={entry.day} className={extra > 0 ? 'ptile-wrap stacked' : 'ptile-wrap'}>
                <button
                  type="button"
                  className="ptile"
                  onClick={() => setOpened({ day: entry.day, index: 0 })}
                >
                  {top.url ? (
                    <img
                      src={top.url}
                      alt={`Progress photo from ${tileDate(entry.day, todayKey)}`}
                      loading="lazy"
                    />
                  ) : (
                    <span className="ptile-missing" aria-hidden="true" />
                  )}
                  {extra > 0 && (
                    <span className="ptile-count" aria-label={`${extra} more`}>
                      +{extra}
                    </span>
                  )}
                  <span className="ptile-date">{tileDate(entry.day, todayKey)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {opened && openedDay && (
        <PhotoViewer
          day={openedDay}
          index={Math.min(opened.index, openedDay.photos.length - 1)}
          onIndex={(index) => setOpened({ day: openedDay.day, index })}
          onClose={() => setOpened(null)}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

/** "Aug 12" this year, "Aug 12 ’25" once the year has turned. */
function tileDate(day: ISODate, todayKey: ISODate): string {
  const short = formatShortDate(fromIso(day));
  const year = day.slice(0, 4);
  return year === todayKey.slice(0, 4) ? short : `${short} ’${year.slice(2)}`;
}

function describe(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return /failed to fetch|network/i.test(message)
    ? 'Lost the connection — that photo may not have saved.'
    : message;
}
