import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { Button, Card, Field, Switch } from '../components/ui/primitives';
import { useT } from '../lib/useT';
import { useFormat } from '../lib/useFormat';
import { appNow, pad, parseTimeInput } from '../lib/format';
import { clearDevOverrides, setDevOverrides, useDev } from '../lib/dev';

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
 *   • **The connection.** Pulling a cable is not a way to test the offline strip on a phone.
 *   • **What the app believes.** The mode, the clock, the battery and the connection in one line,
 *     which is what a bug report should be able to copy instead of describe.
 *
 * **The panel is exempt from the mode it creates.** Settings and the map are closed at 10% and 1%,
 * so a fake battery of 1% would otherwise lock the door to the panel that faked it. While a battery
 * override is set, Settings stays reachable (`App.tsx`, `AppShell`), and only then. Nothing else is
 * exempt: the panel is a way to *see* a mode, never a way for the app to behave differently.
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
                    variant="ghost"
                    /*
                     * Only the level is taken over. The charger is its own switch, and a browser
                     * that reports no battery is treated by the app as plugged in -- copying that
                     * would start every simulation in the full interface, so a pretend 4% would
                     * arrive with saving switched off.
                     */
                    onClick={() => setDevOverrides({ battery: power.level ?? 0.5 })}
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
                **The slider the rest of the app already uses, with the knob reaching its ends.**

                This was a bare `input`, so it drew the browser's own blue control — the only one
                on the site — and at 0% its knob sat a thumb's width inside the rail, which reads as
                "not actually at the start" (reported, circled). `.range` is the app's coral slider
                (the walking-time one), and `--flush` moves the input out by half a thumb so the
                knob's centre lands on the rail's end at both 0 and 100.
              */}
              <div className="range range--flush">
                <input
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
                <div className="row">
                  <Button
                    variant="ghost"
                    icon="refresh"
                    onClick={() => setDevOverrides({ battery: null, charging: false })}
                  >
                    {t('Use the device’s battery')}
                  </Button>
                </div>
              </>
            )}
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
              <input
                className="input"
                type="datetime-local"
                value={clockField}
                onChange={(event) => applyClock(event.target.value)}
                aria-label={t('Date and time')}
              />
            </Field>
            <span className="t-sm t-muted">{t('The app is showing {time}.', { time: clockLabel })}</span>
          </Card>

          <Card className="stack">
            <h2 className="t-section">{t('Connection')}</h2>
            <Switch
              checked={dev.offline === true}
              onChange={(next) => setDevOverrides({ offline: next ? true : null })}
              label={t('Pretend to be offline')}
              description={t('The offline strip and the not-live boards appear, without touching the network.')}
            />
          </Card>

          <Card className="stack">
            <h2 className="t-section">{t('What the app believes')}</h2>
            <div className="between">
              <span className="field__label">{t('Battery')}</span>
              <span className="t-strong t-sm">
                {dev.battery === null
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
