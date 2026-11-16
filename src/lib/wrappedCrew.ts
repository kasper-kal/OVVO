import type { CrewSummary } from './wrappedDeck';

/*
 * **A crew code is a postcard, not a profile.**
 *
 * The code carries only the five safe aggregates the comparison screen shows: journeys, top line,
 * traveller type, theme era and a short list of lines. There is no address, no station id, no
 * account id and no exact place in it. Decoding is local; nothing is sent to a server, so the
 * friend's code never leaves the browser either.
 */

const PREFIX = 'OVVO1.';

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(value: string): string {
  const normal = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normal + '='.repeat((4 - (normal.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function cleanText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 80) : null;
}

function cleanLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(cleanText).filter((line): line is string => Boolean(line)))].slice(0, 8);
}

export function encodeCrewCode(summary: CrewSummary): string {
  const payload = {
    v: 1,
    j: Math.max(0, Math.round(summary.journeys)),
    l: summary.topLine,
    t: summary.traveller,
    e: summary.era,
    ls: summary.lines.slice(0, 5),
  };
  return `${PREFIX}${encodeBase64Url(JSON.stringify(payload))}`;
}

/** Read a pasted code (or a full URL carrying one) without trusting any of its shape. */
export function decodeCrewCode(raw: string): CrewSummary | null {
  let text = raw.trim();
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) {
    try {
      text = new URL(text).searchParams.get('crew') ?? '';
    } catch {
      return null;
    }
  }
  if (text.includes('crew=')) text = text.split('crew=')[1]?.split('&')[0] ?? text;
  if (text.startsWith(PREFIX)) text = text.slice(PREFIX.length);
  try {
    const value = JSON.parse(decodeBase64Url(text)) as Record<string, unknown>;
    if (value.v !== 1 || typeof value.j !== 'number' || !Number.isFinite(value.j)) return null;
    return {
      journeys: Math.max(0, Math.min(100000, Math.round(value.j))),
      topLine: cleanText(value.l),
      traveller: cleanText(value.t),
      era: cleanText(value.e),
      lines: cleanLines(value.ls),
    };
  } catch {
    return null;
  }
}
