/**
 * **The soundtrack, made where it is needed.**
 *
 * A Wrapped with a score needs music, and OVVO ships no audio files: a licensed track is not ours to
 * ship, and half a megabyte of mp3 for one screen is a poor trade on a phone opening a timetable.
 *
 * So the sound is synthesised, in the browser, from nothing: a slow pad that holds under the whole
 * story and one short chime as each chapter arrives, both tuned to a pentatonic scale so no two
 * chapters can ever clash. It costs no bytes, works offline, and stops the moment the deck closes.
 *
 * Three rules it keeps: **nothing plays before a tap** (the deck asks, the answer is the gesture the
 * browser needs), **the traveller can silence it** and that choice holds for the session, and
 * **nothing is written to storage** — sound is not a preference about the app, it is a switch on
 * one screen.
 */

let context: AudioContext | null = null;
let master: GainNode | null = null;
let pad: { stop: () => void } | null = null;
let muted = false;

/** The pentatonic scale the whole score is drawn from: no note in it can sound wrong with another. */
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (context) return context;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    /* A browser that refuses to make an audio context still gets the whole story, silently. */
    return null;
  }
  master = context.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(context.destination);
  return context;
}

/** A note of the scale, `index` steps up from the root, as a frequency in hertz. */
function note(index: number, root = 220): number {
  const step = SCALE[index % SCALE.length] + 12 * Math.floor(index / SCALE.length);
  return root * Math.pow(2, step / 12);
}

/** The pad: two quiet, slightly detuned sines and a filter opened only a little. */
function startPad(): void {
  const ctx = audio();
  if (!ctx || !master || pad) return;
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

  /* Two seconds to arrive, so it is under the cover before the story starts. */
  gain.gain.setTargetAtTime(0.09, ctx.currentTime, 0.8);
  pad = {
    stop: () => {
      const now = ctx.currentTime;
      gain.gain.setTargetAtTime(0, now, 0.15);
      voices.forEach((osc) => osc.stop(now + 0.8));
    },
  };
}

/** Ask for sound. Must be called from a gesture: a browser will not start audio without one. */
export function startSound(): void {
  const ctx = audio();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  muted = false;
  if (master) master.gain.setTargetAtTime(0.5, ctx.currentTime, 0.1);
  startPad();
}

/** Silence it, and remember that for this session. */
export function stopSound(): void {
  muted = true;
  if (context && master) master.gain.setTargetAtTime(0, context.currentTime, 0.08);
  if (pad) {
    pad.stop();
    pad = null;
  }
}

/** Whether the score is currently allowed to make a sound. */
export function soundIsOn(): boolean {
  return !muted;
}

/**
 * One chime, as a chapter arrives.
 *
 * Three short notes, rising with the story: the same figure each time, so the sound is a signature
 * rather than a jingle per screen, and the pitch climbs a step as the year is told.
 */
export function chime(chapter: number): void {
  const ctx = audio();
  if (!ctx || !master || muted) return;
  const start = ctx.currentTime + 0.02;
  const base = 2 + chapter;

  for (let voice = 0; voice < 3; voice += 1) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = voice === 2 ? 'triangle' : 'sine';
    osc.frequency.value = note(base + voice * 2, 440);
    gain.gain.setValueAtTime(0, start + voice * 0.07);
    gain.gain.linearRampToValueAtTime(0.16 - voice * 0.03, start + voice * 0.07 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + voice * 0.07 + 0.9);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start + voice * 0.07);
    osc.stop(start + voice * 0.07 + 1);
  }
}
