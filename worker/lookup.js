/**
 * **Three lookups the page asks for, answered at the edge instead of from every phone.**
 *
 * The address search, the name of a position and a stop's Wikipedia paragraph used to leave the
 * browser and go straight to the open service that answers them. Those services ask callers to be
 * gentle, and a hundred travellers asking for the same street on the same morning is not gentle.
 *
 * So the page asks this Worker instead, the Worker asks upstream once, and the answer is kept at
 * the edge (`cache` in `wrangler.jsonc`): the next person asking the same question is answered
 * without the Worker running at all. Nominatim then sees one request rather than one per traveller.
 *
 * **Only these three addresses are reachable.** A proxy that forwards any URL it is given is an
 * open door somebody else can use to send traffic in our name, so each upstream is written out
 * below and nothing else is forwarded.
 *
 * Every failure is a plain answer rather than an exception: the page treats a failed lookup the way
 * it always has, as "nothing found", and keeps drawing the stops it already had.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org';

/** Nominatim asks for an identifiable caller; this is the address it can complain to. */
const AGENT = 'OVVO/1.0 (+https://ovvo.vibecreations.workers.dev)';

/** A street or a place name does not change during the day; a summary changes over months. */
const DAY = 24 * 60 * 60;
const MONTH = 30 * DAY;

/** Six seconds, the same patience the browser used to give these services. */
const TIMEOUT_MS = 6000;

/** Five, because a picker is a shortlist and the stop list under it is already one. */
const ADDRESS_LIMIT = 5;

/**
 * The one shape every answer takes.
 *
 * `seconds` of 0 means "do not keep this": a failure is not worth remembering, and a refused
 * request that stayed in a cache for a day would look like a site that stopped working.
 */
function answer(body, status, seconds) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control':
        seconds > 0 ? `public, max-age=${seconds}, s-maxage=${seconds}` : 'no-store',
    },
  });
}

/** Ask upstream once, with a deadline, and hand the text back untouched. */
async function upstream(url, seconds) {
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  /*
   * A 404 from Wikipedia is a real answer: the article does not exist, and the page draws no card
   * for it. It is passed on as it came, because the caller already knows what to do with it.
   */
  if (response.status === 404) return answer({ error: 'not-found' }, 404, 0);
  if (!response.ok) return answer({ error: 'upstream' }, 502, 0);
  return answer(await response.text(), 200, seconds);
}

/** Nominatim wants a query, in the Netherlands, as JSON, five answers at most. */
async function addressLookup(url) {
  const query = (url.searchParams.get('q') ?? '').trim();
  if (query.length < 2) return answer({ error: 'query' }, 400, 0);
  if (query.length > 120) return answer([], 200, DAY);

  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    /* This is a Dutch planner, and Nominatim is global: without the filter "Hoofddorp" also
       answers places in Belgium and Germany. */
    countrycodes: 'nl',
    limit: String(ADDRESS_LIMIT),
    q: query,
  });
  return upstream(`${NOMINATIM}/search?${params.toString()}`, DAY);
}

/** The address of one point, which is the same answer for every traveller standing there. */
async function placeLookup(url) {
  const lat = Number(url.searchParams.get('lat'));
  const lon = Number(url.searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return answer({ error: 'place' }, 400, 0);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return answer({ error: 'place' }, 400, 0);

  const params = new URLSearchParams({
    format: 'jsonv2',
    zoom: '18',
    addressdetails: '1',
    lat: String(lat),
    lon: String(lon),
  });
  return upstream(`${NOMINATIM}/reverse?${params.toString()}`, MONTH);
}

/**
 * A stop's opening paragraph, in the traveller's own language.
 *
 * The language is part of the address rather than a header, so a Dutch reader and an English
 * reader are two cache entries rather than one argument.
 */
async function summaryLookup(url) {
  const language = (url.searchParams.get('lang') ?? '').trim().toLowerCase();
  if (!/^[a-z]{2,3}$/.test(language)) return answer({ error: 'language' }, 400, 0);
  const article = (url.searchParams.get('article') ?? '').trim().replace(/ /g, '_');
  if (article.length === 0 || article.length > 200) return answer({ error: 'article' }, 400, 0);
  if (article.includes('/')) return answer({ error: 'article' }, 400, 0);

  return upstream(
    `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article)}?redirect=true`,
    DAY,
  );
}

/** The three, and nothing else. */
export async function lookupRoute(request, env, url) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return answer({ error: 'method' }, 405, 0);
  }
  try {
    if (url.pathname === '/api/lookup/address') return await addressLookup(url);
    if (url.pathname === '/api/lookup/place') return await placeLookup(url);
    if (url.pathname === '/api/lookup/summary') return await summaryLookup(url);
  } catch (error) {
    console.error('[lookup]', error);
    return answer({ error: 'upstream' }, 502, 0);
  }
  return answer({ error: 'not-found' }, 404, 0);
}
