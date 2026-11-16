import { useEffect, useMemo, useState } from 'react';
import { Button, Dialog, Switch } from '../ui/primitives';
import { useApp } from '../../state/AppState';
import { useT } from '../../lib/useT';
import { styleById, stylePalette } from '../../lib/styles';
import type { Chapter } from '../../lib/wrappedDeck';
import type { YearTally } from '../../lib/wrapped';

/*
 * **A year becomes a picture you can send.**
 *
 * Copying a sentence asks somebody to describe their year. A card lets them show it. These are
 * made in the browser, at the size a story takes, and nothing is uploaded: the same privacy that
 * keeps the Yearbook local also keeps these images local until the traveller shares one.
 *
 * The cards are deliberately a small set: who the year made you, the journey you kept making, and
 * the year in numbers. More than three choices stops being a share sheet and becomes a design app.
 */

type ShareLayout = 'identity' | 'route' | 'year' | 'award' | 'award-ticket';

interface ShareCard {
  id: string;
  layout: ShareLayout;
  tab: string;
  eyebrow: string;
  title: string;
  stat: string;
  statLabel: string;
  line: string;
  rows: Array<{ label: string; value: string }>;
  /* Only the route card has the two ends; its picture is built around them. */
  from?: string;
  to?: string;
}

interface Palette {
  canvas: string;
  card: string;
  ink: string;
  accent: string;
}

const W = 1080;
const H = 1920;
const PAD = 72;

function rgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((part) => part + part).join('') : value;
  const red = parseInt(full.slice(0, 2), 16);
  const green = parseInt(full.slice(2, 4), 16);
  const blue = parseInt(full.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const corner = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + corner, y);
  ctx.arcTo(x + width, y, x + width, y + height, corner);
  ctx.arcTo(x + width, y + height, x, y + height, corner);
  ctx.arcTo(x, y + height, x, y, corner);
  ctx.arcTo(x, y, x + width, y, corner);
  ctx.closePath();
}

function wordsOf(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of wordsOf(text)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
      continue;
    }
    lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  return lines;
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  startSize: number,
  minSize: number,
  weight = 700,
  family = 'Archivo, sans-serif',
): { size: number; lines: string[] } {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${family}`;
    const lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
    size -= 4;
  }
  ctx.font = `${weight} ${minSize}px ${family}`;
  const lines = wrapText(ctx, text, maxWidth).slice(0, maxLines);
  if (lines.length === maxLines) {
    const last = lines[lines.length - 1];
    let trimmed = last;
    while (trimmed.length > 1 && ctx.measureText(`${trimmed}...`).width > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    lines[lines.length - 1] = `${trimmed}...`;
  }
  return { size: minSize, lines };
}

function short(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && ctx.measureText(`${result}...`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}...`;
}

/* Every shared card is a different picture. The three base cards each have their own composition,
   and the yearbook awards alternate between a certificate and a ticket. They share only the paper,
   the header and the footer: a set of cards, not seven prints of one template. */

function drawHeader(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  year: number,
  demo: boolean,
): void {
  ctx.textAlign = 'left';
  ctx.fillStyle = palette.ink;
  ctx.font = '700 28px "Space Grotesk", sans-serif';
  ctx.fillText('OVVO YEARBOOK', PAD, 92);

  ctx.textAlign = 'right';
  ctx.fillStyle = rgba(palette.ink, 0.62);
  ctx.font = '600 26px "Space Grotesk", sans-serif';
  ctx.fillText(String(year), W - PAD, 92);

  if (demo) {
    ctx.fillStyle = palette.accent;
    roundedRect(ctx, W - PAD - 132, 118, 132, 44, 22);
    ctx.fill();
    ctx.fillStyle = palette.canvas;
    ctx.textAlign = 'center';
    ctx.font = '700 19px "Space Grotesk", sans-serif';
    ctx.fillText('DEMO', W - PAD - 66, 147);
  }
  ctx.textAlign = 'left';
}

function drawFooter(ctx: CanvasRenderingContext2D, palette: Palette): void {
  ctx.strokeStyle = rgba(palette.ink, 0.18);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, 1790);
  ctx.lineTo(W - PAD, 1790);
  ctx.stroke();

  ctx.fillStyle = rgba(palette.ink, 0.56);
  ctx.font = '600 20px "Space Grotesk", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PLAN THE NETHERLANDS', PAD, 1840);
  ctx.textAlign = 'right';
  ctx.fillText('OVVO', W - PAD, 1840);
  ctx.textAlign = 'left';
}

function drawEyebrow(ctx: CanvasRenderingContext2D, palette: Palette, text: string, y = 300): void {
  ctx.fillStyle = palette.accent;
  ctx.font = '700 24px "Space Grotesk", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text.toUpperCase(), PAD, y);
}

function drawTitle(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  text: string,
  y: number,
  maxWidth: number,
  maxLines: number,
  startSize: number,
  minSize: number,
): number {
  const fitted = fitText(ctx, text, maxWidth, maxLines, startSize, minSize);
  ctx.fillStyle = palette.ink;
  ctx.font = `700 ${fitted.size}px "Archivo", sans-serif`;
  let lineY = y;
  for (const line of fitted.lines) {
    ctx.fillText(line, PAD, lineY);
    lineY += fitted.size * 0.92;
  }
  return lineY;
}

function drawStackedFacts(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  rows: ShareCard['rows'],
  y: number,
): void {
  rows.slice(0, 3).forEach((row, index) => {
    const rowY = y + index * 82;
    ctx.strokeStyle = rgba(palette.ink, 0.13);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD, rowY - 28);
    ctx.lineTo(W - PAD, rowY - 28);
    ctx.stroke();

    ctx.fillStyle = rgba(palette.ink, 0.46);
    ctx.font = '600 18px "Space Grotesk", sans-serif';
    ctx.fillText(row.label.toUpperCase(), PAD, rowY);

    ctx.fillStyle = palette.ink;
    ctx.font = '700 32px "Archivo", sans-serif';
    ctx.fillText(short(ctx, row.value, W - PAD * 2), PAD, rowY + 36);
  });
}

function drawColumnFacts(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  rows: ShareCard['rows'],
  y: number,
  valueSize: number,
): void {
  const visible = rows.slice(0, 3);
  const column = (W - PAD * 2) / Math.max(1, visible.length);
  visible.forEach((row, index) => {
    const x = PAD + index * column;
    if (index) {
      ctx.strokeStyle = rgba(palette.ink, 0.14);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 20, y - 38);
      ctx.lineTo(x - 20, y + 118);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(palette.ink, 0.46);
    ctx.font = '600 17px "Space Grotesk", sans-serif';
    ctx.fillText(row.label.toUpperCase(), x, y);
    const value = fitText(ctx, row.value, column - 34, 2, valueSize, 22);
    ctx.fillStyle = palette.ink;
    ctx.font = `700 ${value.size}px "Archivo", sans-serif`;
    value.lines.forEach((line, lineIndex) => {
      ctx.fillText(line, x, y + 48 + lineIndex * (value.size * 0.94));
    });
  });
}

function drawIdentity(
  ctx: CanvasRenderingContext2D,
  card: ShareCard,
  palette: Palette,
  year: number,
  demo: boolean,
): void {
  ctx.fillStyle = palette.canvas;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(W + 40, 180, 360, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.055;
  ctx.beginPath();
  ctx.arc(-80, H - 280, 420, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawHeader(ctx, palette, year, demo);
  drawEyebrow(ctx, palette, card.eyebrow);

  let y = 420;
  y = drawTitle(ctx, palette, card.title, y, W - PAD * 2, 3, 132, 56) + 24;

  /* One dot for every journey. It is the card's own number, drawn as a field rather than repeated. */
  const count = Math.min(180, Math.max(1, parseInt(card.stat, 10) || 1));
  const cols = 18;
  const dotGap = (W - PAD * 2) / cols;
  const dotTop = Math.min(850, y + 26);
  ctx.fillStyle = palette.accent;
  for (let index = 0; index < count; index += 1) {
    ctx.globalAlpha = 0.24 + (index % 4) * 0.08;
    ctx.beginPath();
    ctx.arc(PAD + (index % cols) * dotGap + dotGap / 2, dotTop + Math.floor(index / cols) * 28, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = palette.accent;
  ctx.font = '700 300px "Archivo", sans-serif';
  ctx.fillText(short(ctx, card.stat, W - PAD * 2), PAD, 1250);

  ctx.fillStyle = rgba(palette.ink, 0.64);
  ctx.font = '600 26px "Space Grotesk", sans-serif';
  ctx.fillText(card.statLabel.toUpperCase(), PAD, 1308);

  drawStackedFacts(ctx, palette, card.rows, 1418);
  drawFooter(ctx, palette);
}

function drawRoute(
  ctx: CanvasRenderingContext2D,
  card: ShareCard,
  palette: Palette,
  year: number,
  demo: boolean,
): void {
  ctx.fillStyle = palette.canvas;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.075;
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += 72) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  ctx.restore();

  drawHeader(ctx, palette, year, demo);
  drawEyebrow(ctx, palette, card.eyebrow);

  const titleWidth = W - PAD * 2;
  const titleEnd = drawTitle(ctx, palette, card.title, 390, titleWidth, 3, 96, 48);

  const from = card.from ?? card.title;
  const to = card.to ?? '';
  const railX = 154;
  const railTop = Math.max(780, titleEnd + 50);
  const railBottom = 1460;

  ctx.strokeStyle = rgba(palette.ink, 0.22);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(railX, railTop);
  ctx.lineTo(railX, railBottom);
  ctx.stroke();

  for (let index = 0; index < 10; index += 1) {
    const tickY = railTop + 18 + (index * (railBottom - railTop - 36)) / 9;
    ctx.strokeStyle = rgba(palette.accent, 0.72);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(railX - 20, tickY);
    ctx.lineTo(railX + 20, tickY);
    ctx.stroke();
  }

  ctx.fillStyle = palette.canvas;
  [railTop, railBottom].forEach((point) => {
    ctx.beginPath();
    ctx.arc(railX, point, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 4;
    ctx.stroke();
  });

  ctx.fillStyle = rgba(palette.ink, 0.55);
  ctx.font = '600 17px "Space Grotesk", sans-serif';
  ctx.fillText('FROM', railX + 42, railTop + 6);
  ctx.fillText('TO', railX + 42, railBottom + 6);

  ctx.fillStyle = palette.ink;
  ctx.font = '700 28px "Space Grotesk", sans-serif';
  ctx.fillText(short(ctx, from, W - PAD - railX - 50), railX + 42, railTop + 42);
  if (to) ctx.fillText(short(ctx, to, W - PAD - railX - 50), railX + 42, railBottom - 18);

  ctx.fillStyle = palette.accent;
  const stat = fitText(ctx, card.stat, W - railX - PAD - 30, 2, 230, 56);
  ctx.font = `700 ${stat.size}px "Archivo", sans-serif`;
  stat.lines.forEach((line, index) => {
    ctx.fillText(line, railX + 42, 1040 + index * (stat.size * 0.9));
  });

  ctx.fillStyle = rgba(palette.ink, 0.64);
  ctx.font = '600 24px "Space Grotesk", sans-serif';
  ctx.fillText(card.statLabel.toUpperCase(), railX + 42, 1092);

  drawColumnFacts(ctx, palette, card.rows, 1610, 28);
  drawFooter(ctx, palette);
}

function drawYear(
  ctx: CanvasRenderingContext2D,
  card: ShareCard,
  palette: Palette,
  year: number,
  demo: boolean,
): void {
  ctx.fillStyle = palette.canvas;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.11;
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(W / 2, 760, 500, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawHeader(ctx, palette, year, demo);
  drawEyebrow(ctx, palette, card.eyebrow);

  ctx.fillStyle = 'transparent';
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 3;
  ctx.textAlign = 'center';
  ctx.font = '700 250px "Archivo", sans-serif';
  ctx.strokeText(String(year), W / 2, 640);
  ctx.textAlign = 'left';

  roundedRect(ctx, PAD, 780, W - PAD * 2, 330, 38);
  ctx.fillStyle = palette.accent;
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = palette.canvas;
  ctx.font = '700 270px "Archivo", sans-serif';
  ctx.fillText(short(ctx, card.stat, W - PAD * 2 - 48), W / 2, 1015);
  ctx.font = '600 25px "Space Grotesk", sans-serif';
  ctx.fillText(card.statLabel.toUpperCase(), W / 2, 1070);
  ctx.textAlign = 'left';

  drawColumnFacts(ctx, palette, card.rows, 1290, 40);
  drawFooter(ctx, palette);
}

function drawAward(
  ctx: CanvasRenderingContext2D,
  card: ShareCard,
  palette: Palette,
  year: number,
  demo: boolean,
): void {
  ctx.fillStyle = palette.canvas;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.strokeStyle = rgba(palette.accent, 0.46);
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 12]);
  roundedRect(ctx, 34, 34, W - 68, H - 68, 34);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(W - 160, 420, 280, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawHeader(ctx, palette, year, demo);
  drawEyebrow(ctx, palette, card.eyebrow);

  const titleEnd = drawTitle(ctx, palette, card.title, 370, W - PAD * 2, 3, 90, 46);

  const sealY = Math.max(830, titleEnd + 130);
  ctx.save();
  ctx.strokeStyle = palette.accent;
  ctx.fillStyle = rgba(palette.accent, 0.1);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(W / 2, sealY, 175, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  const stat = fitText(ctx, card.stat, 310, 1, 120, 54);
  ctx.textAlign = 'center';
  ctx.fillStyle = palette.accent;
  ctx.font = `700 ${stat.size}px "Archivo", sans-serif`;
  ctx.fillText(stat.lines[0], W / 2, sealY + 30);
  ctx.fillStyle = rgba(palette.ink, 0.56);
  ctx.font = '600 19px "Space Grotesk", sans-serif';
  ctx.fillText(card.statLabel.toUpperCase(), W / 2, sealY + 75);
  ctx.textAlign = 'left';

  const line = wrapText(ctx, card.line, W - PAD * 2);
  ctx.fillStyle = rgba(palette.ink, 0.82);
  ctx.font = '500 30px "Space Grotesk", sans-serif';
  let lineY = sealY + 260;
  line.slice(0, 3).forEach((part) => {
    ctx.fillText(part, PAD, lineY);
    lineY += 40;
  });

  drawStackedFacts(ctx, palette, card.rows, Math.max(1530, lineY + 30));
  drawFooter(ctx, palette);
}

function drawAwardTicket(
  ctx: CanvasRenderingContext2D,
  card: ShareCard,
  palette: Palette,
  year: number,
  demo: boolean,
): void {
  ctx.fillStyle = palette.canvas;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = palette.accent;
  roundedRect(ctx, PAD, 240, W - PAD * 2, 300, 30);
  ctx.fill();

  drawHeader(ctx, palette, year, demo);

  ctx.fillStyle = palette.canvas;
  ctx.font = '600 20px "Space Grotesk", sans-serif';
  ctx.fillText(card.eyebrow.toUpperCase(), PAD + 34, 310);

  const stat = fitText(ctx, card.stat, W - PAD * 2 - 70, 1, 150, 62);
  ctx.fillStyle = palette.canvas;
  ctx.font = `700 ${stat.size}px "Archivo", sans-serif`;
  ctx.fillText(short(ctx, stat.lines[0], W - PAD * 2 - 70), PAD + 34, 445);
  ctx.font = '600 22px "Space Grotesk", sans-serif';
  ctx.fillText(card.statLabel.toUpperCase(), PAD + 36, 495);

  ctx.strokeStyle = rgba(palette.ink, 0.24);
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(PAD, 590);
  ctx.lineTo(W - PAD, 590);
  ctx.stroke();
  ctx.setLineDash([]);

  drawTitle(ctx, palette, card.title, 690, W - PAD * 2, 3, 88, 44);

  const line = wrapText(ctx, card.line, W - PAD * 2);
  ctx.fillStyle = rgba(palette.ink, 0.8);
  ctx.font = '500 30px "Space Grotesk", sans-serif';
  line.slice(0, 3).forEach((part, index) => {
    ctx.fillText(part, PAD, 1080 + index * 40);
  });

  drawStackedFacts(ctx, palette, card.rows, 1390);
  drawFooter(ctx, palette);
}

function drawCard(card: ShareCard, palette: Palette, year: number, demo: boolean): string {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');

  switch (card.layout) {
    case 'identity':
      drawIdentity(ctx, card, palette, year, demo);
      break;
    case 'route':
      drawRoute(ctx, card, palette, year, demo);
      break;
    case 'year':
      drawYear(ctx, card, palette, year, demo);
      break;
    case 'award':
      drawAward(ctx, card, palette, year, demo);
      break;
    case 'award-ticket':
      drawAwardTicket(ctx, card, palette, year, demo);
      break;
  }

  return canvas.toDataURL('image/png');
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, body] = dataUrl.split(',');
  const mime = header.match(/data:(.*?);/)?.[1] ?? 'image/png';
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], filename, { type: mime });
}

function saveBlob(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function WrappedShareDialog({
  open,
  onClose,
  initialCardId,
  year,
  demo,
  story,
  tally,
}: {
  open: boolean;
  onClose: () => void;
  /** The award that opened the sheet, if it was a share button on the yearbook page. */
  initialCardId?: string;
  year: number;
  demo: boolean;
  story: Chapter[];
  tally: YearTally;
}) {
  const t = useT();
  const { settings, appearance } = useApp();
  const [active, setActive] = useState(0);
  const [hideStations, setHideStations] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const style = styleById(settings.styleId);
  const palette = useMemo(() => stylePalette(style, appearance), [style, appearance]);

  const cards = useMemo<ShareCard[]>(() => {
    const named = story.find((chapter) => chapter.kind === 'name');
    const route = story.find((chapter) => chapter.kind === 'route');
    const origin = story.find((chapter) => chapter.id === 'origin');
    const hour = story.find((chapter) => chapter.id === 'hour');
    const direct = story.find((chapter) => chapter.id === 'direct');
    const lines = story.find((chapter) => chapter.id === 'lines');
    const look = story.find((chapter) => chapter.id === 'look');
    const awards = story.find((chapter) => chapter.kind === 'awards')?.awards ?? [];
    const total = tally.runs.length;
    const journeyWord = total === 1 ? t('journey') : t('journeys');
    const topStation = hideStations ? t('Hidden for sharing') : origin?.big ?? t('Not enough journeys');
    const usualHour = hour?.big ?? t('No usual hour');
    const lookName = look?.big ?? (settings.language === 'nl' ? style.nameNl : style.name);
    const lineName = lines?.big ?? t('No line stood out');
    const directPct = direct?.count ?? 0;
    const routeCount = route?.route?.count ?? 0;
    const routeTitle =
      route?.route && !hideStations
        ? `${route.route.from} to ${route.route.to}`
        : route?.route
          ? t('A route you know')
          : lineName;
    const routeLine = route?.route
      ? t('The journey you kept coming back to.')
      : t('The line your year kept returning to.');

    const baseCards: ShareCard[] = [
      {
        id: 'identity',
        layout: 'identity',
        tab: t('Who you were'),
        eyebrow: t('The traveller you were'),
        title: named?.big ?? t('The year in journeys'),
        stat: String(total),
        statLabel: `${journeyWord} ${t('planned')}`,
        line:
          hideStations && named?.line
            ? t('A year of journeys planned in OVVO.')
            : named?.line ?? t('A year of journeys planned in OVVO.'),
        rows: [
          { label: t('Top station'), value: topStation },
          { label: t('Usual hour'), value: usualHour },
          { label: t('The look you wore'), value: lookName },
        ],
      },
      {
        id: 'route',
        layout: 'route',
        tab: t('Your route'),
        eyebrow: t('The line you kept'),
        title: routeTitle,
        stat: route?.route ? String(routeCount) : lineName,
        statLabel: route?.route ? (routeCount === 1 ? t('time') : t('times')) : t('on your line'),
        line: routeLine,
        rows: [
          { label: t('Most used line'), value: lineName },
          { label: t('Top station'), value: topStation },
          { label: t('Change-free'), value: `${directPct}%` },
        ],
      },
      {
        id: 'year',
        layout: 'year',
        tab: t('Your year'),
        eyebrow: t('The year in numbers'),
        title: String(year),
        stat: String(total),
        statLabel: `${journeyWord} ${t('planned')}`,
        line: t('Every number here comes from journeys you planned in this app, and nothing else.'),
        rows: [
          { label: t('Top station'), value: topStation },
          { label: t('Usual hour'), value: usualHour },
          { label: t('The look you wore'), value: lookName },
        ],
      },
    ];

    const routeCard = baseCards[1];
    if (route?.route && !hideStations) {
      routeCard.from = route.route.from;
      routeCard.to = route.route.to;
    }

    return [
      ...baseCards,
      ...awards.map((award, index) => ({
        id: `award-${award.id}`,
        layout: (index % 2 === 0 ? 'award' : 'award-ticket') as ShareLayout,
        tab: t(award.title),
        eyebrow: t('Yearbook award'),
        title: t(award.title),
        stat: award.stat,
        statLabel: t(award.statLabel),
        line: t(award.line),
        rows: award.facts.map((fact) => ({ label: t(fact.label), value: fact.value })),
      })),
    ];
  }, [story, tally, hideStations, t, settings.language, style.name, style.nameNl]);

  useEffect(() => {
    if (!open) return;
    const index = initialCardId ? cards.findIndex((card) => card.id === initialCardId) : 0;
    setActive(index >= 0 ? index : 0);
  }, [open, initialCardId]);

  useEffect(() => {
    if (!open) {
      setImages([]);
      setStatus('');
      return undefined;
    }
    let live = true;
    setBusy(true);
    setImages([]);
    const render = async () => {
      if (document.fonts) {
        await Promise.all([
          document.fonts.load('700 126px "Archivo"'),
          document.fonts.load('600 28px "Space Grotesk"'),
          document.fonts.load('500 32px "Space Grotesk"'),
        ]).catch(() => undefined);
      }
      const next = cards.map((card) => drawCard(card, palette, year, demo));
      if (live) {
        setImages(next);
        setBusy(false);
        setActive((current) => Math.min(current, next.length - 1));
      }
    };
    void render().catch(() => {
      if (live) {
        setBusy(false);
        setStatus(t('The cards could not be drawn on this browser.'));
      }
    });
    return () => {
      live = false;
    };
  }, [open, cards, palette, year, demo, t]);

  const image = images[active];

  const shareCurrent = async () => {
    if (!image) return;
    const file = dataUrlToFile(image, `ovvo-yearbook-${year}-${cards[active].id}.png`);
    setStatus('');
    try {
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t('My OVVO Yearbook {year}', { year }),
          text: demo ? t('My demo OVVO Yearbook year.') : t('My year in journeys with OVVO.'),
        });
        setStatus(t('Shared'));
        return;
      }
      saveBlob(file);
      setStatus(t('Downloaded'));
    } catch (error) {
      /* A dismissed share sheet is not a failed share. */
      if ((error as Error)?.name !== 'AbortError') {
        saveBlob(file);
        setStatus(t('Downloaded instead'));
      }
    }
  };

  const downloadAll = () => {
    if (!images.length) return;
    images.forEach((dataUrl, index) => {
      window.setTimeout(() => {
        saveBlob(dataUrlToFile(dataUrl, `ovvo-yearbook-${year}-${cards[index].id}.png`));
      }, index * 240);
    });
    setStatus(t('Downloading all cards'));
  };

  return (
    <Dialog
      open={open}
      title={t('Share your year')}
      description={t('Story-sized cards, made in this browser. Nothing is uploaded.')}
      onClose={onClose}
      panelClassName="wrapped-share"
      footer={
        <>
          <Button variant="accent" icon="share" onClick={() => void shareCurrent()} disabled={!image || busy}>
            {t('Share this card')}
          </Button>
          <Button variant="ghost" icon="download" onClick={downloadAll} disabled={!images.length || busy}>
            {t('Download all cards')}
          </Button>
        </>
      }
    >
      <div className="wrapped-share__tabs" role="tablist" aria-label={t('Choose a card')}>
        {cards.map((card, index) => (
          <button
            key={card.id}
            type="button"
            role="tab"
            aria-selected={index === active}
            className="wrapped-share__tab"
            onClick={() => setActive(index)}
          >
            {card.tab}
          </button>
        ))}
      </div>

      <div className="wrapped-share__stage">
        {busy ? (
          <div className="wrapped-share__loading" role="status">
            {t('Making your cards')}
          </div>
        ) : image ? (
          <img
            className="wrapped-share__image"
            src={image}
            alt={t('{card} card for OVVO Yearbook {year}', { card: cards[active].tab, year })}
          />
        ) : (
          <div className="wrapped-share__loading" role="status">
            {t('This browser could not draw the cards.')}
          </div>
        )}
      </div>

      <Switch
        checked={hideStations}
        onChange={setHideStations}
        label={t('Hide exact station names')}
        description={t('The cards keep the story but leave out the stations you actually used.')}
        icon="mapPin"
      />

      {status ? (
        <p className="t-sm t-muted" role="status">
          {status}
        </p>
      ) : null}
    </Dialog>
  );
}
