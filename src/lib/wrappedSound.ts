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
 * **Loud enough to be music.** The ten pieces were not mastered together, and the first version of this
 * table brought them all to -22 dBFS and then turned the whole score down another five decibels. Measured
 * on a phone that is about -27 dBFS, which is not a quiet score, it is a score that sounds like nothing at
 * all: the report said "playing", and the speaker said silence. Every file is now brought to -16 dBFS,
 * a normal listening level, and the extra master turn-down is gone. The three quiet files were lifted in
 * the files themselves, where a boost above full volume is possible.
 */
const TRIM: Record<Track, number> = {
  'luxury-anthem': 0.859,
  'electro-dance': 0.839,
  'afrobeat': 0.461,
  'indie-pop': 1,
  'electropop': 1,
  'melodic-trap': 0.475,
  'hip-hop-anthem': 0.75,
  'dark-trap': 1,
  'rap-anthem': 0.5,
  'acoustic': 0.945,
};

/** How far under the phone's own volume the whole score sits. */
const LEVEL = 1;
/**
 * **A song arrives in four tenths of a second, every time.**
 *
 * The steerer asked for the fade-in to be short and to never be skipped: a chapter that slid in already
 * at full level made the page turn sound like a cut, and a chapter that took almost a second to arrive
 * sounded like a broken phone.
 */
const FADE_IN = 0.4;
const FADE_OUT = 0.7;

/**
 * **The last second of an automatic turn belongs to the fade.**
 *
 * When the song is turning the page by itself, the music has a full second to fall away before the next
 * chapter arrives, so the ear is ready for it. A page the traveller turns by hand is not faded this way:
 * a thumb should get its answer at once, and there the two tracks simply cross.
 */
const AUTO_FADE = 1;

/** How long before a song ends the deck turns the page. */
const TURN_EARLY = 0.5;

/**
 * **How much of a song a chapter gets.**
 *
 * Every chapter used to run its whole track, so twelve chapters took over three minutes to walk and
 * the steerer called the story slow, which it was. A chapter now plays a little over half its song:
 * it opens on the part that moves, and it hands over to the next chapter while the last of it is still
 * there to be faded. Nothing is cut out of the files, so the same music is under the same page, and the
 * page still ends on its own cadence rather than on a timer.
 */
const CUT = 0.56;

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
let ducked = false;
/** The last few things the score was asked to do, newest last, for the report. */
const calls: string[] = [];

function note(line: string): void {
  const at = typeof performance !== 'undefined' ? (performance.now() / 1000).toFixed(1) : '0';
  calls.push(`${at}s ${line}`);
  if (calls.length > 6) calls.shift();
}

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
  /*
   * **The player is in the page, and invisible.**
   *
   * An audio element that exists only in memory is refused by some phone browsers — the classic reason a
   * score plays on a desktop and is silent on a phone. It is a one-pixel, transparent element at the end
   * of the body: present for the browser, invisible to the traveller, and never in the way of a tap.
   */
  el.setAttribute('aria-hidden', 'true');
  el.style.position = 'fixed';
  el.style.left = '0';
  el.style.bottom = '0';
  el.style.width = '1px';
  el.style.height = '1px';
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  if (typeof document !== 'undefined' && document.body) document.body.appendChild(el);
  const slot: Slot = { el, track: null };
  /*
   * The page turns just before the song does.
   *
   * `timeupdate` fires several times a second, which is fine-grained enough to catch the last half
   * second, and it works while the tab is in front. `ended` stays as the fallback for a browser that
   * skips the last update, and the `turned` flag makes sure one song never asks twice.
   */
  el.addEventListener('timeupdate', () => watchEnd(slot));
  /*
   * **A tenth of a second is close enough to the last second.**
   *
   * `timeupdate` fires about four times a second, which is fine for catching the end of a song but too
   * coarse to place a one-second fade: the fade could start a quarter of a second late and still be at a
   * third of its level when the page turned. This ticker asks the same question ten times a second, so a
   * one-second fade takes one second.
   */
  window.setInterval(() => watchEnd(slot), 100);
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

/**
 * Watch a player's clock for the two moments an automatic page turn needs: a second out, and half a
 * second out.
 *
 * One second before the page turns, the song starts to fall away, so a chapter that ends by itself is
 * heard ending rather than cut off. Half a second before, the deck is told, and it turns the page as the
 * fade lands on nothing. A page the traveller turns by hand never gets here: by then this element is no
 * longer the active one.
 */
function watchEnd(slot: Slot): void {
  if (slot !== active || !playing) return;
  const { duration, currentTime } = slot.el;
  /* The page turns where the cut is, not where the file ends. */
  const end = duration * CUT;
  if (!Number.isFinite(duration) || end <= TURN_EARLY + AUTO_FADE) return;
  if (!ducked && currentTime >= end - TURN_EARLY - AUTO_FADE) {
    ducked = true;
    fade(slot.el, 0, AUTO_FADE);
    note(`fade out ${AUTO_FADE}s before the page`);
  }
  if (turned) return;
  if (currentTime >= end - TURN_EARLY) {
    turned = true;
    onEnd?.();
  }
}

/**
 * **A station bell on every page turn.**
 *
 * The deck is a journey, and a journey through Dutch stations has one sound everybody knows: two notes,
 * high then low, before the announcement. It is a plain audio element like the score, it is quiet, and it
 * never asks for a gesture of its own, so a phone that refuses it simply has no bell.
 */
let bell: HTMLAudioElement | null = null;

function stationBell(): void {
  if (!playing) return;
  if (!bell) {
    bell = new Audio(`${import.meta.env.BASE_URL}music/chime.wav`);
    bell.preload = 'auto';
    bell.volume = 0.24;
  }
  try {
    bell.currentTime = 0;
  } catch {
    /* Not decoded yet: the first page has no bell, the next one will. */
  }
  void bell.play().catch(() => undefined);
}

/** Load a track into a player, unless it is already there. */
function load(slot: Slot, track: Track): void {
  if (slot.track === track) return;
  slot.track = track;
  slot.el.src = urlOf(track);
  turned = false;
  ducked = false;
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

/**
 * **Start a player, but never a player that is already starting.**
 *
 * Begin starts the chapter's song, and the chapter's own effect asks the score for that same song a
 * moment later. Both calls used to go through `play()`, and a phone aborts the first play when a second
 * arrives on the same element while it is still loading: the element ends up stopped while the score's
 * state says "on". That is why the music only arrived after the switch had been tapped off and on — the
 * second tap was the first play that nothing interrupted.
 */
function begin(slot: Slot): void {
  note(`play ${slot.track ?? 'none'}${slot.el.paused ? '' : ' (already playing)'}`);
  if (!slot.el.paused) return;
  slot.el.volume = 0;
  const started = slot.el.play();
  if (started) {
    void started.catch((error: unknown) => {
      refusal = String((error as Error)?.name || error);
      note(`refused: ${refusal}`);
    });
  }
}

/**
 * **If the song did not start, ask again.**
 *
 * A phone refuses a play that arrives while the file is still loading: the element is left paused, the
 * score says "on", and nothing retries it. The debug view of this deck sounded fine only because it
 * re-renders twice a second and kept asking; the real page asked once. So the retry lives here now, four
 * attempts over three seconds, and it stops the moment the player is moving.
 */
const retries = new Map<HTMLAudioElement, number>();

function ensurePlaying(slot: Slot): void {
  const running = retries.get(slot.el);
  if (running) window.clearTimeout(running);
  let attempt = 0;
  const tryAgain = () => {
    if (!playing || slot !== active) return;
    if (!slot.el.paused) return;
    if (attempt >= 4) return;
    attempt += 1;
    note(`retry ${attempt} ${slot.track ?? 'none'}`);
    const started = slot.el.play();
    if (started) void started.catch(() => undefined);
    retries.set(slot.el, window.setTimeout(tryAgain, 600 * attempt));
  };
  retries.set(slot.el, window.setTimeout(tryAgain, 400));
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
    ensurePlaying(live);
    fade(live.el, targetVolume(track), FADE_IN);
    current = track;
    prefetch(next);
    return;
  }

  const incoming = pick(track);
  if (!incoming) return;
  load(incoming, track);
  begin(incoming);
  ensurePlaying(incoming);
  fade(incoming.el, targetVolume(track), FADE_IN);

  const leaving = active;
  active = incoming;
  current = track;
  playing = true;
  /* The bell belongs to the change of chapter, not to a resumed score. */
  stationBell();

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
  note(`startSound ${track}`);
  playing = true;
  spin(track, next);
}

/** Silence it for the session, and leave nothing playing behind another screen. */
export function stopSound(): void {
  note('stopSound');
  playing = false;
  retries.forEach((id) => window.clearTimeout(id));
  retries.clear();
  slots.forEach((slot) => fade(slot.el, 0, 0.15));
  bell?.pause();
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
 * **Whether a speaker is actually moving, which is not the same as being switched on.**
 *
 * A phone refuses a play that arrives without a tap, so the score can be armed and silent at the same
 * moment. The corner switch has to name what is true of the speaker rather than what the state believes,
 * or the first page asks for a press that the second page never asks for.
 */
export function soundAudible(): boolean {
  return Boolean(playing && active && !active.el.paused && active.el.currentTime > 0.05);
}

/**
 * A chapter arrived: move the score to its track.
 *
 * Silent unless the traveller has asked for sound, so the cover's Begin and the switch in the corner
 * are the only two ways music ever starts.
 */
export function playChapter(track: Track, next?: Track): void {
  note(`playChapter ${track}${playing ? '' : ' (silent)'}`);
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
  note(`resume ${track}`);
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
  calls.slice(-4).forEach((line) => lines.push(line));
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

/**
 * **How long a chapter actually lasts.**
 *
 * The deck's silent clock and its progress bar have to run to the same length the score does, or a muted
 * story turns its pages later than a heard one and the bar fills past the cut. Both read this.
 */
export function chapterSeconds(track: Track): number {
  return TRACK_SECONDS[track] * CUT;
}

/** The chapter that is playing, for the tests and for anyone reading the state. */
export function currentTrack(): Track | null {
  return current;
}
