/**
 * **The street beside every stop, from the map itself.**
 *
 * Item 11 asks the rail to name the stop you stand at *with its street or building*, as 9292 does.
 * The app holds no street, so this asks OpenStreetMap once per stop and writes the answer into
 * `src/data/stop-streets.json`, which the app reads at build time. Nothing is typed in by hand: every
 * line is what the map says is at that stop's own position.
 *
 * Nominatim's terms ask for one request a second and a name that says who is asking, so this waits
 * between calls and sends one. Re-running it is safe: a stop already answered is skipped unless
 * `--all` is passed.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SOURCE = 'src/data/stops.ts';
const TARGET = 'src/data/stop-streets.json';
const AGENT = 'OVVO/1.0 (stop streets for a public transport planner; dev@vibecreations.nl)';

const text = readFileSync(SOURCE, 'utf8');
/*
 * Read the whole file rather than slicing the table out of it: the first `};` after `const GEO`
 * closed the slice early and left twenty stops unasked, which looked exactly like a map with no
 * street at Haarlem. Only the geo table uses this shape, so the pattern is the table.
 */
const stops = [
  ...text.matchAll(/(?:'([a-z0-9-]+)'|([a-z0-9-]+)):\s*\{\s*lat:\s*(-?[\d.]+),\s*lon:\s*(-?[\d.]+)\s*\}/g),
].map(([, quoted, bare, lat, lon]) => ({ id: quoted ?? bare, lat: Number(lat), lon: Number(lon) }));
if (!stops.length) {
  console.error('no stops found in the GEO table');
  process.exit(1);
}

const existing = existsSync(TARGET) ? JSON.parse(readFileSync(TARGET, 'utf8')) : {};
const all = process.argv.includes('--all');
const out = { ...existing };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let asked = 0;
for (const stop of stops) {
  if (!all && out[stop.id]?.street) continue;
  const ask = async (zoom) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${stop.lat}&lon=${stop.lon}&format=jsonv2&zoom=${zoom}&addressdetails=1`;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(url, { headers: { 'User-Agent': AGENT, Accept: 'application/json' } });
      if (response.ok) return response.json();
      await sleep(1500);
    }
    return null;
  };
  let answer = await ask(18);
  /*
   * A station's own position lands *inside* the station, where the map's nearest name is a tunnel,
   * a passage or a platform. That is a true answer and a useless one beside a station's name, so a
   * point that names one is asked again one step out, which gives the street the entrance is on.
   */
  const inside = /tunnel|passage|perron|platform|^[A-Z]$|^\d+$|hal$/i;
  if (inside.test((answer?.address?.road ?? answer?.name ?? '').trim())) {
    await sleep(1100);
    const wider = await ask(16);
    if (wider) answer = wider;
  }
  asked += 1;
  const address = answer?.address ?? {};
  /* The street and number when the map has them; otherwise the nearest named thing, which for a
     station forecourt is usually the square it stands on. */
  const road = address.road ?? address.pedestrian ?? address.square ?? address.footway ?? '';
  const number = address.house_number ?? '';
  const street = road ? `${road}${number ? ` ${number}` : ''}` : (answer?.name ?? '');
  out[stop.id] = {
    street: street.trim(),
    place: address.city ?? address.town ?? address.village ?? address.suburb ?? '',
    source: 'OpenStreetMap',
  };
  console.log(`${stop.id.padEnd(26)} ${out[stop.id].street || '(nothing named here)'}${out[stop.id].place ? `, ${out[stop.id].place}` : ''}`);
  await sleep(1100);
}

writeFileSync(TARGET, `${JSON.stringify(out, null, 2)}\n`);
console.log(`\n${asked} stop(s) asked, ${Object.keys(out).length} in ${TARGET}`);
