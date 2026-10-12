import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../state/AppState';
import { getStop, stopLabel } from '../../data/stops';
import { StopCombobox } from './StopCombobox';
import { PreferencesControls } from './PreferencesControls';
import { Button, Chip, Dialog, Disclosure, Field, IconButton, Panel, Segmented } from '../ui/primitives';
import { Icon } from '../ui/Icons';
import { addDaysIso, nowMinutes, roundToStep, todayIso } from '../../lib/format';
import type { Stop } from '../../data/types';
import type { SearchQuery } from '../../data/journeyEngine';

/** A small set of invented "current locations" — this prototype never asks for real device location. */
const SIMULATED_LOCATIONS: { label: string; stopId: string; description: string }[] = [
  { label: 'Near Amsterdam Centraal', stopId: 'amsterdam-centraal', description: 'Simulated GPS fix · city centre' },
  { label: 'Near Utrecht Centraal', stopId: 'utrecht-centraal', description: 'Simulated GPS fix · station area' },
  { label: 'Near Rotterdam Blaak', stopId: 'rotterdam-blaak', description: 'Simulated GPS fix · city centre' },
  { label: 'Near Eindhoven Centraal', stopId: 'eindhoven-centraal', description: 'Simulated GPS fix · station area' },
];

interface Errors {
  from?: string;
  to?: string;
  date?: string;
  general?: string;
}

export function SearchForm({
  variant = 'hero',
  onSearch,
}: {
  variant?: 'hero' | 'inline';
  onSearch?: () => void;
}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { search, startSearch, preferences, updatePreferences, favouriteStopIds, pushToast, settings } = useApp();

  const defaults = useMemo(() => {
    const base = search?.query;
    const paramFrom = params.get('from');
    const paramTo = params.get('to');
    const fallbackOrigin = settings.defaultOriginStopId ? getStop(settings.defaultOriginStopId) : undefined;
    return {
      from: getStop(paramFrom ?? base?.fromStopId) ?? fallbackOrigin ?? null,
      to: getStop(paramTo ?? base?.toStopId) ?? null,
      date: base?.date ?? todayIso(),
      time: base ? base.time : roundToStep(nowMinutes() + 10, 5),
      timeMode: base?.timeMode ?? settings.defaultTimeMode,
    };
  }, [params, search, settings.defaultOriginStopId, settings.defaultTimeMode]);

  const [from, setFrom] = useState<Stop | null>(defaults.from);
  const [to, setTo] = useState<Stop | null>(defaults.to);
  const [date, setDate] = useState(defaults.date);
  const [timeMinutes, setTimeMinutes] = useState(defaults.time);
  const [timeMode, setTimeMode] = useState<'depart' | 'arrive'>(defaults.timeMode);
  const [errors, setErrors] = useState<Errors>({});
  const [locationOpen, setLocationOpen] = useState(false);
  const [simulatedFix, setSimulatedFix] = useState<string | null>(null);

  const timeValue = `${String(Math.floor(timeMinutes / 60)).padStart(2, '0')}:${String(timeMinutes % 60).padStart(2, '0')}`;

  const setNow = (offsetMinutes: number) => {
    const target = roundToStep(nowMinutes() + offsetMinutes, 5);
    const dayShift = Math.floor(target / 1440);
    setDate(dayShift > 0 ? addDaysIso(todayIso(), dayShift) : todayIso());
    setTimeMinutes(((target % 1440) + 1440) % 1440);
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    setErrors({});
    pushToast('Origin and destination swapped');
  };

  const reset = () => {
    setFrom(null);
    setTo(null);
    setErrors({});
    setSimulatedFix(null);
  };

  const submit = () => {
    const nextErrors: Errors = {};
    if (!from) nextErrors.from = 'Choose a departure stop from the suggestions.';
    if (!to) nextErrors.to = 'Choose a destination stop from the suggestions.';
    if (from && to && from.id === to.id) nextErrors.to = 'Origin and destination must be different stops.';
    if (date < todayIso()) nextErrors.date = 'Pick today or a future date — this prototype has no historical timetable.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      pushToast('Check the highlighted fields', 'warning');
      return;
    }
    setErrors({});
    const query: SearchQuery = {
      fromStopId: from!.id,
      toStopId: to!.id,
      date,
      time: timeMinutes,
      timeMode,
      preferences,
    };
    startSearch(query);
    pushToast('Simulated journeys generated for this search', 'success');
    onSearch?.();
    navigate('/results');
  };

  return (
    <div className="stack">
      <form
        className="stack"
        style={{ gap: 'var(--s-3)' }}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="stack-2">
          <StopCombobox
            id="planner-from"
            label="From"
            value={from}
            onSelect={(stop) => {
              setFrom(stop);
              setSimulatedFix(null);
              setErrors((current) => ({ ...current, from: undefined, general: undefined }));
            }}
            invalid={Boolean(errors.from)}
            describedBy={errors.from ? 'planner-from-error' : undefined}
          />
          {errors.from ? (
            <p className="field__error" id="planner-from-error" role="alert">
              <Icon name="alert" size={14} />
              {errors.from}
            </p>
          ) : null}
          <div className="row-wrap">
            <Button icon="swap" size="sm" onClick={swap} aria-label="Reverse origin and destination">
              Reverse journey
            </Button>
            <Button icon="location" size="sm" onClick={() => setLocationOpen(true)}>
              Use my location (simulated)
            </Button>
            {simulatedFix ? (
              <span className="pill pill--sage">
                <Icon name="check" size={13} />
                {simulatedFix}
              </span>
            ) : null}
          </div>
        </div>

        <StopCombobox
          id="planner-to"
          label="To"
          value={to}
          onSelect={(stop) => {
            setTo(stop);
            setErrors((current) => ({ ...current, to: undefined, general: undefined }));
          }}
          invalid={Boolean(errors.to)}
          describedBy={errors.to ? 'planner-to-error' : undefined}
        />
        {errors.to ? (
          <p className="field__error" id="planner-to-error" role="alert">
            <Icon name="alert" size={14} />
            {errors.to}
          </p>
        ) : null}

        <div className="grid-3">
          <Field label="Date" error={errors.date} id="planner-date">
            <input
              id="planner-date"
              className="input"
              type="date"
              value={date}
              min={todayIso()}
              onChange={(event) => {
                setDate(event.target.value);
                setErrors((current) => ({ ...current, date: undefined }));
              }}
            />
          </Field>
          <Field label="Time" hint={`${timeMode === 'depart' ? 'Departure' : 'Arrival'} at ${timeValue}`} id="planner-time">
            <input
              id="planner-time"
              className="input"
              type="time"
              value={timeValue}
              onChange={(event) => {
                const [h, m] = event.target.value.split(':').map(Number);
                if (Number.isFinite(h) && Number.isFinite(m)) setTimeMinutes(h * 60 + m);
              }}
            />
          </Field>
          <Field label="Search for" id="planner-mode">
            <Segmented
              ariaLabel="Depart at or arrive by"
              value={timeMode}
              onChange={(value) => setTimeMode(value)}
              options={[
                { value: 'depart', label: 'Depart at' },
                { value: 'arrive', label: 'Arrive by' },
              ]}
            />
          </Field>
        </div>

        <div className="row-wrap">
          <span className="field__label">Quick times</span>
          <Chip onClick={() => setNow(0)}>Now</Chip>
          <Chip onClick={() => setNow(30)}>+30 min</Chip>
          <Chip onClick={() => setNow(60)}>+1 hour</Chip>
          <Chip onClick={() => setNow(1440)}>Tomorrow</Chip>
        </div>

        <Disclosure
          title="Travel preferences"
          summary={`${preferences.allowedModes.length} modes · max ${preferences.maxTransfers} transfers · ${preferences.maxWalkingMinutes} min walking`}
          id="planner-preferences"
        >
          <PreferencesControls preferences={preferences} onChange={updatePreferences} />
        </Disclosure>

        <div className="row-wrap">
          <Button type="submit" variant="primary" icon="search" style={{ flex: '1 1 220px' }} onClick={submit}>
            Search journeys
          </Button>
          <Button variant="ghost" icon="close" onClick={reset}>
            Clear form
          </Button>
        </div>

        {variant === 'hero' && favouriteStopIds.length > 0 ? (
          <Panel>
            <div className="stack-2">
              <span className="field__label">Quick fill from favourite locations</span>
              <div className="row-wrap">
                {favouriteStopIds.slice(0, 6).map((stopId) => (
                  <span key={stopId} className="row">
                    <Chip
                      icon="arrowRight"
                      onClick={() => {
                        setTo(getStop(stopId) ?? null);
                        pushToast(`Destination set to ${stopLabel(stopId)}`);
                      }}
                    >
                      {stopLabel(stopId)}
                    </Chip>
                    <Chip
                      icon="location"
                      onClick={() => {
                        setFrom(getStop(stopId) ?? null);
                        pushToast(`Origin set to ${stopLabel(stopId)}`);
                      }}
                    >
                      from here
                    </Chip>
                  </span>
                ))}
              </div>
            </div>
          </Panel>
        ) : null}
      </form>

      <Dialog
        open={locationOpen}
        title="Simulated current location"
        description="This prototype does not request your device location. Pick one of the demonstration positions instead."
        onClose={() => setLocationOpen(false)}
      >
        <ul className="stack-2">
          {SIMULATED_LOCATIONS.map((location) => (
            <li key={location.stopId}>
              <button
                type="button"
                className="list-row"
                onClick={() => {
                  setFrom(getStop(location.stopId) ?? null);
                  setSimulatedFix(`Simulated location: ${location.label.replace('Near ', '')}`);
                  setLocationOpen(false);
                  pushToast('Origin set from simulated location', 'success');
                }}
              >
                <span className="leg-row__marker">
                  <Icon name="location" size={18} />
                </span>
                <span className="stack-1 grow">
                  <span className="t-strong t-sm">{location.label}</span>
                  <span className="t-sm t-muted">{location.description}</span>
                </span>
                <Icon name="chevronRight" size={18} />
              </button>
            </li>
          ))}
        </ul>
        {variant === 'inline' ? null : (
          <p className="t-sm t-faint" style={{ marginTop: 'var(--s-3)' }}>
            Real device location is intentionally out of scope for this stage.
          </p>
        )}
        <div className="row-wrap" style={{ marginTop: 'var(--s-3)' }}>
          <IconButton icon="close" label="Close simulated location picker" onClick={() => setLocationOpen(false)} />
          <span className="t-sm t-muted">Nothing is sent anywhere — the choice stays in this browser.</span>
        </div>
      </Dialog>
    </div>
  );
}
