/**
 * **The deck: eight cards, each answering from the tally and from nothing else.**
 *
 * Every card here is a number the year really holds and one sentence about it. Nothing is compared
 * with other travellers, because there is no data for that and a made-up average is the worst kind
 * of lie; nothing is extrapolated; and when the year holds almost nothing the deck says so in one
 * card instead of dressing three searches up as a story.
 *
 * The sentences are written here rather than scattered through the screen, so what a card claims
 * can be read in one place and checked against `lib/wrapped` — the module that wrote the year down.
 */

import { formatDuration } from './format';
import { styleById } from './styles';
import type { YearTally } from './wrapped';
import type { Language } from '../state/types';

export interface DeckCard {
  id: string;
  /** The small line above the number. */
  kicker: string;
  /** The one big thing the card says. */
  big: string;
  /** The sentence under it, in plain words. */
  line: string;
  /** An optional second line, for the closing card and its honesty. */
  note?: string;
  /** `ink` draws the card on the app's dark surface. Alternating is the whole of the deck's colour. */
  tone?: 'ink';
}

/** The busiest few of something, largest first. */
function top<T extends string | number>(counts: Map<T, number>): { value: T; count: number } | null {
  let best: { value: T; count: number } | null = null;
  for (const [value, count] of counts) {
    if (!best || count > best.count) best = { value, count };
  }
  return best;
}

function bump<T extends string | number>(counts: Map<T, number>, value: T): void {
  counts.set(value, (counts.get(value) ?? 0) + 1);
}

/** A stop id or a label, made readable without the app's stop table. */
function readable(end: string): string {
  const known = end
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return known.replace(/^Schiphol Airport$/, 'Schiphol Airport');
}

/** The look's own name, or nothing when the style is not one this build knows. */
function lookName(id: string): string | null {
  try {
    const style = styleById(id) as { name?: string } | null | undefined;
    return style?.name ?? null;
  } catch {
    return null;
  }
}

/** How many journeys are enough to make a story. Below this the deck says so plainly instead. */
export const DECK_MIN_RUNS = 5;

export function buildDeck({
  year,
  tally,
  language,
}: {
  year: number;
  tally: YearTally;
  language: Language;
}): DeckCard[] {
  const runs = [...tally.runs].sort((a, b) => a.at - b.at);

  if (runs.length < DECK_MIN_RUNS) {
    return [
      {
        id: 'thin',
        kicker: String(year),
        big: String(runs.length),
        line:
          runs.length === 1
            ? 'journey planned this year. That is not a year to make a story of yet.'
            : 'journeys planned this year. That is not a year to make a story of yet.',
        note: 'Nothing has been invented to fill the space.',
      },
    ];
  }

  const pairs = new Map<string, number>();
  const origins = new Map<string, number>();
  const hours = new Map<number, number>();
  const looks = new Map<string, number>();
  let direct = 0;
  let longest = runs[0];

  for (const run of runs) {
    bump(pairs, `${run.from}→${run.to}`);
    bump(origins, run.from);
    bump(hours, run.hour);
    if ((run.changes ?? 1) === 0) direct += 1;
    if ((run.minutes ?? 0) > (longest.minutes ?? 0)) longest = run;
  }
  for (const wear of tally.wears) bump(looks, wear.id);

  const pair = top(pairs);
  const origin = top(origins);
  const hour = top(hours);
  const look = top(looks);
  const [pairFrom, pairTo] = (pair?.value ?? '').split('→');
  const lookNamed = look ? lookName(look.value) : null;

  const cards: Array<DeckCard | null> = [
    {
      id: 'count',
      tone: 'ink',
      kicker: 'The year in one number',
      big: String(runs.length),
      line: runs.length === 1 ? 'journey planned in OVVO.' : 'journeys planned in OVVO.',
    },
    pair
      ? {
          id: 'pair',
          kicker: 'Your own line',
          big: String(pair.count),
          line: `${pair.count === 1 ? 'time' : 'times'} you planned ${readable(pairFrom ?? '')} → ${readable(pairTo ?? '')}.`,
        }
      : null,
    origin
      ? {
          id: 'origin',
          tone: 'ink',
          kicker: 'Where you set off',
          big: String(origin.count),
          line: `journeys began at ${readable(origin.value)}.`,
        }
      : null,
    hour
      ? {
          id: 'hour',
          kicker: 'Your hour',
          big: `${hour.value < 10 ? '0' : ''}${hour.value}:00`,
          line: `${hour.count === 1 ? 'journey' : 'journeys'} asked to leave in that hour, more than any other.`,
        }
      : null,
    {
      id: 'direct',
      tone: 'ink',
      kicker: 'Straight through',
      big: String(direct),
      line:
        direct === 1
          ? 'journey with no changes at all.'
          : `journeys with no changes at all, out of ${runs.length}.`,
    },
    longest.minutes
      ? {
          id: 'longest',
          kicker: 'The long haul',
          big: formatDuration(longest.minutes, language),
          line: `on the way to ${readable(longest.to)}, the longest trip you planned.`,
        }
      : null,
    lookNamed
      ? {
          id: 'look',
          tone: 'ink',
          kicker: 'The look you wore',
          big: String(look?.count ?? 0),
          line: `${(look?.count ?? 0) === 1 ? 'day' : 'days'} wearing ${lookNamed}.`,
        }
      : null,
    {
      id: 'close',
      kicker: String(year),
      big: 'That was the year.',
      line: 'Every number here comes from journeys you planned in this app, and nothing else.',
      note: 'OVVO counts what you planned, not what you caught. It never sees you get on.',
    },
  ];

  return cards.filter((card): card is DeckCard => Boolean(card));
}
