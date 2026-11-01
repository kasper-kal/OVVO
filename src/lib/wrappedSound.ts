/**
 * **The score: one track per chapter, and never a track before a tap.**
 *
 * Ten short pieces live in `public/music`, one for each chapter of the story. They are the steerer's
 * own licensed music, so the deck can carry a real score instead of the synthesised pad it opened
 * with, and the whole set is 3.2 MB, which is a fair trade for the one screen in OVVO that is meant
 * to feel like an event.
 *
 * Three things make it behave rather than play:
 *
 * - **Two players, not ten.** A chapter change starts the incoming track on the idle element and
 *   fades the playing one out under it, so the music bends into the next chapter instead of stopping
 *   and starting. The idle element is then loaded with the chapter after that, so by the time the
 *   traveller swipes, their next song is already on the phone.
 * - **Nothing plays before a tap.** Browsers refuse audio without a gesture, and the cover is the
 *   right place to ask: Begin starts the story and the score together, Skip the sound starts only
 *   the story.
 * - **A missing track is not a silent story.** If a file will not load or play, the deck falls back
 *   to the quiet synthesised pad it used before, so the room is never dead.
 * - **The track is the clock.** Each chapter is scored, so its song ending is the signal that the
 *   chapter is over: the deck listens for that and turns the page by itself. Muting stops the clock,
 *   because the song is what was doing the counting.
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

/** How loud the whole score sits under the words, and how long each change takes. */
const LEVEL = 0.55;

/**
 * **Every track, brought to the same average decibel.**
 *
 * The ten pieces were not mastered together. Measured as an average level over each whole file, the
 * quietest sat at -28 dB and the loudest at -9 dB: nineteen decibels apart, which is not a nuance,
 * it is one chapter shouting and the next whispering. These trims bring all of them to -22 dB, low
 * enough that the score sits under the words on a phone speaker rather than beside them.
 *
 * Measured by decoding each file and taking the average level of the whole thing, which is what
 * "average decibel" means and what the audit in `CREDITS.md` records. The biggest single correction
 * is the track under chapter four, which was quietly mastered; every peak still sits well under full
 * scale after the trim, so nothing clips.
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
const FADE_IN = 0.9;
const FADE_OUT = 0.7;

/**
 * How long before a song ends the deck turns the page.
 *
 * Half a second, so the next chapter is already arriving as the last bar of the song lands instead of
 * after a beat of silence. The old version waited for `ended`, which on a phone sounds like the music
 * stopped and then, a moment later, the screen caught up.
 */
const TURN_EARLY = 0.5;

interface Slot {
  el: HTMLAudioElement;
  gain: GainNode;
  /** What is loaded in this element, so a prefetched track is not fetched twice. */
  track: Track | null;
}

let context: AudioContext | null = null;
let master: GainNode | null = null;
let slots: Slot[] = [];
let active: Slot | null = null;
let current: Track | null = null;
let playing = false;
let pad: { stop: () => void } | null = null;
let onEnd: (() => void) | null = null;
/** Whether this track has already asked for the next chapter, so it only ever asks once. */
let turned = false;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (context) return context;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    /* A browser that refuses to make an audio context still gets the whole story, silently. */
    return null;
  }
  master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);
  return context;
}

/**
 * One player: an audio element with its own gain, wired into the shared master.
 *
 * The element is routed through the graph rather than turned down with `volume`, because a gain
 * ramp is smooth to the ear and `volume` is not: the two players have to cross without a click.
 */
function makeSlot(ctx: AudioContext, bus: GainNode): Slot {
  const el = new Audio();
  /* A chapter's song plays once: its end is what tells the deck to turn the page. */
  el.loop = false;
  el.preload = 'auto';
  const gain = ctx.createGain();
  gain.gain.value = 0;
  ctx.createMediaElementSource(el).connect(gain);
  gain.connect(bus);
  const slot: Slot = { el, gain, track: null };
  /* A file that will not load falls back to the quiet pad for this chapter only. */
  el.addEventListener('error', () => {
    if (playing) startPad();
  });
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
  const ctx = audio();
  if (!ctx || !master) return [];
  if (slots.length === 0) makeSlot(ctx, master);
  if (slots.length === 1) makeSlot(ctx, master);
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
  if (idle) return idle;
  const ctx = audio();
  return ctx && master ? makeSlot(ctx, master) : null;
}

/** Quietly fetch the chapter after this one, so the next swipe has nothing to wait for. */
function prefetch(next: Track | undefined): void {
  if (!next) return;
  const ready = ensureSlots();
  const idle = ready.find((slot) => slot !== active);
  if (idle) load(idle, next);
}

function ramp(gain: GainNode, to: number, seconds: number, ctx: AudioContext): void {
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, to), now + seconds);
}

/**
 * Play a chapter's track, fading the one before it out underneath.
 *
 * `next` is only a hint: the chapter that follows, handed over so it can be warmed while this one
 * plays. Missing it costs a little waiting, never a wrong song.
 */
function spin(track: Track, next?: Track): void {
  const ctx = audio();
  if (!ctx || !master) return;
  if (ctx.state === 'suspended') void ctx.resume();
  /*
   * **A chapter that cannot load does not end the score.**
   *
   * There used to be a `broken` flag here, set once and never cleared: the first failed fetch swapped
   * every later chapter for the quiet fallback pad, and a pad never ends, so the deck stopped turning
   * its own pages from that point to the last. A chapter now falls back for itself, and the next one
   * asks for its own file.
   */

  /* A track already in the live player (rounding a chapter twice, or coming back from silence). */
  const live = active && active.track === track ? active : null;
  if (live) {
    turned = false;
    const started = live.el.play();
    if (started) void started.catch(() => undefined);
    ramp(live.gain, TRIM[track], 0.35, ctx);
    current = track;
    prefetch(next);
    return;
  }

  const incoming = pick(track);
  if (!incoming) return;
  load(incoming, track);
  const started = incoming.el.play();
  if (started) {
    void started.catch(() => {
      if (playing) startPad();
    });
  }
  ramp(incoming.gain, TRIM[track], FADE_IN, ctx);

  const leaving = active;
  active = incoming;
  current = track;
  playing = true;

  if (leaving && leaving !== incoming) {
    ramp(leaving.gain, 0.0001, FADE_OUT, ctx);
    const leavingTrack = leaving.track;
    /* Fade first, stop after: stopping on the same beat as the fade leaves a hole in the middle. */
    window.setTimeout(() => {
      /* Only if this player still holds the song it was playing: the prefetch may have taken it. */
      if (active === leaving || leaving.track !== leavingTrack) return;
      leaving.el.pause();
      leaving.track = null;
    }, 1200);
  }

  window.setTimeout(() => prefetch(next), 1000);
}

/** Ask for the score. Must be called from a gesture: a browser will not start audio without one. */
export function startSound(track: Track, next?: Track): void {
  const ctx = audio();
  if (!ctx || !master) return;
  if (ctx.state === 'suspended') void ctx.resume();
  playing = true;
  stopPad();
  ramp(master, LEVEL, 0.6, ctx);
  spin(track, next);
}

/** Silence it for the session, and leave nothing playing behind another screen. */
export function stopSound(): void {
  playing = false;
  if (context && master) ramp(master, 0.0001, 0.15, context);
  window.setTimeout(() => {
    if (playing) return;
    slots.forEach((slot) => slot.el.pause());
    stopPad();
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
 * The deck puts its movement on this clock rather than on a timer of its own: a beat is only a beat
 * if it comes from the song that is actually playing. Silence returns nothing, which is how the deck
 * knows to keep still.
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
 * are the only two ways music ever starts, and swiping before choosing either stays quiet.
 */
export function playChapter(track: Track, next?: Track): void {
  if (!playing) return;
  spin(track, next);
}

/* ---------------------------------------------------------------------------------------------
 * The fallback: the quiet pad the deck used before it had music.
 * Two detuned sines under a half-closed filter, tuned so it never clashes with itself.
 * ------------------------------------------------------------------------------------------- */

/** The pentatonic scale the pad is drawn from: no note in it can sound wrong with another. */
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

function note(index: number, root = 220): number {
  const step = SCALE[index % SCALE.length] + 12 * Math.floor(index / SCALE.length);
  return root * Math.pow(2, step / 12);
}

function startPad(): void {
  const ctx = audio();
  if (!ctx || !master || pad) return;
  if (master.gain.value < 0.05) ramp(master, LEVEL, 0.6, ctx);
  const gain = ctx.createGain();
  gain.gain.value = 0;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 700;
  gain.connect(filter);
  filter.connect(master);

  const voices = [note(0, 110), note(3, 110), note(5, 220)].map((frequency, index) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency * (index === 2 ? 1.003 : 1);
    osc.connect(gain);
    osc.start();
    return osc;
  });

  gain.gain.setTargetAtTime(0.09, ctx.currentTime, 0.8);
  pad = {
    stop: () => {
      const now = ctx.currentTime;
      gain.gain.setTargetAtTime(0, now, 0.15);
      voices.forEach((osc) => osc.stop(now + 0.8));
    },
  };
}

function stopPad(): void {
  if (!pad) return;
  pad.stop();
  pad = null;
}

/** The chapter that is playing, for the tests and for anyone reading the state. */
export function currentTrack(): Track | null {
  return current;
}

/**
 * **How far through this chapter's song the deck is.**
 *
 * The segments at the top of the story fill with the music rather than with a timer, because the song
 * is what ends the chapter. Nothing is returned before a tap, or while the score is muted, or before a
 * file has said how long it is: a segment that guesses would be a progress bar that lies.
 */
export function scoreProgress(): number | null {
  if (!playing || !active) return null;
  const { duration, currentTime } = active.el;
  if (!Number.isFinite(duration) || duration <= 0) return null;
  return Math.min(1, Math.max(0, currentTime / duration));
}

/**
 * **How long each piece runs, measured from the files themselves.**
 *
 * Needed because a chapter is over when its song is over, and a silent story still has to know when
 * that would have been. Without it, turning the sound off turned the deck into a slideshow that had
 * to be swiped, which reads exactly like a missing auto-advance.
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
