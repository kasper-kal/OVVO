/**
 * Development smoke test for the simulated planner and departure boards.
 * Run with:  npx esbuild scripts/smoke-engine.ts --bundle --format=esm --platform=node --outfile=/tmp/smoke.mjs && node /tmp/smoke.mjs
 */
import { planJourneys, filterJourneys, DEFAULT_RESULTS_FILTER } from '../src/data/journeyEngine';
import { DEFAULT_PREFERENCES } from '../src/data/preferences';
import { formatMinutes, formatDuration } from '../src/lib/format';
import { boardForStop } from '../src/data/departures';

const CASES: [string, string, number][] = [
  ['amsterdam-centraal', 'utrecht-centraal', 540],
  ['groningen', 'maastricht', 480],
  ['amsterdam-leidseplein', 'amsterdam-museumplein', 600],
  ['rotterdam-erasmusbrug', 'dordrecht', 700],
  ['vlissingen', 'groningen', 500],
  ['zaanse-schans', 'volendam', 660],
  ['eindhoven-centraal', 'schiphol-airport', 400],
];

for (const [from, to, time] of CASES) {
  const journeys = planJourneys({
    fromStopId: from,
    toStopId: to,
    date: '2026-10-12',
    time,
    timeMode: 'depart',
    preferences: DEFAULT_PREFERENCES,
  });
  const filtered = filterJourneys(journeys, DEFAULT_RESULTS_FILTER, DEFAULT_PREFERENCES);
  console.log(`\n=== ${from} -> ${to} @ ${formatMinutes(time)} : ${journeys.length} raw / ${filtered.length} filtered`);
  for (const j of filtered.slice(0, 3)) {
    const chain = j.legs
      .map((l) => `${l.mode}${l.lineNumber ? ` ${l.lineNumber}` : ''} ${formatMinutes(l.departure)}->${formatMinutes(l.arrival)} ${l.fromStopId}->${l.toStopId}`)
      .join(' | ');
    console.log(
      `  ${j.label ?? '-'} dep ${formatMinutes(j.departure)} arr ${formatMinutes(j.arrival)} ${formatDuration(j.durationMinutes)} tr${j.transfers} walk${j.walkMinutes} eur${j.fare.eur} :: ${chain}`,
    );
  }
}

for (const stopId of ['utrecht-centraal', 'amsterdam-leidseplein', 'groningen']) {
  const board = boardForStop(stopId, { fromMinutes: 480, limit: 5 });
  console.log(`\n=== board ${stopId}`);
  for (const d of board) {
    console.log(
      `  ${formatMinutes(d.expected)} ${d.mode} ${d.lineNumber} -> ${d.destinationLabel} pl ${d.platform} delay ${d.delayMinutes}${d.cancelled ? ' CANCELLED' : ''}`,
    );
  }
}
