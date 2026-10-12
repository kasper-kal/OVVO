import type { PublicMode } from '../data/types';

export { nowMinutes, roundToStep } from './format';

/** Order in which public transport modes appear in lists and filters. */
export const PT_LABEL_ORDER: PublicMode[] = ['train', 'metro', 'tram', 'bus', 'ferry'];
