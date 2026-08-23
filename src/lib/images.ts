/**
 * Client-side downscaling for gallery uploads.
 *
 * A phone photo is 3-8 MB. Uploading those untouched makes the gallery slow to
 * open on mobile data and burns Storage egress for pixels no 110 px tile will
 * ever show, so each file is redrawn at a sane size before it leaves the
 * browser. If anything in the pipeline fails — a format the canvas can't decode,
 * most often HEIC outside Safari — the original file is uploaded as-is rather
 * than the upload failing.
 */

/** Longest edge, in pixels. Comfortable full-screen on a 3x phone display. */
const MAX_EDGE = 1600;
const QUALITY = 0.82;

/**
 * Formats every browser can render, and the ones the bucket accepts. Anything
 * else has to be re-encoded on the way in or it lands in a tile that shows a
 * blank box.
 */
const WEB_SAFE = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface PreparedImage {
  file: File;
  /** Object URL for the preview thumbnail; revoke it when done. */
  previewUrl: string;
  /** Best guess at when the photo was taken, from the file's own timestamp. */
  takenAt: Date;
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const takenAt = new Date(file.lastModified || Date.now());
  let out = file;

  try {
    out = (await downscale(file)) ?? file;
  } catch {
    // Couldn't decode it — HEIC outside Safari, most often. Sending a format
    // the browser can already display is fine; anything else would upload into
    // a tile that never renders, so say so instead.
    if (!WEB_SAFE.has(file.type)) {
      throw new Error(
        `${file.name}: this browser can’t read that image format. Convert it to JPEG first.`,
      );
    }
  }

  return { file: out, previewUrl: URL.createObjectURL(out), takenAt };
}

/** Returns null when the file is already small enough to upload untouched. */
async function downscale(file: File): Promise<File | null> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

  if (scale === 1 && file.size < 900_000 && WEB_SAFE.has(file.type)) {
    close(bitmap);
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process that image.');

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  close(bitmap);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', QUALITY);
  });
  if (!blob) throw new Error('Could not process that image.');

  const name = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${name}.jpg`, {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  });
}

/**
 * `createImageBitmap` handles EXIF orientation for us where it exists; the
 * <img> fallback covers older Safari.
 */
async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Fall through — some browsers reject the options bag, others the format.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not read that image.'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function close(bitmap: ImageBitmap | HTMLImageElement): void {
  if ('close' in bitmap) bitmap.close();
}
