import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { StopCombobox } from '../components/journey/StopCombobox';
import { STOPS, getStop } from '../data/stops';
import { NETWORK } from '../data/network';
import { DISRUPTIONS } from '../data/disruptions';
import { Button, Card, DemoBadge, Dialog, Field, Pill, Segmented, Stat, Switch } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import type { Stop } from '../data/types';

export function SettingsPage() {
  const {
    settings,
    updateSettings,
    resetSettings,
    favouriteStopIds,
    savedJourneys,
    recentSearches,
    preferences,
    resetLocalData,
    pushToast,
  } = useApp();
  const format = useFormat();
  const [confirmReset, setConfirmReset] = useState(false);
  const [origin, setOrigin] = useState<Stop | null>(getStop(settings.defaultOriginStopId ?? undefined) ?? null);

  const sampleTime = 14 * 60 + 5;
  const sampleDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="stack" style={{ gap: 'var(--s-6)' }}>
      <PageHeader
        title="Settings"
        description="Appearance, defaults and locally stored prototype data. Every change applies immediately and is stored in this browser."
        breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Settings' }]}
        badge={<DemoBadge label="Stored on this device" />}
        actions={
          <Button icon="refresh" onClick={() => { resetSettings(); pushToast('Settings restored to defaults'); }}>
            Restore defaults
          </Button>
        }
      />

      <div className="grid-4">
        <Stat label="Clock" value={settings.timeFormat === '24h' ? '24-hour' : '12-hour'} hint={`Example: ${format.time(sampleTime)}`} />
        <Stat label="Density" value={settings.density} hint="Card and row spacing" />
        <Stat label="Stored journeys" value={String(savedJourneys.length)} hint="Saved in this browser" />
        <Stat label="Stored searches" value={String(recentSearches.length)} hint="Recent history" />
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="stack" style={{ gap: 'var(--s-4)' }}>
          <Card className="stack">
            <h2 className="t-section">Display</h2>
            <Field label="Clock format" hint={`Times across the app render as ${format.time(sampleTime)}`}>
              <Segmented
                ariaLabel="Clock format"
                value={settings.timeFormat}
                onChange={(value) => updateSettings({ timeFormat: value })}
                options={[
                  { value: '24h', label: '24-hour' },
                  { value: '12h', label: '12-hour' },
                ]}
              />
            </Field>
            <Field label="Date format" hint={`Dates render as ${format.date(sampleDate)}`}>
              <Segmented
                ariaLabel="Date format"
                value={settings.dateFormat}
                onChange={(value) => updateSettings({ dateFormat: value })}
                options={[
                  { value: 'long', label: 'Descriptive' },
                  { value: 'short', label: 'dd-mm-yyyy' },
                ]}
              />
            </Field>
            <Field label="Density" hint="Compact tightens spacing while keeping the 4px rhythm and 44px touch targets.">
              <Segmented
                ariaLabel="Density"
                value={settings.density}
                onChange={(value) => updateSettings({ density: value })}
                options={[
                  { value: 'comfortable', label: 'Comfortable' },
                  { value: 'compact', label: 'Compact' },
                ]}
              />
            </Field>
            <Switch
              checked={settings.highContrast}
              onChange={(next) => updateSettings({ highContrast: next })}
              label="Raised contrast"
              description="Strengthens ink and hairline borders for readability."
            />
            <Switch
              checked={settings.reduceMotion}
              onChange={(next) => updateSettings({ reduceMotion: next })}
              label="Reduce motion"
              description="Turns off the spring press and hover transitions."
            />
            <Switch
              checked={settings.showDemoBadges}
              onChange={(next) => updateSettings({ showDemoBadges: next })}
              label="Show simulated-data badges"
              description="Hides or shows the demo labels and notices across the prototype."
            />
          </Card>

          <Card className="stack">
            <h2 className="t-section">Planner and board defaults</h2>
            <Field label="Default search type" hint="Which option the planner starts with.">
              <Segmented
                ariaLabel="Default search type"
                value={settings.defaultTimeMode}
                onChange={(value) => updateSettings({ defaultTimeMode: value })}
                options={[
                  { value: 'depart', label: 'Depart at' },
                  { value: 'arrive', label: 'Arrive by' },
                ]}
              />
            </Field>
            <Field label="Default origin" hint="Prefills the From field. Clear it to start empty.">
              <StopCombobox
                id="settings-origin"
                label="Default origin stop"
                value={origin}
                onSelect={(stop) => {
                  setOrigin(stop);
                  updateSettings({ defaultOriginStopId: stop?.id ?? null });
                  pushToast(stop ? `Planner will start from ${stop.name}` : 'Default origin cleared');
                }}
              />
            </Field>
            <Field label="Departure board auto-refresh" hint="Re-simulates the board automatically.">
              <Segmented
                ariaLabel="Departure board auto-refresh"
                value={settings.boardAutoRefresh}
                onChange={(value) => updateSettings({ boardAutoRefresh: value })}
                options={[
                  { value: 0, label: 'Off' },
                  { value: 30, label: '30 sec' },
                  { value: 60, label: '60 sec' },
                ]}
              />
            </Field>
            <div className="row-wrap">
              <Link to="/departures" className="btn btn--sm">
                <Icon name="board" size={15} />
                Check the board
              </Link>
              <Link to="/preferences" className="btn btn--sm">
                <Icon name="sliders" size={15} />
                Travel preferences
              </Link>
            </div>
          </Card>
        </div>

        <div className="stack" style={{ gap: 'var(--s-4)' }}>
          <Card className="stack">
            <h2 className="t-section">Locally stored data</h2>
            <dl className="dl">
              <dt>Favourite locations</dt>
              <dd>{favouriteStopIds.length}</dd>
              <dt>Saved journeys</dt>
              <dd>{savedJourneys.length}</dd>
              <dt>Recent searches</dt>
              <dd>{recentSearches.length}</dd>
              <dt>Preferences</dt>
              <dd>
                {preferences.allowedModes.length} modes allowed · {preferences.avoidedModes.length} avoided
              </dd>
              <dt>Storage location</dt>
              <dd>This browser (localStorage)</dd>
            </dl>
            <div className="row-wrap">
              <Button variant="accent" icon="trash" onClick={() => setConfirmReset(true)}>
                Remove all stored data
              </Button>
              <Link to="/favourites" className="btn btn--sm">
                Manage favourites
              </Link>
              <Link to="/journeys" className="btn btn--sm">
                Manage saved journeys
              </Link>
            </div>
          </Card>

          <Card className="stack">
            <h2 className="t-section">Preview with current settings</h2>
            <p className="t-sm t-muted">
              A quick look at how times, dates and density render with the settings you have chosen.
            </p>
            <dl className="dl">
              <dt>Time</dt>
              <dd>{format.time(sampleTime)}</dd>
              <dt>Duration</dt>
              <dd>{format.duration(97)}</dd>
              <dt>Date</dt>
              <dd>{format.date(sampleDate)}</dd>
              <dt>Relative</dt>
              <dd>{format.relative(600, 606)}</dd>
            </dl>
            <div className="row-wrap">
              <Pill tone="butter">Highlighted</Pill>
              <Pill tone="sage">Positive status</Pill>
              <Pill tone="coral">Delay example</Pill>
              <Pill tone="outline">Neutral</Pill>
            </div>
            <p className="t-sm t-faint">
              Settings are presentation-only: they never change the underlying simulated timetable.
            </p>
          </Card>

          <Card className="stack">
            <h2 className="t-section">About this prototype</h2>
            <dl className="dl">
              <dt>Stage</dt>
              <dd>1 — frontend prototype</dd>
              <dt>Design system</dt>
              <dd>Warm Tactile Minimalism v2.4 (per DESIGN.pdf)</dd>
              <dt>Demo stops</dt>
              <dd>{STOPS.length}</dd>
              <dt>Demo services</dt>
              <dd>{NETWORK.length}</dd>
              <dt>Demo alerts</dt>
              <dd>{DISRUPTIONS.length}</dd>
              <dt>Live data</dt>
              <dd>None — no feeds, no routing engine, no geocoding</dd>
            </dl>
            <div className="row-wrap">
              <Link to="/" className="btn btn--sm">
                <Icon name="home" size={15} />
                Back to the planner
              </Link>
              <Link to="/stops" className="btn btn--sm">
                <Icon name="station" size={15} />
                Browse the {STOPS.length} stops
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <Dialog
        open={confirmReset}
        title="Remove all locally stored prototype data?"
        description="Preferences, favourites, saved journeys and recent searches are deleted from this browser. Settings return to their defaults."
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
              Remove everything
            </Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <p className="t-sm">
          {favouriteStopIds.length} favourite location(s), {savedJourneys.length} saved journey(s) and{' '}
          {recentSearches.length} recent search(es) will be deleted. The prototype then starts fresh, exactly as it did
          the first time you opened it.
        </p>
      </Dialog>
    </div>
  );
}
