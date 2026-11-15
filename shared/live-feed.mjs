/**
 * **Reading the live feed.**
 *
 * The national realtime feed `tripUpdates.pb` is a protobuf that a browser cannot read: the file is
 * binary and the feed sends no CORS headers, so the page is not allowed to ask for it at all. This
 * module is the one place that fetches and reads it. The worker serves it in production and the dev
 * server serves it through the same code, so what I test locally is what runs live.
 *
 * Only the fields needed are decoded — the trip's identifier and its delay — and only the trips that
 * were asked about are kept, because the whole feed is far larger than any one page needs.
 *
 * Format reference: GTFS Realtime `FeedMessage`, `FeedEntity`, `TripUpdate`, `TripDescriptor`,
 * `StopTimeUpdate`, `StopTimeEvent`.
 */

export const LIVE_URL = 'https://gtfs.ovapi.nl/nl/tripUpdates.pb';

/** The feed itself is refreshed about every half minute; no point asking more often than that. */
const CACHE_MS = 25_000;
const MAX_IDS = 250;

function readVarint(bytes, at) {
  let result = 0;
  let shift = 0;
  let index = at;
  while (index < bytes.length) {
    const byte = bytes[index];
    index += 1;
    result += (byte & 0x7f) * 2 ** shift;
    if ((byte & 0x80) === 0) break;
    shift += 7;
    if (shift > 63) break;
  }
  return { value: result, next: index };
}

/**
 * A `delay` is a signed 32-bit integer, and a negative one is sent as ten varint bytes holding its
 * two's-complement 64-bit form. Reading that as an ordinary number gave values around 1.8 × 10¹⁹ —
 * a delay of eighteen quintillion seconds — so the low 32 bits are accumulated exactly and only
 * then read as signed. Only the low half is kept, which is all an int32 can hold.
 */
function readVarint32(bytes, at) {
  let result = 0;
  let shift = 0;
  let index = at;
  while (index < bytes.length) {
    const byte = bytes[index];
    index += 1;
    if (shift < 32) {
      result += (byte & 0x7f) * 2 ** shift;
      shift += 7;
    }
    if ((byte & 0x80) === 0) break;
  }
  return { value: result % 2 ** 32, next: index };
}

function readSigned(value) {
  return value >= 2 ** 31 ? value - 2 ** 32 : value;
}

function skipField(bytes, at, wire) {
  if (wire === 0) return readVarint(bytes, at).next;
  if (wire === 1) return at + 8;
  if (wire === 5) return at + 4;
  if (wire === 2) {
    const { value, next } = readVarint(bytes, at);
    return next + value;
  }
  return bytes.length;
}

function readTag(bytes, at) {
  const { value, next } = readVarint(bytes, at);
  return { field: Math.floor(value / 8), wire: value % 8, next };
}

const decodeText = (bytes) => new TextDecoder().decode(bytes);

/** `StopTimeEvent`: the delay in field 1, in seconds, positive or negative. */
function readEventDelay(bytes, at, end) {
  let delay = null;
  while (at < end) {
    const tag = readTag(bytes, at);
    at = tag.next;
    if (tag.field === 1 && tag.wire === 0) {
      const read = readVarint32(bytes, at);
      delay = readSigned(read.value);
      at = read.next;
      continue;
    }
    at = skipField(bytes, at, tag.wire);
  }
  return delay;
}

/** `TripUpdate`: which trip, and how late it is running. */
function readTripUpdate(bytes, at, end) {
  let tripId = '';
  let startDate = '';
  let routeId = '';
  let delay = null;

  while (at < end) {
    const tag = readTag(bytes, at);
    at = tag.next;

    if (tag.field === 1 && tag.wire === 2) {
      const size = readVarint(bytes, at);
      const stop = size.next + size.value;
      let inner = size.next;
      while (inner < stop) {
        const field = readTag(bytes, inner);
        inner = field.next;
        if (field.wire === 2) {
          const value = readVarint(bytes, inner);
          const textEnd = value.next + value.value;
          if (field.field === 1) tripId = decodeText(bytes.subarray(value.next, textEnd));
          if (field.field === 2) startDate = decodeText(bytes.subarray(value.next, textEnd));
          if (field.field === 5) routeId = decodeText(bytes.subarray(value.next, textEnd));
          inner = textEnd;
          continue;
        }
        inner = skipField(bytes, inner, field.wire);
      }
      at = stop;
      continue;
    }

    if (tag.field === 5 && tag.wire === 0) {
      const read = readVarint32(bytes, at);
      delay = readSigned(read.value);
      at = read.next;
      continue;
    }

    if (tag.field === 2 && tag.wire === 2) {
      const size = readVarint(bytes, at);
      const stop = size.next + size.value;
      let inner = size.next;
      /* The last stop's delay is the best summary when the trip carries none of its own. */
      while (inner < stop) {
        const field = readTag(bytes, inner);
        inner = field.next;
        if (field.wire === 2 && (field.field === 2 || field.field === 3)) {
          const eventSize = readVarint(bytes, inner);
          const eventEnd = eventSize.next + eventSize.value;
          const eventDelay = readEventDelay(bytes, eventSize.next, eventEnd);
          if (eventDelay !== null) delay = eventDelay;
          inner = eventEnd;
          continue;
        }
        inner = skipField(bytes, inner, field.wire);
      }
      at = stop;
      continue;
    }

    at = skipField(bytes, at, tag.wire);
  }

  return { tripId, startDate, routeId, delay };
}

/**
 * The whole feed, decoded into `tripId → delay in seconds`.
 * `generatedAt` is the feed's own timestamp, which is what the page shows as "as of".
 */
export function decodeTripUpdates(bytes) {
  let at = 0;
  let generatedAt = 0;
  const delays = new Map();

  while (at < bytes.length) {
    const tag = readTag(bytes, at);
    at = tag.next;

    /* Field 1: the header, whose timestamp says when this snapshot was made. */
    if (tag.field === 1 && tag.wire === 2) {
      const size = readVarint(bytes, at);
      const end = size.next + size.value;
      let inner = size.next;
      while (inner < end) {
        const field = readTag(bytes, inner);
        inner = field.next;
        if (field.field === 3 && field.wire === 0) {
          generatedAt = readVarint(bytes, inner).value;
          inner = readVarint(bytes, inner).next;
          continue;
        }
        inner = skipField(bytes, inner, field.wire);
      }
      at = end;
      continue;
    }

    /* Field 2: one entity per vehicle. */
    if (tag.field === 2 && tag.wire === 2) {
      const size = readVarint(bytes, at);
      const end = size.next + size.value;
      let inner = size.next;
      while (inner < end) {
        const field = readTag(bytes, inner);
        inner = field.next;
        if (field.field === 3 && field.wire === 2) {
          const updateSize = readVarint(bytes, inner);
          const update = readTripUpdate(bytes, updateSize.next, updateSize.next + updateSize.value);
          if (update.tripId && update.delay !== null) delays.set(update.tripId, update.delay);
          inner = updateSize.next + updateSize.value;
          continue;
        }
        inner = skipField(bytes, inner, field.wire);
      }
      at = end;
      continue;
    }

    at = skipField(bytes, at, tag.wire);
  }

  return { generatedAt, delays };
}

let cached = { at: 0, value: null };

/** Fetch the feed at most once every 25 seconds, then answer from the copy. */
async function loadFeed() {
  const now = Date.now();
  if (cached.value && now - cached.at < CACHE_MS) return cached.value;

  const response = await fetch(LIVE_URL, {
    headers: { accept: 'application/x-protobuf', 'user-agent': 'OVVO (+https://ovvo.onrender.com)' },
  });
  if (!response.ok) throw new Error(`the live feed answered ${response.status}`);

  const decoded = decodeTripUpdates(new Uint8Array(await response.arrayBuffer()));
  cached = { at: now, value: decoded };
  return decoded;
}

/**
 * Delays for the trips a page actually asked about, in seconds.
 * An empty request means "anything you have that is late", which the page uses for its status line.
 */
export async function liveDelays(requested = []) {
  const wanted = requested.map((id) => String(id).trim()).filter(Boolean).slice(0, MAX_IDS);
  const feed = await loadFeed();
  const delays = {};
  let matched = 0;

  if (wanted.length > 0) {
    for (const id of wanted) {
      const delay = feed.delays.get(id);
      if (delay === undefined) continue;
      delays[id] = delay;
      matched += 1;
    }
  } else {
    for (const [id, delay] of feed.delays) {
      if (Math.abs(delay) < 60) continue;
      delays[id] = delay;
      matched += 1;
    }
  }

  let lateNationally = 0;
  for (const delay of feed.delays.values()) if (delay >= 60) lateNationally += 1;

  return {
    source: 'gtfs.ovapi.nl tripUpdates',
    late: lateNationally,
    generatedAt: feed.generatedAt ? new Date(feed.generatedAt * 1000).toISOString() : null,
    fetchedAt: new Date().toISOString(),
    known: feed.delays.size,
    matched,
    delays,
  };
}
