import type { Language } from '../state/types';
import { wikipediaArticle, wikipediaUrl } from '../data/wikipedia';

/**
 * A stop's summary, asked of Wikipedia when its page is opened.
 *
 * This is the app's one piece of *live* reading material, and it is treated the way
 * `lib/approximateLocation` treats its one live convenience: a request that may not answer, an
 * answer that is checked before it is used, and a failure that says nothing at all. The page
 * simply has no encyclopaedia card, which is also what it has for a stop with no article — the
 * rule the summary was asked for by is "if it doesn't exist, don't add an empty widget", and from
 * the page's side a 404, a dead connection and an article that was never written are the same
 * answer.
 *
 * The REST endpoint is used rather than the action API because it returns the article's opening
 * paragraph already as plain text: no wikitext, no HTML to sanitise, no infobox. It is CORS-open
 * and keyless, so a static frontend can read it directly (checked while building this: the
 * response carries `access-control-allow-origin: *`).
 *
 * The summary is cached for the session, per language, because it is the same paragraph every time
 * the traveller goes back to that station — and the promise is held while a request is in flight,
 * so React's development double-mount asks once rather than twice.
 */
export interface WikipediaSummary {
  /** The article's own title, in that language. */
  title: string;
  /** The article's opening paragraph, as plain text. */
  extract: string;
  /** Where to read the rest. */
  url: string;
}

const TIMEOUT_MS = 6000;
const answered = new Map<string, WikipediaSummary>();
const inFlight = new Map<string, Promise<WikipediaSummary | null>>();

/** The summary this session already has, so a revisit draws it without a wait. */
export function cachedWikipediaSummary(stopId: string, language: Language): WikipediaSummary | null {
  const article = wikipediaArticle(stopId, language);
  return article ? answered.get(keyFor(language, article)) ?? null : null;
}

export function fetchWikipediaSummary(
  stopId: string,
  language: Language,
): Promise<WikipediaSummary | null> {
  const article = wikipediaArticle(stopId, language);
  if (!article) return Promise.resolve(null);
  const cached = answered.get(keyFor(language, article));
  if (cached) return Promise.resolve(cached);
  if (typeof fetch !== 'function') return Promise.resolve(null);

  const key = keyFor(language, article);
  let pending = inFlight.get(key);
  if (!pending) {
    pending = requestSummary(language, article).then(
      (summary) => {
        inFlight.delete(key);
        if (summary) answered.set(key, summary);
        return summary;
      },
      () => {
        inFlight.delete(key);
        return null;
      },
    );
    inFlight.set(key, pending);
  }
  return pending;
}

function keyFor(language: Language, article: string): string {
  return `${language}:${article}`;
}

async function requestSummary(language: Language, article: string): Promise<WikipediaSummary | null> {
  const address = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    article.replace(/ /g, '_'),
  )}?redirect=true`;
  try {
    const response = await fetch(address, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object') return null;
    const record = body as Record<string, unknown>;
    /* A disambiguation page is a list of articles, not one of them: it has nothing to say about
       this stop and would read as a riddle in a card headed with the station's name. */
    if (record.type !== 'standard' && record.type !== '') return null;
    const extract = typeof record.extract === 'string' ? record.extract.trim() : '';
    if (!extract) return null;
    const title = typeof record.title === 'string' && record.title ? record.title : article;
    const content = record.content_urls as { desktop?: { page?: unknown } } | undefined;
    const page = content?.desktop?.page;
    return {
      title,
      extract,
      url: typeof page === 'string' && page ? page : wikipediaUrl(title, language),
    };
  } catch {
    return null;
  }
}
