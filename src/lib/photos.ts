import { supabase } from './supabase';
import type { ISODate } from '@/types';

/**
 * Reads and writes the Gallery tab's photos — see
 * supabase/migrations/0006_progress_photos.sql.
 *
 * Rows in `progress_photos` say which day a photo belongs to; the bytes sit in
 * the private `progress-photos` bucket under `<user_id>/<day>/<uuid>.<ext>`.
 * Nothing in the bucket is publicly reachable, so every image is handed to the
 * browser as a short-lived signed URL minted for the signed-in owner.
 */

const BUCKET = 'progress-photos';

/** Signed URLs last an hour; the gallery re-signs whenever the tab is reopened. */
const URL_TTL_SECONDS = 3600;

/** Matches `char_length(caption) <= 200` on the table. */
export const MAX_CAPTION_LENGTH = 200;

export interface Photo {
  id: string;
  /** The day the photo belongs to. */
  day: ISODate;
  path: string;
  caption: string;
  /** Signed URL, or '' when the file behind the row has gone missing. */
  url: string;
  createdAt: string;
}

/** One tile in the grid: a day, and everything shot on it, oldest first. */
export interface PhotoDay {
  day: ISODate;
  photos: Photo[];
}

interface PhotoRow {
  id: string;
  day: string;
  storage_path: string;
  caption: string;
  created_at: string;
}

function fail(context: string, error: { message: string } | null): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

/** Signs a batch of object paths in one round trip. */
async function signAll(paths: string[]): Promise<Map<string, string>> {
  const signed = new Map<string, string>();
  if (paths.length === 0) return signed;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, URL_TTL_SECONDS);
  fail('Loading your photos', error);

  for (const entry of data ?? []) {
    // `path` is null on the entries Storage couldn't sign — a row whose file is
    // gone. Those keep their row and render as a placeholder rather than
    // vanishing without explanation.
    if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
  }
  return signed;
}

export async function loadPhotos(userId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('progress_photos')
    .select('id, day, storage_path, caption, created_at')
    .eq('user_id', userId)
    .order('day', { ascending: false })
    .order('created_at', { ascending: true });
  fail('Loading your photos', error);

  const rows = (data ?? []) as PhotoRow[];
  const signed = await signAll(rows.map((row) => row.storage_path));

  return rows.map((row) => ({
    id: row.id,
    day: row.day,
    path: row.storage_path,
    caption: row.caption,
    url: signed.get(row.storage_path) ?? '',
    createdAt: row.created_at,
  }));
}

/**
 * Groups a flat list into one entry per day. `newestFirst` flips the whole
 * gallery: newest-first to see where you are now, oldest-first to watch the
 * change run forwards.
 */
export function groupByDay(photos: Photo[], newestFirst: boolean): PhotoDay[] {
  const byDay = new Map<ISODate, Photo[]>();
  for (const photo of photos) {
    const list = byDay.get(photo.day);
    if (list) list.push(photo);
    else byDay.set(photo.day, [photo]);
  }

  const days = [...byDay.entries()].map(([day, list]) => ({
    day,
    // Within a day, oldest first — the order they were taken in.
    photos: [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }));

  days.sort((a, b) => (newestFirst ? b.day.localeCompare(a.day) : a.day.localeCompare(b.day)));
  return days;
}

function extensionFor(file: File): string {
  const fromName = /\.([a-z0-9]{2,5})$/i.exec(file.name)?.[1];
  if (fromName) return fromName.toLowerCase();
  const fromType = file.type.split('/')[1];
  return fromType ? fromType.toLowerCase() : 'jpg';
}

/**
 * Uploads one file and records it against a day. The row is written only after
 * the bytes land, so a failed upload can't leave a tile pointing at nothing.
 */
export async function uploadPhoto(
  userId: string,
  file: File,
  day: ISODate,
  caption: string,
): Promise<Photo> {
  const path = `${userId}/${day}/${crypto.randomUUID()}.${extensionFor(file)}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
  fail('Uploading the photo', uploadError);

  const { data, error } = await supabase
    .from('progress_photos')
    .insert({
      user_id: userId,
      day,
      storage_path: path,
      caption: caption.slice(0, MAX_CAPTION_LENGTH),
    })
    .select('id, day, storage_path, caption, created_at')
    .single();

  if (error) {
    // The row is what makes the file findable, so don't leave an orphan behind.
    await supabase.storage.from(BUCKET).remove([path]);
    fail('Saving the photo', error);
  }

  const row = data as PhotoRow;
  const signed = await signAll([path]);
  return {
    id: row.id,
    day: row.day,
    path: row.storage_path,
    caption: row.caption,
    url: signed.get(path) ?? '',
    createdAt: row.created_at,
  };
}

/** Removes the row first: an orphaned file is cheaper than a broken tile. */
export async function deletePhoto(userId: string, photo: Photo): Promise<void> {
  const { error } = await supabase
    .from('progress_photos')
    .delete()
    .eq('user_id', userId)
    .eq('id', photo.id);
  fail('Deleting the photo', error);

  const { error: fileError } = await supabase.storage.from(BUCKET).remove([photo.path]);
  fail('Deleting the photo file', fileError);
}
