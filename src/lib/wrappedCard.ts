/**
 * **The card, drawn from the same page it belongs to.**
 *
 * A copied sentence is a link nobody posts, so every figure page can make a 9:16 picture of itself.
 * The card is deliberately the page: black, the act's fold at the top and bottom, the same sentence
 * and the same caption in the same order. It cannot say anything the deck does not, because it is
 * handed the chapter's own words.
 */

import type { Act } from './wrappedDeck';

const ACT: Record<Act, { light: string; mid: string; deep: string }> = {
  1: { light: '#ff8a6b', mid: '#ff3b2f', deep: '#8c0f1e' },
  2: { light: '#ff8fc0', mid: '#ff2d87', deep: '#7a0c3b' },
  3: { light: '#b9a2ff', mid: '#7b4bff', deep: '#2c1470' },
};

const W = 1080;
const H = 1920;

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

/** Three folded panels in one corner, so the card carries the object rather than a wash. */
function band(ctx: CanvasRenderingContext2D, act: Act, atTop: boolean): void {
  const tone = ACT[act];
  const panels = [
    { shift: -120, light: tone.mid, deep: tone.deep },
    { shift: 120, light: tone.light, deep: tone.mid },
    { shift: 360, light: tone.mid, deep: tone.deep },
  ];
  panels.forEach((panel, index) => {
    const y0 = atTop ? 0 : H;
    const y1 = atTop ? 330 : H - 330;
    const x0 = panel.shift + index * 60;
    const gradient = ctx.createLinearGradient(x0, y0, x0 + 520, y1);
    gradient.addColorStop(0, panel.light);
    gradient.addColorStop(1, panel.deep);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + 430, y0);
    ctx.lineTo(x0 + 300, y1);
    ctx.lineTo(x0 - 220, y1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 - 220, y1);
    ctx.stroke();
  });
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

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  band(ctx, act, true);
  band(ctx, act, false);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const font = (weight: number, size: number) =>
    `${weight} ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

  ctx.font = font(800, 92);
  ctx.fillStyle = '#ffffff';
  const rows = wrap(ctx, sentence, 860);
  const lineHeight = 104;
  const startY = 940 - ((rows.length - 1) * lineHeight) / 2;
  rows.forEach((row, index) => ctx.fillText(row, W / 2, startY + index * lineHeight));

  ctx.font = font(500, 44);
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  const captionRows = wrap(ctx, caption, 780);
  const captionY = startY + rows.length * lineHeight + 24;
  captionRows.forEach((row, index) => ctx.fillText(row, W / 2, captionY + index * 58));

  ctx.textAlign = 'left';
  ctx.font = font(800, 40);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('OVVO', 88, H - 96);
  ctx.textAlign = 'right';
  ctx.font = font(700, 40);
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillText(String(year), W - 88, H - 96);

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
