/**
 * **The card is a poster, not a screenshot.**
 *
 * A 9:16 story graphic: a flat band of the act's colour across the top carrying the year, the
 * sentence set large and left aligned, the one line under it, and a rule with the mark at the foot.
 * No gradient, no glass, no washed panel: the same flat rules as the film, so what is posted looks
 * like what was watched.
 */

import type { Act } from './wrappedDeck';

const ACT: Record<Act, { light: string; mid: string; deep: string }> = {
  1: { light: '#ff8a6b', mid: '#ff3b2f', deep: '#8c0f1e' },
  2: { light: '#ff8fc0', mid: '#ff2d87', deep: '#7a0c3b' },
  3: { light: '#b9a2ff', mid: '#7b4bff', deep: '#2c1470' },
};

const W = 1080;
const H = 1920;
const M = 88;
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const rows: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      rows.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) rows.push(line);
  return rows;
}

export async function drawCard({
  year,
  sentence,
  caption,
  act,
}: {
  year: number;
  sentence: string;
  caption: string;
  act: Act;
}): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const tone = ACT[act];
  const font = (weight: number, size: number) => `${weight} ${size}px ${SANS}`;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  /* The band: one flat rectangle, the whole width, carrying the year. */
  ctx.fillStyle = tone.deep;
  ctx.fillRect(0, 0, W, 380);
  ctx.fillStyle = tone.mid;
  ctx.fillRect(0, 380, W, 10);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = tone.light;
  ctx.font = font(800, 30);
  ctx.fillText('OVVO WRAPPED', M, 110);

  ctx.fillStyle = '#ffffff';
  ctx.font = font(800, 190);
  ctx.fillText(String(year), M - 6, 320);

  /* The sentence: the same words as the page, set left and large. */
  ctx.font = font(800, 96);
  const rows = wrap(ctx, sentence, W - M * 2);
  const lineHeight = 108;
  const blockTop = 380 + 10 + (H - 380 - 10) / 2 - (rows.length * lineHeight) / 2 - 60;
  rows.forEach((row, index) => ctx.fillText(row, M, blockTop + index * lineHeight));

  const captionY = blockTop + rows.length * lineHeight + 40;
  ctx.font = font(500, 42);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  wrap(ctx, caption, W - M * 2).forEach((row, index) => ctx.fillText(row, M, captionY + index * 56));

  /* The foot: a rule in the act's light, then the mark and the year. */
  ctx.fillStyle = tone.mid;
  ctx.fillRect(M, H - 236, W - M * 2, 4);
  ctx.font = font(800, 42);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('OVVO', M, H - 150);
  ctx.textAlign = 'right';
  ctx.font = font(600, 34);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText(`Wrapped ${year}`, W - M, H - 152);

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/** Hand the card to the phone's own share sheet, and fall back to a download. */
export async function shareCard(blob: Blob, filename: string, text: string): Promise<void> {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text });
      return;
    } catch {
      /* The traveller closed the sheet, or the phone refused it: fall through to a download. */
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}
