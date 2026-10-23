import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { JourneyCard } from '../components/journey/JourneyCard';
import { JourneyCardSkeletons, PickerRowSkeletons, StopCardSkeletons } from '../components/ui/Skeletons';
import { Button } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { StopCard } from '../components/stops/StopCard';
import { boardForStop } from '../data/departures';
import { planJourneys } from '../data/journeyEngine';
import { DEFAULT_PREFERENCES } from '../data/preferences';
import { STOPS, hasBoard } from '../data/stops';
import { useMinuteNow } from '../lib/useMinuteNow';
import { useFormat } from '../lib/useFormat';
import { useT } from '../lib/useT';
import { todayIso } from '../lib/format';
import type { Journey } from '../data/types';

/**
 * **The skeleton gallery — a dev-only screen for judging held places, all of them, side by side.**
 *
 * The journey card was designed on this screen and nowhere else, which is how it took four
 * versions to stop looking wrong: a held shape judged alone has nothing to be right about. So the
 * lab is a gallery now. Every surface that has a hold is drawn next to the thing that replaces it,
 * at a phone's width, with the three settings that change how a hold looks — appearance, motion and
 * the battery switches — available at the top instead of being guessed at.
 *
 * **Every section runs a cycle, not a still.** A pause, then the same screen with the answer in it,
 * and a Replay that starts it over — because a hold is only ever the first half of an event, and a
 * grey card parked under a heading shows the shape without showing what it is for. The three
 * sections run their own cycles so one can be replayed without restarting the others.
 *
 * One section has no wait behind it in the app today (the journey card, since the results screen
 * paints in one frame). It cycles here to be *looked at*, and says so: a skeleton that ships
 * nowhere is a drawing, and the note is what stops it being mistaken for a state the app is in.
 *
 * Reached at `#/skeleton`, dev only (`import.meta.env.DEV` in `App.tsx`), outside the app shell so
 * the hold is the whole screen. It is not in a build.
 */

/** How long a sample holds before it lands. */
const LOAD_MS = 1800;
const CARD_COUNT = 3;

/** A random pair of stops, the way a search picks two ends. */
function randomPair(): { fromId: string; toId: string } {
  const from = STOPS[Math.floor(Math.random() * STOPS.length)];
  let to = STOPS[Math.floor(Math.random() * STOPS.length)];
  let guard = 0;
  while (to.id === from.id && guard < 12) {
    to = STOPS[Math.floor(Math.random() * STOPS.length)];
    guard += 1;
  }
  return { fromId: from.id, toId: to.id };
}

/** A departure in the next few hours, on the five-minute grid the planner works in. */
function randomTime(): number {
  const start = 6 * 60;
  const span = 12 * 60;
  return start + Math.floor(Math.random() * (span / 5)) * 5;
}

/**
 * One cycle: hold the place, then land on the answer. Replaying restarts it whole.
 *
 * The cycle is the unit of this screen, so it is a hook rather than a state held at the top: each
 * section gets its own, and a Replay under the stop cards leaves the picker rows above it alone.
 * `round` is returned as well, because the journey sample draws a new pair of stops every time it
 * starts over — the card that lands should be a different card, not the same one after a pause.
 */
function useHoldCycle(): { round: number; loading: boolean; replay: () => void } {
  const [round, setRound] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), LOAD_MS);
    return () => window.clearTimeout(timer);
  }, [round]);

  const replay = useCallback(() => setRound((current) => current + 1), []);
  return { round, loading, replay };
}

/** One group of switches in the toolbar. */
function Switch<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="stack-1">
      <span className="field__label">{label}</span>
      <div className="row-wrap">
        {options.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={option.value === value ? 'primary' : 'ghost'}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * One surface: what it is, whether it really waits, the line that says what is happening, the held
 * shape or the thing that replaced it, and the Replay under it.
 */
function Section({
  title,
  note,
  status,
  replay,
  children,
}: {
  title: string;
  note: string;
  /** `Loading…` while the hold is up, and what landed once it is down. */
  status: string;
  replay: () => void;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <section className="stack-3">
      <div className="stack-1">
        <h2 className="t-section">{title}</h2>
        <p className="t-sm t-muted">{note}</p>
      </div>
      <p className="t-sm t-muted">{status}</p>
      {children}
      <div className="row">
        <Button icon="refresh" onClick={replay}>
          {t('Replay')}
        </Button>
      </div>
    </section>
  );
}

export function SkeletonDemoPage() {
  const t = useT();
  const format = useFormat();
  const [appearance, setAppearance] = useState<'light' | 'dark'>('light');
  const [motion, setMotion] = useState<'full' | 'reduced'>('full');
  const [power, setPower] = useState<'off' | 'save'>('off');

  const { round: journeyRound, loading: journeyLoading, replay: replayJourney } = useHoldCycle();
  const { loading: pickerLoading, replay: replayPicker } = useHoldCycle();
  const { loading: stopLoading, replay: replayStops } = useHoldCycle();

  /*
   * And one button for the whole lab: the three cycles start over together, for the comparison that
   * needs all three holds up at once. Each section keeps its own Replay as well, so this is the
   * wide shot beside the close-ups rather than a replacement for them.
   */
  const replayAll = useCallback(() => {
    replayJourney();
    replayPicker();
    replayStops();
  }, [replayJourney, replayPicker, replayStops]);

  /*
   * The three switches write the same attributes the app's own settings and battery watcher write,
   * so the shell of the app is not needed to see a held card at 18% or on reduced motion. Whatever
   * was there before the lab opened is put back when it closes.
   */
  useEffect(() => {
    const root = document.documentElement;
    const before = { theme: root.dataset.theme, motion: root.dataset.motion, power: root.dataset.power };
    root.dataset.theme = appearance;
    if (motion === 'reduced') root.dataset.motion = 'reduced';
    else delete root.dataset.motion;
    if (power === 'save') root.dataset.power = 'save';
    else delete root.dataset.power;
    return () => {
      if (before.theme) root.dataset.theme = before.theme;
      else delete root.dataset.theme;
      if (before.motion) root.dataset.motion = before.motion;
      else delete root.dataset.motion;
      if (before.power) root.dataset.power = before.power;
      else delete root.dataset.power;
    };
  }, [appearance, motion, power]);

  /* A fresh journey every round: the pair, the departure time and the cards all follow `round`. */
  const { journeys, fromId, toId, departure } = useMemo(() => {
    const pair = randomPair();
    const time = randomTime();
    let planned: Journey[] = [];
    let attempt = 0;
    let chosen = pair;
    while (planned.length < 2 && attempt < 16) {
      const candidate = randomPair();
      planned = planJourneys({
        fromStopId: candidate.fromId,
        toStopId: candidate.toId,
        date: todayIso(),
        time,
        timeMode: 'depart',
        preferences: DEFAULT_PREFERENCES,
      }).slice(0, CARD_COUNT);
      chosen = candidate;
      attempt += 1;
    }
    return { journeys: planned, fromId: chosen.fromId, toId: chosen.toId, departure: time };
  }, [journeyRound]);

  /*
   * The three rows that land in the picker: real stations, drawn with the row's own parts — the
   * marker's disc, the name, the meta line — so the arrived rows are the rows the hold promised.
   */
  const pickerSamples = useMemo(() => STOPS.filter((stop) => stop.type === 'station').slice(0, 3), []);

  /*
   * The cards that land in the stops list: the same component the list draws, with the same three
   * departures its glimpse carries.
   *
   * The first of them is chosen for a **matched pair**: the held card draws three pills where the
   * badge row goes, so the first card to land is one with three things in that row (two services
   * and an OV-fiets, say). Amsterdam Centraal would put six badges on two lines and make the held
   * card 40px shorter than the card beside it — which is the comparison failing, not the hold.
   */
  const stopSamples = useMemo(() => {
    const withBoard = STOPS.filter(hasBoard);
    const threeBadges = withBoard.filter(
      (stop) =>
        stop.modes.filter((mode) => mode !== 'walk' && mode !== 'bike').length +
          (stop.ovFiets ? 1 : 0) ===
        3,
    );
    return [...threeBadges, ...withBoard.filter((stop) => !threeBadges.includes(stop))].slice(0, 2);
  }, []);
  const fromMinutes = useMinuteNow();
  const stopDepartures = useMemo(
    () => stopSamples.map((stop) => boardForStop(stop.id, { fromMinutes, limit: 3 })),
    [stopSamples, fromMinutes],
  );

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '24px 16px 120px' }}>
      <div className="stack-6">
        <div className="stack-1">
          <h1 className="t-h2">{t('Held places')}</h1>
          <p className="t-sm t-muted">
            {t('Every grey shape the app can draw, with the screen that replaces it. Dev only.')}
          </p>
        </div>

        <div className="row">
          <Button icon="refresh" onClick={replayAll}>
            {t('Replay all')}
          </Button>
        </div>

        <div className="stack-3">
          <Switch
            label={t('Appearance')}
            value={appearance}
            onChange={setAppearance}
            options={[
              { value: 'light', label: t('Light') },
              { value: 'dark', label: t('Dark') },
            ]}
          />
          <Switch
            label={t('Motion')}
            value={motion}
            onChange={setMotion}
            options={[
              { value: 'full', label: t('Full') },
              { value: 'reduced', label: t('Reduced') },
            ]}
          />
          <Switch
            label={t('Battery')}
            value={power}
            onChange={setPower}
            options={[
              { value: 'off', label: t('Normal') },
              { value: 'save', label: t('Saving (20%)') },
            ]}
          />
        </div>

        <Section
          title={t('Journey result')}
          note={t(
            'Ships nowhere: the results screen plans in one frame. Four marks, the times heaviest — then the real cards, for comparison.',
          )}
          status={
            journeyLoading
              ? t('Loading…')
              : t('{from} → {to} · leaving after {time}', {
                  from: STOPS.find((stop) => stop.id === fromId)?.name ?? fromId,
                  to: STOPS.find((stop) => stop.id === toId)?.name ?? toId,
                  time: format.time(departure),
                })
          }
          replay={replayJourney}
        >
          {journeyLoading ? (
            <JourneyCardSkeletons count={CARD_COUNT} />
          ) : (
            <div className="stack-2">
              {journeys.map((journey) => (
                <JourneyCard key={journey.id} journey={journey} />
              ))}
            </div>
          )}
        </Section>

        <Section
          title={t('Stop picker rows')}
          note={t(
            'Ships: the address lookup and the "closest stops" wait both hold the row with three marks — a disc, a name, a meta line.',
          )}
          status={
            pickerLoading
              ? t('Loading…')
              : t('Closest stops: {names}', {
                  names: pickerSamples.map((stop) => stop.name).join(' · '),
                })
          }
          replay={replayPicker}
        >
          <ul className="picker__list">
            {pickerLoading ? (
              <PickerRowSkeletons count={3} />
            ) : (
              pickerSamples.map((stop) => (
                <li key={stop.id} className="picker__item">
                  <span className="picker-row">
                    <span className="picker-row__marker">
                      <Icon name="station" size={18} />
                    </span>
                    <span className="stack-1 grow">
                      <span className="picker-row__name">{stop.name}</span>
                      <span className="picker-row__meta">
                        {t('{city} · {code}', { city: stop.city, code: stop.code })}
                      </span>
                    </span>
                    <Icon name="chevronRight" size={18} />
                  </span>
                </li>
              ))
            )}
          </ul>
        </Section>

        <Section
          title={t('Stop card')}
          note={t(
            'Ships: the stops list holds these cards while it finds where you are, because nearest-first cannot be ordered before that answer arrives.',
          )}
          status={
            stopLoading
              ? t('Loading…')
              : t('The list: {names}', { names: stopSamples.map((stop) => stop.name).join(' · ') })
          }
          replay={replayStops}
        >
          {stopLoading ? (
            <StopCardSkeletons
              cards={stopSamples.map((stop, index) => ({ stop, departures: stopDepartures[index] ?? [] }))}
            />
          ) : (
            <ul className="grid-2 stops-grid">
              {stopSamples.map((stop, index) => (
                <StopCard
                  key={stop.id}
                  stop={stop}
                  departures={stopDepartures[index] ?? []}
                  distance={null}
                  isFavourite={false}
                  onToggleFavourite={() => {}}
                  onPlan={() => {}}
                />
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
