/**
 * **The card at the end: the one part of the year you can send to somebody.**
 *
 * A Wrapped that ends on a paragraph of disclaimers is a report with a story stuck on the front. The
 * last screen is the shareable thing instead: four figures, the year, and one label for the kind of
 * traveller the numbers describe, drawn onto a 1080 x 1350 canvas so it lands in a chat as an image
 * rather than as text somebody has to read.
 *
 * Two rules are kept from the deck itself:
 *
 * - **Nothing is invented.** Every figure on the card is one the story already printed, pulled out of
 *   the same chapters. The archetype is a name for the hour you travel at, not a score and not a
 *   comparison: there is no data about other travellers, so there is nothing to be a percentage of.
 * - **The card is the screen.** What the page draws and what the canvas draws are the same four
 *   figures, so a screenshot and a share never disagree.
 */

import type { Chapter } from './wrappedDeck';

export interface CardStat {
  label: string;
  value: string;
}

export interface CardData {
  year: number;
  archetype: string;
  stats: CardStat[];
  /** The pair to draw on the little rail, when there is one. */
  route: { from: string; to: string } | null;
  site: string;
}

/**
 * **One name for the kind of year it was.**
 *
 * Taken from the hour the traveller plans at, which is the strongest shape the tally has. It is a
 * description of their own data and nothing else — no tier, no comparison, no "top 3% of travellers",
 * because there is no other traveller in the sum.
 */
function archetypeFor(peakHour: number, directPct: number): string {
  if (directPct >= 90) return 'Straight through';
  if (peakHour < 7) return 'The early one';
  if (peakHour < 11) return 'The morning regular';
  if (peakHour < 16) return 'The afternoon planner';
  if (peakHour < 21) return 'The evening traveller';
  return 'The night owl';
}

export function cardData(story: Chapter[], year: number): CardData {
  const total = story.find((chapter) => chapter.id === 'total');
  const pair = story.find((chapter) => chapter.id === 'pair');
  const hour = story.find((chapter) => chapter.id === 'hour');
  const direct = story.find((chapter) => chapter.id === 'direct');
  const longest = story.find((chapter) => chapter.id === 'longest');

  const journeys = total?.count ?? 0;
  const peakHour = hour ? Number(hour.big.slice(0, 2)) || 0 : 12;
  const directPct = direct ? Number(direct.big.replace('%', '')) || 0 : 0;

  /*
   * A figure that is not there is left out rather than printed as a dash: the card is four promises,
   * and a promise with nothing behind it is worse than three promises.
   */
  const stats: CardStat[] = [{ label: 'journeys planned', value: String(journeys) }];
  if (pair?.route) {
    stats.push({ label: 'the line you kept coming back to', value: `${pair.route.count}x` });
  }
  if (hour?.big) stats.push({ label: 'your hour', value: hour.big });
  if (direct?.big) stats.push({ label: 'straight through', value: direct.big });
  if (longest?.big) stats.push({ label: 'the long haul', value: longest.big });

  return {
    year,
    archetype: archetypeFor(Number.isFinite(peakHour) ? peakHour : 12, directPct),
    stats: stats.slice(0, 4),
    route: pair?.route ? { from: pair.route.from, to: pair.route.to } : null,
    site: 'ovvo.vibecreations.workers.dev',
  };
}

const W = 1080;
const H = 1350;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * **The image itself.**
 *
 * Drawn rather than screenshotted: a screenshot of the deck on a 390-pixel phone is a 390-pixel-wide
 * picture, and the same story posted from a phone would arrive soft. This is 1080 wide, portrait, the
 * shape a story post wants.
 */
export async function wrappedImage(data: CardData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot draw the card.');

  /* The font has to be in before the text is drawn, or the figure lands in a fallback face. */
  try {
    await document.fonts.ready;
  } catch {
    /* An older browser without the font API still gets a card, in the system face. */
  }

  ctx.fillStyle = '#0a0a0d';
  ctx.fillRect(0, 0, W, H);

  const warm = ctx.createRadialGradient(W * 0.18, H * 0.1, 0, W * 0.18, H * 0.1, W * 1.05);
  warm.addColorStop(0, 'rgba(126, 92, 255, 0.62)');
  warm.addColorStop(1, 'rgba(10, 10, 13, 0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W, H);

  const second = ctx.createRadialGradient(W * 0.92, H * 0.9, 0, W * 0.92, H * 0.9, W * 0.85);
  second.addColorStop(0, 'rgba(226, 84, 118, 0.45)');
  second.addColorStop(1, 'rgba(10, 10, 13, 0)');
  ctx.fillStyle = second;
  ctx.fillRect(0, 0, W, H);

  const ink = '#f7f4ef';
  const soft = 'rgba(247, 244, 239, 0.62)';

  ctx.fillStyle = ink;
  ctx.font = '800 30px Archivo, system-ui, sans-serif';
  ctx.fillText('OVVO WRAPPED', 72, 116);

  ctx.fillStyle = soft;
  ctx.font = '600 26px Archivo, system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(data.archetype, W - 72, 116);
  ctx.textAlign = 'left';

  ctx.fillStyle = ink;
  ctx.font = '800 220px Archivo, system-ui, sans-serif';
  ctx.fillText(String(data.year), 60, 350);

  if (data.route) {
    const railY = 470;
    ctx.strokeStyle = 'rgba(247, 244, 239, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(76, railY);
    ctx.lineTo(W - 76, railY);
    ctx.stroke();

    ctx.fillStyle = ink;
    for (const x of [76, W - 76]) {
      ctx.beginPath();
      ctx.arc(x, railY, 13, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = soft;
    ctx.font = '600 28px Archivo, system-ui, sans-serif';
    ctx.fillText(data.route.from, 76, railY + 62);
    ctx.textAlign = 'right';
    ctx.fillText(data.route.to, W - 76, railY + 62);
    ctx.textAlign = 'left';
  }

  const top = 640;
  const gap = 44;
  const tileW = (W - 144 - gap) / 2;
  const tileH = 240;

  data.stats.forEach((stat, which) => {
    const x = 72 + (which % 2) * (tileW + gap);
    const y = top + Math.floor(which / 2) * (tileH + gap);
    ctx.fillStyle = 'rgba(247, 244, 239, 0.06)';
    roundRect(ctx, x, y, tileW, tileH, 34);
    ctx.fill();
    ctx.strokeStyle = 'rgba(247, 244, 239, 0.16)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = ink;
    ctx.font = '800 86px Archivo, system-ui, sans-serif';
    ctx.fillText(stat.value, x + 34, y + 130);

    ctx.fillStyle = soft;
    ctx.font = '600 24px Archivo, system-ui, sans-serif';
    const words = stat.label.split(' ');
    let row = '';
    let line = 0;
    for (const word of words) {
      const next = row ? `${row} ${word}` : word;
      if (ctx.measureText(next).width > tileW - 68 && row) {
        ctx.fillText(row, x + 34, y + 182 + line * 32);
        row = word;
        line += 1;
      } else {
        row = next;
      }
    }
    ctx.fillText(row, x + 34, y + 182 + line * 32);
  });

  ctx.fillStyle = soft;
  ctx.font = '600 26px Archivo, system-ui, sans-serif';
  ctx.fillText('Made in OVVO. Every number is a journey you planned.', 72, H - 132);
  ctx.fillStyle = 'rgba(247, 244, 239, 0.4)';
  ctx.font = '600 24px Archivo, system-ui, sans-serif';
  ctx.fillText(data.site, 72, H - 88);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('The card could not be made.'));
    }, 'image/png');
  });
}

/**
 * **Straight to the share sheet, with a download behind it.**
 *
 * The share sheet is what a phone expects and it lets the picture go to Instagram, a chat or the camera
 * roll in one tap. Where a browser cannot share files -- most desktops -- the same image is downloaded
 * instead, so the button always gives the traveller the picture rather than an apology.
 */
export async function shareCardImage(data: CardData): Promise<'shared' | 'saved'> {
  const blob = await wrappedImage(data);
  const file = new File([blob], `ovvo-wrapped-${data.year}.png`, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };

  if (nav.canShare?.({ files: [file] }) && typeof nav.share === 'function') {
    try {
      await nav.share({ files: [file], title: `OVVO Wrapped ${data.year}` });
      return 'shared';
    } catch {
      /* A cancelled sheet is not a failure, but it also did not save: fall through to the file. */
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 6000);
  return 'saved';
}
