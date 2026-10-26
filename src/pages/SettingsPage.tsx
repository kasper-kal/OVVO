import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { StopCombobox } from '../components/journey/StopCombobox';
import { getStop } from '../data/stops';
import { Banner, Button, Card, Dialog, Field, Pill, Segmented, Switch } from '../components/ui/primitives';
import { ColourSettings } from '../components/ui/ColourSettings';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { paletteFor } from '../lib/palette';
import { useFormat } from '../lib/useFormat';
import { useT } from '../lib/useT';
import { LANGUAGES } from '../lib/i18n';
import type { Stop } from '../data/types';
import type { Language, ThemeChoice } from '../state/types';

/**
 * The three appearances, in the order the control offers them.
 *
 * **A segmented control is words, or it is pictures — never both.** These segments used to carry a
 * monitor, a sun and a moon beside the words (an earlier audit counted glyphs on the Settings page
 * and asked for them). Side by side with the word, a glyph that says the same thing is not a
 * shortcut, it is a second thing to read: "System" and a monitor both mean the device setting, and
 * the clock format offered two identical clocks for "24-hour" and "12-hour". The words are the
 * choice and they already fit, so the pictures go; the language control was words all along and
 * shows the shape the others now share.
 */
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
  /*
   * Escape discards the draft — and blur must not then write it.
   *
   * The handler set the draft back and blurred, and blur is what commits; but the commit still read
   * the old draft, so the abandoned name went to storage and won on the next load (11.3). The flag
   * is the difference between "left the field" and "left the field on purpose".
   */
  const abandoning = useRef(false);
  const commit = () => {
    if (abandoning.current) {
      abandoning.current = false;
      return;
    }
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
          /*
            The visible label above this field is the stop's own name, so a screen reader read the
            box as "Haarlem Station · Haarlem, edit text" — the place, never the job. The name says
            what to type and still contains the visible words, so a speech-input user can say them.
          */
          aria-label={t('Your name for {stop}', { stop: `${stop.name} · ${stop.city}` })}
          placeholder={t('For example: Work')}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') {
              abandoning.current = true;
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
    power,
  } = useApp();
  /* The stops the rename list offers, in the order they were hearted. */
  const favouriteStops = favouriteStopIds
    .map((id) => getStop(id))
    .filter((stop): stop is Stop => Boolean(stop));
  const format = useFormat();
  const t = useT();
  const navigate = useNavigate();
  /* The colours **in force** here — each appearance keeps its own (`lib/palette.ts`), so the
     "currently in effect" labels below must read the half that is being drawn. */
  const palette = paletteFor(settings, appearance);
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
      ? t('{appearance}, from your device', { appearance: appearance === 'dark' ? t('Dark') : t('Light') })
      : appearance === 'dark'
        ? t('Dark')
        : t('Light');
  /* The language's own name, as the control above offers it — never translated into the language
     the traveller is leaving. */
  const languageLabel = LANGUAGES.find((option) => option.value === settings.language)?.label ?? 'English';

  /*
   * What the battery watcher is doing right now, in the shortest true form.
   *
   * The percentage is part of it because the percentage is the reason: "Saving · 18%" says both
   * what the app is doing and how long it will keep doing it, and a phone on a charger says so
   * rather than naming a mode that is deliberately not in force.
   */
  const batteryModeLabel =
    power.mode === 'super'
      ? t('Super saving')
      : power.mode === 'save'
        ? t('Saving')
        : power.charging
          ? t('Charging')
          : t('Off');
  const batteryLabel = power.supported
    ? `${batteryModeLabel} · ${Math.round((power.level ?? 0) * 100)}%`
    : t('Not reported');

  return (
    <div className="stack-6">
      <PageHeader
        title={t('Settings')}
        description={t(
          'Appearance, defaults and locally stored data. Every change applies immediately and is stored in this browser.',
        )}
        /* The H1 was a 1×1 sr-only box at every width, so the page opened on RESET TO DEFAULTS
           with nothing above it saying where the traveller was (11.4). */
        showTitle
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
                options={THEME_OPTIONS.map((option) => ({
                  value: option.value,
                  label: t(option.label),
                }))}
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
                ariaLabel={t('Date format')}
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
            {/*
              Battery saving is a reading, not a control, so it is drawn the way the page draws
              every other reading: a label, a sentence, and the value on the right. There is
              deliberately no switch — a mode that can be turned off is a mode that leaves a phone
              on 3% drawing a map — and pressing it would only be able to lie.
            */}
            <div className="field">
              {/* The label line carries the reading, the same way a control's own row does: name
                  on the left, what it is doing on the right, and one sentence under it. No pill
                  — a pill is a thing you can press or a tag on a list, and this is neither. */}
              <div className="between">
                <span className="field__label">{t('Battery saving')}</span>
                <span className="t-strong t-sm">{batteryLabel}</span>
              </div>
              <p className="field__hint">
                {power.supported
                  ? t('Automatic: movement goes at 20%, and at 10% only what you need to catch a bus is drawn. Plugging in turns it off.')
                  : t('This browser does not report the battery, so the full interface is always drawn.')}
              </p>
            </div>
          </Card>

          {/*
            **Colours, as questions that open screens.** The card names each setting and its
            current value; the choice itself lives one level in (`ColourSettings`, and the note
            there). Everything about the interface's colour is still in this one place.
          */}
          <ColourSettings />

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
                ? t('Allowed for this browser. You can turn it off again here at any time.')
                : locationConsent === 'denied'
                  ? t('Not allowed. Switch it on here whenever you want it.')
                  : t('No answer yet. The question appears the first time you open the app.')}
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
                'Give a stop you have favourited your own name: Work, Home, Closest bus stop. The name is used everywhere the stop appears, and this screen is the only place to change it.',
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
                {t('Heart a stop first. Its name appears here once it is a favourite.')}
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
            {/*
              A specimen, not a description (F25): the card is the one place on a screen of text
              that is meant to be looked at — "the rest of the page is text so here is where we
              show it IRL, not in text". Everything below is the app's own furniture drawn with
              the settings in force: a journey's times and its delay, the board's rows, two
              buttons, a chip row, a notice, and the accent swatches with the name of what each
              one means. Nothing here is a control; changing a setting above re-draws it.
            */}
            <div className="preview-specimen stack-2">
              <div className="between wrap">
                <div className="journey-card__times">
                  <span className="journey-card__time">{format.time(sampleTime)}</span>
                  <Icon name="arrowRight" size={18} className="journey-card__arrow" />
                  <span className="journey-card__time">{format.time(sampleTime + 97)}</span>
                  <span className="pill">{format.duration(97)}</span>
                </div>
                <Pill tone="coral" dot dotTone="coral">
                  {t('Delay +{minutes} min', { minutes: 4 })}
                </Pill>
              </div>
              <div className="row-wrap">
                <span className="mode-badge mode-badge--tram">
                  <ModeIcon mode="tram" size={13} />
                  {t('Tram')} 2
                </span>
                <span className="t-sm t-muted">{format.date(sampleDate)}</span>
                <span className="t-sm t-faint">{format.relative(600, 606)}</span>
              </div>
              <div className="row-wrap">
                <Pill tone="sage">{t('Expected quiet')}</Pill>
                <Pill tone="butter">{t('Highlighted')}</Pill>
                <Pill tone="outline">{t('Neutral')}</Pill>
              </div>
            </div>

            <div className="preview-specimen stack-1">
              <span className="field__label">{t('Departure board')}</span>
              <ul className="board-list">
                <li className="board-list__row">
                  <span className="board-list__time">
                    <span className="t-mono-num">{format.time(sampleTime)}</span>
                  </span>
                  <span className="board-list__main">
                    <span className="board-list__line">
                      <span className="board-list__destination">{t('Amsterdam Centraal')}</span>
                      <span className="t-sm t-faint">{t('Tram')} 2 · GVB</span>
                    </span>
                  </span>
                  <span className="board-list__platform">1</span>
                </li>
                <li className="board-list__row">
                  <span className="board-list__time">
                    <span className="t-mono-num">{format.time(sampleTime + 10)}</span>
                    <span className="board-list__delta">
                      <span className="strike">{format.time(sampleTime + 7)}</span>
                      <span className="delay">+3</span>
                    </span>
                  </span>
                  <span className="board-list__main">
                    <span className="board-list__line">
                      <span className="board-list__destination">{t('Utrecht Centraal')}</span>
                      <span className="t-sm t-faint">{t('Tram')} 4 · GVB</span>
                    </span>
                  </span>
                  <span className="board-list__platform">2</span>
                </li>
              </ul>
            </div>

            {/* The specimen is a picture of the app's controls, not the controls: these two were
                real buttons in the tab order that did nothing when pressed (11.9). They keep the
                paint and lose the semantics. */}
            <div className="row-wrap" aria-hidden="true">
              <span className="btn btn--primary">
                <Icon name="route" size={16} />
                {t('Plan journey')}
              </span>
              <span className="btn">
                <Icon name="sliders" size={16} />
                {t('Filters')}
              </span>
            </div>

            <Banner tone="butter" icon="info" title={t('Service notice')}>
              {t('Work on the line until 18:00. Add ten minutes.')}
            </Banner>

            <h3 className="t-label">{t('Accent colours')}</h3>
            <div className="row-wrap">
              {ACCENTS.map((accent) => (
                <span key={accent.key} className="row row--inline">
                  <span
                    className={`palette__swatch palette__swatch--${accent.key}`}
                    aria-hidden="true"
                  />
                  {/*
                    The first swatch is painted from `--accent-primary`, so when a tint is in force
                    it *is* the tint's accent — and calling it "Signature coral" while it draws
                    green would be the row lying about itself.
                  */}
                  <span className="t-sm">
                    {/*
                      **Only the first swatch is the accent.** It is painted from `--accent-primary`,
                      which follows the widgets' colour or the page's, so it is named for whichever
                      is in force — and the other five are their own colours either way, which is
                      why the `accent.key === 'coral'` guard has to stay on both branches. (It was
                      dropped when this label learned about the primary colour, and every swatch in
                      the row read "Primary colour".)
                    */}
                    {accent.key === 'coral'
                      ? palette.primaryColour
                        ? t('Primary colour')
                        : settings.background !== 'cream'
                          ? t('Theme colour')
                          : t(accent.name)
                      : t(accent.name)}
                  </span>
                </span>
              ))}
            </div>

            <h3 className="t-label">{t('Currently in effect')}</h3>
            <div className="row-wrap">
              <Pill tone="outline">{appearanceLabel}</Pill>
              <Pill tone="outline">{languageLabel}</Pill>
              <Pill tone="outline">{settings.density === 'compact' ? t('Compact') : t('Comfortable')}</Pill>
              <Pill tone="outline">{settings.highContrast ? t('Raised') : t('Standard')}</Pill>
              <Pill tone="outline">{settings.reduceMotion ? t('Reduced') : t('Full')}</Pill>
            </div>
          </Card>

        </div>
      </div>

      {/*
        Both blocks that used to sit on this screen are deleted by request: "Locally stored data"
        (a manifest of pins, journeys, searches, modes and a storage location), and the foot panel
        (the build line, a browse link and the install hint).

        One thing was reachable only from inside the manifest, and it is kept as a bare button at
        the foot, which is now the app's **reset** rather than only its way to empty the store.
        It was called *Remove all stored data*, which named half of what it does: the traveller
        asked for a control that makes OVVO treat them as somebody new, and that is the whole of
        it now - the data goes, the settings go back to their defaults, and the two questions a
        first visit asks (where are you, and would you like this on your home screen) come back
        with them (`resetLocalData`, `state/AppState.tsx`). It is **one** control, not a second
        button beside an older one doing nearly the same job.
      */}
      <div className="row-wrap">
        <Button variant="accent" icon="trash" onClick={() => setConfirmReset(true)}>
          {t('Reset the app')}
        </Button>
      </div>


      <Dialog
        open={confirmReset}
        title={t('Reset OVVO?')}
        description={t(
          'Everything OVVO remembers in this browser is deleted, and the settings go back to their defaults. It then asks about your location again, the way it does on a first visit.',
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
                /*
                 * Home, which is where a first visit starts. Staying on Settings would draw the
                 * reset as a screen of changed defaults and then cover it with the location
                 * question the same trip is meant to be - so the traveller is put where a new
                 * phone is put, and the first-visit sheet arrives on that screen instead.
                 */
                navigate('/');
              }}
            >
              {t('Reset everything')}
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
              /* One of a thing is not the plural's sentence: the sheet printed "1 stops" and
                 "1 favoriete reizen" because the count and the noun were concatenated (11.10). */
              favourites: t('{count} favourite stops', { count: favouriteStopIds.length }),
              board: t('{count} stops pinned to the board', { count: boardStopIds.length }),
              journeys: t('{count} favourited journeys', { count: savedJourneys.length }),
              searches: t('{count} recent searches', { count: recentSearches.length }),
            },
          )}
        </p>
      </Dialog>
    </div>
  );
}
