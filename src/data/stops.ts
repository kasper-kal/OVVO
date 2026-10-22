import type { Accessibility, Stop, StopType, TravelMode } from './types';

/**
 * The stop network: stations, halts and walking landmarks in the Netherlands.
 *
 * `coordinates` is the schematic 0–100 canvas the map draws on; `geo` is the
 * real WGS84 position used for distances and for "near me" lookups.
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

/**
 * Real WGS84 positions (latitude, longitude) for every stop, so the planner can
 * measure true distances and resolve "my current location" to the nearest stop.
 * The `x`/`y` seed values remain the schematic canvas the map draws on.
 */
const GEO: Record<string, { lat: number; lon: number }> = {
  'amsterdam-centraal': { lat: 52.3789, lon: 4.9006 },
  'amsterdam-sloterdijk': { lat: 52.389, lon: 4.8381 },
  'amsterdam-zuid': { lat: 52.3388, lon: 4.8732 },
  'amsterdam-bijlmer-arena': { lat: 52.3122, lon: 4.9471 },
  'amsterdam-muiderpoort': { lat: 52.3607, lon: 4.9312 },
  'amsterdam-amstel': { lat: 52.3465, lon: 4.9176 },
  'amsterdam-noord': { lat: 52.4017, lon: 4.9321 },
  'amsterdam-leidseplein': { lat: 52.364, lon: 4.8828 },
  'amsterdam-museumplein': { lat: 52.3573, lon: 4.8815 },
  'amsterdam-dam': { lat: 52.3731, lon: 4.8924 },
  'amsterdam-buiksloterweg': { lat: 52.3824, lon: 4.9032 },
  'amsterdam-raijhuis': { lat: 52.3598, lon: 4.885 },
  'amsterdam-vondelpark': { lat: 52.3572, lon: 4.8641 },
  'amsterdam-annefrank': { lat: 52.3752, lon: 4.8841 },
  zaandam: { lat: 52.4382, lon: 4.8137 },
  'zaanse-schans': { lat: 52.4751, lon: 4.818 },
  volendam: { lat: 52.4937, lon: 5.069 },
  haarlem: { lat: 52.3872, lon: 4.6379 },
  hilversum: { lat: 52.2265, lon: 5.1813 },
  'almere-centrum': { lat: 52.3753, lon: 5.2193 },
  alkmaar: { lat: 52.6381, lon: 4.7407 },
  hoofddorp: { lat: 52.2922, lon: 4.6988 },
  'amstelveen-busstation': { lat: 52.3025, lon: 4.8578 },
  'schiphol-airport': { lat: 52.3096, lon: 4.7621 },
  'leiden-centraal': { lat: 52.1663, lon: 4.4823 },
  'den-haag-centraal': { lat: 52.0808, lon: 4.3245 },
  'den-haag-hs': { lat: 52.0701, lon: 4.3223 },
  'den-haag-binnenhof': { lat: 52.0793, lon: 4.3124 },
  delft: { lat: 52.0076, lon: 4.3581 },
  'rotterdam-centraal': { lat: 51.9251, lon: 4.4692 },
  'rotterdam-blaak': { lat: 51.9201, lon: 4.4891 },
  'rotterdam-alexander': { lat: 51.9517, lon: 4.5525 },
  'rotterdam-erasmusbrug': { lat: 51.9096, lon: 4.4855 },
  'rotterdam-markthal': { lat: 51.9201, lon: 4.487 },
  'schiedam-centrum': { lat: 51.922, lon: 4.4087 },
  gouda: { lat: 52.0174, lon: 4.7062 },
  dordrecht: { lat: 51.8075, lon: 4.6677 },
  zoetermeer: { lat: 52.0476, lon: 4.4769 },
  'utrecht-centraal': { lat: 52.0894, lon: 5.1098 },
  'utrecht-vaartsche-rijn': { lat: 52.0788, lon: 5.1219 },
  'utrecht-lunetten': { lat: 52.0664, lon: 5.1433 },
  'utrecht-overvecht': { lat: 52.1101, lon: 5.1258 },
  'utrecht-domtoren': { lat: 52.0907, lon: 5.1213 },
  'amersfoort-centraal': { lat: 52.1539, lon: 5.3741 },
  'arnhem-centraal': { lat: 51.9851, lon: 5.9 },
  nijmegen: { lat: 51.8431, lon: 5.8531 },
  apeldoorn: { lat: 52.209, lon: 5.9698 },
  deventer: { lat: 52.2574, lon: 6.1596 },
  zwolle: { lat: 52.505, lon: 6.0912 },
  enschede: { lat: 52.2224, lon: 6.8898 },
  'den-bosch': { lat: 51.6905, lon: 5.2937 },
  tilburg: { lat: 51.5606, lon: 5.0838 },
  breda: { lat: 51.5951, lon: 4.78 },
  'eindhoven-centraal': { lat: 51.443, lon: 5.4795 },
  'eindhoven-strijp-s': { lat: 51.4504, lon: 5.457 },
  helmond: { lat: 51.4761, lon: 5.6612 },
  maastricht: { lat: 50.8513, lon: 5.7042 },
  groningen: { lat: 53.2105, lon: 6.5641 },
  'groningen-noord': { lat: 53.2301, lon: 6.5566 },
  leeuwarden: { lat: 53.1965, lon: 5.793 },
  vlissingen: { lat: 51.4441, lon: 3.5957 },
};

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
    geo: GEO[seed.id],
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
  { id: 'zaandam', name: 'Zaandam Station', city: 'Zaandam', code: 'ZDM', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Noord-Holland', x: 39, y: 19, operatorIds: ['ns', 'ebs'] },
  { id: 'zaanse-schans', name: 'Zaanse Schans', city: 'Zaandam', code: 'ZSC', type: 'busstop', modes: ['bus', 'walk', 'bike'], region: 'Noord-Holland', x: 39, y: 16, operatorIds: ['ebs'] },
  { id: 'volendam', name: 'Volendam, Centrum', city: 'Volendam', code: 'VOL', type: 'busstop', modes: ['bus', 'walk'], region: 'Noord-Holland', x: 48, y: 19, operatorIds: ['ebs'] },
  { id: 'haarlem', name: 'Haarlem Station', city: 'Haarlem', code: 'HLM', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Noord-Holland', x: 35, y: 24, operatorIds: ['ns', 'connexxion'] },
  { id: 'hilversum', name: 'Hilversum Station', city: 'Hilversum', code: 'HVS', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Noord-Holland', x: 52, y: 33, operatorIds: ['ns', 'connexxion'] },
  { id: 'almere-centrum', name: 'Almere Centrum', city: 'Almere', code: 'ALM', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Flevoland', x: 51, y: 22, operatorIds: ['ns', 'keolis'] },
  { id: 'alkmaar', name: 'Alkmaar Station', city: 'Alkmaar', code: 'ALK', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Noord-Holland', x: 40, y: 14, operatorIds: ['ns', 'connexxion'] },
  { id: 'hoofddorp', name: 'Hoofddorp Station', city: 'Hoofddorp', code: 'HDD', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Noord-Holland', x: 36, y: 27, operatorIds: ['ns'] },
  { id: 'amstelveen-busstation', name: 'Amstelveen, Busstation', city: 'Amstelveen', code: 'AVB', type: 'busstop', modes: ['bus', 'tram', 'walk'], region: 'Noord-Holland', x: 40, y: 28, operatorIds: ['gvb'] },
  { id: 'schiphol-airport', name: 'Schiphol Airport', city: 'Schiphol', code: 'SHL', type: 'airport', modes: ['train', 'bus', 'walk', 'bike'], region: 'Noord-Holland', x: 37, y: 29, operatorIds: ['ns', 'connexxion'] },

  // ---- Zuid-Holland --------------------------------------------------------
  { id: 'leiden-centraal', name: 'Leiden Centraal', city: 'Leiden', code: 'LED', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Zuid-Holland', x: 32, y: 33, operatorIds: ['ns', 'arriva'] },
  { id: 'den-haag-centraal', name: 'Den Haag Centraal', city: 'Den Haag', code: 'DHC', type: 'station', modes: ['train', 'tram', 'bus', 'walk', 'bike'], region: 'Zuid-Holland', x: 27, y: 38, operatorIds: ['ns', 'htm'] },
  { id: 'den-haag-hs', name: 'Den Haag HS', city: 'Den Haag', code: 'DHH', type: 'station', modes: ['train', 'tram', 'bus', 'walk'], region: 'Zuid-Holland', x: 27, y: 39.4, operatorIds: ['ns', 'htm'] },
  { id: 'den-haag-binnenhof', name: 'Den Haag, Binnenhof', city: 'Den Haag', code: 'DBH', type: 'landmark', modes: ['walk', 'bike'], region: 'Zuid-Holland', x: 26.4, y: 38.6, operatorIds: [] },
  { id: 'delft', name: 'Delft Station', city: 'Delft', code: 'DLF', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Zuid-Holland', x: 29, y: 42, operatorIds: ['ns'] },
  { id: 'rotterdam-centraal', name: 'Rotterdam Centraal', city: 'Rotterdam', code: 'RTC', type: 'station', modes: ['train', 'metro', 'tram', 'bus', 'walk', 'bike'], region: 'Zuid-Holland', x: 33, y: 48, operatorIds: ['ns', 'ret'] },
  { id: 'rotterdam-blaak', name: 'Rotterdam Blaak', city: 'Rotterdam', code: 'RTB', type: 'station', modes: ['train', 'metro', 'tram', 'walk'], region: 'Zuid-Holland', x: 34, y: 49, operatorIds: ['ns', 'ret'] },
  { id: 'rotterdam-alexander', name: 'Rotterdam Alexander', city: 'Rotterdam', code: 'RTA', type: 'station', modes: ['train', 'metro', 'bus', 'walk'], region: 'Zuid-Holland', x: 38, y: 47, operatorIds: ['ns', 'ret'] },
  { id: 'rotterdam-erasmusbrug', name: 'Rotterdam, Erasmusbrug waterbus', city: 'Rotterdam', code: 'REB', type: 'ferrystop', modes: ['ferry', 'walk', 'bike'], region: 'Zuid-Holland', x: 32, y: 50, operatorIds: ['aquabus'] },
  { id: 'rotterdam-markthal', name: 'Rotterdam, Markthal', city: 'Rotterdam', code: 'RMK', type: 'landmark', modes: ['walk', 'bike'], region: 'Zuid-Holland', x: 33.6, y: 49.2, operatorIds: [] },
  { id: 'schiedam-centrum', name: 'Schiedam Centrum', city: 'Schiedam', code: 'SCM', type: 'station', modes: ['train', 'metro', 'tram', 'bus', 'walk'], region: 'Zuid-Holland', x: 30, y: 48, operatorIds: ['ns', 'ret'] },
  { id: 'gouda', name: 'Gouda Station', city: 'Gouda', code: 'GDA', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Zuid-Holland', x: 40, y: 45, operatorIds: ['ns'] },
  { id: 'dordrecht', name: 'Dordrecht Station', city: 'Dordrecht', code: 'DDZ', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Zuid-Holland', x: 33, y: 56, operatorIds: ['ns', 'qbuzz'] },
  { id: 'zoetermeer', name: 'Zoetermeer Station', city: 'Zoetermeer', code: 'ZTM', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Zuid-Holland', x: 30, y: 40, operatorIds: ['ns', 'htm'] },

  // ---- Utrecht -------------------------------------------------------------
  { id: 'utrecht-centraal', name: 'Utrecht Centraal', city: 'Utrecht', code: 'UTC', type: 'station', modes: ['train', 'tram', 'bus', 'walk', 'bike'], region: 'Utrecht', x: 50, y: 40, operatorIds: ['ns', 'qbuzz'] },
  { id: 'utrecht-vaartsche-rijn', name: 'Utrecht Vaartsche Rijn', city: 'Utrecht', code: 'UTV', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Utrecht', x: 50, y: 42, operatorIds: ['ns'] },
  { id: 'utrecht-lunetten', name: 'Utrecht Lunetten', city: 'Utrecht', code: 'UTL', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Utrecht', x: 51, y: 44, operatorIds: ['ns'] },
  { id: 'utrecht-overvecht', name: 'Utrecht Overvecht', city: 'Utrecht', code: 'UTO', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Utrecht', x: 50, y: 37, operatorIds: ['ns', 'qbuzz'] },
  { id: 'utrecht-domtoren', name: 'Utrecht, Domtoren', city: 'Utrecht', code: 'UDM', type: 'landmark', modes: ['walk', 'bike'], region: 'Utrecht', x: 49.4, y: 40.8, operatorIds: [] },
  { id: 'amersfoort-centraal', name: 'Amersfoort Centraal', city: 'Amersfoort', code: 'AMF', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Utrecht', x: 58, y: 42, operatorIds: ['ns', 'keolis'] },

  // ---- Gelderland / Overijssel --------------------------------------------
  { id: 'arnhem-centraal', name: 'Arnhem Centraal', city: 'Arnhem', code: 'ARN', type: 'station', modes: ['train', 'tram', 'bus', 'walk', 'bike'], region: 'Gelderland', x: 68, y: 52, operatorIds: ['ns', 'keolis'] },
  { id: 'nijmegen', name: 'Nijmegen Station', city: 'Nijmegen', code: 'NM', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Gelderland', x: 72, y: 58, operatorIds: ['ns', 'arriva'] },
  { id: 'apeldoorn', name: 'Apeldoorn Station', city: 'Apeldoorn', code: 'APD', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Gelderland', x: 66, y: 44, operatorIds: ['ns', 'keolis'] },
  { id: 'deventer', name: 'Deventer Station', city: 'Deventer', code: 'DVN', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Overijssel', x: 68, y: 34, operatorIds: ['ns', 'keolis'] },
  { id: 'zwolle', name: 'Zwolle Station', city: 'Zwolle', code: 'ZL', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Overijssel', x: 68, y: 26, operatorIds: ['ns', 'keolis'] },
  { id: 'enschede', name: 'Enschede Station', city: 'Enschede', code: 'ES', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Overijssel', x: 80, y: 46, operatorIds: ['ns', 'keolis'] },

  // ---- Noord-Brabant / Limburg --------------------------------------------
  { id: 'den-bosch', name: "'s-Hertogenbosch", city: "'s-Hertogenbosch", code: 'HT', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Noord-Brabant', x: 52, y: 62, operatorIds: ['ns', 'arriva'] },
  { id: 'tilburg', name: 'Tilburg Station', city: 'Tilburg', code: 'TB', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Noord-Brabant', x: 45, y: 70, operatorIds: ['ns'] },
  { id: 'breda', name: 'Breda Station', city: 'Breda', code: 'BD', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Noord-Brabant', x: 40, y: 68, operatorIds: ['ns', 'arriva'] },
  { id: 'eindhoven-centraal', name: 'Eindhoven Centraal', city: 'Eindhoven', code: 'EHV', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Noord-Brabant', x: 56, y: 74, operatorIds: ['ns', 'arriva'] },
  { id: 'eindhoven-strijp-s', name: 'Eindhoven Strijp-S', city: 'Eindhoven', code: 'EHS', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Noord-Brabant', x: 55, y: 72, operatorIds: ['ns'] },
  { id: 'helmond', name: 'Helmond Station', city: 'Helmond', code: 'HM', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Noord-Brabant', x: 60, y: 78, operatorIds: ['ns'] },
  { id: 'maastricht', name: 'Maastricht Station', city: 'Maastricht', code: 'MT', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Limburg', x: 62, y: 92, operatorIds: ['ns', 'arriva'] },

  // ---- Noord / Zeeland ----------------------------------------------------
  { id: 'groningen', name: 'Groningen Station', city: 'Groningen', code: 'GN', type: 'station', modes: ['train', 'bus', 'walk', 'bike'], region: 'Groningen', x: 73, y: 9, operatorIds: ['ns', 'qbuzz'] },
  { id: 'groningen-noord', name: 'Groningen Noord', city: 'Groningen', code: 'GNN', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Groningen', x: 73, y: 7, operatorIds: ['arriva'] },
  { id: 'leeuwarden', name: 'Leeuwarden Station', city: 'Leeuwarden', code: 'LW', type: 'station', modes: ['train', 'bus', 'walk'], region: 'Friesland', x: 58, y: 10, operatorIds: ['ns', 'arriva'] },
  { id: 'vlissingen', name: 'Vlissingen Station', city: 'Vlissingen', code: 'VS', type: 'station', modes: ['train', 'ferry', 'bus', 'walk'], region: 'Zeeland', x: 10, y: 76, operatorIds: ['ns'] },
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
/**
 * The traveller's own names for stops they have favourited.
 *
 * Kept here, beside the stop list, because every label in the app goes through `stopLabel` or
 * `customStopName`: a rename that only reached one screen would be a different place on another.
 * The map is replaced wholesale by the provider when it loads or changes (see `AppState`), so
 * there is one copy and no listener to forget to call.
 *
 * Only stops can carry a name — the settings screen offers the list of favourites — but nothing
 * here assumes the stop is a station: "Work" for an office address is exactly the case this was
 * asked for.
 */
let customNames: Record<string, string> = {};

export function setCustomStopNames(next: Record<string, string>): void {
  customNames = next;
}

/** The traveller's name for this stop, or null when they have not given it one. */
export function customStopName(id: string | undefined): string | null {
  return (id && customNames[id]) || null;
}

export function stopLabel(id: string | undefined): string {
  const stop = getStop(id);
  if (!stop) return 'Unknown stop';
  const custom = customNames[stop.id];
  if (custom) return custom;
  return stop.name.includes(stop.city) ? stop.name : `${stop.city}, ${stop.name}`;
}

export function canvasDistance(a: Stop, b: Stop): number {
  return Math.hypot(a.coordinates.x - b.coordinates.x, a.coordinates.y - b.coordinates.y);
}

const EARTH_RADIUS_METRES = 6371008.8;

/** Great-circle distance in metres between two stops, from their real positions. */
export function geoDistanceMetres(a: Stop, b: Stop): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.geo.lat - a.geo.lat);
  const dLon = toRad(b.geo.lon - a.geo.lon);
  const lat1 = toRad(a.geo.lat);
  const lat2 = toRad(b.geo.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.min(1, Math.sqrt(h)));
}

const toRadians = (deg: number) => (deg * Math.PI) / 180;

/**
 * Straight-line distance in metres from a WGS84 position to a stop.
 *
 * The sorting counterpart of `nearestStop`: that one answers "which stop is closest", this one
 * answers "how far is each stop", and the stops list needs the second question answered for
 * every row. One implementation, so the two can never drift apart.
 */
export function distanceFromPosition(stop: Stop, lat: number, lon: number): number {
  const dLat = toRadians(stop.geo.lat - lat);
  const dLon = toRadians(stop.geo.lon - lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat)) * Math.cos(toRadians(stop.geo.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * A distance a person can read: metres under a kilometre, one decimal above it.
 *
 * A straight line, not a journey — the label says "away", not "travel time", because the two
 * are different and pretending otherwise is how a prototype starts lying.
 */
export function formatDistance(metres: number): string {
  if (!Number.isFinite(metres)) return '';
  if (metres < 950) return `${Math.round(metres / 10) * 10} m`;
  const km = metres / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export interface NearestStop {
  stop: Stop;
  /** Straight-line distance from the position to the stop, in metres. */
  metres: number;
}

/**
 * The stop closest to a WGS84 position — used to turn a device fix into a stop.
 *
 * Walking-only landmarks are skipped: they are places you walk *to*, not stops a
 * journey can depart from, so a position next to one resolves to the nearest
 * stop that actually has services.
 */
export function nearestStop(lat: number, lon: number): NearestStop | undefined {
  let best: NearestStop | undefined;
  for (const stop of STOPS) {
    if (!stop.modes.some((mode) => mode !== 'walk' && mode !== 'bike')) continue;
    const metres = distanceFromPosition(stop, lat, lon);
    if (!best || metres < best.metres) best = { stop, metres };
  }
  return best;
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
/**
 * Whether a departure **board** can be shown for this place at all.
 *
 * A board lists services, so a place only has one if a service calls there: the landmarks and
 * street addresses in this data (`Rijksmuseum`, `Utrecht, Domtoren`, `Rotterdam, Markthal`) carry
 * `['walk', 'bike']` and no operator, and there is nothing to list at them. One rule, in one
 * place, because two callers need the same answer — the board's own stop list here, and the
 * board's row of favourited locations, which must not offer something it has no board for.
 */
export function hasBoard(stop: Stop): boolean {
  return stop.modes.some((mode) => mode !== 'walk' && mode !== 'bike');
}

export function boardStops(): Stop[] {
  return STOPS.filter(hasBoard);
}

/**
 * The first of a list of stop ids whose place has a board.
 *
 * Three screens pick a board's stop from a list of candidates — the board itself (requested stop,
 * then the default origin, then a busy one), the home screen's next-departures widget, and an
 * alert's own "board here" link (its first affected stop). Each of them must skip a place with no
 * services, because that is what `hasBoard` says and a board cannot be drawn for an address. The
 * rule is the same one the board's own stop list uses, so no candidate order can smuggle one in.
 */
export function firstBoardStop(ids: (string | null | undefined)[]): Stop | undefined {
  for (const id of ids) {
    const stop = getStop(id ?? undefined);
    if (stop && hasBoard(stop)) return stop;
  }
  return undefined;
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
  const fromCanvas = canvasDistance(a, b) * factor;
  /*
   * A walk cannot be faster than a person.
   *
   * The canvas factor is a drawing's scale, not a pace, and it drifted: a walking-only journey
   * measured 8,000 m covered in 15 minutes — 32 km/h — while the leg and the summary agreed with
   * each other, so only the arithmetic could catch it (9.6). 100 m/min (6 km/h) is the fastest a
   * pedestrian is modelled at here, so a distance that implies more than that raises the minutes.
   * Every walk that already passed stays exactly as it was.
   */
  const plausible = (canvasDistance(a, b) * METRES_PER_UNIT) / 100;
  return Math.max(1, Math.round(Math.max(fromCanvas, plausible)));
}
