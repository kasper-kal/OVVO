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
 * keeps Wrapped local also keeps these images local until the traveller shares one.
 *
 * The cards are deliberately a small set: who the year made you, the journey you kept making, and
 * the year in numbers. More than three choices stops being a share sheet and becomes a design app.
 */

interface ShareCard {
  id: string;
  tab: string;
  eyebrow: string;
  title: string;
  stat: string;
  statLabel: string;
  line: string;
  rows: Array<{ label: string; value: string }>;
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

function drawCard(card: ShareCard, palette: Palette, year: number, demo: boolean): string {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');

  const ink = palette.ink;
  const accent = palette.accent;

  ctx.fillStyle = palette.canvas;
  ctx.fillRect(0, 0, W, H);

  /* A material, not a flat poster: one large accent field and a quiet grid. */
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(W + 70, 160, 390, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.08;
  ctx.beginPath();
  ctx.arc(-40, H - 220, 330, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += 72) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  ctx.restore();

  /* Top line: the deck, the year, and the honest demo mark. */
  ctx.fillStyle = ink;
  ctx.font = '700 28px "Space Grotesk", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('OVVO WRAPPED', PAD, 92);

  ctx.textAlign = 'right';
  ctx.fillStyle = rgba(ink, 0.62);
  ctx.font = '600 26px "Space Grotesk", sans-serif';
  ctx.fillText(String(year), W - PAD, 92);

  if (demo) {
    ctx.fillStyle = accent;
    roundedRect(ctx, W - PAD - 132, 118, 132, 44, 22);
    ctx.fill();
    ctx.fillStyle = palette.canvas;
    ctx.textAlign = 'center';
    ctx.font = '700 19px "Space Grotesk", sans-serif';
    ctx.fillText('DEMO', W - PAD - 66, 147);
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = accent;
  ctx.font = '700 24px "Space Grotesk", sans-serif';
  ctx.fillText(card.eyebrow.toUpperCase(), PAD, 300);

  const fitted = fitText(ctx, card.title, W - PAD * 2, 3, 126, 52);
  let y = 430;
  ctx.fillStyle = ink;
  ctx.font = `700 ${fitted.size}px "Archivo", sans-serif`;
  for (const line of fitted.lines) {
    ctx.fillText(line, PAD, y);
    y += fitted.size * 0.9;
  }

  ctx.fillStyle = accent;
  const statSize = card.stat.length > 4 ? 132 : 210;
  ctx.font = `700 ${statSize}px "Archivo", sans-serif`;
  ctx.fillText(short(ctx, card.stat, W - PAD * 2), PAD, 1120);

  ctx.fillStyle = rgba(ink, 0.66);
  ctx.font = '600 28px "Space Grotesk", sans-serif';
  ctx.fillText(card.statLabel.toUpperCase(), PAD, 1170);

  ctx.fillStyle = rgba(ink, 0.82);
  ctx.font = '500 32px "Space Grotesk", sans-serif';
  const line = wrapText(ctx, card.line, W - PAD * 2);
  let lineY = 1260;
  for (const part of line.slice(0, 3)) {
    ctx.fillText(part, PAD, lineY);
    lineY += 44;
  }

  /* The facts sit on one plate, so three small rows read as a receipt, not three paragraphs. */
  ctx.fillStyle = rgba(palette.card, 0.92);
  ctx.strokeStyle = rgba(ink, 0.16);
  ctx.lineWidth = 2;
  roundedRect(ctx, PAD, 1440, W - PAD * 2, 292, 28);
  ctx.fill();
  ctx.stroke();

  card.rows.forEach((row, index) => {
    const rowY = 1508 + index * 78;
    ctx.fillStyle = rgba(ink, 0.5);
    ctx.font = '600 20px "Space Grotesk", sans-serif';
    ctx.fillText(row.label.toUpperCase(), PAD + 30, rowY);
    ctx.fillStyle = ink;
    ctx.font = '700 34px "Archivo", sans-serif';
    ctx.fillText(short(ctx, row.value, W - PAD * 2 - 300), PAD + 300, rowY);
  });

  ctx.strokeStyle = rgba(ink, 0.18);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, 1790);
  ctx.lineTo(W - PAD, 1790);
  ctx.stroke();

  ctx.fillStyle = rgba(ink, 0.56);
  ctx.font = '600 20px "Space Grotesk", sans-serif';
  ctx.fillText('PLAN THE NETHERLANDS', PAD, 1840);
  ctx.textAlign = 'right';
  ctx.fillText('OVVO', W - PAD, 1840);

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

    return [
      ...baseCards,
      ...awards.map((award) => ({
        id: `award-${award.id}`,
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
    const file = dataUrlToFile(image, `ovvo-wrapped-${year}-${cards[active].id}.png`);
    setStatus('');
    try {
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t('My OVVO Wrapped {year}', { year }),
          text: demo ? t('My demo OVVO Wrapped year.') : t('My year in journeys with OVVO.'),
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
        saveBlob(dataUrlToFile(dataUrl, `ovvo-wrapped-${year}-${cards[index].id}.png`));
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
            alt={t('{card} card for OVVO Wrapped {year}', { card: cards[active].tab, year })}
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
