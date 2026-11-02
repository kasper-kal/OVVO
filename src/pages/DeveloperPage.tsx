import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { Button, Card, Field, IconButton, Switch } from '../components/ui/primitives';
import { useT } from '../lib/useT';
import { useFormat } from '../lib/useFormat';
import { appNow, pad, parseTimeInput } from '../lib/format';
import { clearDevOverrides, setDevOverrides, useDev } from '../lib/dev';
import { DISRUPTIONS } from '../data/disruptions';
import { APP_WIRE_BYTES, CLAIM_MAX_MBPS, CLAIM_MIN_MBPS, clampSpeed, transferMs } from '../lib/link';
import { Icon } from '../components/ui/Icons';
import { Select } from '../components/ui/Select';

/**
 * The developer panel — what this browser believes about the device.
 *
 * Four questions the app actually asks, all of them answered by the phone in the field and by this
 * panel in the workshop:
 *
 *   • **The battery.** A level and a charger, fed into the same rule the device's readings go
 *     through (`lib/power.ts`), so 20%, 10% and 1% are the shipped thresholds rather than a copy.
 *   • **The clock.** One field, `datetime-local`, so the picker is the device's own calendar, as
 *     the steerer asked: a day, an hour and a minute chosen in one go instead of in two fields that
 *     can disagree. It moves the app's clock as an offset, so the app's minute timers keep running.
 *   • **The connection.** Pulling a cable is not a way to test the offline strip on a phone, and
 *     no link can be made slow on demand either, so the speed is claimed here. Setting it reloads
 *     the page, and the reload waits as long as the app's own files would take at that speed — a
 *     reload is the one navigation that downloads the app, so it is the one that has a real cost.
 *     The two things the app fetches while it runs, the article card and the address suggestions,
 *     wait too; the screens already in the bundle do not, and say so.
 *   • **The network.** A calm day, or one alert on its own, and the number the boards roll from,
 *     so a row that was reported can be found again instead of hunted for.
 *   • **The way in.** A hold over the results long enough to be looked at, and the focus ring kept
 *     on every control, because both are things to look at rather than to use.
 *   • **What the app believes.** The mode, the clock, the battery and the connection in one line,
 *     which is what a bug report should be able to copy instead of describe.
 *
 * **The panel is not reached out of the mode it creates.** At 10% a simulated battery keeps Settings
 * and the map, so the simulation is ended the ordinary way. At 1% nothing is kept: a last drop with
 * Settings in its menu is not a last drop, which is what made that one impossible to look at
 * (reported). Instead the last-drop screen carries one small link to this panel, drawn only while
 * the battery is simulated (`pages/HomePage`), so the way out exists without pretending the mode is
 * something other than it is.
 *
 * Nothing here is hidden from the audits and nothing here is translated: it is a tool for one
 * person, it ships because this site has one user, and it is off until the switch in Settings says
 * otherwise.
 */

/** `YYYY-MM-DDTHH:MM`, the one shape a native `datetime-local` field accepts. */
function dateTimeValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/**
 * **The panel is not a way in while the switch is off.**
 *
 * A typed address and a stored one are the same address, so the route checks the switch rather than
 * trusting the link that is not drawn. It lands on Settings, where the switch lives.
 */
export function DeveloperRoute() {
  const { settings } = useApp();
  if (!settings.developerMode) return <Navigate to="/settings" replace />;
  return <DeveloperPage />;
}

export function DeveloperPage() {
  const { power } = useApp();
  const t = useT();
  const format = useFormat();
  const dev = useDev();
  /*
   * The field's own draft, so the calendar can be opened and moved around without each intermediate
   * value being written to the app's clock. It starts on the time the app is actually showing.
   */
  const [clockField, setClockField] = useState(() => dateTimeValue(appNow()));
  /*
   * The speed field's own draft, like the clock's: a number being typed is allowed to be half-typed,
   * and only a finished, positive one is handed to the app.
   */
  const [speedDraft, setSpeedDraft] = useState(() => (dev.wifiMbps === null ? '5' : String(dev.wifiMbps)));

  /*
   * **Two steps to a speed, because a reload leaves no time to type one.**
   *
   * Switching the speed on used to reload the page straight away, at whatever number was in the
   * box, so the field you were about to type into was gone before the first digit (reported). So
   * turning it on only claims the speed it has — the field appears with it — and nothing is
   * reloaded until the button inside the field is pressed. That button is the reload: press it and
   * the app comes back over the link you just chose, which is the whole point of being able to
   * choose one.
   */
  const claimSpeed = (next: number) => setDevOverrides({ wifiMbps: clampSpeed(next) });
  const applySpeed = (next: number | null) => {
    setDevOverrides({ wifiMbps: next });
    window.location.reload();
  };
  /* The field's button and Enter do the same thing: take the number that was typed, at once. */
  const commitSpeed = () => {
    /*
     * **A typed number is brought inside the field's range before it is believed.**
     *
     * `0.00000005` is under the field's own bottom end, and it used to be stored as typed: the wait it
     * asked for was longer than a browser timer can count, so the timer fired at once and the reload
     * looked instant. It is now stored as the slowest speed the field offers, and the label says so.
     */
    const next = clampSpeed(Number(speedDraft));
    if (next === null) {
      setSpeedDraft(String(dev.wifiMbps ?? 5));
      return;
    }
    setSpeedDraft(String(next));
    applySpeed(next);
  };

  const percent = dev.battery === null ? null : Math.round(dev.battery * 100);
  /*
   * **The level the knob sits at.**
   *
   * With no simulation, that is the device's own reading and not a full battery. The knob used to
   * be parked at the end of the rail while the sentence under it said the device's own battery was
   * being read, which claims a charge nobody measured (reported). A browser that reports no level
   * leaves the knob at 0, and the sentence says so rather than pretending otherwise.
   */
  const devicePercent = power.level === null ? null : Math.round(power.level * 100);
  const shownPercent = percent ?? devicePercent;
  /* What the app is doing with the level it now believes, in the same words Settings uses. */
  const modeLabel =
    power.mode === 'last'
      ? t('Last drop')
      : power.mode === 'super'
        ? t('Super saving')
        : power.mode === 'save'
          ? t('Saving')
          : t('Off');
  const clock = appNow();
  const clockLabel = `${format.date(`${clock.getFullYear()}-${pad(clock.getMonth() + 1)}-${pad(
    clock.getDate(),
  )}`)} ${format.time(clock.getHours() * 60 + clock.getMinutes())}`;

  const applyClock = (value: string) => {
    setClockField(value);
    const [day, time] = value.split('T');
    if (!day || !time) return;
    const [year, month, date] = day.split('-').map(Number);
    const minutes = parseTimeInput(time);
    if (!year || !month || !date || minutes === null) return;
    const target = new Date(year, month - 1, date, Math.floor(minutes / 60), minutes % 60, 0, 0);
    setDevOverrides({ clockOffset: target.getTime() - Date.now() });
  };

  return (
    <div className="stack-6">
      <PageHeader
        title={t('Developer panel')}
        description={t(
          'Changes what this app believes about the device. Everything here is remembered across reloads until it is put back.',
        )}
        showTitle
      />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="stack-4">
          <Card className="stack">
            <h2 className="t-section">{t('Battery')}</h2>
            {/*
              **No slider while the device's own battery is being read.**

              The rail used to be drawn in both states, its knob parked at whatever the device
              reported. A rail with a knob on it, in front of a sentence saying nothing is being
              simulated, reads as a control that is set to that level (reported twice). When the
              device is being read there is nothing to drag, so the level is drawn the way Settings
              draws a reading, name on the left and value on the right, and the slider arrives only
              when the traveller asks to pretend one.
            */}
            {dev.battery === null ? (
              <>
                <div className="field">
                  <div className="between">
                    <span className="field__label">{t('Level')}</span>
                    <span className="t-strong t-sm">
                      {devicePercent === null ? t('Not reported') : `${devicePercent}%`}
                    </span>
                  </div>
                  <p className="field__hint">
                    {devicePercent === null
                      ? t('This browser does not report a level.')
                      : t('Read from this device. Nothing here is being simulated.')}
                  </p>
                </div>
                <div className="row">
                  <Button
                    /*
                     * The same surface as "Put everything back": a white pill with the app's
                     * hairline, so the two stand-alone actions on this screen read alike
                     * (reported). It was a ghost button -- no fill, no edge -- which read as a line
                     * of text rather than as something to press.
                     *
                     * Only the level is taken over. The charger is its own switch, and a browser
                     * that reports no battery is treated by the app as plugged in -- copying that
                     * would start every simulation in the full interface, so a pretend 4% would
                     * arrive with saving switched off.
                     */
                    onClick={() => setDevOverrides({ battery: power.level ?? 0.5, noBattery: false })}
                  >
                    {t('Pretend a level')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Field
                  /* The number rides on the label, the way the battery reading in Settings does. */
                  label={t('Level · {percent}%', { percent: shownPercent ?? 0 })}
                  hint={t('The app is in {mode}.', { mode: modeLabel })}
                >
              {/*
                **The rail is the column, and the knob reaches both ends of it.**

                This was the app's native slider pulled a half thumb wider than the card's text to
                make its knob meet the ends, which left the rail overhanging the column and, at 100%,
                the knob hanging outside the card (reported, circled). The rail is now drawn at the
                column's own width with a knob whose centre travels from one end to the other, and a
                transparent native input sits on top so dragging, the arrow keys and the screen
                reader all still work.
              */}
              <div className="dev-level">
                <div className="dev-level__rail" aria-hidden="true">
                  <span className="dev-level__fill" style={{ width: `${shownPercent ?? 0}%` }} />
                  <span className="dev-level__knob" style={{ left: `${shownPercent ?? 0}%` }} />
                </div>
                <input
                  className="dev-level__input"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={shownPercent ?? 0}
                  onChange={(event) => setDevOverrides({ battery: Number(event.target.value) / 100 })}
                  aria-label={t('Battery level')}
                />
              </div>
                </Field>
                <Switch
                  checked={dev.charging}
                  onChange={(next) => setDevOverrides({ charging: next })}
                  label={t('On a charger')}
                  description={t(
                    'A charger puts the app back in its full interface, whatever the level says.',
                  )}
                />
              </>
            )}
            {/*
              **The browser with no battery, which a browser on this machine cannot be.**

              Safari and Firefox have no battery API, and the app has a state for that: no level,
              no mode, the full interface, and Settings naming the fact. A Chromium browser cannot
              be made to forget the API, so the panel says it here. Pressing to pretend a level
              takes this back off, because otherwise the two switches would disagree about whether
              there is a number to read.
            */}
            <Switch
              checked={dev.noBattery}
              onChange={(next) =>
                setDevOverrides(next ? { noBattery: true, battery: null } : { noBattery: false })
              }
              label={t('A browser with no battery')}
              description={t('No level, no mode, and the full interface: what Safari and Firefox see.')}
            />

            {/* The way back sits under the switch that decides whether there is a level to read. */}
            {dev.battery !== null ? (
              <div className="row">
                <Button
                  variant="ghost"
                  icon="refresh"
                  onClick={() => setDevOverrides({ battery: null, charging: false })}
                >
                  {t('Use the device’s battery')}
                </Button>
              </div>
            ) : null}
          </Card>

          <Card className="stack">
            <h2 className="t-section">{t('Clock')}</h2>
            {/*
              One field, the device's own calendar. A date field and a time field beside it can
              disagree between the two taps, and the picker the phone shows for `datetime-local` is
              the one that chooses both together.
            */}
            <Field
              label={t('Date and time')}
            >
              {/*
                * **One mark, and it is the field's own.**
                *
                * For a day this drew an app calendar in the field's right-hand lane. On a browser
                * that does not honour the hiding of the platform's own glyph - which is most phones
                * - that is two marks in one field, and it was called out immediately. So nothing of
                * ours is drawn here: whatever the field draws is the only mark on it.
                */}
              <div className="dev-datetime">
                <input
                  className="input"
                  type="datetime-local"
                  value={clockField}
                  onChange={(event) => applyClock(event.target.value)}
                  aria-label={t('Date and time')}
                />
                {/*
                  The app's own mark, in the lane the stylesheet reserves for it. The browser's own
                  glyph is still underneath this one - invisible, and still the thing a tap opens -
                  because Chrome on Android paints that glyph on the field's edge and will not be
                  moved by any padding.
                */}
                <span className="dev-datetime__mark" aria-hidden="true">
                  <Icon name="chevronDown" size={18} />
                </span>
              </div>
            </Field>
            <span className="t-sm t-muted">{t('The app is showing {time}.', { time: clockLabel })}</span>
            <div className="row">
              <Button
                icon="refresh"
                onClick={() => {
                  setDevOverrides({ clockOffset: null });
                  setClockField(dateTimeValue(appNow()));
                }}
              >
                {t('Use the device’s clock')}
              </Button>
            </div>
          </Card>

          <Card className="stack">
            <h2 className="t-section">{t('OVVO Wrapped')}</h2>
            {/*
              The deck is built to be read from 20 December. This opens a made-up year — 146
              journeys, a favourite line, a look worn for months — so the cards can be looked at and
              argued with in November. Nothing here is stored: `?demo=1` is read into memory by
              `lib/wrappedDemo` and thrown away when the page closes.
            */}
            <p className="t-sm t-muted">
              {t("Opens the year's deck with a made-up year, without touching your own tally.")}
            </p>
            <div className="row-wrap">
              <Link className="btn btn--accent" to="/wrapped?demo=1">
                <Icon name="star" size={16} />
                {t('Open a demo year')}
              </Link>
            </div>
          </Card>

          <Card className="stack">
            <h2 className="t-section">{t('Connection')}</h2>
            <Switch
              checked={dev.offline === true}
              onChange={(next) => setDevOverrides({ offline: next ? true : null })}
              label={t('Pretend to be offline')}
              description={t('The offline strip and the not-live boards appear, without touching the network.')}
            />
            {/*
              **A hold that can be watched.**

              The results screen holds its list's place for a quarter of a second while a search
              lands. That is the right length to use the app and the wrong length to look at it: the
              cards are there before the eye has found them. This is the same hold, at two seconds.
            */}
            <Switch
              checked={dev.slow}
              onChange={(next) => setDevOverrides({ slow: next })}
              label={t('Slow it down')}
              description={t('The results hold their loading shape for two seconds instead of a quarter of one.')}
            />
            {/*
              **A link speed, exact and in megabits, because that is the number a connection has.**

              The app cannot be given a slow connection by pulling anything, so the speed is claimed
              and then spent on the transfers that really happen: the reload that follows this
              change (`src/main.tsx`, sized by the build's own compressed weight), the article card
              and the address suggestions. A number is typed here rather than chosen, because the
              interesting speeds are low: below a hundredth of a megabit the reload is half a
              minute, which is the sort of link a report is usually about.
            */}
            <Switch
              checked={dev.wifiMbps !== null}
              onChange={(next) => {
                const speed = clampSpeed(dev.wifiMbps ?? Number(speedDraft)) ?? 5;
                setSpeedDraft(String(speed));
                /* On is not applied: the field appears, and its button is what reloads. Off has no
                   number to type, so it takes effect at once. */
                if (next) claimSpeed(speed);
                else applySpeed(null);
              }}
              label={t('Custom WiFi speed')}
              description={t(
                'A claimed link speed. Type it in the field, then press the button in the field to reload over it.',
              )}
            />
            {dev.wifiMbps !== null ? (
              <Field
                label={t('Speed · {speed} Mbps', { speed: dev.wifiMbps })}
                hint={t('Press the button to reload over it: the reload takes {seconds} seconds at this speed. The article card and the address suggestions wait too; the screens already in the app do not.', {
                  seconds: (transferMs(APP_WIRE_BYTES, dev.wifiMbps) / 1000).toFixed(1),
                })}
              >
                {/*
                  * **The confirm button sits inside the field, at its right end.**
                  *
                  * A speed is a number that has to be typed, so the thing that applies it belongs
                  * where the number is: a separate row below would be pressed by mistake while
                  * looking for the box. It is the app's own disc with the app's own tick, sized to
                  * the field's height, and the field's text is inset far enough that a long number
                  * never runs underneath it. Enter does the same thing for a keyboard.
                  */}
                <div className="dev-speed">
                  <input
                    className="input"
                    type="number"
                    inputMode="decimal"
                    min={CLAIM_MIN_MBPS}
                    max={CLAIM_MAX_MBPS}
                    step={0.01}
                    value={speedDraft}
                    onChange={(event) => setSpeedDraft(event.target.value)}
                    /* A draft while typing, applied by the button or Enter — never by a keystroke,
                       which would reload on `0.0` on the way to `0.05`. */
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        commitSpeed();
                      }
                    }}
                    aria-label={t('Speed in megabits per second')}
                  />
                  <IconButton
                    className="dev-speed__go"
                    variant="surface"
                    icon="check"
                    label={t('Use this speed')}
                    onClick={commitSpeed}
                  />
                </div>
              </Field>
            ) : null}
          </Card>

          <Card className="stack">
            <h2 className="t-section">{t('Alerts')}</h2>
            {/*
              **The two states the app has data for and no way to stand in.**

              Every screen carries the same fourteen alerts every day, so neither a network with
              nothing wrong with it nor a single alert on its own can be looked at. The calm day
              comes first and takes the list away entirely; the picker is for looking at one alert
              as if it were the only thing wrong, on the boards and the journeys too.
            */}
            <Switch
              checked={dev.calm}
              onChange={(next) => setDevOverrides({ calm: next, alertId: null })}
              label={t('A calm day')}
              description={t('Every alert is gone: the quiet boards, the quiet journeys, and an empty list.')}
            />
            <Field
              label={t('One alert at a time')}
              hint={t('Every screen shows only this alert, as if it were the only thing wrong today.')}
            >
              <Select
                className="input"
                value={dev.calm ? '' : dev.alertId ?? ''}
                disabled={dev.calm}
                onChange={(event) => setDevOverrides({ alertId: event.target.value || null })}
                aria-label={t('One alert at a time')}
              >
                <option value="">{t('All alerts')}</option>
                {DISRUPTIONS.map((alert) => (
                  <option key={alert.id} value={alert.id}>
                    {alert.title}
                  </option>
                ))}
              </Select>
            </Field>
          </Card>

          <Card className="stack">
            <h2 className="t-section">{t('Board')}</h2>
            {/*
              **The same board twice.**

              Whether a row is late, cancelled or standing at another platform is rolled from the
              things that name the departure, so it is stable — but there is no way to ask for the
              drawing that showed a cancellation, and a reported row has to be hunted for. One
              number names one drawing of the whole network, and it is kept with the other
              overrides, so it survives the reload that reproduces the report.
            */}
            <Field
              label={t('Variant · {number}', { number: dev.rollVariant })}
              hint={t(
                'Note the number and the same rows come back: the delays, the cancellations and the platforms.',
              )}
            >
              <div className="row">
                <Button onClick={() => setDevOverrides({ rollVariant: dev.rollVariant + 1 })}>
                  {t('Roll again')}
                </Button>
                <Button onClick={() => setDevOverrides({ rollVariant: 0 })}>
                  {t('The first roll')}
                </Button>
              </div>
            </Field>
          </Card>

          <Card className="stack">
            <h2 className="t-section">{t('Keyboard')}</h2>
            {/*
              **A ring on everything focused, for looking rather than for using.**

              `:focus-visible` is the browser guessing whether a ring is wanted, which is right for
              a traveller and useless for a review: the ring can only be seen while you trust it to
              appear. With this on, the app's own ring is drawn on whatever holds focus.
            */}
            <Switch
              checked={dev.focusRings}
              onChange={(next) => setDevOverrides({ focusRings: next })}
              label={t('Show the focus ring everywhere')}
              description={t('Every focused control wears the ring, not only the ones the keyboard reached.')}
            />
          </Card>

          <Card className="stack">
            <h2 className="t-section">{t('What the app believes')}</h2>
            <div className="between">
              <span className="field__label">{t('Battery')}</span>
              <span className="t-strong t-sm">
                {dev.noBattery
                  ? t('Not reported')
                  : dev.battery === null
                    ? t('From the device')
                    : `${percent}%${dev.charging ? ` · ${t('Charging')}` : ''}`}
              </span>
            </div>
            <div className="between">
              <span className="field__label">{t('Mode')}</span>
              <span className="t-strong t-sm">
                {power.mode === 'last'
                  ? t('Last drop')
                  : power.mode === 'super'
                    ? t('Super saving')
                    : power.mode === 'save'
                      ? t('Saving')
                      : t('Off')}
              </span>
            </div>
            <div className="between">
              <span className="field__label">{t('Clock')}</span>
              <span className="t-strong t-sm">{clockLabel}</span>
            </div>
            <div className="between">
              <span className="field__label">{t('Connection')}</span>
              <span className="t-strong t-sm">
                {dev.offline === null ? t('From the device') : dev.offline ? t('Offline') : t('Online')}
              </span>
            </div>
            <div className="between">
              <span className="field__label">{t('Speed')}</span>
              <span className="t-strong t-sm">
                {dev.wifiMbps === null ? t('Not simulated') : `${dev.wifiMbps} Mbps`}
              </span>
            </div>
            <div className="row">
              <Button
                icon="refresh"
                onClick={() => {
                  clearDevOverrides();
                  setClockField(dateTimeValue(appNow()));
                }}
              >
                {t('Put everything back')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
