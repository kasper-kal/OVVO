import type { Disruption } from './types';

/**
 * DEMONSTRATION DATA — every alert below is a SIMULATED EXAMPLE.
 * None of these describe a real, current situation on the Dutch network.
 */
export const DISRUPTIONS: Disruption[] = [
  {
    id: 'd-signal-utrecht',
    type: 'delay',
    severity: 'warning',
    title: 'Signalling fault: delays around Utrecht Centraal',
    description:
      'A signalling fault is causing delays of 5 to 10 minutes on services running through Utrecht Centraal. Intercity services may be held at the platform for a few minutes.',
    advice: 'Allow 15 minutes extra travel time, or use the Sprinter 5000 between Den Haag and Zwolle.',
    affectedStopIds: ['utrecht-centraal', 'utrecht-vaartsche-rijn', 'amsterdam-centraal', 'den-bosch'],
    affectedLineIds: ['ic-800', 'ic-700', 'ic-300', 'sp-7000'],
    operatorIds: ['ns'],
    modes: ['train'],
    startsAt: 420,
    endsAt: 1320,
    source: 'demo',
  },
  {
    id: 'd-platform-amsterdam',
    type: 'platformChange',
    severity: 'info',
    title: 'Platform changes at Amsterdam Centraal',
    description:
      'Trains towards Alkmaar and Zaandam depart from a different platform than planned. Please check the departure boards.',
    advice: 'Check the departure board at the station; the app shows the platform in the journey details.',
    affectedStopIds: ['amsterdam-centraal'],
    affectedLineIds: ['ic-800', 'ic-300', 'sp-4000', 'b22'],
    operatorIds: ['ns', 'ebs'],
    modes: ['train', 'bus'],
    startsAt: 360,
    endsAt: 1200,
    source: 'demo',
  },
  {
    id: 'd-works-rotterdam',
    type: 'works',
    severity: 'warning',
    title: 'Engineering works: Rotterdam Blaak closed to trams',
    description:
      'Planned track works mean tram 24 and tram 8 do not call at Rotterdam Blaak. Metro A and metro E continue to run.',
    advice: 'Travel via metro A/E or walk from Rotterdam Centraal (about 15 minutes).',
    affectedStopIds: ['rotterdam-blaak', 'rotterdam-centraal'],
    affectedLineIds: ['ret-t24', 'ret-t8'],
    operatorIds: ['ret'],
    modes: ['tram'],
    startsAt: 540,
    endsAt: 1380,
    source: 'demo',
  },
  {
    id: 'd-cancel-schiphol',
    type: 'cancellation',
    severity: 'severe',
    title: 'Cancelled services: Schiphol Airport to Haarlem',
    description:
      'Two Sprinter services between Schiphol Airport and Haarlem are cancelled because of a shortage of rolling stock.',
    advice: 'Take bus 347 from Schiphol Airport to Haarlem, or the Intercity to Amsterdam Sloterdijk and travel back.',
    affectedStopIds: ['schiphol-airport', 'haarlem', 'hoofddorp'],
    /* Bus 347 is this alert's *advice*, not its victim: the Sprinter is cancelled and the bus is
       the way round it. Listing the bus here marked the replacement as cancelled too, which put a
       "Cancelled services" pill on a Haarlem → Hoofddorp bus journey whose own advice was to take
       that bus. */
    affectedLineIds: ['sp-4000'],
    operatorIds: ['ns', 'connexxion'],
    modes: ['train', 'bus'],
    startsAt: 480,
    endsAt: 720,
    source: 'demo',
  },
  {
    id: 'd-ferry-buiksloterweg',
    type: 'delay',
    severity: 'info',
    title: 'Ferry F3: longer waiting times',
    description:
      'The Buiksloterweg ferry runs every 20 minutes instead of every 10 minutes because one vessel is under maintenance.',
    advice: 'Use metro 52 to Amsterdam Noord as an alternative.',
    affectedStopIds: ['amsterdam-buiksloterweg', 'amsterdam-centraal'],
    affectedLineIds: ['f3', 'm52'],
    operatorIds: ['gvb'],
    modes: ['ferry'],
    startsAt: 300,
    endsAt: 900,
    source: 'demo',
  },
  {
    id: 'd-crowding-utrecht',
    type: 'crowding',
    severity: 'info',
    title: 'Busy trains towards Amsterdam',
    description:
      'Crowding is expected on afternoon Intercity services between Utrecht Centraal and Amsterdam Centraal.',
    advice: 'Travel outside the 16:00–18:00 peak, or take the Sprinter 6000 via Hilversum.',
    affectedStopIds: ['utrecht-centraal', 'amsterdam-centraal', 'hilversum'],
    affectedLineIds: ['ic-800', 'sp-6000'],
    operatorIds: ['ns'],
    modes: ['train'],
    startsAt: 960,
    endsAt: 1140,
    source: 'demo',
  },
  {
    id: 'd-weather-groningen',
    type: 'weather',
    severity: 'warning',
    title: 'Strong wind: reduced speed in the north',
    description:
      'Strong winds are reducing the speed of trains between Groningen, Leeuwarden and Zwolle.',
    advice: 'Expect 10 minutes extra travel time on trains in the north.',
    affectedStopIds: ['groningen', 'groningen-noord', 'leeuwarden', 'zwolle'],
    affectedLineIds: ['ic-700', 'st-rs30', 'st-rs5', 'b350'],
    operatorIds: ['ns', 'arriva'],
    modes: ['train', 'bus'],
    startsAt: 360,
    endsAt: 1080,
    source: 'demo',
  },
  {
    id: 'd-metro-noord-zuid',
    type: 'delay',
    severity: 'warning',
    title: 'Metro 52: longer journey times',
    description:
      'A track inspection between Amsterdam Noord and Amsterdam Centraal adds 4 minutes to metro 52 journeys.',
    advice: 'Allow extra time or use ferry F3 to Amsterdam Noord.',
    affectedStopIds: ['amsterdam-noord', 'amsterdam-centraal', 'amsterdam-zuid'],
    affectedLineIds: ['m52'],
    operatorIds: ['gvb'],
    modes: ['metro'],
    startsAt: 600,
    endsAt: 900,
    source: 'demo',
  },
  {
    id: 'd-works-denhaag',
    type: 'works',
    severity: 'warning',
    title: 'Planned works: fewer trains to Den Haag HS',
    description:
      'Scheduled maintenance means tram 1 runs a shortened route between Den Haag Centraal and Den Haag HS.',
    advice: 'Walk from Den Haag Centraal (12 minutes) or use metro E.',
    affectedStopIds: ['den-haag-centraal', 'den-haag-hs', 'delft'],
    affectedLineIds: ['htm-t1', 're-metro-e'],
    operatorIds: ['htm', 'ret'],
    modes: ['tram', 'metro'],
    startsAt: 420,
    endsAt: 1320,
    source: 'demo',
  },
  {
    id: 'd-cancel-maastricht',
    type: 'cancellation',
    severity: 'severe',
    title: 'Cancelled night bus N851 to Utrecht',
    description:
      'The 02:00 night bus from Rotterdam Centraal to Utrecht Centraal does not run tonight.',
    advice: 'Use the first morning Intercity from Rotterdam Centraal, or plan a different night connection.',
    affectedStopIds: ['rotterdam-centraal', 'utrecht-centraal'],
    affectedLineIds: ['n851'],
    operatorIds: ['ns'],
    modes: ['bus'],
    startsAt: 0,
    endsAt: 330,
    source: 'demo',
  },
  {
    id: 'd-platform-eindhoven',
    type: 'platformChange',
    severity: 'info',
    title: 'Platform change at Eindhoven Centraal',
    description:
      'Intercity 1100 towards Den Haag departs from a different platform at Eindhoven Centraal.',
    advice: 'Check the departure board; the app shows the simulated platform in the journey details.',
    affectedStopIds: ['eindhoven-centraal'],
    affectedLineIds: ['ic-1100', 'st-rs20'],
    operatorIds: ['ns'],
    modes: ['train'],
    startsAt: 300,
    endsAt: 1440,
    source: 'demo',
  },
  {
    id: 'd-waterbus-dordrecht',
    type: 'delay',
    severity: 'info',
    title: 'Waterbus 20: timetable adjusted',
    description:
      'The waterbus between Rotterdam Erasmus bridge and Dordrecht runs to a reduced timetable.',
    advice: 'Use the train from Rotterdam Blaak to Dordrecht instead.',
    affectedStopIds: ['rotterdam-erasmusbrug', 'dordrecht'],
    affectedLineIds: ['w20'],
    operatorIds: ['aquabus'],
    modes: ['ferry'],
    startsAt: 420,
    endsAt: 1200,
    source: 'demo',
  },
  {
    id: 'd-crowding-brabantliner',
    type: 'crowding',
    severity: 'info',
    title: 'Brabantliner 300 very busy in the morning',
    description:
      'High demand is expected on Brabantliner 300 between Breda and Eindhoven during the morning peak.',
    advice: 'Travel before 07:30 or take the Intercity 1100.',
    affectedStopIds: ['breda', 'tilburg', 'den-bosch', 'eindhoven-centraal'],
    affectedLineIds: ['b300'],
    operatorIds: ['arriva'],
    modes: ['bus'],
    startsAt: 390,
    endsAt: 570,
    source: 'demo',
  },
  {
    id: 'd-lift-almere',
    type: 'works',
    severity: 'info',
    title: 'Lift out of service at Almere Centrum',
    description:
      'The lift to platform 3 and 4 at Almere Centrum is out of service. Staff assistance is available.',
    advice: 'Ask station staff for assistance, or use platform 1 with the Sprinter.',
    affectedStopIds: ['almere-centrum'],
    affectedLineIds: ['ic-500'],
    operatorIds: ['ns'],
    modes: ['train'],
    startsAt: 360,
    endsAt: 1260,
    source: 'demo',
  },
];

const disruptionMap = new Map(DISRUPTIONS.map((d) => [d.id, d]));

export function getDisruption(id: string | undefined): Disruption | undefined {
  return id ? disruptionMap.get(id) : undefined;
}

export function disruptionsForStop(stopId: string): Disruption[] {
  return DISRUPTIONS.filter((d) => d.affectedStopIds.includes(stopId));
}

export function disruptionsForLine(lineId: string): Disruption[] {
  return DISRUPTIONS.filter((d) => d.affectedLineIds.includes(lineId));
}

/** The alert that applies to a concrete leg, if any. */
export function disruptionForLeg(lineId: string | undefined, fromStopId: string, toStopId: string): Disruption | undefined {
  if (!lineId) return undefined;
  return DISRUPTIONS.find(
    (d) =>
      d.affectedLineIds.includes(lineId) &&
      d.affectedStopIds.some((s) => s === fromStopId || s === toStopId),
  );
}

export const DISRUPTION_TYPE_LABELS: Record<Disruption['type'], string> = {
  delay: 'Delay',
  cancellation: 'Cancelled',
  works: 'Planned works',
  platformChange: 'Platform change',
  crowding: 'Busy',
  weather: 'Weather',
};
