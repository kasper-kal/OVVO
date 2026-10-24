import type { Language } from '../state/types';

/**
 * The Wikipedia article for a stop, in each language the app is written in.
 *
 * A station's page is the one place in the app that is *about a place*, so it is the one place a
 * summary of that place belongs. The summary itself is asked for at runtime (`lib/wikipedia`),
 * because an encyclopaedia is not timetable data: it changes, and copying a paragraph of it into
 * this file would be a copy that slowly stops being true.
 *
 * What is kept here is the one thing a request cannot guess: **which article**. Dutch and English
 * Wikipedia title the same station differently ("Station Utrecht Centraal" / "Utrecht Centraal
 * station"), and several stops are not stations at all — a tram stop is a square, a ferry stop is
 * a bridge's pier. Deriving a title from `stop.name` would be wrong for all of those, and wrong
 * quietly: the request would 404 and the page would simply lose its card.
 *
 * Every title below was checked against both Wikipedias while this was built (114 title/language
 * pairs, all answering), and a stop that is **not** in the table — the ferry piers, the bus
 * stations, the walking landmarks with no article of their own — has no card on its page. That is
 * the rule: no article, no widget, rather than an empty one.
 */
const ARTICLES: Record<string, Record<Language, string>> = {
  /* Amsterdam */
  'amsterdam-centraal': { nl: 'Station Amsterdam Centraal', en: 'Amsterdam Centraal station' },
  'amsterdam-sloterdijk': { nl: 'Station Amsterdam Sloterdijk', en: 'Amsterdam Sloterdijk station' },
  'amsterdam-zuid': { nl: 'Station Amsterdam Zuid', en: 'Amsterdam Zuid station' },
  'amsterdam-bijlmer-arena': { nl: 'Station Amsterdam Bijlmer ArenA', en: 'Amsterdam Bijlmer ArenA station' },
  'amsterdam-muiderpoort': { nl: 'Station Amsterdam Muiderpoort', en: 'Amsterdam Muiderpoort railway station' },
  'amsterdam-amstel': { nl: 'Station Amsterdam Amstel', en: 'Amsterdam Amstel station' },
  'amsterdam-noord': { nl: 'Noord (metrostation)', en: 'Noord metro station' },
  'amsterdam-leidseplein': { nl: 'Leidseplein', en: 'Leidseplein' },
  'amsterdam-museumplein': { nl: 'Museumplein', en: 'Museumplein' },
  'amsterdam-dam': { nl: 'Dam (Amsterdam)', en: 'Dam Square' },
  'amsterdam-raijhuis': { nl: 'Rijksmuseum', en: 'Rijksmuseum' },
  'amsterdam-vondelpark': { nl: 'Vondelpark', en: 'Vondelpark' },
  'amsterdam-annefrank': { nl: 'Anne Frank Huis', en: 'Anne Frank House' },

  /* Noord-Holland */
  zaandam: { nl: 'Station Zaandam', en: 'Zaandam railway station' },
  'zaanse-schans': { nl: 'Zaanse Schans', en: 'Zaanse Schans' },
  volendam: { nl: 'Volendam', en: 'Volendam' },
  haarlem: { nl: 'Station Haarlem', en: 'Haarlem railway station' },
  hilversum: { nl: 'Station Hilversum', en: 'Hilversum railway station' },
  'almere-centrum': { nl: 'Station Almere Centrum', en: 'Almere Centrum railway station' },
  alkmaar: { nl: 'Station Alkmaar', en: 'Alkmaar railway station' },
  hoofddorp: { nl: 'Station Hoofddorp', en: 'Hoofddorp railway station' },
  'schiphol-airport': { nl: 'Station Schiphol Airport', en: 'Schiphol Airport station' },

  /* Zuid-Holland */
  'leiden-centraal': { nl: 'Station Leiden Centraal', en: 'Leiden Centraal railway station' },
  'den-haag-centraal': { nl: 'Station Den Haag Centraal', en: 'Den Haag Centraal station' },
  'den-haag-hs': { nl: 'Station Den Haag Hollands Spoor', en: 'Den Haag Hollands Spoor station' },
  'den-haag-binnenhof': { nl: 'Binnenhof', en: 'Binnenhof' },
  delft: { nl: 'Station Delft', en: 'Delft railway station' },
  'rotterdam-centraal': { nl: 'Station Rotterdam Centraal', en: 'Rotterdam Centraal station' },
  'rotterdam-blaak': { nl: 'Station Rotterdam Blaak', en: 'Rotterdam Blaak station' },
  'rotterdam-alexander': { nl: 'Station Rotterdam Alexander', en: 'Rotterdam Alexander station' },
  'rotterdam-markthal': { nl: 'Markthal', en: 'Markthal' },
  'schiedam-centrum': { nl: 'Station Schiedam Centrum', en: 'Schiedam Centrum station' },
  gouda: { nl: 'Station Gouda', en: 'Gouda railway station' },
  dordrecht: { nl: 'Station Dordrecht', en: 'Dordrecht railway station' },
  zoetermeer: { nl: 'Station Zoetermeer', en: 'Zoetermeer railway station' },

  /* Utrecht */
  'utrecht-centraal': { nl: 'Station Utrecht Centraal', en: 'Utrecht Centraal station' },
  'utrecht-vaartsche-rijn': { nl: 'Station Utrecht Vaartsche Rijn', en: 'Utrecht Vaartsche Rijn railway station' },
  'utrecht-lunetten': { nl: 'Station Utrecht Lunetten', en: 'Utrecht Lunetten railway station' },
  'utrecht-overvecht': { nl: 'Station Utrecht Overvecht', en: 'Utrecht Overvecht railway station' },
  'utrecht-domtoren': { nl: 'Dom van Utrecht', en: 'Dom Tower of Utrecht' },
  'amersfoort-centraal': { nl: 'Station Amersfoort Centraal', en: 'Amersfoort Centraal railway station' },

  /* Gelderland, Overijssel, Brabant, Limburg */
  'arnhem-centraal': { nl: 'Station Arnhem Centraal', en: 'Arnhem Centraal station' },
  nijmegen: { nl: 'Station Nijmegen', en: 'Nijmegen railway station' },
  apeldoorn: { nl: 'Station Apeldoorn', en: 'Apeldoorn railway station' },
  deventer: { nl: 'Station Deventer', en: 'Deventer railway station' },
  zwolle: { nl: 'Station Zwolle', en: 'Zwolle station' },
  enschede: { nl: 'Station Enschede', en: 'Enschede station' },
  tilburg: { nl: 'Station Tilburg', en: 'Tilburg railway station' },
  breda: { nl: 'Station Breda', en: 'Breda railway station' },
  'eindhoven-centraal': { nl: 'Station Eindhoven Centraal', en: 'Eindhoven Centraal railway station' },
  'eindhoven-strijp-s': { nl: 'Station Eindhoven Strijp-S', en: 'Eindhoven Strijp-S railway station' },
  helmond: { nl: 'Station Helmond', en: 'Helmond railway station' },
  maastricht: { nl: 'Station Maastricht', en: 'Maastricht railway station' },

  /* Noord, Zeeland */
  groningen: { nl: 'Station Groningen', en: 'Groningen railway station' },
  'groningen-noord': { nl: 'Station Groningen Noord', en: 'Groningen Noord railway station' },
  leeuwarden: { nl: 'Station Leeuwarden', en: 'Leeuwarden railway station' },
  vlissingen: { nl: 'Station Vlissingen', en: 'Vlissingen railway station' },
};

/** The article's title on that language's Wikipedia, or null when this stop has none. */
export function wikipediaArticle(stopId: string, language: Language): string | null {
  return ARTICLES[stopId]?.[language] ?? null;
}

/** The address of the article, for the "read the whole thing" link. */
export function wikipediaUrl(title: string, language: Language): string {
  return `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}
