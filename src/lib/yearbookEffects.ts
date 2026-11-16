/**
 * **The Yearbook's small sounds.**
 *
 * These are short, dry effects that sit under the score: a page turn, a station bell, a stamp. They
 * are separate from `wrappedSound` because they are not music and must never become the chapter's
 * clock. Every one is optional: if a file is missing, the story still runs silently.
 *
 * The files live in `public/sfx`, named for the moment rather than for the chapter, so an AI-generated
 * replacement can be dropped over a stand-in without changing any component.
 */

export type YearbookEffect =
  | 'begin'
  | 'page-turn'
  | 'share-confirmation'
  | 'sound-toggle'
  | 'stat-tick'
  | 'name-reveal'
  | 'map-pin'
  | 'rail-chime'
  | 'distance-whoosh'
  | 'clock-chime'
  | 'camera-shutter'
  | 'era-advance'
  | 'board-stamp'
  | 'trophy-triumph'
  | 'comparison-two-tone'
  | 'crew-connect'
  | 'yearbook-close';

const FILES: Record<YearbookEffect, string> = {
  begin: 'begin.wav',
  'page-turn': 'page-turn.wav',
  'share-confirmation': 'share-confirmation.wav',
  'sound-toggle': 'sound-toggle.wav',
  'stat-tick': 'stat-tick.wav',
  'name-reveal': 'name-reveal.wav',
  'map-pin': 'map-pin.wav',
  'rail-chime': 'rail-chime.wav',
  'distance-whoosh': 'distance-whoosh.wav',
  'clock-chime': 'clock-chime.wav',
  'camera-shutter': 'camera-shutter.wav',
  'era-advance': 'era-advance.wav',
  'board-stamp': 'board-stamp.wav',
  'trophy-triumph': 'trophy-triumph.wav',
  'comparison-two-tone': 'comparison-two-tone.wav',
  'crew-connect': 'crew-connect.wav',
  'yearbook-close': 'yearbook-close.wav',
};

/** The generated/exported file can be WAV or MP3; the first extension that exists wins. */
function pathOf(effect: YearbookEffect, extension: 'wav' | 'mp3'): string {
  return `${import.meta.env.BASE_URL}sfx/${FILES[effect].replace(/\.wav$/, `.${extension}`)}`;
}

/** A comfortable level under the score. The generated files are normalized, so this stays constant. */
const VOLUME = 0.36;
/** Two players per effect, so a tick can repeat without cutting its own tail. */
const POOL_SIZE = 2;

const pools = new Map<YearbookEffect, HTMLAudioElement[]>();
let loaded = false;

function makePlayer(effect: YearbookEffect): HTMLAudioElement {
  const player = new Audio(pathOf(effect, 'wav'));
  player.preload = 'auto';
  player.setAttribute('playsinline', '');
  player.setAttribute('aria-hidden', 'true');
  player.style.position = 'fixed';
  player.style.left = '0';
  player.style.bottom = '0';
  player.style.width = '1px';
  player.style.height = '1px';
  player.style.opacity = '0';
  player.style.pointerEvents = 'none';
  player.addEventListener('error', () => {
    /* A dropped MP3 is the common export; try it before giving up on the cue. */
    if (player.dataset.fallback !== '1') {
      player.dataset.fallback = '1';
      player.src = pathOf(effect, 'mp3');
      player.load();
      return;
    }
    /* A missing sound effect is not a broken story; leave the rest of the deck alone. */
    player.dataset.missing = 'true';
  });
  if (typeof document !== 'undefined' && document.body) document.body.appendChild(player);
  return player;
}

/** Warm the small files once, after the first tap that starts the story. */
export function preloadYearbookEffects(): void {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  for (const effect of Object.keys(FILES) as YearbookEffect[]) {
    if (!pools.has(effect)) {
      pools.set(effect, Array.from({ length: POOL_SIZE }, () => makePlayer(effect)));
    }
  }
}

/**
 * Play one effect.
 *
 * This is deliberately fire-and-forget. A phone that refuses a sound is not allowed to stop a page
 * turn, and a missing file is not allowed to throw into the chapter effect.
 */
export function playYearbookEffect(effect: YearbookEffect): void {
  if (typeof window === 'undefined') return;
  preloadYearbookEffects();
  const pool = pools.get(effect);
  if (!pool?.length) return;
  const player = pool.find((item) => item.paused || item.ended) ?? pool[0];
  if (player.dataset.missing === 'true') return;
  try {
    player.pause();
    player.currentTime = 0;
    player.volume = VOLUME;
    const started = player.play();
    if (started) void started.catch(() => undefined);
  } catch {
    /* Silence is the fallback. */
  }
}
