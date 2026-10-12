import type { Operator } from './types';

/** DEMONSTRATION DATA — operator names reference real Dutch carriers for realism only. */
export const OPERATORS: Operator[] = [
  { id: 'ns', name: 'Nederlandse Spoorwegen', shortName: 'NS', modes: ['train'] },
  { id: 'arriva', name: 'Arriva', shortName: 'Arriva', modes: ['train', 'bus'] },
  { id: 'gvb', name: 'GVB Amsterdam', shortName: 'GVB', modes: ['tram', 'metro', 'ferry', 'bus'] },
  { id: 'ret', name: 'RET Rotterdam', shortName: 'RET', modes: ['metro', 'tram', 'bus'] },
  { id: 'htm', name: 'HTM Den Haag', shortName: 'HTM', modes: ['tram', 'bus'] },
  { id: 'qbuzz', name: 'Qbuzz', shortName: 'Qbuzz', modes: ['bus', 'tram'] },
  { id: 'keolis', name: 'Keolis', shortName: 'Keolis', modes: ['train', 'bus'] },
  { id: 'ebs', name: 'EBS', shortName: 'EBS', modes: ['bus'] },
  { id: 'connexxion', name: 'Connexxion', shortName: 'Connexxion', modes: ['bus'] },
  { id: 'aquabus', name: 'Aquabus', shortName: 'Aquabus', modes: ['ferry'] },
];

const operatorMap = new Map(OPERATORS.map((o) => [o.id, o]));

export function getOperator(id: string | undefined): Operator | undefined {
  return id ? operatorMap.get(id) : undefined;
}

export function operatorName(id: string | undefined): string {
  return getOperator(id)?.shortName ?? 'Onbekend';
}
