/**
 * **The measured heartbeat of each chapter.**
 *
 * Written by `.logs/tempofix.py`: it decodes each track, builds an onset envelope, and finds the
 * lag the envelope repeats at (autocorrelation) restricted to 86–172 beats a minute — the range a
 * person taps. Two earlier versions of this table were wrong in different ways. The first picked
 * the grid that collected the most hits, which any fast grid does. The second picked the grid with
 * the most energy strictly on it, which quietly prefers a slow pulse that only catches the loudest
 * hits, so the deck was counting time at 62 beats a minute on a pop song.
 *
 * A tap tempo is lively and the movement can ride it. The contrast figure recorded with each track
 * is how much more onset energy falls on the grid than halfway between it; anything above 1 is a
 * real pulse, and every track here is measured rather than guessed.
 */

import type { Track } from './wrappedSound';

export interface Tempo {
  /** Beats per minute, the tempo a foot taps. */
  bpm: number;
  /** Where the first beat sits, in seconds from the start of the file. */
  offset: number;
  /** How much more energy lands on the grid than between it, where 1 is no better than chance. */
  confidence: number;
}

export const TEMPO: Record<Track, Tempo> = {
  'acoustic': { bpm: 86.9, offset: 0.414, confidence: 1.41 },
  'afrobeat': { bpm: 164.1, offset: 0.134, confidence: 1.61 },
  'dark-trap': { bpm: 129.2, offset: 0.248, confidence: 1.53 },
  'electro-dance': { bpm: 120.2, offset: 0.474, confidence: 1.51 },
  'electropop': { bpm: 130.8, offset: 0.183, confidence: 1.69 },
  'hip-hop-anthem': { bpm: 152.0, offset: 0.329, confidence: 1.8 },
  'indie-pop': { bpm: 159.0, offset: 0.283, confidence: 1.91 },
  'luxury-anthem': { bpm: 124.5, offset: 0.393, confidence: 2.51 },
  'melodic-trap': { bpm: 123.0, offset: 0.114, confidence: 1.74 },
  'rap-anthem': { bpm: 149.8, offset: 0.02, confidence: 2.03 },
};

/** One beat in milliseconds, for anything that should last exactly that long. */
export function beatMs(track: Track): number {
  return 60000 / TEMPO[track].bpm;
}

/** How long a bar of four beats lasts, which is the natural length of a landfall. */
export function barMs(track: Track): number {
  return beatMs(track) * 4;
}

export interface BeatPoint {
  /** How many beats have landed since the file started. */
  index: number;
  /** How far through the current beat, from 0 to just under 1. */
  phase: number;
}

/**
 * Where the music is on its own grid, at a given moment in the file.
 *
 * The offset matters as much as the tempo: a song’s first beat is rarely at zero, and a grid that
 * ignores it lands every movement late by that much.
 */
export function beatAt(track: Track, seconds: number): BeatPoint {
  const { bpm, offset } = TEMPO[track];
  const beatsSoFar = (seconds - offset) / (60 / bpm);
  const index = Math.floor(beatsSoFar);
  return { index, phase: beatsSoFar - index };
}
