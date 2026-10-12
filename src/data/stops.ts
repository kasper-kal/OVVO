import type { Accessibility, Stop, StopType, TravelMode } from './types';

/**
 * DEMONSTRATION DATA — a fictional-but-plausible network of Dutch stops.
 * Coordinates are positions on the prototype's own 0–100 illustrative canvas,
 * not real geography. Codes are example identifiers.
 */

interface StopSeed {
  id: string;
  name: string;
  city: string;
  code: string;
  type: StopType;
  modes: TravelMode[];
  region: string;
  x: number;
  y: number;
  operatorIds: string[];
  facilities?: string[];
  accessibility?: Partial<Accessibility>;
  bikeParking?: boolean;
  ovFiets?: boolean;
  platforms?: string[];
}

const FACILITIES_BY_TYPE: Record<StopType, string[]> = {
  station: ['Toilets', 'Kiosk', 'Bicycle parking', 'Lift', 'Ticket machine', 'Taxi rank'],
  airport: ['Toilets', 'Kiosk', 'Bicycle parking', 'Lift', 'Ticket machine', 'Left luggage', 'Taxi rank'],
  busstop: ['Shelter', 'Rubbish bin', 'LED display'],
  tramstop: ['Shelter', 'LED display'],
  metrostop: ['Shelter', 'Lift', 'LED display'],
  ferrystop: ['Shelter', 'Bicycle parking'],
  landmark: ['Bench', 'Bicycle parking'],
};

const STEP_FREE_EXCEPTIONS = new Set([
  'hilversum',
  'zaanse-schans',
  'amsterdam-buiksloterweg',
  'rotterdam-erasmusbrug',
]);

function platformsFor(type: StopType, index: number): string[] {
  const count = type === 'station' ? 6 + (index % 5) * 2 : type === 'airport' ? 3 : 2;
  switch (type) {
    case 'busstop':
    case 'landmark':
      return ['A', 'B', 'C'].slice(0, count);
    case 'tramstop':
      return ['A', 'B'];
    case 'ferrystop':
      return ['Pier 1', 'Pier 2'];
    case 'metrostop':
      return ['1', '2'];
    default:
      return Array.from({ length: count }, (_, i) => String(i + 1));
  }
}

function build(seed: StopSeed, index: number): Stop {
  const facilities = seed.facilities ?? FACILITIES_BY_TYPE[seed.type];
  const stepFree = !STEP_FREE_EXCEPTIONS.has(seed.id);
  return {
    id: seed.id,
    name: seed.name,
    city: seed.city,
    code: seed.code,
    type: seed.type,
    modes: seed.modes,
    platforms: seed.platforms ?? platformsFor(seed.type, index),
    region: seed.region,
    coordinates: { x: seed.x, y: seed.y },
    facilities,
    accessibility: {
      stepFree,
      lift: seed.accessibility?.lift ?? (stepFree && seed.type !== 'busstop' && seed.type !== 'tramstop'),
      tactilePaving: seed.accessibility?.tactilePaving ?? stepFree,
      assistance: seed.accessibility?.assistance ?? (seed.type === 'station' || seed.type === 'airport'),
      lowFloorBoarding: seed.accessibility?.lowFloorBoarding ?? seed.type !== 'ferrystop',
      ...seed.accessibility,
    },
    bikeParking: seed.bikeParking ?? seed.type !== 'tramstop',
    ovFiets: seed.ovFiets ?? (seed.type === 'station' || seed.type === 'airport'),
    operatorIds: seed.operatorIds,
    servesCity: seed.city,
  };
}

const SEEDS: StopSeed[] = [
  // ---- Amsterdam ------------------------------------------------------------
  { id: 'amsterdam-centraal', name: 'Amsterdam Centraal', city: 'Amsterdam', code: 'ASC', type: 'station', modes: ['train', 'tram', 'metro', 'bus', 'ferry', 'walk', 'bike'], region: 'Noord-Holland', x: 42, y: 22, operatorIds: ['ns', 'gvb'], facilities: ['Toilets', 'Kiosk', 'Bicycle parking', 'Lift', 'Ticket machine', 'Left luggage', 'Taxi rank', 'Shops'] },
  { id: 'amsterdam-sloterdijk', name: 'Amsterdam Sloterdijk', city: 'Amsterdam', code: 'ASD', type: 'station', modes: ['train', 'metro', 'bus', 'walk', 'bike'], region: 'Noord-Holland', x: 37, y: 20, operatorIds: ['ns', 'gvb'] },
  { id: 'amsterdam-zuid', name: 'Amsterdam Zuid', city: 'Amsterdam', code: 'ASZ', type: 'station', modes: ['train', 'metro', 'tram', 'bus', 'walk', 'bike'], region: 'Noord-Holland', x: 40, y: 27, operatorIds: ['ns', 'gvb'] },
  { id: 'amsterdam-bijlmer-arena', name: 'Amsterdam Bijlmer ArenA', city: 'Amsterdam', code: 'ASB', type: 'station', modes: ['train', 'metro', 'bus', 'walk', 'bike'], region: 'Noord-Holland', x: 47, y: 27, operatorIds: ['ns', 'gvb'] },
  { id: 'amsterdam-muiderpoort', name: 'Amsterdam Muiderpoort', city: 'Amsterdam', code: 'ASM', type: 'station', modes: ['train', 'tram', 'walk'], region: 'Noord-Holland', x: 45, y: 22, operatorIds: ['ns', 'gvb'] },
  { id: 'amsterdam-amstel', name: 'Amsterdam Amstel', city: 'Amsterdam', code: 'ASA', type: 'station', modes: ['train', 'metro', 'bus', 'walk'], region: 'Noord-Holland', x: 43, y: 25, operatorIds: ['ns', 'gvb'] },
  { id: 'amsterdam-noord', name: 'Amsterdam Noord (metro)', city: 'Amsterdam', code: 'AMN', type: 'metrostop', modes: ['metro', 'bus', 'walk'], region: 'Noord-Holland', x: 43, y: 17, operatorIds: ['gvb'] },
  { id: 'amsterdam-leidseplein', name: 'Amsterdam, Leidseplein', city: 'Amsterdam', code: 'ALP', type: 'tramstop', modes: ['tram', 'bus', 'walk'], region: 'Noord-Holland', x: 39, y: 24, operatorIds: ['gvb'] },
  { id: 'amsterdam-museumplein', name: 'Amsterdam, Museumplein', city: 'Amsterdam', code: 'AMP', type: 'tramstop', modes: ['tram', 'walk'], region: 'Noord-Holland', x: 39, y: 26, operatorIds: ['gvb'] },
  { id: 'amsterdam-dam', name: 'Amsterdam, Dam', city: 'Amsterdam', code: 'ADA', type: 'tramstop', modes: ['tram', 'bus', 'walk'], region: 'Noord-Holland', x: 41, y: 23, operatorIds: ['gvb'] },
  { id: 'amsterdam-buiksloterweg', name: 'Amsterdam, Buiksloterweg ferry', city: 'Amsterdam', code: 'ABW', type: 'ferrystop', modes: ['ferry', 'walk', 'bike'], region: 'Noord-Holland', x: 43, y: 19, operatorIds: ['gvb'] },
  { id: 'amsterdam-raijhuis', name: 'Rijksmuseum', city: 'Amsterdam', code: 'ARM', type: 'landmark', modes: ['walk', 'bike'], region: 'Noord-Holland', x: 39, y: 26, operatorIds: [] },
  { id: 'amsterdam-vondelpark', name: 'Amsterdam, Vondelpark', city: 'Amsterdam', code: 'AVP', type: 'landmark', modes: ['walk', 'bike'], region: 'Noord-Holland', x: 38, y: 25, operatorIds: [] },
  { id: 'amsterdam-annefrank', name: 'Amsterdam, Anne Frank House', city: 'Amsterdam', code: 'AAF', type: 'landmark', modes: ['walk', 'bike'], region: 'Noord-Holland', x: 40, y: 21, operatorIds: [] },
  { id: 'zaandam', name: 'Zaandam', city: 'Zaandam', code: 'ZDM', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Noord-Holland', x: 39, y: 19, operatorIds: ['ns', 'ebs'] },
  { id: 'zaanse-schans', name: 'Zaanse Schans', city: 'Zaandam', code: 'ZSC', type: 'busstop', modes: ['bus', 'walk', 'bike'], region: 'Noord-Holland', x: 39, y: 16, operatorIds: ['ebs'] },
  { id: 'volendam', name: 'Volendam, Centrum', city: 'Volendam', code: 'VOL', type: 'busstop', modes: ['bus', 'walk'], region: 'Noord-Holland', x: 48, y: 19, operatorIds: ['ebs'] },
  { id: 'haarlem', name: 'Haarlem', city: 'Haarlem', code: 'HLM', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Noord-Holland', x: 35, y: 24, operatorIds: ['ns', 'connexxion'] },
  { id: 'hilversum', name: 'Hilversum', city: 'Hilversum', code: 'HVS', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Noord-Holland', x: 52, y: 33, operatorIds: ['ns', 'connexxion'] },
  { id: 'almere-centrum', name: 'Almere Centrum', city: 'Almere', code: 'ALM', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Flevoland', x: 51, y: 22, operatorIds: ['ns', 'keolis'] },
  { id: 'alkmaar', name: 'Alkmaar', city: 'Alkmaar', code: 'ALK', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Noord-Holland', x: 40, y: 14, operatorIds: ['ns', 'connexxion'] },
  { id: 'hoofddorp', name: 'Hoofddorp', city: 'Hoofddorp', code: 'HDD', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Noord-Holland', x: 36, y: 27, operatorIds: ['ns'] },
  { id: 'amstelveen-busstation', name: 'Amstelveen, Busstation', city: 'Amstelveen', code: 'AVB', type: 'busstop', modes: ['bus', 'tram', 'walk'], region: 'Noord-Holland', x: 40, y: 28, operatorIds: ['gvb'] },
  { id: 'schiphol-airport', name: 'Schiphol Airport', city: 'Schiphol', code: 'SHL', type: 'airport', modes: ['train', 'bus', 'walk', 'bike'], region: 'Noord-Holland', x: 37, y: 29, operatorIds: ['ns', 'connexxion'] },

  // ---- Zuid-Holland --------------------------------------------------------
  { id: 'leiden-centraal', name: 'Leiden Centraal', city: 'Leiden', code: 'LED', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Zuid-Holland', x: 32, y: 33, operatorIds: ['ns', 'arriva'] },
  { id: 'den-haag-centraal', name: 'Den Haag Centraal', city: 'Den Haag', code: 'DHC', type: 'station', modes: ['train', 'tram', 'bus', 'walk', 'bike'], region: 'Zuid-Holland', x: 27, y: 38, operatorIds: ['ns', 'htm'] },
  { id: 'den-haag-hs', name: 'Den Haag HS', city: 'Den Haag', code: 'DHH', type: 'station', modes: ['train', 'tram', 'bus', 'walk'], region: 'Zuid-Holland', x: 27, y: 39.4, operatorIds: ['ns', 'htm'] },
  { id: 'den-haag-binnenhof', name: 'Den Haag, Binnenhof', city: 'Den Haag', code: 'DBH', type: 'landmark', modes: ['walk', 'bike'], region: 'Zuid-Holland', x: 26.4, y: 38.6, operatorIds: [] },
  { id: 'delft', name: 'Delft', city: 'Delft', code: 'DLF', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Zuid-Holland', x: 29, y: 42, operatorIds: ['ns'] },
  { id: 'rotterdam-centraal', name: 'Rotterdam Centraal', city: 'Rotterdam', code: 'RTC', type: 'station', modes: ['train', 'metro', 'tram', 'bus', 'walk', 'bike'], region: 'Zuid-Holland', x: 33, y: 48, operatorIds: ['ns', 'ret'] },
  { id: 'rotterdam-blaak', name: 'Rotterdam Blaak', city: 'Rotterdam', code: 'RTB', type: 'station', modes: ['train', 'metro', 'tram', 'walk'], region: 'Zuid-Holland', x: 34, y: 49, operatorIds: ['ns', 'ret'] },
  { id: 'rotterdam-alexander', name: 'Rotterdam Alexander', city: 'Rotterdam', code: 'RTA', type: 'station', modes: ['train', 'metro', 'bus', 'walk'], region: 'Zuid-Holland', x: 38, y: 47, operatorIds: ['ns', 'ret'] },
  { id: 'rotterdam-erasmusbrug', name: 'Rotterdam, Erasmusbrug waterbus', city: 'Rotterdam', code: 'REB', type: 'ferrystop', modes: ['ferry', 'walk', 'bike'], region: 'Zuid-Holland', x: 32, y: 50, operatorIds: ['aquabus'] },
  { id: 'rotterdam-markthal', name: 'Rotterdam, Markthal', city: 'Rotterdam', code: 'RMK', type: 'landmark', modes: ['walk', 'bike'], region: 'Zuid-Holland', x: 33.6, y: 49.2, operatorIds: [] },
  { id: 'schiedam-centrum', name: 'Schiedam Centrum', city: 'Schiedam', code: 'SCM', type: 'station', modes: ['train', 'metro', 'tram', 'bus', 'walk'], region: 'Zuid-Holland', x: 30, y: 48, operatorIds: ['ns', 'ret'] },
  { id: 'gouda', name: 'Gouda', city: 'Gouda', code: 'GDA', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Zuid-Holland', x: 40, y: 45, operatorIds: ['ns'] },
  { id: 'dordrecht', name: 'Dordrecht', city: 'Dordrecht', code: 'DDZ', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Zuid-Holland', x: 33, y: 56, operatorIds: ['ns', 'qbuzz'] },
  { id: 'zoetermeer', name: 'Zoetermeer', city: 'Zoetermeer', code: 'ZTM', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Zuid-Holland', x: 30, y: 40, operatorIds: ['ns', 'htm'] },

  // ---- Utrecht -------------------------------------------------------------
  { id: 'utrecht-centraal', name: 'Utrecht Centraal', city: 'Utrecht', code: 'UTC', type: 'station', modes: ['train', 'tram', 'bus', 'walk', 'bike'], region: 'Utrecht', x: 50, y: 40, operatorIds: ['ns', 'qbuzz'] },
  { id: 'utrecht-vaartsche-rijn', name: 'Utrecht Vaartsche Rijn', city: 'Utrecht', code: 'UTV', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Utrecht', x: 50, y: 42, operatorIds: ['ns'] },
  { id: 'utrecht-lunetten', name: 'Utrecht Lunetten', city: 'Utrecht', code: 'UTL', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Utrecht', x: 51, y: 44, operatorIds: ['ns'] },
  { id: 'utrecht-overvecht', name: 'Utrecht Overvecht', city: 'Utrecht', code: 'UTO', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Utrecht', x: 50, y: 37, operatorIds: ['ns', 'qbuzz'] },
  { id: 'utrecht-domtoren', name: 'Utrecht, Domtoren', city: 'Utrecht', code: 'UDM', type: 'landmark', modes: ['walk', 'bike'], region: 'Utrecht', x: 49.4, y: 40.8, operatorIds: [] },
  { id: 'amersfoort-centraal', name: 'Amersfoort Centraal', city: 'Amersfoort', code: 'AMF', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Utrecht', x: 58, y: 42, operatorIds: ['ns', 'keolis'] },

  // ---- Gelderland / Overijssel --------------------------------------------
  { id: 'arnhem-centraal', name: 'Arnhem Centraal', city: 'Arnhem', code: 'ARN', type: 'station', modes: ['train', 'tram', 'bus', 'walk', 'bike'], region: 'Gelderland', x: 68, y: 52, operatorIds: ['ns', 'keolis'] },
  { id: 'nijmegen', name: 'Nijmegen', city: 'Nijmegen', code: 'NM', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Gelderland', x: 72, y: 58, operatorIds: ['ns', 'arriva'] },
  { id: 'apeldoorn', name: 'Apeldoorn', city: 'Apeldoorn', code: 'APD', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Gelderland', x: 66, y: 44, operatorIds: ['ns', 'keolis'] },
  { id: 'deventer', name: 'Deventer', city: 'Deventer', code: 'DVN', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Overijssel', x: 68, y: 34, operatorIds: ['ns', 'keolis'] },
  { id: 'zwolle', name: 'Zwolle', city: 'Zwolle', code: 'ZL', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Overijssel', x: 68, y: 26, operatorIds: ['ns', 'keolis'] },
  { id: 'enschede', name: 'Enschede', city: 'Enschede', code: 'ES', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Overijssel', x: 80, y: 46, operatorIds: ['ns', 'keolis'] },

  // ---- Noord-Brabant / Limburg --------------------------------------------
  { id: 'den-bosch', name: "'s-Hertogenbosch", city: "'s-Hertogenbosch", code: 'HT', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Noord-Brabant', x: 52, y: 62, operatorIds: ['ns', 'arriva'] },
  { id: 'tilburg', name: 'Tilburg', city: 'Tilburg', code: 'TB', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Noord-Brabant', x: 45, y: 70, operatorIds: ['ns'] },
  { id: 'breda', name: 'Breda', city: 'Breda', code: 'BD', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Noord-Brabant', x: 40, y: 68, operatorIds: ['ns', 'arriva'] },
  { id: 'eindhoven-centraal', name: 'Eindhoven Centraal', city: 'Eindhoven', code: 'EHV', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Noord-Brabant', x: 56, y: 74, operatorIds: ['ns', 'arriva'] },
  { id: 'eindhoven-strijp-s', name: 'Eindhoven Strijp-S', city: 'Eindhoven', code: 'EHS', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Noord-Brabant', x: 55, y: 72, operatorIds: ['ns'] },
  { id: 'helmond', name: 'Helmond', city: 'Helmond', code: 'HM', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Noord-Brabant', x: 60, y: 78, operatorIds: ['ns'] },
  { id: 'maastricht', name: 'Maastricht', city: 'Maastricht', code: 'MT', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Limburg', x: 62, y: 92, operatorIds: ['ns', 'arriva'] },

  // ---- Noord / Zeeland ----------------------------------------------------
  { id: 'groningen', name: 'Groningen', city: 'Groningen', code: 'GN', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Groningen', x: 73, y: 9, operatorIds: ['ns', 'qbuzz'] },
  { id: 'groningen-noord', name: 'Groningen Noord', city: 'Groningen', code: 'GNN', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Groningen', x: 73, y: 7, operatorIds: ['arriva'] },
  { id: 'leeuwarden', name: 'Leeuwarden', city: 'Leeuwarden', code: 'LW', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Friesland', x: 58, y: 10, operatorIds: ['ns', 'arriva'] },
  { id: 'vlissingen', name: 'Vlissingen', city: 'Vlissingen', code: 'VS', type: 'station', modes: ['train', 'ferry', 'bus', 'walk'], region: 'Zeeland', x: 10, y: 76, operatorIds: ['ns'] },
];

export const STOPS: Stop[] = SEEDS.map(build);

const stopMap = new Map(STOPS.map((s) => [s.id, s]));

export function getStop(id: string | undefined): Stop | undefined {
  return id ? stopMap.get(id) : undefined;
}

/** Throws for unknown ids — used where a journey is guaranteed to reference a real stop. */
export function requireStop(id: string): Stop {
  const stop = stopMap.get(id);
  if (!stop) throw new Error(`Unknown stop: ${id}`);
  return stop;
}

export function stopName(id: string | undefined): string {
  return getStop(id)?.name ?? 'Unknown stop';
}

/** "Amsterdam Centraal" stays as-is; "Leidseplein" becomes "Amsterdam, Leidseplein". */
export function stopLabel(id: string | undefined): string {
  const stop = getStop(id);
  if (!stop) return 'Unknown stop';
  return stop.name.includes(stop.city) ? stop.name : `${stop.city}, ${stop.name}`;
}

export function canvasDistance(a: Stop, b: Stop): number {
  return Math.hypot(a.coordinates.x - b.coordinates.x, a.coordinates.y - b.coordinates.y);
}

/** Every stop within `radius` illustrative canvas units (used for "nearby stops"). */
export function nearbyStops(id: string, radius = 4): Stop[] {
  const origin = getStop(id);
  if (!origin) return [];
  return STOPS.filter((s) => s.id !== id && canvasDistance(origin, s) <= radius).sort(
    (a, b) => canvasDistance(origin, a) - canvasDistance(origin, b),
  );
}

export function cities(): string[] {
  return [...new Set(STOPS.map((s) => s.city))].sort((a, b) => a.localeCompare(b, 'nl'));
}

export function regions(): string[] {
  return [...new Set(STOPS.map((s) => s.region))].sort((a, b) => a.localeCompare(b, 'nl'));
}

/** Stops that operate a departure board (everything except pure walking landmarks). */
export function boardStops(): Stop[] {
  return STOPS.filter((s) => s.modes.some((m) => m !== 'walk' && m !== 'bike'));
}

/**
 * Illustrative walking times.
 *
 * The prototype canvas is NOT to scale: intercity distances use roughly 4 km per
 * canvas unit, while stops inside one city are laid out far more generously than
 * the real street grid. Walking therefore uses two factors so that a walk inside
 * a city stays realistic and a walk between cities is never suggested.
 */
const CITY_WALK_MINUTES_PER_UNIT = 7.5;
const INTERCITY_WALK_MINUTES_PER_UNIT = 53;
/** One canvas unit ≈ 4 km on the intercity scale. */
export const METRES_PER_UNIT = 4000;

export function walkMinutesBetween(a: Stop, b: Stop): number {
  const factor = a.city === b.city ? CITY_WALK_MINUTES_PER_UNIT : INTERCITY_WALK_MINUTES_PER_UNIT;
  return Math.max(1, Math.round(canvasDistance(a, b) * factor));
}
