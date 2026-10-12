import { useApp } from '../../state/AppState';
import {
  BIKE_OPTIONS,
  PT_MODES,
  TRANSFER_OPTIONS,
  WALK_OPTIONS,
  describePreferences,
  type Preferences,
} from '../../data/preferences';
import { Chip, Field, Panel, Segmented, Switch } from '../ui/primitives';
import { Icon, ModeIcon } from '../ui/Icons';
import { MODE_LABELS } from '../../lib/format';

/**
 * The single source of truth for every travel-preference control in the app.
 * Used by the planner, the preferences page and the results page, so a change
 * anywhere has the same effect on the simulated results.
 */
export function PreferencesControls({ preferences, onChange }: { preferences: Preferences; onChange: (patch: Partial<Preferences>) => void }) {
  const { settings } = useApp();
  const toggleMode = (mode: Preferences['allowedModes'][number]) => {
    onChange({
      allowedModes: preferences.allowedModes.includes(mode)
        ? preferences.allowedModes.filter((m) => m !== mode)
        : [...preferences.allowedModes, mode],
    });
  };
  const toggleAvoid = (mode: Preferences['avoidedModes'][number]) => {
    onChange({
      avoidedModes: preferences.avoidedModes.includes(mode)
        ? preferences.avoidedModes.filter((m) => m !== mode)
        : [...preferences.avoidedModes, mode],
    });
  };

  return (
    <div className="stack" style={{ gap: 'var(--s-4)' }}>
      <div className="stack-2">
        <p className="field__label">Preferred transport modes</p>
        <div className="row-wrap">
          {PT_MODES.map((mode) => (
            <Chip key={mode} selected={preferences.allowedModes.includes(mode)} onClick={() => toggleMode(mode)}>
              <ModeIcon mode={mode} size={15} />
              {MODE_LABELS[mode]}
            </Chip>
          ))}
        </div>
        {preferences.allowedModes.length === 0 ? (
          <Panel variant="coral">
            <span className="t-sm row">
              <Icon name="alert" size={16} />
              With no transport mode selected the demo planner cannot produce any journey.
            </span>
          </Panel>
        ) : null}
      </div>

      <div className="stack-2">
        <p className="field__label">Avoid these modes</p>
        <div className="row-wrap">
          {PT_MODES.map((mode) => (
            <Chip
              key={mode}
              tone="danger"
              selected={preferences.avoidedModes.includes(mode)}
              icon="close"
              onClick={() => toggleAvoid(mode)}
            >
              {MODE_LABELS[mode]}
            </Chip>
          ))}
        </div>
        <p className="t-sm t-faint">Avoided modes are removed from the simulated results, even when allowed above.</p>
      </div>

      <div className="grid-2">
        <Field label="Maximum walking distance" hint="Applies to access, transfer and egress walks.">
          <div className="range">
            <input
              type="range"
              min={5}
              max={45}
              step={5}
              value={preferences.maxWalkingMinutes}
              aria-label="Maximum walking minutes"
              onChange={(event) => onChange({ maxWalkingMinutes: Number(event.target.value) })}
            />
            <div className="between">
              <span className="t-sm t-muted">5 min</span>
              <span className="t-strong">
                {preferences.maxWalkingMinutes >= 45 ? 'No limit' : `${preferences.maxWalkingMinutes} minutes`}
              </span>
              <span className="t-sm t-muted">45 min</span>
            </div>
          </div>
        </Field>

        <Field label="Maximum number of transfers" hint="Counts changes between services, not walking links.">
          <select
            className="select"
            value={preferences.maxTransfers}
            onChange={(event) => onChange({ maxTransfers: Number(event.target.value) })}
          >
            {TRANSFER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="stack-2">
        <p className="field__label">Walking limit preset</p>
        <div className="row-wrap">
          {WALK_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              selected={preferences.maxWalkingMinutes === option.value}
              onClick={() => onChange({ maxWalkingMinutes: option.value })}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="stack-2">
        <p className="field__label">Accessibility</p>
        <div className="grid-2">
          <Switch
            checked={preferences.stepFreeOnly}
            onChange={(next) => onChange({ stepFreeOnly: next })}
            label="Step-free journey only"
            description="Only journeys without stairs at stops and stations."
          />
          <Switch
            checked={preferences.needAssistance}
            onChange={(next) => onChange({ needAssistance: next })}
            label="Assistance at stations"
            description="Only trains boarding from stations with staff assistance."
          />
          <Switch
            checked={preferences.lowFloorBoarding}
            onChange={(next) => onChange({ lowFloorBoarding: next })}
            label="Low-floor boarding"
            description="Prefer stops with level or low-floor boarding."
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="stack-2">
          <p className="field__label">Trade-offs</p>
          <Switch
            checked={preferences.preferFewerTransfers}
            onChange={(next) => onChange({ preferFewerTransfers: next })}
            label="Prefer fewer transfers"
            description="Ranks journeys with fewer changes higher, even if slower."
          />
          <Switch
            checked={preferences.preferLessWalking}
            onChange={(next) => onChange({ preferLessWalking: next })}
            label="Prefer less walking"
            description="Shortens walking links and ranks them lower."
          />
        </div>

        <div className="stack-2">
          <p className="field__label">Bicycle</p>
          <Segmented
            ariaLabel="Bicycle preference"
            value={preferences.bikeMode}
            onChange={(value) => onChange({ bikeMode: value })}
            options={BIKE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          />
          <p className="t-sm t-muted">
            {BIKE_OPTIONS.find((option) => option.value === preferences.bikeMode)?.hint}
          </p>
          <Switch
            checked={preferences.allowBikeOnBoard}
            onChange={(next) => onChange({ allowBikeOnBoard: next })}
            label="Allow a bicycle on board"
            description="Shows the bicycle symbol on services where a bicycle fits."
          />
        </div>
      </div>

      <div className="stack-2">
        <p className="field__label">Current preference set</p>
        <ul className="row-wrap">
          {describePreferences(preferences).map((part) => (
            <li key={part} className="pill">
              {part}
            </li>
          ))}
        </ul>
        <p className="t-sm t-faint">
          Changes apply immediately to the simulated results and are stored in this browser
          {settings.showDemoBadges ? ' — no account needed.' : '.'}
        </p>
      </div>
    </div>
  );
}
