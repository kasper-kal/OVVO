import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/AppShell';
import { Button, Card } from '../components/ui/primitives';
import { useApp } from '../state/AppState';
import { STOPS } from '../data/stops';
import { OPERATORS } from '../data/operators';
import { loadDay, loadGraphIndex, planRealJourneys, placesOf, type PlanDay, type PlanJourney, type PlanPlace } from '../planner/graph';
import type { Journey, Leg, TravelMode } from '../data/types';
import type { SearchQuery } from '../data/journeyEngine';

/**
 * **Plan a journey against the real timetable.**
 *
 * Everything on this page comes from the official Dutch timetable, read in the browser. There is no
 * sample data here and no invented journey: if no chain of real connections exists, the page says so
 * instead of filling the space.
 *
 * **The search now ends where every other search ends.** It used to draw its results inline, with
 * no way into a journey, no save and no map — a second results screen behind the first. The answer
 * is handed to `/results` (`adoptPlanResult`), which draws the same cards a saved search does and
 * opens the same journey page, so there is one planner and one result screen.
 */

const clock = (minutes: number) => {
  const hours = Math.floor(minutes / 60) % 24;
  const rest = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};

const modeLabel = (mode: string) => {
  if (mode === 'walk') return 'Walk';
  if (mode === 'train') return 'Train';
  if (mode === 'metro') return 'Metro';
  if (mode === 'tram') return 'Tram';
  if (mode === 'ferry') return 'Ferry';
  return 'Bus';
};

/** The service-day key the graph files are named with, in local time. */
const pad = (value: number) => String(value).padStart(2, '0');
const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
};

/** `20261115` reads as `Sun 15 Nov`; a raw key is a database value, not a date. */
const dayLabel = (date: string) => {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6));
  const day = Number(date.slice(6, 8));
  if (!year || !month || !day) return date;
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const isoDay = (date: string) => `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * The app's own stop for a planner place, when there is one.
 *
 * The GTFS graph knows 21,276 places; the app's stop file knows 61. A place with the same name is
 * the same place, so the journey can link to its page. Anything else is a timetable stop outside
 * this build's small network: its name is kept, and only the link is lost.
 */
function appStopFor(name: string) {
  const direct = STOPS.find((stop) => stop.name === name);
  if (direct) return direct;
  /* The feed writes places its own way: "Groningen" for "Groningen Station", and
     "Amsterdam, Station Bijlmer ArenA" for "Amsterdam Bijlmer ArenA". Comparing the words that
     are left after dropping the word "station" and all punctuation matches both without a table
     of aliases. */
  const key = (text: string) => text.toLowerCase().replace(/\bstation\b/g, '').replace(/[^a-z0-9]/g, '');
  return STOPS.find((stop) => key(stop.name) === key(name));
}

function operatorIdFor(name: string) {
  return OPERATORS.find((operator) => operator.name === name || operator.shortName === name)?.id;
}

/** One real journey, in the shape every journey card and journey page already understands. */
function toJourney(plan: PlanJourney, index: number, date: string): Journey {
  const first = plan.legs[0];
  const last = plan.legs[plan.legs.length - 1];
  const fromStop = appStopFor(first.fromName);
  const toStop = appStopFor(last.toName);
  const id = `tt-${date}-${slug(fromStop?.id ?? first.fromName)}-${slug(toStop?.id ?? last.toName)}-${plan.departure}-${index}`;

  const legs: Leg[] = plan.legs.map((leg, legIndex) => {
    const from = appStopFor(leg.fromName);
    const to = appStopFor(leg.toName);
    return {
      id: `${id}-${legIndex}`,
      mode: leg.mode as TravelMode,
      fromStopId: from?.id ?? `tt-${slug(leg.fromName)}`,
      toStopId: to?.id ?? `tt-${slug(leg.toName)}`,
      /* A label is how a leg names a place that has no page of its own. When the stop is in the
         app, leaving this unset gives the leg a link instead of a word. */
      fromLabel: from ? undefined : leg.fromName,
      toLabel: to ? undefined : leg.toName,
      departure: leg.departure,
      arrival: leg.arrival,
      platform: leg.fromPlatform || undefined,
      arrivalPlatform: leg.toPlatform || undefined,
      lineName: leg.mode === 'walk' ? undefined : leg.line || modeLabel(leg.mode),
      lineNumber: leg.mode === 'walk' ? undefined : leg.line || undefined,
      /* The feed's headsign can be empty; "Direction" with nothing after it is worse than naming
         the stop this leg actually reaches. */
      headsign: leg.mode === 'walk' ? undefined : leg.headsign || leg.toName,
      operatorId: leg.mode === 'walk' ? undefined : operatorIdFor(leg.operator),
    };
  });

  const rides = plan.legs.filter((leg) => leg.mode !== 'walk');

  return {
    id,
    signature: id,
    legs,
    departure: plan.departure,
    arrival: plan.arrival,
    durationMinutes: plan.durationMinutes,
    transfers: plan.transfers,
    walkMinutes: plan.legs
      .filter((leg) => leg.mode === 'walk')
      .reduce((total, leg) => total + Math.max(0, leg.arrival - leg.departure), 0),
    modes: [...new Set(rides.map((leg) => leg.mode as TravelMode))],
    operatorIds: [...new Set(rides.map((leg) => operatorIdFor(leg.operator)).filter((id): id is string => Boolean(id)))],
    /* The timetable has no fare and no crowding: both are left empty rather than invented. */
    fare: { eur: 0, label: '' },
    realtime: false,
    delayMinutes: 0,
    cancelled: false,
    disruptionIds: [],
    source: 'timetable',
  };
}

function StationPicker({
  label,
  value,
  places,
  onPick,
}: {
  label: string;
  value: PlanPlace | null;
  places: PlanPlace[];
  onPick: (place: PlanPlace | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    return places
      .filter((place) => place.name.toLowerCase().includes(needle))
      .sort((a, b) => {
        const startsA = a.name.toLowerCase().startsWith(needle) ? 0 : 1;
        const startsB = b.name.toLowerCase().startsWith(needle) ? 0 : 1;
        if (startsA !== startsB) return startsA - startsB;
        return b.platforms - a.platforms || a.name.length - b.name.length;
      })
      .slice(0, 8);
  }, [places, query]);

  return (
    <div className="field" style={{ position: 'relative' }}>
      <label className="field__label" htmlFor={`station-${label}`}>
        {label}
      </label>
      <input
        id={`station-${label}`}
        className="input"
        value={value ? value.name : query}
        placeholder="Type a station name"
        autoComplete="off"
        onChange={(event) => {
          onPick(null);
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && matches.length > 0 ? (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 20,
            insetInline: 0,
            top: '100%',
            margin: '4px 0 0',
            padding: 0,
            listStyle: 'none',
            background: 'var(--surface, #fff)',
            border: '1px solid var(--border, #ddd)',
            borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          {matches.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  width: '100%',
                  padding: '10px 12px',
                  background: 'none',
                  border: 0,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  onPick(place);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <span>{place.name}</span>
                <span style={{ opacity: 0.6 }}>{place.platforms} platforms</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function PlanPage() {
  const navigate = useNavigate();
  const { preferences, startSearch, adoptPlanResult } = useApp();
  const [days, setDays] = useState<PlanDay[]>([]);
  const [day, setDay] = useState<string>('');
  const [places, setPlaces] = useState<PlanPlace[]>([]);
  const [origin, setOrigin] = useState<PlanPlace | null>(null);
  const [destination, setDestination] = useState<PlanPlace | null>(null);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'searching' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const available = await loadGraphIndex();
        if (cancelled) return;
        if (available.length === 0) {
          setStatus('error');
          setMessage('The timetable has not been built on this machine yet.');
          return;
        }
        setDays(available);
        /*
         * **Today, not the oldest file on disk.**
         *
         * The day picker used to open on `available[0]` — the first day in the rolling week — which
         * is yesterday or earlier. The traveller could press Search without touching it and ask
         * for a timetable that had already gone, and nothing said so. Today is the honest default;
         * if today is not built, the next built day is; only then the last one.
         */
        const today = todayKey();
        const first =
          available.find((entry) => entry.date === today)?.date ??
          available.find((entry) => entry.date > today)?.date ??
          available[available.length - 1].date;
        setDay(first);
        const graph = await loadDay(first);
        if (cancelled) return;
        setPlaces(placesOf(graph));
        setStatus('idle');
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'The timetable could not be loaded.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const search = async () => {
    if (!origin || !destination) {
      setMessage('Choose a station to leave from and one to travel to.');
      setStatus('error');
      return;
    }
    if (origin.id === destination.id) {
      setMessage('Those are the same station.');
      setStatus('error');
      return;
    }
    const [hours, minutes] = time.split(':').map(Number);
    setStatus('searching');
    setMessage('');
    try {
      const found = await planRealJourneys(day, origin.id, destination.id, (hours || 0) * 60 + (minutes || 0));
      if (found.length === 0) {
        setStatus('ready');
        setMessage('No journey found at that time.');
        return;
      }

      const fromStop = appStopFor(origin.name);
      const toStop = appStopFor(destination.name);
      const query: SearchQuery = {
        fromStopId: fromStop?.id ?? `tt-${slug(origin.name)}`,
        toStopId: toStop?.id ?? `tt-${slug(destination.name)}`,
        fromLabel: fromStop ? undefined : origin.name,
        toLabel: toStop ? undefined : destination.name,
        date: isoDay(day),
        time: (hours || 0) * 60 + (minutes || 0),
        timeMode: 'depart',
        preferences,
      };
      const journeys = found.map((journey, index) => toJourney(journey, index, isoDay(day)));

      /* One search, one results screen: the real answer is kept for this tab and drawn there. */
      startSearch(query);
      adoptPlanResult(query, journeys);
      setStatus('ready');
      navigate('/results');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'The search failed.');
    }
  };

  return (
    <>
      <PageHeader
        title="Plan a journey"
        description="Real scheduled times, from the official Dutch timetable, searched in your browser."
      />

      <Card>
        <div style={{ display: 'grid', gap: 12 }}>
          <StationPicker label="From" value={origin} places={places} onPick={setOrigin} />
          <StationPicker label="To" value={destination} places={places} onPick={setDestination} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="field__label" htmlFor="plan-day">
                Day
              </label>
              <select
                id="plan-day"
                className="input"
                value={day}
                onChange={async (event) => {
                  const next = event.target.value;
                  if (next < todayKey()) return;
                  setDay(next);
                  setStatus('loading');
                  const graph = await loadDay(next);
                  setPlaces(placesOf(graph));
                  setStatus('idle');
                }}
              >
                {days.map((available) => (
                  <option key={available.date} value={available.date} disabled={available.date < todayKey()}>
                    {dayLabel(available.date)}
                    {available.date === todayKey() ? ' · today' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="plan-time">
                Leave after
              </label>
              <input id="plan-time" className="input" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button onClick={search} disabled={status === 'searching' || status === 'loading'}>
              {status === 'searching' ? 'Searching…' : 'Search'}
            </Button>
            <span style={{ opacity: 0.7 }}>
              {status === 'loading'
                ? 'Loading the timetable…'
                : days.length > 0
                  ? `Timetable for ${dayLabel(day)} · ${places.length.toLocaleString('en')} stations`
                  : ''}
            </span>
          </div>
        </div>
      </Card>

      {message ? (
        <Card>
          <p style={{ margin: 0 }}>{message}</p>
        </Card>
      ) : null}

      {status === 'searching' ? (
        <Card>
          <p style={{ margin: 0, opacity: 0.85 }}>
            Searching the official timetable for {origin?.name} → {destination?.name} around {clock((Number(time.split(':')[0]) || 0) * 60 + (Number(time.split(':')[1]) || 0))}.
          </p>
        </Card>
      ) : null}
    </>
  );
}
