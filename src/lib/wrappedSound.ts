/**
 * **The score: one track per chapter, played plainly, and never a track before a tap.**
 *
 * Ten short pieces live in `public/music`, one for each chapter of the story. They are the steerer's
 * own licensed music, so the deck carries a real score.
 *
 * **These are plain `<audio>` elements, and nothing else.** The score used to be routed through a Web
 * Audio graph — two players, a gain node each, a master under them — so chapters could cross-fade and
 * the level could be set below the phone's own volume. On a desktop browser it worked. On the steerer's
 * phone it reported every sign of health — a context running, a player moving at eleven seconds, no
 * refusal — and made no sound at all, which is the known way a media element routed through that graph
 * goes quiet. The graph is gone. Each element carries its own `volume`, faded in small steps, which is a
 * plainer thing that no layer between the file and the speaker can silently drop.
 *
 * Two players, not ten, so a chapter change bends from one track into the next; the middle of the story
 * is one song fading under another rather than a stop and a start.
 *
 * **The track is the clock.** Each chapter is scored, so its song ending is the signal that the chapter
 * is over, and the deck turns the page a little before the last bar. A muted story has its own clock in
 * the deck, so silence never looks like a missing auto-advance.
 */

/** The chapters' tracks, named after the music rather than after the chapter, so they can be swapped. */
export type Track =
  | 'luxury-anthem'
  | 'electro-dance'
  | 'afrobeat'
  | 'indie-pop'
  | 'electropop'
  | 'melodic-trap'
  | 'hip-hop-anthem'
  | 'dark-trap'
  | 'rap-anthem'
  | 'acoustic';

/** Where a track is fetched from. Files sit in `public/music`, so the base is the app's own. */
function urlOf(track: Track): string {
  return `${import.meta.env.BASE_URL}music/${track}.mp3`;
}

/**
 * **Every track, brought to the same average decibel.**
 *
 * The ten pieces were not mastered together: measured as an average level over each whole file, the
 * quietest sat at -28 dB and the loudest at -9 dB. These trims bring them all to about -22 dB, low
 * enough that the score sits under the words on a phone speaker rather than beside them.
 */
const TRIM: Record<Track, number> = {
  'luxury-anthem': 0.432,
  'electro-dance': 0.422,
  'afrobeat': 0.224,
  'indie-pop': 2.065,
  'electropop': 0.676,
  'melodic-trap': 0.237,
  'hip-hop-anthem': 0.376,
  'dark-trap': 0.716,
  'rap-anthem': 0.257,
  'acoustic': 0.484,
};

/** How far under the phone's own volume the whole score sits. */
const LEVEL = 0.55;
const FADE_IN = 0.9;
const FADE_OUT = 0.7;

/** How long before a song ends the deck turns the page. */
const TURN_EARLY = 0.5;

/** The volume a chapter's track is faded to: its trim, scaled under the phone's own volume. */
function targetVolume(track: Track): number {
  return Math.max(0, Math.min(1, TRIM[track] * LEVEL));
}

interface Slot {
  el: HTMLAudioElement;
  /** What is loaded in this element, so a prefetched track is not fetched twice. */
  track: Track | null;
}

let slots: Slot[] = [];
let active: Slot | null = null;
let current: Track | null = null;
let playing = false;
let onEnd: (() => void) | null = null;
let turned = false;
/** The last thing a play() said when it would not start, for the report. */
let refusal: string | null = null;

/** Volume fades in flight, so a new fade cancels the last one on the same element. */
const fades = new Map<HTMLAudioElement, number>();

/**
 * Fade an element to a volume, in small steps.
 *
 * A media element's `volume` has no ramp of its own, and setting it once at the end would click. Twenty
 * five steps a second is under the ear's notice and cheap enough to run on a phone.
 */
function fade(el: HTMLAudioElement, to: number, seconds: number): void {
  const running = fades.get(el);
  if (running) window.clearInterval(running);
  const from = el.volume;
  const target = Math.max(0, Math.min(1, to));
  const steps = Math.max(1, Math.round(seconds * 25));
  let step = 0;
  const id = window.setInterval(() => {
    step += 1;
    el.volume = Math.max(0, Math.min(1, from + (target - from) * (step / steps)));
    if (step >= steps) {
      window.clearInterval(id);
      fades.delete(el);
    }
  }, (seconds * 1000) / steps);
  fades.set(el, id);
}

/** One player: an audio element, its own volume, and the two events the score turns on. */
function makeSlot(): Slot {
  const el = new Audio();
  /* A chapter's song plays once: its end is what tells the deck to turn the page. */
  el.loop = false;
  el.preload = 'auto';
  el.setAttribute('playsinline', '');
  el.volume = 0;
  const slot: Slot = { el, track: null };
  /*
   * The page turns just before the song does.
   *
   * `timeupdate` fires several times a second, which is fine-grained enough to catch the last half
   * second, and it works while the tab is in front. `ended` stays as the fallback for a browser that
   * skips the last update, and the `turned` flag makes sure one song never asks twice.
   */
  el.addEventListener('timeupdate', () => {
    if (slot !== active || !playing || turned) return;
    const { duration, currentTime } = el;
    if (!Number.isFinite(duration) || duration <= TURN_EARLY) return;
    if (currentTime >= duration - TURN_EARLY) {
      turned = true;
      onEnd?.();
    }
  });
  el.addEventListener('ended', () => {
    if (slot !== active || !playing || turned) return;
    turned = true;
    onEnd?.();
  });
  slots = [...slots, slot];
  return slot;
}

function ensureSlots(): Slot[] {
  if (slots.length === 0) makeSlot();
  if (slots.length === 1) makeSlot();
  return slots;
}

/** Load a track into a player, unless it is already there. */
function load(slot: Slot, track: Track): void {
  if (slot.track === track) return;
  slot.track = track;
  slot.el.src = urlOf(track);
  turned = false;
}

/** The player a new track should use: one that already holds it, or the one that is not playing. */
function pick(track: Track): Slot | null {
  const ready = ensureSlots();
  if (ready.length === 0) return null;
  const holds = ready.find((slot) => slot !== active && slot.track === track);
  if (holds) return holds;
  const idle = ready.find((slot) => slot !== active);
  return idle ?? makeSlot();
}

/** Quietly fetch the chapter after this one, so the next swipe has nothing to wait for. */
function prefetch(next: Track | undefined): void {
  if (!next) return;
  const idle = ensureSlots().find((slot) => slot !== active);
  if (idle) load(idle, next);
}

/** Start a player, and remember what it said if it would not. */
function begin(slot: Slot): void {
  slot.el.volume = 0;
  const started = slot.el.play();
  if (started) {
    void started.catch((error: unknown) => {
      refusal = String((error as Error)?.name || error);
    });
  }
}

/**
 * Play a chapter's track, fading the one before it out underneath.
 *
 * `next` is only a hint: the chapter that follows, handed over so it can be warmed while this one
 * plays. Missing it costs a little waiting, never a wrong song.
 */
function spin(track: Track, next?: Track): void {
  /* A track already in the live player (rounding a chapter twice, or coming back from silence). */
  const live = active && active.track === track ? active : null;
  if (live) {
    turned = false;
    begin(live);
    fade(live.el, targetVolume(track), 0.35);
    current = track;
    prefetch(next);
    return;
  }

  const incoming = pick(track);
  if (!incoming) return;
  load(incoming, track);
  begin(incoming);
  fade(incoming.el, targetVolume(track), FADE_IN);

  const leaving = active;
  active = incoming;
  current = track;
  playing = true;

  if (leaving && leaving !== incoming) {
    fade(leaving.el, 0, FADE_OUT);
    /* Fade first, stop after: stopping on the same beat as the fade leaves a hole in the middle. */
    window.setTimeout(() => {
      if (active !== leaving) {
        leaving.el.pause();
        leaving.track = null;
      }
    }, 1200);
  }

  window.setTimeout(() => prefetch(next), 1000);
}

/** Ask for the score. Must be called from a gesture: a browser will not start audio without one. */
export function startSound(track: Track, next?: Track): void {
  playing = true;
  spin(track, next);
}

/** Silence it for the session, and leave nothing playing behind another screen. */
export function stopSound(): void {
  playing = false;
  slots.forEach((slot) => fade(slot.el, 0, 0.15));
  window.setTimeout(() => {
    if (playing) return;
    slots.forEach((slot) => slot.el.pause());
  }, 260);
}

/**
 * Called when the chapter's song reaches its end.
 *
 * One handler at a time, set by the deck while it is on screen and cleared when it leaves, so a
 * finished track can never turn a page behind a closed story.
 */
export function whenTrackEnds(handler: (() => void) | null): void {
  onEnd = handler;
}

/**
 * Where the playing track is, in seconds, and which track it is.
 *
 * The deck puts its movement on this clock rather than on a timer of its own: a beat is only a beat if
 * it comes from the song that is actually playing. Silence returns nothing.
 */
export function scoreTime(): { track: Track; seconds: number } | null {
  if (!playing || !active || !active.track) return null;
  return { track: active.track, seconds: active.el.currentTime };
}

/** Whether the score is currently allowed to make a sound. */
export function soundIsOn(): boolean {
  return playing;
}

/**
 * A chapter arrived: move the score to its track.
 *
 * Silent unless the traveller has asked for sound, so the cover's Begin and the switch in the corner
 * are the only two ways music ever starts.
 */
export function playChapter(track: Track, next?: Track): void {
  if (!playing) return;
  spin(track, next);
}

/**
 * **Play it again, from the next touch.**
 *
 * A phone that refused a play leaves the story running in silence, and the only way back was to tap the
 * sound switch off and on. This is that repair without the dance: a touch while the score should be
 * sounding starts the chapter the traveller is on, in that touch, if it is not already playing.
 */
export function resumeSound(track: Track, next?: Track): void {
  if (!playing) return;
  const live = active;
  if (live && live.track === track && !live.el.paused && live.el.currentTime > 0.4) return;
  spin(track, next);
}

/**
 * **What the score is actually doing, in words, for a phone I cannot hear.**
 *
 * Shown behind `?sound=debug`. It names the file, whether the player is moving, what its volume is, and
 * what a refusal called itself — the four things that separate one cause from another.
 */
export function soundDiagnostics(): string[] {
  const lines: string[] = [];
  lines.push('audio: plain elements');
  lines.push(`score: ${playing ? 'on' : 'off'}`);
  lines.push(`track: ${active?.track ?? 'none'}`);
  if (active) {
    const el = active.el;
    lines.push(`player: ${el.paused ? 'paused' : 'playing'} at ${el.currentTime.toFixed(1)}s`);
    lines.push(`volume: ${el.volume.toFixed(2)}${el.muted ? ' muted' : ''}`);
    lines.push(`ready: ${el.readyState}${el.error ? ` error ${el.error.code}` : ''}`);
  } else {
    lines.push('player: none');
  }
  lines.push(`refused: ${refusal ?? 'no'}`);
  return lines;
}

/**
 * **How long each piece runs, measured from the files themselves.**
 *
 * A chapter is over when its song is over, and a silent story still has to know when that would have
 * been. Without it, a muted deck turned the story into a slideshow that had to be swiped.
 */
const TRACK_SECONDS: Record<Track, number> = {
  'acoustic': 14.32,
  'afrobeat': 14.42,
  'dark-trap': 20.74,
  'electro-dance': 20.3,
  'electropop': 14.81,
  'hip-hop-anthem': 16.4,
  'indie-pop': 14.92,
  'luxury-anthem': 15.61,
  'melodic-trap': 13.32,
  'rap-anthem': 13.7,
};

/** How long a chapter's song runs, in seconds. */
export function trackSeconds(track: Track): number {
  return TRACK_SECONDS[track];
}

/** The chapter that is playing, for the tests and for anyone reading the state. */
export function currentTrack(): Track | null {
  return current;
}
