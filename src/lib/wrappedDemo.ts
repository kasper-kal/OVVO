/**
 * **A year of pretend travelling, for the developer panel.**
 *
 * The deck is built to be read in December, which is the one month it is hardest to look at in
 * November. This is a year of plausible journeys made up once, in one place, so the panel can show
 * the whole thing without waiting two months or touching the traveller's real tally.
 *
 * It is **not** written to storage: `WrappedPage` builds it in memory when the address says
 * `?demo=1`, so nothing here can ever be mistaken later for something that really happened. Every
 * card it draws is drawn from this list and from nothing else, exactly as a real year is.
 */

import type { YearRun, YearTally } from './wrapped';

/** The stops a made-up year travels between. Real ids, so the labels are the app's own. */
const DEMO_PAIRS: Array<[string, string]> = [
  ['utrecht-centraal', 'amsterdam-centraal'],
  ['amsterdam-centraal', 'utrecht-centraal'],
  ['utrecht-centraal', 'rotterdam-centraal'],
  ['utrecht-centraal', 'amsterdam-zuid'],
  ['amsterdam-zuid', 'utrecht-centraal'],
  ['utrecht-centraal', 'den-haag-centraal'],
  ['utrecht-centraal', 'eindhoven-centraal'],
  ['amsterdam-centraal', 'haarlem'],
  ['utrecht-centraal', 'groningen'],
  ['amsterdam-centraal', 'schiphol-airport'],
];

const DEMO_LINES = ['700', '800', '3500', '12', '2', 'IC 3100', 'Sprinter 6000'];

/** A small deterministic shuffle, so the demo year is the same year every time it is opened. */
function seeded(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/**
 * A year of runs for the demo deck.
 *
 * The hours are not uniform on purpose: a real year is thick at eight in the morning and five in
 * the afternoon and thin at three, and a deck that says "you usually set off at eight" is only
 * worth reading if the year behind it looks like a person's week.
 */
export function demoYear(year: number): YearTally {
  const random = seeded(20261231);
  const runs: YearRun[] = [];
  const peaks = [7, 8, 8, 8, 9, 12, 17, 17, 18, 18, 19, 22];
  const total = 146;

  for (let index = 0; index < total; index += 1) {
    /* Spread across the year, weighted towards the months people actually travel. */
    const monthWeights = [2, 3, 4, 5, 5, 3, 2, 3, 6, 6, 6, 5];
    const monthPool: number[] = [];
    monthWeights.forEach((weight, month) => {
      for (let n = 0; n < weight; n += 1) monthPool.push(month);
    });
    const month = monthPool[Math.floor(random() * monthPool.length)];
    const day = 1 + Math.floor(random() * 28);
    const hour = peaks[Math.floor(random() * peaks.length)];
    const [from, to] = DEMO_PAIRS[Math.floor(random() * DEMO_PAIRS.length)];
    const changes = random() < 0.42 ? 0 : random() < 0.75 ? 1 : 2;
    const minutes = 18 + Math.floor(random() * 78) + changes * 9;
    runs.push({
      at: new Date(year, month, day, hour, Math.floor(random() * 60)).getTime(),
      from,
      to,
      hour,
      changes,
      minutes,
      lines: [DEMO_LINES[Math.floor(random() * DEMO_LINES.length)]],
    });
  }

  runs.sort((a, b) => a.at - b.at);

  /* A look worn most of the year, with two changes of heart in the spring. */
  const wears = [] as YearTally['wears'];
  const looks: Array<[string, number]> = [
    /* A look with a photograph, so the demo year shows the chapter taking the look's own picture. */
    ['nostalgia', 96],
    ['marble', 38],
    ['arches', 12],
  ];
  let day = 0;
  for (const [id, days] of looks) {
    for (let n = 0; n < days; n += 1) {
      day += 1;
      const at = new Date(year, 0, 1 + (day % 355), 9, 0).getTime();
      wears.push({ at, id });
    }
  }
  wears.sort((a, b) => a.at - b.at);

  return { version: 1, runs, wears, boards: [], hearts: 23 };
}
