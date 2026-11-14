#!/usr/bin/env node
/**
 * **What is actually inside the Dutch realtime feeds.**
 *
 *   node scripts/realtime/probe.mjs            # fetch all three, parse them, write the inventory
 *   node scripts/realtime/probe.mjs --report   # print the last inventory, fetch nothing
 *
 * A `200 OK` proves a URL exists, not that the feed says anything useful. This decodes the
 * protobuf by hand — no dependency, no schema tooling — and reports only what the bytes contain:
 * how many entities, of which kind, how old the newest and oldest message is, which trips and
 * routes are named, and whether the payload could be matched back to the timetable at all.
 *
 * It is intentionally read-only and complete: every number below is measured from the payload at
 * the moment of the run, and the inventory records that moment, because a realtime feed is only
 * true for a few minutes.
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'realtime/inventory.json';
const FEEDS = [
  ['vehiclePositions', 'https://gtfs.ovapi.nl/nl/vehiclePositions.pb', 'vehicles'],
  ['tripUpdates', 'https://gtfs.ovapi.nl/nl/tripUpdates.pb', 'trip updates'],
  ['alerts', 'https://gtfs.ovapi.nl/nl/alerts.pb', 'service alerts'],
];

/* ------------------------------------------------------------------ protobuf, by hand */

function varint(buffer, position) {
  let result = 0;
  let shift = 0;
  let cursor = position;
  while (cursor < buffer.length) {
    const byte = buffer[cursor++];
    result += (byte & 0x7f) * 2 ** shift;
    if ((byte & 0x80) === 0) break;
    shift += 7;
    if (shift > 63) break;
  }
  return [result, cursor];
}

function fields(buffer) {
  const out = [];
  let position = 0;
  while (position < buffer.length) {
    let key;
    [key, position] = varint(buffer, position);
    const field = Math.floor(key / 8);
    const wire = key & 7;
    if (wire === 0) {
      let value;
      [value, position] = varint(buffer, position);
      out.push({ field, wire, value });
    } else if (wire === 2) {
      let length;
      [length, position] = varint(buffer, position);
      out.push({ field, wire, buffer: buffer.subarray(position, position + length) });
      position += length;
    } else if (wire === 5) {
      out.push({ field, wire, buffer: buffer.subarray(position, position + 4) });
      position += 4;
    } else if (wire === 1) {
      out.push({ field, wire, buffer: buffer.subarray(position, position + 8) });
      position += 8;
    } else {
      break;
    }
  }
  return out;
}

const text = (buffer) => buffer.toString('utf8');
const first = (list, field) => list.find((entry) => entry.field === field);

/* FeedMessage: 1 header, 2 entity
 * FeedHeader:  1 version, 3 timestamp
 * FeedEntity:  1 id, 2 is_deleted, 3 trip_update, 4 vehicle, 5 alert
 * TripUpdate:  1 trip, 2 stop_time_update, 4 timestamp
 * TripDescriptor: 1 trip_id, 5 route_id
 * VehiclePosition: 1 trip, 7 timestamp
 * Alert:       1 active_period, 3 informed_entity, 7 cause, 8 effect
 */
function parseFeed(buffer) {
  const message = fields(buffer);
  const header = first(message, 1);
  const headerFields = header?.buffer ? fields(header.buffer) : [];
  const version = first(headerFields, 1);
  const headerTime = first(headerFields, 3);

  const summary = {
    version: version?.buffer ? text(version.buffer) : null,
    /* The header timestamp is the moment the producer built the message — the authoritative
     * answer to "how old is this", and the only one every GTFS-RT feed is required to carry. */
    headerTimestamp: headerTime?.value ? new Date(headerTime.value * 1000).toISOString() : null,
    headerEpoch: headerTime?.value ?? null,
    alertSelectors: { routes: new Set(), stops: new Set(), agencies: new Set(), withoutSelector: 0 },
    entities: 0,
    deleted: 0,
    tripUpdates: 0,
    vehicles: 0,
    alerts: 0,
    timestamps: [],
    tripIds: new Set(),
    routeIds: new Set(),
    withStopTimeUpdates: 0,
    causes: new Map(),
    effects: new Map(),
  };

  for (const entry of message.filter((item) => item.field === 2)) {
    summary.entities += 1;
    const entity = fields(entry.buffer);
    if (first(entity, 2)?.value === 1) summary.deleted += 1;

    const tripUpdate = first(entity, 3);
    if (tripUpdate) {
      summary.tripUpdates += 1;
      const inner = fields(tripUpdate.buffer);
      const trip = first(inner, 1);
      if (trip) {
        const descriptor = fields(trip.buffer);
        const tripId = first(descriptor, 1);
        const routeId = first(descriptor, 5);
        if (tripId?.buffer) summary.tripIds.add(text(tripId.buffer));
        if (routeId?.buffer) summary.routeIds.add(text(routeId.buffer));
      }
      if (first(inner, 2)) summary.withStopTimeUpdates += 1;
      const stamp = first(inner, 4);
      if (stamp?.value) summary.timestamps.push(stamp.value);
    }

    const vehicle = first(entity, 4);
    if (vehicle) {
      summary.vehicles += 1;
      const inner = fields(vehicle.buffer);
      const trip = first(inner, 1);
      if (trip) {
        const descriptor = fields(trip.buffer);
        const tripId = first(descriptor, 1);
        const routeId = first(descriptor, 5);
        if (tripId?.buffer) summary.tripIds.add(text(tripId.buffer));
        if (routeId?.buffer) summary.routeIds.add(text(routeId.buffer));
      }
      const stamp = first(inner, 5);
      if (stamp?.value) summary.timestamps.push(stamp.value);
    }

    const alert = first(entity, 5);
    if (alert) {
      summary.alerts += 1;
      const inner = fields(alert.buffer);
      const cause = first(inner, 7);
      const effect = first(inner, 8);
      if (cause?.value) summary.causes.set(cause.value, (summary.causes.get(cause.value) ?? 0) + 1);
      if (effect?.value) summary.effects.set(effect.value, (summary.effects.get(effect.value) ?? 0) + 1);
      /* An alert never names a trip directly at this level: it carries informed entities, each a
       * selector for a route, a stop or an agency. Reading those is what makes "does this alert
       * touch a stop we can show?" answerable. */
      const selectors = inner.filter((item) => item.field === 3 && item.buffer);
      if (selectors.length === 0) summary.alertSelectors.withoutSelector += 1;
      for (const selector of selectors) {
        const parts = fields(selector.buffer);
        const route = first(parts, 2);
        const stop = first(parts, 5);
        const agency = first(parts, 1);
        if (route?.buffer) summary.alertSelectors.routes.add(text(route.buffer));
        if (stop?.buffer) summary.alertSelectors.stops.add(text(stop.buffer));
        if (agency?.buffer) summary.alertSelectors.agencies.add(text(agency.buffer));
      }
    }
  }

  const min = summary.timestamps.length ? Math.min(...summary.timestamps) : null;
  const max = summary.timestamps.length ? Math.max(...summary.timestamps) : null;
  const stamp = summary.headerEpoch;
  return {
    version: summary.version,
    headerTimestamp: summary.headerTimestamp,
    headerEpoch: undefined,
    alertSelectors: {
      routes: summary.alertSelectors.routes.size,
      stops: summary.alertSelectors.stops.size,
      agencies: summary.alertSelectors.agencies.size,
      withoutSelector: summary.alertSelectors.withoutSelector,
    },
    entities: summary.entities,
    deleted: summary.deleted,
    counts: { tripUpdates: summary.tripUpdates, vehicles: summary.vehicles, alerts: summary.alerts },
    stopTimeUpdates: summary.withStopTimeUpdates,
    namedTrips: summary.tripIds.size,
    namedRoutes: summary.routeIds.size,
    sampleTrips: [...summary.tripIds].slice(0, 5),
    sampleRoutes: [...summary.routeIds].slice(0, 5),
    messageTime: {
      header: summary.headerTimestamp,
      oldestEntity: min ? new Date(min * 1000).toISOString() : null,
      newestEntity: max ? new Date(max * 1000).toISOString() : null,
    },
    causes: [...summary.causes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    effects: [...summary.effects.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
  };
}

/* ------------------------------------------------------------------ the run */

if (process.argv.includes('--report')) {
  if (!fs.existsSync(OUT)) {
    console.error(`no inventory yet at ${OUT} — run without --report`);
    process.exit(1);
  }
  console.log(fs.readFileSync(OUT, 'utf8'));
  process.exit(0);
}

const inventory = { measuredAt: new Date().toISOString(), feeds: [] };
let failures = 0;

for (const [name, url, label] of FEEDS) {
  const started = Date.now();
  try {
    const response = await fetch(url, { headers: { 'user-agent': 'OVVO realtime probe' } });
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (bytes.length < 100) throw new Error(`only ${bytes.length} bytes`);
    const parsed = parseFeed(bytes);
    /* Age is taken from the header timestamp when the feed carries one, and from the newest
     * entity when it does not. Either way it is measured, never assumed. */
    const reference = parsed.messageTime.header ?? parsed.messageTime.newestEntity;
    const ageSeconds = reference ? Math.round((Date.now() - Date.parse(reference)) / 1000) : null;
    inventory.feeds.push({
      name,
      label,
      url,
      status: 'ok',
      httpStatus: response.status,
      bytes: bytes.length,
      contentType: response.headers.get('content-type'),
      fetchedInMs: Date.now() - started,
      ageSeconds,
      ...parsed,
    });
    console.log(
      `${label.padEnd(14)} ${String(bytes.length).padStart(9)} bytes · ${parsed.entities.toLocaleString('en')} entities · ` +
        `trips ${parsed.namedTrips.toLocaleString('en')} · routes ${parsed.namedRoutes.toLocaleString('en')} · age ${ageSeconds}s`,
    );
  } catch (error) {
    failures += 1;
    inventory.feeds.push({ name, label, url, status: 'failed', error: String(error.message ?? error) });
    console.log(`${label.padEnd(14)} FAILED ${String(error.message ?? error)}`);
  }
}

const usable = inventory.feeds.filter((feed) => feed.status === 'ok');
inventory.summary = {
  feedsChecked: FEEDS.length,
  feedsOk: usable.length,
  feedsFailed: failures,
  newestMessageAgeSeconds: Math.min(...usable.map((feed) => feed.ageSeconds ?? Infinity)),
  oldestMessageAgeSeconds: Math.max(...usable.map((feed) => feed.ageSeconds ?? 0)),
  staleAfterSeconds: 300,
  matchesTimetable: usable.some((feed) => feed.namedTrips > 0),
  note: 'Counts and ages are from the payload bytes at measuredAt. Matching a feed trip to a scheduled trip needs the timetable index; a named trip id here does not prove the match.',
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(inventory, null, 2));
console.log(`\nwrote ${OUT} · ${usable.length}/${FEEDS.length} feeds usable · newest message ${inventory.summary.newestMessageAgeSeconds}s old`);
process.exit(failures === FEEDS.length ? 1 : 0);
