/**
 * **The card at the end, drawn three ways.**
 *
 * Wrapped does not end on a sentence: it ends on the thing you send, and you can page it through a
 * few colourways before you send it. This is that card, the year's journeys, the five places it
 * kept returning to, the busiest day and the longest run of them, painted at story size, 1080 by
 * 1920.
 *
 * The page draws the same card in HTML, so what is on screen when Share is pressed is what leaves.
 * Both read this one palette table, so a colourway cannot be one colour here and another there.
 */

import type { CSSProperties } from 'react';

export type PosterColourway = 'ember' | 'indigo' | 'paper';

export const POSTER_COLOURWAYS: readonly PosterColourway[] = ['ember', 'indigo', 'paper'];

export interface PosterData {
  year: number;
  journeys: number;
  /** The five places, in order, exactly as the ranked chapter printed them. */
  places: Array<{ name: string; count: number }>;
  day: { date: string; count: number } | null;
  streakDays: number | null;
}

export interface PosterPalette {
  /** The three stops of the card's own field, top to bottom. */
  ground: [string, string, string];
  ink: string;
  /** The quieter ink for labels and rules. */
  soft: string;
  /** The one loud mark: the big number and the rules under it. */
  mark: string;
}

export const POSTER_PALETTES: Record<PosterColourway, PosterPalette> = {
  ember: {
    ground: ['#ff5a00', '#b81400', '#2a0008'],
    ink: '#fff7ea',
    soft: 'rgba(255, 247, 234, 0.66)',
    mark: '#ffb000',
  },
  indigo: {
    ground: ['#4d7bff', '#1a0a8a', '#05001f'],
    ink: '#eef3ff',
    soft: 'rgba(238, 243, 255, 0.68)',
    mark: '#7cf9ff',
  },
  paper: {
    ground: ['#fff6e2', '#ffe3bd', '#ffc98a'],
    ink: '#2a0a00',
    soft: 'rgba(42, 10, 0, 0.64)',
    mark: '#ff2d0a',
  },
};

/** The card's own CSS, so the page and the export cannot disagree about a colourway. */
export function posterStyle(colourway: PosterColourway): CSSProperties {
  const palette = POSTER_PALETTES[colourway];
  return {
    backgroundImage: `linear-gradient(165deg, ${palette.ground[0]} 0%, ${palette.ground[1]} 52%, ${palette.ground[2]} 100%)`,
    color: palette.ink,
    '--poster-mark': palette.mark,
    '--poster-soft': palette.soft,
  } as CSSProperties;
}

const W = 1080;
const H = 1920;
const PAD = 84;

function clip(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}…`;
}

/**
 * **The card, at the size a story takes.**
 *
 * Deliberately the same order as the page version: masthead, the year's one number, then the two
 * columns, the places on the left, the days on the right, and the footer the share cards already
 * wear. Nothing here is invented: every figure is handed in.
 */
export function drawPoster(data: PosterData, colourway: PosterColourway): string {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');
  const palette = POSTER_PALETTES[colourway];

  const field = ctx.createLinearGradient(0, 0, W * 0.4, H);
  field.addColorStop(0, palette.ground[0]);
  field.addColorStop(0.52, palette.ground[1]);
  field.addColorStop(1, palette.ground[2]);
  ctx.fillStyle = field;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = palette.ink;
  ctx.font = '700 30px "IBM Plex Mono", monospace';
  ctx.fillText('OVVO YEARBOOK', PAD, 128);
  ctx.textAlign = 'right';
  ctx.fillText(String(data.year), W - PAD, 128);
  ctx.textAlign = 'left';

  ctx.strokeStyle = palette.soft;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PAD, 164);
  ctx.lineTo(W - PAD, 164);
  ctx.stroke();

  /* The year's one number, at the size the card can carry. */
  ctx.fillStyle = palette.mark;
  ctx.font = '800 250px "Archivo", sans-serif';
  ctx.fillText(String(data.journeys), PAD, 480);
  ctx.fillStyle = palette.ink;
  ctx.font = '700 26px "IBM Plex Mono", monospace';
  ctx.fillText('JOURNEYS PLANNED', PAD, 540);

  ctx.strokeStyle = palette.soft;
  ctx.beginPath();
  ctx.moveTo(PAD, 620);
  ctx.lineTo(W - PAD, 620);
  ctx.stroke();

  const columnWidth = 420;
  const leftX = PAD;
  const rightX = W - PAD - columnWidth;
  const top = 700;

  ctx.fillStyle = palette.soft;
  ctx.font = '700 22px "IBM Plex Mono", monospace';
  ctx.fillText('YOUR PLACES', leftX, top);
  ctx.fillText('YOUR YEAR', rightX, top);

  let y = top + 76;
  for (const place of data.places.slice(0, 5)) {
    ctx.fillStyle = palette.ink;
    ctx.font = '700 34px "Archivo", sans-serif';
    ctx.fillText(clip(ctx, place.name, columnWidth - 90), leftX, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = palette.mark;
    ctx.font = '800 34px "Archivo", sans-serif';
    ctx.fillText(String(place.count), leftX + columnWidth, y);
    ctx.textAlign = 'left';
    y += 84;
  }

  const facts: Array<{ label: string; value: string }> = [
    { label: 'Busiest day', value: data.day ? data.day.date : '-' },
    { label: 'Journeys that day', value: data.day ? String(data.day.count) : '-' },
    { label: 'Longest streak', value: data.streakDays ? `${data.streakDays} ${data.streakDays === 1 ? 'day' : 'days'}` : '-' },
    { label: 'Places in the year', value: String(data.places.length) },
  ];
  let factY = top + 76;
  for (const fact of facts) {
    ctx.fillStyle = palette.soft;
    ctx.font = '600 20px "IBM Plex Mono", monospace';
    ctx.fillText(fact.label.toUpperCase(), rightX, factY);
    ctx.fillStyle = palette.ink;
    ctx.font = '700 34px "Archivo", sans-serif';
    ctx.fillText(clip(ctx, fact.value, columnWidth), rightX, factY + 40);
    factY += 108;
  }

  ctx.strokeStyle = palette.soft;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PAD, H - 150);
  ctx.lineTo(W - PAD, H - 150);
  ctx.stroke();
  ctx.fillStyle = palette.ink;
  ctx.font = '600 24px "IBM Plex Mono", monospace';
  ctx.fillText('PLAN THE NETHERLANDS', PAD, H - 86);
  ctx.textAlign = 'right';
  ctx.fillText('OVVO', W - PAD, H - 86);
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png');
}

/** A data URL as a file, for the share sheet and for a download. */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, body] = dataUrl.split(',');
  const mime = header.match(/data:(.*?);/)?.[1] ?? 'image/png';
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], filename, { type: mime });
}

/** A file on disk, when the phone has no share sheet to give it to. */
export function saveBlob(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
