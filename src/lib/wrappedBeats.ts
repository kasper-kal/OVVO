/**
 * **The measured heartbeat of each chapter, and the proof that it is one.**
 *
 * Written by `.logs/gridfix.py`, which decodes each track, builds an onset envelope and then asks
 * the only question that matters: how much more energy falls ON the grid than halfway between it?
 * A real pulse scores well above 1; a wrong tempo or a misplaced downbeat scores below it. The
 * first version of this table was produced by an analyser that only asked which grid collected the
 * most energy, which any fast grid does, and five of the ten came out below 1 — the movement was
 * landing between the hits. These numbers each carry the ratio they were measured at.
 *
 * The deck reads the playing song’s own clock and lays its movement on this grid, so a page lands
 * with the music instead of near it. Re-run the script if a track is ever swapped.
 */

import type { Track } from './wrappedSound';

export interface Tempo {
  /** Beats per minute, measured from the audio. */
  bpm: number;
  /** Where the first beat sits, in seconds from the start of the file. */
  offset: number;
  /** How much more energy lands on the grid than between it, where 1 is no better than chance. */
  confidence: number;
}

export const TEMPO: Record<Track, Tempo> = {
  'acoustic': { bpm: 65.0, offset: 0.154, confidence: 1.96 },
  'afrobeat': { bpm: 163.4, offset: 0.098, confidence: 2.13 },
  'dark-trap': { bpm: 65.5, offset: 0.725, confidence: 2.26 },
  'electro-dance': { bpm: 96.0, offset: 0.258, confidence: 5.04 },
  'electropop': { bpm: 62.6, offset: 0.756, confidence: 2.52 },
  'hip-hop-anthem': { bpm: 101.4, offset: 0.232, confidence: 5.0 },
  'indie-pop': { bpm: 158.5, offset: 0.256, confidence: 3.49 },
  'luxury-anthem': { bpm: 82.6, offset: 0.603, confidence: 5.68 },
  'melodic-trap': { bpm: 81.9, offset: 0.32, confidence: 4.25 },
  'rap-anthem': { bpm: 100.1, offset: 0.057, confidence: 5.86 },
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
