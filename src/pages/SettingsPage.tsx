import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { StopCombobox } from '../components/journey/StopCombobox';
import { getStop } from '../data/stops';
import { Button, Card, Dialog, Field, Pill, Segmented, Switch } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import { useT } from '../lib/useT';
import { LANGUAGES } from '../lib/i18n';
import type { Stop } from '../data/types';
import type { Language, ThemeChoice } from '../state/types';

/** The three appearances, in the order the control offers them. */
const THEME_OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/**
 * Every accent the interface is painted with, and what each one *means*.
 *
 * The preview used to sample one accent — butter, on a pill — which read as if that were the
 * accent and the rest of the palette did not exist (reported). These six are the whole set the
 * stylesheets draw with, in the order the palette uses them: the focal coral, the highlight, the
 * two tints, the structure everything sits in, and the one signal colour that never turns over
 * with the appearance.
 *
 * `key` is only the class suffix — the swatch is painted from the token itself in
 * `components.css`, so a row cannot advertise a colour the app does not use. The `role` line is
 * where the colour is actually explained, which is the part a swatch alone cannot say.
 */
const ACCENTS: { key: string; name: string; role: string }[] = [
  {
    key: 'coral',
    name: 'Signature coral',
    role: 'Where you are: the current section in the navigation, the alert count and the focus ring.',
  },
  { key: 'butter', name: 'Butter', role: 'Highlights, tags and the notice banner.' },
  { key: 'sage', name: 'Sage', role: 'Cleared and allowed states, and the water on the map.' },
  {
    key: 'coral-tint',
    name: 'Coral tint',
    role: 'Delays, disruptions, the bus badge and a field that needs fixing.',
  },
  { key: 'obsidian', name: 'Obsidian', role: 'The navigation bar, the primary action and the dark tier.' },
  { key: 'green', name: 'Running green', role: 'The live dot on a service that is running.' },
];

/**
 * One renaming row, and the only place in the app where a stop's name can be changed.
 *
 * The input holds a draft until it is left or Enter is pressed, so a name is not written on every
 * keystroke; Escape puts the stored name back. Clearing the field restores the official name
 * (`renameStop` deletes an empty one), which is why there is no separate "remove" control for the
 * case where the traveller simply empties the box — and a button for the case where they would
 * rather not have to select the text to do it.
 */
function StopNameRow({ stop }: { stop: Stop }) {
  const { customStopNames, renameStop } = useApp();
  const t = useT();
  const stored = customStopNames[stop.id] ?? '';
  const [draft, setDraft] = useState(stored);
  const commit = () => {
    if (draft.trim() !== stored) renameStop(stop.id, draft);
  };
  return (
    <li className="stack-2">
      <label className="field">
        <span className="field__label">
          {stop.name} · {stop.city}
        </span>
        <input
          className="input"
          value={draft}
          maxLength={40}
          placeholder={t('For example: Work')}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') {
              setDraft(stored);
              event.currentTarget.blur();
            }
          }}
        />
      </label>
      {stored ? (
        <div className="row-wrap">
          <span className="t-sm t-muted grow">
            {t('Shown as {name}', { name: stored })}
          </span>
          <Button
            size="sm"
            variant="ghost"
            icon="refresh"
            onClick={() => {
              setDraft('');
              renameStop(stop.id, '');
            }}
          >
            {t('Use the official name')}
          </Button>
        </div>
      ) : null}
    </li>
  );
}

export function SettingsPage() {
  const {
    settings,
    appearance,
    updateSettings,
    resetSettings,
    favouriteStopIds,
    boardStopIds,
    savedJourneys,
    recentSearches,
    resetLocalData,
    pushToast,
    locationConsent,
    setLocationConsent,
    requestLocation,
  } = useApp();
  /* The stops the rename list offers, in the order they were hearted. */
  const favouriteStops = favouriteStopIds
    .map((id) => getStop(id))
    .filter((stop): stop is Stop => Boolean(stop));
  const format = useFormat();
  const t = useT();
  const [confirmReset, setConfirmReset] = useState(false);
  const [origin, setOrigin] = useState<Stop | null>(getStop(settings.defaultOriginStopId ?? undefined) ?? null);
  /*
   * While the browser is being asked for a fix.
   *
   * The switch has to show the request it is making: flipped on, it turns on immediately and
   * asks, then settles to whatever the browser actually said. Without this the switch is
   * controlled by `locationConsent`, which is still "denied" while the request is out, so it
   * snapped straight back to off and looked like nothing had happened — the reported
   * "flip it, it should try again, then go back to off if it fails again".
   */
  const [askingLocation, setAskingLocation] = useState(false);

  const sampleTime = 14 * 60 + 5;
  const sampleDate = new Date().toISOString().slice(0, 10);

  const appearanceLabel =
    settings.theme === 'system'
      ? t('{appearance} — from your device', { appearance: appearance === 'dark' ? t('Dark') : t('Light') })
      : appearance === 'dark'
        ? t('Dark')
        : t('Light');
  /* The language's own name, as the control above offers it — never translated into the language
     the traveller is leaving. */
  const languageLabel = LANGUAGES.find((option) => option.value === settings.language)?.label ?? 'English';

  return (
    <div className="stack-6">
      <PageHeader
        title={t('Settings')}
        description={t(
          'Appearance, defaults and locally stored data. Every change applies immediately and is stored in this browser.',
        )}
        actions={
          <Button icon="refresh" onClick={resetSettings}>
            {t('Reset to defaults')}
          </Button>
        }
      />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="stack-4">
          <Card className="stack">
            {/*
              Appearance first, because it is the setting that changes what the traveller is
              looking at while they are looking at it — the value of every other control on this
              page depends on the light in the room.
            */}
            <h2 className="t-section">{t('Appearance')}</h2>
            <Field label={t('Appearance')} hint={t('Light, dark or the device setting.')}>
              <Segmented
                ariaLabel={t('Appearance')}
                value={settings.theme}
                onChange={(value) => updateSettings({ theme: value })}
                options={THEME_OPTIONS.map((option) => ({ value: option.value, label: t(option.label) }))}
              />
            </Field>
            <Field label={t('Language')} hint={t('The language of the interface.')}>
              <Segmented
                ariaLabel={t('Language')}
                value={settings.language}
                onChange={(value) => updateSettings({ language: value as Language })}
                options={LANGUAGES.map((option) => ({ value: option.value, label: option.label }))}
              />
            </Field>
            <h2 className="t-section">{t('Display')}</h2>
            <Field label={t('Clock format')} hint={t('Times across the app render as {sample}', { sample: format.time(sampleTime) })}>
              <Segmented
                ariaLabel={t('Clock format')}
                value={settings.timeFormat}
                onChange={(value) => updateSettings({ timeFormat: value })}
                options={[
                  { value: '24h', label: t('24-hour') },
                  { value: '12h', label: t('12-hour') },
                ]}
              />
            </Field>
            <Field label={t('Date format')} hint={t('Dates render as {sample}', { sample: format.date(sampleDate) })}>
              <Segmented
                ariaLabel="Date format"
                value={settings.dateFormat}
                onChange={(value) => updateSettings({ dateFormat: value })}
                options={[
                  { value: 'long', label: t('Descriptive') },
                  { value: 'short', label: 'dd-mm-yyyy' },
                ]}
              />
            </Field>
            <Field label={t('Density')} hint={t('Compact tightens spacing while keeping the 4px rhythm and 44px touch targets.')}>
              <Segmented
                ariaLabel={t('Density')}
                value={settings.density}
                onChange={(value) => updateSettings({ density: value })}
                options={[
                  { value: 'comfortable', label: t('Comfortable') },
                  { value: 'compact', label: t('Compact') },
                ]}
              />
            </Field>
            <Switch
              checked={settings.highContrast}
              onChange={(next) => updateSettings({ highContrast: next })}
              label={t('Raised contrast')}
              description={t('Strengthens ink and hairline borders for readability.')}
            />
            <Switch
              checked={settings.reduceMotion}
              onChange={(next) => updateSettings({ reduceMotion: next })}
              label={t('Reduce motion')}
              description={t('Turns off the spring press and hover transitions.')}
            />
          </Card>

          <Card className="stack">
            <h2 className="t-section">{t('Location')}</h2>
            <Switch
              checked={askingLocation || locationConsent === 'granted'}
              onChange={(next) => {
                if (askingLocation) return;
                if (!next) {
                  setLocationConsent('denied');
                  return;
                }
                /*
                 * Turning it on is a request, not a setting. It is already on visually, the
                 * browser is asked for a fix, and the switch settles on the answer: a grant
                 * leaves it on, a refusal puts it back off (and the toast says why), so it can
                 * never sit on while permission is not held.
                 */
                setAskingLocation(true);
                requestLocation()
                  .catch((error: unknown) =>
                    pushToast(error instanceof Error ? error.message : 'Location is unavailable', 'warning'),
                  )
                  .finally(() => setAskingLocation(false));
              }}
              label={t('Use my location')}
              description={t('Fills in the nearest stop when you plan a journey. The browser asks on your first visit.')}
            />
            <p className="t-sm t-faint">
              {locationConsent === 'granted'
                ? t('Allowed for this browser — you can turn it off again here at any time.')
                : locationConsent === 'denied'
                  ? t('Not allowed. Switch it on here whenever you want it.')
                  : t('No answer yet — the question appears the first time you open the app.')}
            </p>
          </Card>

          {/*
            Names for favourites, above the planner defaults because it belongs with the things
            about *your* stops rather than the settings that shape a search (asked for by name).

            This is the **only** place a stop can be renamed: every other screen shows the name it
            gives, so there is one list to look after rather than a rename control on every row
            that happens to show a stop.

            Favourites, not board pins: a name belongs to the place you use — your work address,
            your home address, the bus stop on the corner — and a pin is a stop whose board you
            watch. Addresses are allowed here for exactly the reason they are allowed as
            favourites.
          */}
          <Card className="stack">
            <h2 className="t-section">{t('Names for your favourites')}</h2>
            <p className="t-sm t-muted">
              {t(
                'Give a stop you have favourited your own name — Work, Home, Closest bus stop. The name is used everywhere the stop appears, and this screen is the only place to change it.',
              )}
            </p>
            {favouriteStops.length ? (
              <ul className="stack-4">
                {favouriteStops.map((stop) => (
                  <StopNameRow key={stop.id} stop={stop} />
                ))}
              </ul>
            ) : (
              <p className="t-sm t-faint">
                {t('Heart a stop first — its name appears here once it is a favourite.')}
              </p>
            )}
          </Card>

          <Card className="stack">
            <h2 className="t-section">{t('Planner and board defaults')}</h2>
            <Field label={t('Default search type')} hint={t('Which option the planner starts with.')}>
              <Segmented
                ariaLabel={t('Default search type')}
                value={settings.defaultTimeMode}
                onChange={(value) => updateSettings({ defaultTimeMode: value })}
                options={[
                  { value: 'depart', label: t('Depart at') },
                  { value: 'arrive', label: t('Arrive by') },
                ]}
              />
            </Field>
            <div className="stack-1">
              <StopCombobox
                id="settings-origin"
                label={t('Default origin')}
                value={origin}
                onSelect={(stop) => {
                  setOrigin(stop);
                  updateSettings({ defaultOriginStopId: stop?.id ?? null });
                }}
              />
              <p className="field__hint">
                {t('Prefills the From field when you open the planner. Clear it to start empty.')}
              </p>
            </div>
            {/*
              The board's refresh interval used to be a setting here, offering off / 5 / 15 / 30 /
              60 seconds as a five-option segmented control. It is gone: a departure board that
              updates slower than the departures do is not a choice anybody wants, and five
              options in a capsule is the shape this app keeps getting wrong — at 320px the
              control measured 328.9px wide, so it wrapped onto two rows and drew a pill around
              both of them (the reported screenshot). The board now ticks at a fixed five
              seconds (`BOARD_REFRESH_SECONDS`), with nothing to set.
            */}
            <div className="row-wrap">
              <Link to="/departures" className="btn btn--sm">
                <Icon name="board" size={15} />
                {t('Check the board')}
              </Link>
              <Link to="/preferences" className="btn btn--sm">
                <Icon name="sliders" size={15} />
                {t('Travel preferences')}
              </Link>
            </div>
          </Card>
        </div>

        <div className="stack-4">
          <Card className="stack">
            <h2 className="t-section">{t('Preview with current settings')}</h2>
            <p className="t-sm t-muted">
              {t(
                'A quick look at how times, dates, density and the accent colours render with the settings you have chosen.',
              )}
            </p>
            <dl className="dl">
              <dt>{t('Time')}</dt>
              <dd>{format.time(sampleTime)}</dd>
              <dt>{t('Duration')}</dt>
              <dd>{format.duration(97)}</dd>
              <dt>{t('Date')}</dt>
              <dd>{format.date(sampleDate)}</dd>
              <dt>{t('Relative')}</dt>
              <dd>{format.relative(600, 606)}</dd>
            </dl>
            <div className="row-wrap">
              <Pill tone="butter">{t('Highlighted')}</Pill>
              <Pill tone="outline">{t('Neutral')}</Pill>
            </div>

            {/*
              The palette, then the settings that have no sample of their own.

              Both blocks answer the same report — the preview showed one accent and five format
              lines, and said nothing about the appearance, the language, the density, the contrast
              or the motion that were actually in force. Nothing here is a second control: every
              line is a reading of the settings above it, and the appearance line is the resolved
              one, so "System" is never printed as if it were an appearance.
            */}
            <h3 className="t-label">{t('Accent colours')}</h3>
            <dl className="dl dl--swatch">
              {ACCENTS.map((accent) => (
                <Fragment key={accent.key}>
                  <dt>
                    <span
                      className={`palette__swatch palette__swatch--${accent.key}`}
                      aria-hidden="true"
                    />
                    {t(accent.name)}
                  </dt>
                  <dd>{t(accent.role)}</dd>
                </Fragment>
              ))}
            </dl>

            <h3 className="t-label">{t('Currently in effect')}</h3>
            <dl className="dl">
              <dt>{t('Appearance')}</dt>
              <dd>{appearanceLabel}</dd>
              <dt>{t('Language')}</dt>
              <dd>{languageLabel}</dd>
              <dt>{t('Density')}</dt>
              <dd>{settings.density === 'compact' ? t('Compact') : t('Comfortable')}</dd>
              <dt>{t('Contrast')}</dt>
              <dd>{settings.highContrast ? t('Raised') : t('Standard')}</dd>
              <dt>{t('Motion')}</dt>
              <dd>{settings.reduceMotion ? t('Reduced') : t('Full')}</dd>
            </dl>

            <p className="t-sm t-faint">
              {t('Settings are presentation-only: they never change the timetable or your journeys.')}
            </p>
          </Card>

        </div>
      </div>

      {/*
        Both blocks that used to sit on this screen are deleted by request: "Locally stored data"
        (a manifest of pins, journeys, searches, modes and a storage location), and the foot panel
        (the build line, a browse link and the install hint).

        One thing was reachable only from inside the manifest, and it is kept as a bare button at
        the foot: Remove all stored data, with its confirmation dialog unchanged. Say the word and
        it goes too — a screen with no way to clear what it stores is a different decision from a
        screen with fewer blocks on it, so it was not made silently.
      */}
      <div className="row-wrap">
        <Button variant="accent" icon="trash" onClick={() => setConfirmReset(true)}>
          {t('Remove all stored data')}
        </Button>
      </div>

      <Dialog
        open={confirmReset}
        title={t('Remove all locally stored data?')}
        description={t(
          'Preferences, favourites, board pins, favourited journeys, recent searches and location permission are deleted from this browser. Settings return to their defaults.',
        )}
        onClose={() => setConfirmReset(false)}
        footer={
          <>
            <Button
              variant="accent"
              icon="trash"
              onClick={() => {
                resetLocalData();
                setOrigin(null);
                setConfirmReset(false);
              }}
            >
              {t('Remove everything')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              {t('Cancel')}
            </Button>
          </>
        }
      >
        <p className="t-sm">
          {t(
            '{favourites}, {board}, {journeys} and {searches} will be deleted. The app then starts fresh.',
            {
              favourites: `${favouriteStopIds.length} ${t('favourite stops')}`,
              board: `${boardStopIds.length} ${t('stops pinned to the board')}`,
              journeys: `${savedJourneys.length} ${t('favourited journeys')}`,
              searches: `${recentSearches.length} ${t('recent searches')}`,
            },
          )}
        </p>
      </Dialog>
    </div>
  );
}
