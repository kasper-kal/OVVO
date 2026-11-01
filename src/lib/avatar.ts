/**
 * **A face for everybody, before anybody uploads one.**
 *
 * Every account has an avatar. Without a photograph it is the lucide `user` glyph on one of ten
 * background colours, and which colour is not random: it is worked out from the account's own id,
 * so the same traveller gets the same colour on every device and a list of accounts looks like ten
 * different people rather than ten identical circles.
 *
 * The photograph itself is stored as a small square JPEG in this browser's own storage under one
 * key, which means the existing sync carries it to the next device with no new upload service, no
 * extra bucket and nothing to keep in step. 256px is enough for the largest place it is drawn and
 * keeps the whole document far under the server's limit.
 */

/** Ten backgrounds, each dark enough that the white glyph on it is easy to see. */
export const AVATAR_COLOURS = [
  '#c4573c',
  '#8a6d1f',
  '#4e7a4e',
  '#3f6e8c',
  '#6c4e8c',
  '#8c5a3c',
  '#56703f',
  '#4a5566',
  '#8c4a63',
  '#3f7a72',
] as const;

/** The storage key the photograph lives under. Synced like everything else in this app. */
export const PHOTO_KEY = 'profile-photo';

/** The colour for an account: stable, and different enough between ids to look deliberate. */
export function avatarColour(seed: string | null | undefined): string {
  if (!seed) return AVATAR_COLOURS[0];
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100000007;
  }
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length];
}

/**
 * Turn a chosen file into a square photograph, cropped from the middle.
 *
 * Drawn through a canvas rather than uploaded as it arrived: a phone photograph is several
 * megabytes and a circle 56px across does not need any of them. Nothing leaves this function
 * larger than about thirty kilobytes.
 */
export async function squarePhoto(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('no canvas');

  const shortest = Math.min(bitmap.width, bitmap.height);
  const sourceX = (bitmap.width - shortest) / 2;
  const sourceY = (bitmap.height - shortest) / 2;
  context.drawImage(bitmap, sourceX, sourceY, shortest, shortest, 0, 0, size, size);
  bitmap.close?.();

  return canvas.toDataURL('image/jpeg', 0.85);
}
