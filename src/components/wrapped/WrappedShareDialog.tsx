import { useEffect, useMemo, useState } from 'react';
import { Button, Dialog, Switch } from '../ui/primitives';
import { useApp } from '../../state/AppState';
import { useT } from '../../lib/useT';
import { styleById, stylePalette } from '../../lib/styles';
import { playYearbookEffect } from '../../lib/yearbookEffects';
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

/*
 * **The export is a still from the film.**
 *
 * Sharing a card used to put the old yearbook back on screen. These cards carry the scene grammar:
 * black, a neon ribbon, a red field, a huge figure in Archivo and a lean mono masthead.
 */
function drawIssueCard(card: ShareCard, year: number, demo: boolean): string {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');

  const paper = '#050505';
  const ink = '#f7f3ea';
  const red = '#ff2d75';
  const acid = '#d9ff3a';

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H);

  /* The same neon ribbon as the live scenes, frozen into the export. */
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const ribbon = ctx.createLinearGradient(0, 0, W, 260);
  ribbon.addColorStop(0, '#ff2d75');
  ribbon.addColorStop(0.5, '#ff4b2b');
  ribbon.addColorStop(1, '#ff9d00');
  ctx.strokeStyle = ribbon;
  ctx.shadowColor = '#ff4b2b';
  ctx.shadowBlur = 32;
  for (const [base, flip] of [[160, 1], [H - 150, -1]] as const) {
    for (let layer = 0; layer < 3; layer += 1) {
      ctx.lineWidth = 16 + layer * 8;
      ctx.globalAlpha = 0.8 - layer * 0.18;
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 8) {
        const y = base + flip * (Math.sin(x * 0.009 + layer * 1.2) * 58 + Math.cos(x * 0.018) * 22);
        if (x === -20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.restore();

  /* The red block is the live mark, carried into every export. */
  ctx.fillStyle = red;
  ctx.fillRect(PAD, 300, 190, 300);

  ctx.fillStyle = ink;
  ctx.font = '700 30px "IBM Plex Mono", monospace';
  ctx.fillText('OVVO YEARBOOK', PAD, 100);
  ctx.textAlign = 'right';
  ctx.font = '600 26px "IBM Plex Mono", monospace';
  ctx.fillText(`${year} · IN MOTION`, W - PAD, 100);
  ctx.textAlign = 'left';

  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PAD, 130);
  ctx.lineTo(W - PAD, 130);
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.font = '700 24px "IBM Plex Mono", monospace';
  ctx.fillText(card.eyebrow.toUpperCase(), PAD, 210);

  if (demo) {
    ctx.fillStyle = acid;
    ctx.fillRect(W - PAD - 150, 180, 150, 42);
    ctx.fillStyle = ink;
    ctx.font = '700 18px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DEMO', W - PAD - 75, 208);
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = ink;
  const title = fitText(ctx, card.title, W - PAD * 2 - 230, 3, 100, 44);
  ctx.font = `700 ${title.size}px "Archivo", sans-serif`;
  title.lines.forEach((line, index) => {
    ctx.fillText(line, PAD + 230, 310 + index * (title.size * 0.9));
  });

  ctx.fillStyle = red;
  ctx.font = '700 250px "Archivo", sans-serif';
  ctx.fillText(short(ctx, card.stat, W - PAD * 2), PAD, 850);

  ctx.fillStyle = ink;
  ctx.font = '700 24px "IBM Plex Mono", monospace';
  ctx.fillText(card.statLabel.toUpperCase(), PAD, 910);

  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PAD, 960);
  ctx.lineTo(W - PAD, 960);
  ctx.stroke();

  if (card.from) {
    ctx.font = '700 46px "Archivo", sans-serif';
    ctx.fillText(short(ctx, card.from, W - PAD * 2), PAD, 1060);
    ctx.fillStyle = red;
    ctx.font = '700 46px "Archivo", sans-serif';
    ctx.fillText('↓', PAD, 1125);
    ctx.fillStyle = ink;
    ctx.fillText(short(ctx, card.to ?? '', W - PAD * 2), PAD, 1200);
  } else {
    const line = wrapText(ctx, card.line, W - PAD * 2);
    ctx.font = '500 38px "Archivo", sans-serif';
    line.slice(0, 3).forEach((part, index) => {
      ctx.fillText(part, PAD, 1060 + index * 48);
    });
  }

  let rowY = 1390;
  card.rows.slice(0, 3).forEach((row) => {
    ctx.strokeStyle = 'rgba(247, 243, 234, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD, rowY - 34);
    ctx.lineTo(W - PAD, rowY - 34);
    ctx.stroke();
    ctx.fillStyle = 'rgba(247, 243, 234, 0.62)';
    ctx.font = '600 20px "IBM Plex Mono", monospace';
    ctx.fillText(row.label.toUpperCase(), PAD, rowY);
    ctx.fillStyle = ink;
    ctx.font = '700 28px "Archivo", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(short(ctx, row.value, W * 0.5), W - PAD, rowY);
    ctx.textAlign = 'left';
    rowY += 72;
  });

  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PAD, 1780);
  ctx.lineTo(W - PAD, 1780);
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.font = '600 22px "IBM Plex Mono", monospace';
  ctx.fillText('PLAN THE NETHERLANDS', PAD, 1840);
  ctx.textAlign = 'right';
  ctx.fillText('OVVO', W - PAD, 1840);
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png');
}

function drawCard(card: ShareCard, _palette: Palette, year: number, demo: boolean): string {
  return drawIssueCard(card, year, demo);
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
  soundOn = true,
  story,
  tally,
}: {
  open: boolean;
  onClose: () => void;
  /** The award that opened the sheet, if it was a share button on the yearbook page. */
  initialCardId?: string;
  year: number;
  demo: boolean;
  /** Follows the story's own sound switch; muting the score mutes these confirmations too. */
  soundOn?: boolean;
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
        if (soundOn) playYearbookEffect('share-confirmation');
        setStatus(t('Shared'));
        return;
      }
      saveBlob(file);
      if (soundOn) playYearbookEffect('share-confirmation');
      setStatus(t('Downloaded'));
    } catch (error) {
      /* A dismissed share sheet is not a failed share. */
      if ((error as Error)?.name !== 'AbortError') {
        saveBlob(file);
        if (soundOn) playYearbookEffect('share-confirmation');
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
    if (soundOn) playYearbookEffect('share-confirmation');
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
