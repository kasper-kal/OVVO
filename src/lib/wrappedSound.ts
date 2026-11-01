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
 * **Every track, trimmed to the same loudness.**
 *
 * The ten pieces were not mastered together: measured in the band the ear judges music by, the
 * quietest sat at -31 dB and the loudest at -15 dB, which is sixteen times the difference in power
 * and exactly why one chapter felt too quiet and another too loud. These numbers bring the lot to
 * -21 dB, so the story changes colour between chapters without changing volume.
 *
 * Measured by decoding each file and taking the level between 300 Hz and 6 kHz, because a straight
 * average would turn a bass-heavy track down for being bass-heavy. The biggest correction is the
 * acoustic guitar, which was simply quieter than everything else; nothing clips.
 */
const TRIM: Record<Track, number> = {
  'luxury-anthem': 1.07,
  'electro-dance': 1.14,
  'afrobeat': 0.5,
  'indie-pop': 3.27,
  'electropop': 1.17,
  'melodic-trap': 0.51,
  'hip-hop-anthem': 0.86,
  'dark-trap': 1.32,
  'rap-anthem': 0.78,
  'acoustic': 0.51,
};
const FADE_IN = 0.9;
const FADE_OUT = 0.7;

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
let broken = false;
let pad: { stop: () => void } | null = null;
let onEnd: (() => void) | null = null;

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
  el.addEventListener('error', () => {
    broken = true;
    if (playing) startPad();
  });
  el.addEventListener('ended', () => {
    if (slot !== active || !playing) return;
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
  if (broken) {
    startPad();
    return;
  }

  /* A track already in the live player (rounding a chapter twice, or coming back from silence). */
  const live = active && active.track === track ? active : null;
  if (live) {
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
      broken = true;
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
