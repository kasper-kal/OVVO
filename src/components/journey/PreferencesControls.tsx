import {
  ACCESS_MODE_HINTS,
  MAX_WALKING_MINUTES,
  MODE_OPTIONS,
  TRANSFER_OPTIONS,
  modeLabel,
  type Preferences,
} from '../../data/preferences';
import { Chip, Field, Panel, Switch } from '../ui/primitives';
import { useT } from '../../lib/useT';
import { Icon, ModeIcon } from '../ui/Icons';
import type { TravelMode } from '../../data/types';

/**
 * The single source of truth for every travel-preference control in the app.
 * Used by the planner, the preferences page and the results page, so a change
 * anywhere has the same effect on your journeys.
 *
 * One mode list: allowed or not used at all.
 */
export function PreferencesControls({
  preferences,
  onChange,
  /** The results page's Options panel already asks the modes question as a result filter. */
  showModes = true,
  /** The results page's panel is a row of named switches; the explanations live on the preferences page. */
  withHints = true,
}: {
  preferences: Preferences;
  onChange: (patch: Partial<Preferences>) => void;
  showModes?: boolean;
  withHints?: boolean;
}) {
  const t = useT();
  const toggleMode = (mode: TravelMode) => {
    onChange({
      allowedModes: preferences.allowedModes.includes(mode)
        ? preferences.allowedModes.filter((m) => m !== mode)
        : [...preferences.allowedModes, mode],
    });
  };

  return (
    <div className="stack-4">
      {showModes ? (
      <div className="stack-2">
        {/* One question, one named group: seven toggle buttons with nothing saying what they
            belong to read as seven loose switches (10.4). */}
        <p className="field__label" id="modes-label">
          {t('Transport modes')}
        </p>
        <div className="row-wrap chip-group" role="group" aria-labelledby="modes-label">
          {MODE_OPTIONS.map((mode) => (
            <Chip key={mode} selected={preferences.allowedModes.includes(mode)} onClick={() => toggleMode(mode)}>
              <ModeIcon mode={mode} size={15} />
              {t(modeLabel(mode))}
            </Chip>
          ))}
        </div>
        <p className="t-sm t-faint">
          {t('Every mode starts switched on; unselected modes are left out of your journeys.')}
        </p>
        {preferences.allowedModes.length === 0 ? (
          <Panel variant="coral" role="status">
            <span className="t-sm row">
              <Icon name="alert" size={16} />
              {t('With no transport mode selected no journey can be planned.')}
            </span>
          </Panel>
        ) : null}
        {preferences.allowedModes.includes('bike') ? (
          <p className="t-sm t-faint mode-hint">
            <ModeIcon mode="bike" size={15} />
            <span>{ACCESS_MODE_HINTS.bike ? t(ACCESS_MODE_HINTS.bike) : null}</span>
          </p>
        ) : null}
      </div>
      ) : null}

      <div className="grid-2">
        <Field
          label={t('Maximum walking time')}
          hint={withHints ? t('Applies to access, transfer and egress walks.') : undefined}
        >
          <div className="range">
            <input
              type="range"
              min={5}
              max={MAX_WALKING_MINUTES}
              step={5}
              value={preferences.maxWalkingMinutes}
              /* The visible label's own words: "Maximum walking time" is what a speech-input user
                 says, and the control answered to a different name (10.7). */
              aria-label={t('Maximum walking time')}
              onChange={(event) => onChange({ maxWalkingMinutes: Number(event.target.value) })}
            />
            <div className="between">
              <span className="t-sm t-muted">{t('5 min')}</span>
              <span className="t-strong">
                {preferences.maxWalkingMinutes >= MAX_WALKING_MINUTES
                  ? t('No limit')
                  : t('{count} minutes', { count: preferences.maxWalkingMinutes })}
              </span>
              <span className="t-sm t-muted">{t('{count} min', { count: MAX_WALKING_MINUTES })}</span>
            </div>
          </div>
        </Field>

        <Field
          label={t('Maximum number of transfers')}
          hint={withHints ? t('Counts changes between services, not walking links.') : undefined}
        >
          <select
            className="select"
            /*
              The field's label is a `<label>` with no `htmlFor`, so this control had no name at
              all: a screen reader announced "combo box, Maximum 2 transfers, selected" and never
              said what it was counting. The visible words are the name, spelled the way the
              slider above spells them for the same reason (10.7).
            */
            aria-label={t('Maximum number of transfers')}
            value={preferences.maxTransfers}
            onChange={(event) => onChange({ maxTransfers: Number(event.target.value) })}
          >
            {TRANSFER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.label)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="stack-2" role="group" aria-label={t('Trade-offs')}>
        <p className="field__label">{t('Trade-offs')}</p>
        <Switch
          checked={preferences.preferFewerTransfers}
          onChange={(next) => onChange({ preferFewerTransfers: next })}
          label={t('Prefer fewer transfers')}
          icon="swap"
          description={withHints ? t('Ranks journeys with fewer changes higher, even if slower.') : undefined}
        />
        <Switch
          checked={preferences.preferLessWalking}
          onChange={(next) => onChange({ preferLessWalking: next })}
          label={t('Prefer less walking')}
          icon="walk"
          description={withHints ? t('Shortens walking links and ranks them lower.') : undefined}
        />
      </div>

    </div>
  );
}
