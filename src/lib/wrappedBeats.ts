/**
 * **The measured heartbeat of each chapter.**
 *
 * Written by `.logs/beats.py`, which decodes each track and finds the tempo and the first downbeat
 * that best explain where the hits land. The deck does not guess a beat or run a timer: it reads
 * the playing song’s own clock and puts its movement on these beats, so a page lands with the
 * music instead of near it. Re-run the script if a track is ever swapped.
 */

import type { Track } from './wrappedSound';

export interface Tempo {
  /** Beats per minute, measured from the audio. */
  bpm: number;
  /** Where the first downbeat sits, in seconds from the start of the file. */
  offset: number;
  /** How strongly the audio agrees with this grid, where 1 is no better than noise. */
  confidence: number;
}

export const TEMPO: Record<Track, Tempo> = {
  'acoustic': { bpm: 130.0, offset: 0.114, confidence: 3.26 },
  'afrobeat': { bpm: 81.5, offset: 0.046, confidence: 5.9 },
  'dark-trap': { bpm: 81.0, offset: 0.673, confidence: 2.83 },
  'electro-dance': { bpm: 120.0, offset: 0.248, confidence: 3.8 },
  'electropop': { bpm: 97.5, offset: 0.579, confidence: 6.06 },
  'hip-hop-anthem': { bpm: 76.0, offset: 0.582, confidence: 4.93 },
  'indie-pop': { bpm: 79.0, offset: 0.394, confidence: 3.49 },
  'luxury-anthem': { bpm: 124.0, offset: 0.296, confidence: 3.41 },
  'melodic-trap': { bpm: 123.0, offset: 0.046, confidence: 4.93 },
  'rap-anthem': { bpm: 75.0, offset: 0.012, confidence: 3.4 },
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
 * The offset matters as much as the tempo: a song's first downbeat is rarely at zero, and a grid
 * that ignores it lands every pulse late by that much.
 */
export function beatAt(track: Track, seconds: number): BeatPoint {
  const { bpm, offset } = TEMPO[track];
  const beatsSoFar = (seconds - offset) / (60 / bpm);
  const index = Math.floor(beatsSoFar);
  return { index, phase: beatsSoFar - index };
}
