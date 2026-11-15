import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/AppShell';
import { Button, Card } from '../components/ui/primitives';
import { nowMinutes, timeInputValue } from '../lib/format';
import { loadDay, loadGraphIndex, planRealJourneys, placesOf, type PlanDay, type PlanJourney, type PlanLeg, type PlanPlace } from '../planner/graph';
import { fetchLiveDelays, type LiveReport } from '../planner/live';

/**
 * **Plan a journey against the real timetable.**
 *
 * Everything on this page comes from the official Dutch timetable, read in the browser. There is no
 * sample data here and no invented journey: if no chain of real connections exists, the page says so
 * instead of filling the space.
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
  const [days, setDays] = useState<PlanDay[]>([]);
  const [day, setDay] = useState<string>('');
  const [places, setPlaces] = useState<PlanPlace[]>([]);
  const [origin, setOrigin] = useState<PlanPlace | null>(null);
  const [destination, setDestination] = useState<PlanPlace | null>(null);
  const [time, setTime] = useState(() => timeInputValue(nowMinutes()));
  const [status, setStatus] = useState<'idle' | 'loading' | 'searching' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [journeys, setJourneys] = useState<PlanJourney[]>([]);
  const [live, setLive] = useState<{
    delays: Record<string, number>;
    report: LiveReport | null;
    state: 'idle' | 'loading' | 'ready' | 'error';
  }>({ delays: {}, report: null, state: 'idle' });

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
        const first = available[0].date;
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
      setJourneys(found);

      /* Ask for live running times for exactly these vehicles, after the timetable has its answer. */
      const tripIds = found.flatMap((journey) => journey.legs.map((leg) => leg.tripId)).filter((id): id is string => Boolean(id));
      if (tripIds.length > 0) {
        setLive({ delays: {}, report: null, state: 'loading' });
        fetchLiveDelays(tripIds)
          .then(({ report, delays }) => setLive({ delays, report, state: 'ready' }))
          .catch(() => setLive({ delays: {}, report: null, state: 'error' }));
      }
      setStatus('ready');
      if (found.length === 0) setMessage('No journey found at that time.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'The search failed.');
    }
  };

  /* Live delays are shown next to the planned time, never instead of it. */
  const delayLabel = (leg: PlanLeg): string | null => {
    const delay = leg.tripId ? live.delays[leg.tripId] : undefined;
    if (delay === undefined) return null;
    if (Math.abs(delay) < 60) return 'on time';
    return `${delay > 0 ? '+' : ''}${Math.round(delay / 60)} min`;
  };

  const arrivalShift = (journey: PlanJourney): number => {
    const lastRide = [...journey.legs].reverse().find((leg) => leg.mode !== 'walk');
    const delay = lastRide?.tripId ? live.delays[lastRide.tripId] : undefined;
    return delay === undefined ? 0 : Math.round(delay / 60);
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
                  setDay(next);
                  setStatus('loading');
                  const graph = await loadDay(next);
                  setPlaces(placesOf(graph));
                  setStatus('idle');
                }}
              >
                {days.map((available) => (
                  <option key={available.date} value={available.date}>
                    {available.date}
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
              {status === 'loading' ? 'Loading the timetable…' : days.length > 0 ? `Timetable for ${day} · ${places.length.toLocaleString('en')} stations` : ''}
            </span>
          </div>
        </div>
      </Card>

      {live.state === 'ready' && live.report ? (
        <Card>
          <p style={{ margin: 0, opacity: 0.85 }}>
            Live running times · feed updated{' '}
            {live.report.generatedAt
              ? new Date(live.report.generatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              : 'just now'}{' '}
            {live.report.matched > 0
              ? ` · ${live.report.matched} of ${live.report.requested} services reporting`
              : ' · none of these services has started yet'}
            {live.report.late > 0 ? ` · ${live.report.late} services nationally running late` : ''}
          </p>
        </Card>
      ) : null}
      {live.state === 'error' ? (
        <Card>
          <p style={{ margin: 0, opacity: 0.85 }}>Live running times are unavailable right now, so these are the scheduled times.</p>
        </Card>
      ) : null}

      {message ? (
        <Card>
          <p style={{ margin: 0 }}>{message}</p>
        </Card>
      ) : null}

      {journeys.map((journey, index) => (
        <Card key={`${journey.departure}-${index}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '1.1rem' }}>
              {clock(journey.departure)} → {clock(journey.arrival + arrivalShift(journey))}
              {arrivalShift(journey) !== 0 ? (
                <span style={{ marginLeft: 8, fontSize: '0.85rem', color: '#b3261e' }}>
                  {arrivalShift(journey) > 0 ? '+' : ''}
                  {arrivalShift(journey)} min
                </span>
              ) : null}
            </strong>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid var(--border, #ddd)', fontSize: '0.9em' }}>
                {journey.durationMinutes} min
              </span>
              <span style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid var(--border, #ddd)', fontSize: '0.9em' }}>
                {journey.transfers === 0 ? 'Direct' : `${journey.transfers} transfer${journey.transfers > 1 ? 's' : ''}`}
              </span>
            </span>
          </div>
          <ol style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
            {journey.legs.map((leg, legIndex) => (
              <li key={`${leg.departure}-${legIndex}`} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 12 }}>
                <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.8 }}>{clock(leg.departure)}</span>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong>{leg.line || modeLabel(leg.mode)}</strong>
                    <span style={{ opacity: 0.7 }}>{modeLabel(leg.mode)}</span>
                    {leg.mode !== 'walk' && leg.headsign ? <span style={{ opacity: 0.7 }}>towards {leg.headsign}</span> : null}
                  </div>
                  <div style={{ opacity: 0.85 }}>
                    {leg.fromName}
                    {leg.fromPlatform ? ` · platform ${leg.fromPlatform}` : ''} → {leg.toName}
                    {leg.toPlatform ? ` · platform ${leg.toPlatform}` : ''}
                  </div>
                  <div style={{ opacity: 0.6, fontSize: '0.9em' }}>
                    {leg.operator ? `${leg.operator} · ` : ''}
                    {clock(leg.arrival)}
                    {leg.mode === 'walk' ? ' · on foot' : ''}
                    {delayLabel(leg) ? (
                      <span style={{ marginLeft: 6, color: delayLabel(leg)?.startsWith('+') ? '#b3261e' : undefined }}>
                        {' · '}
                        {delayLabel(leg)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      ))}
    </>
  );
}
