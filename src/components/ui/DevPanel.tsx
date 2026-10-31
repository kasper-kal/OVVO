/**
 * **The developer panel: the whole year, in one sheet.**
 *
 * Settings carries the switch that opens this, and the switch is off for everybody who is not the
 * person building the app. What it answers is a practical question — "how does the rain look on
 * this style, on this phone?" — which otherwise needs either a specific date or a real drizzle.
 *
 * Two groups, both as tiles rather than as a list of rows: the weather and the calendar, then the
 * three hidden things. A tile is the size of a thumb, two to a row on a phone and three from 560px
 * up, and the chosen one is drawn with a ring rather than a colour swap so the choice survives
 * every style. Pressing one of the three jokes closes the sheet, because the point is to see what
 * happens on the screen behind it.
 *
 * Everything here is transient: the simulation lives in `lib/simulation` and dies with the page, so
 * a panel closed in July does not leave the app snowing in August.
 */

import { useEffect, useState } from 'react';
import { Dialog } from './primitives';
import { useT } from '../../lib/useT';
import {
  getForcedMood,
  punchTickets,
  replayTram,
  setForcedMood,
  showNeighbours,
  subscribeSimulation,
  type Simulation,
} from '../../lib/simulation';

const MOODS: { value: Simulation; label: string; hint: string; mood: string }[] = [
  { value: null, label: 'Auto (today)', hint: 'the date, then the sky', mood: 'auto' },
  { value: 'rain', label: 'Rain', hint: 'behind the cards', mood: 'rain' },
  { value: 'snow', label: 'Snow', hint: 'slow flakes', mood: 'snow' },
  { value: 'fireworks', label: 'Fireworks', hint: 'new year', mood: 'fireworks' },
  { value: 'lights', label: 'Christmas Eve', hint: 'warm lights', mood: 'lights' },
  { value: 'christmas', label: 'Christmas Day', hint: 'snow and lights', mood: 'christmas' },
  { value: 'pepernoten', label: 'Sinterklaas', hint: 'pepernoten', mood: 'pepernoten' },
];

/** The three things a tap or a hold normally finds, given their own buttons. */
const JOKES: { label: string; hint: string; run: () => void }[] = [
  { label: 'Tram across the dock', hint: 'a phone, with the bottom bar showing', run: replayTram },
  { label: 'Punch a ticket', hint: 'on a journey, with a platform showing', run: punchTickets },
  { label: 'The 9292 row', hint: 'open the station field, then press', run: showNeighbours },
];

export function DevPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const [forced, setForced] = useState<Simulation>(getForcedMood);
  const [quiet, setQuiet] = useState('');

  useEffect(() => subscribeSimulation(() => setForced(getForcedMood())), []);

  /* Read when the sheet opens rather than kept in step with the root: the panel's own subject is
     the atmosphere, and the two settings that silence it are worth one sentence when it is used. */
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement.dataset;
    setQuiet(root.motion === 'reduced' ? 'motion' : root.power === 'super' ? 'power' : '');
  }, [open]);

  const choose = (value: Simulation) => {
    setForcedMood(value);
    setForced(getForcedMood());
  };

  const play = (run: () => void) => {
    onClose();
    /* The screen behind has to be the one that answers, so the event waits a frame for the sheet
       to be out of the way of what it draws. */
    window.setTimeout(run, 60);
  };

  return (
    <Dialog
      open={open}
      title={t('Developer panel')}
      description={t('Simulate the weather, the calendar and the hidden jokes. Nothing here is saved.')}
      onClose={onClose}
      panelClassName="dev-panel"
    >
      <div className="dev-panel__group">
        <p className="field__label">{t('Weather and calendar')}</p>
        <div className="dev-grid">
          {MOODS.map((mood) => (
            <button
              key={mood.mood}
              type="button"
              className="btn dev-tile"
              aria-pressed={forced === mood.value}
              onClick={() => choose(mood.value)}
            >
              <span className="dev-dot" data-mood={mood.mood} aria-hidden="true" />
              <span className="t-strong t-sm">{t(mood.label)}</span>
              <span className="t-sm t-muted">{t(mood.hint)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="dev-panel__group">
        <p className="field__label">{t('Hidden things')}</p>
        <div className="dev-grid">
          {JOKES.map((joke) => (
            <button key={joke.label} type="button" className="btn dev-tile" onClick={() => play(joke.run)}>
              <span className="t-strong t-sm">{t(joke.label)}</span>
              <span className="t-sm t-muted">{t(joke.hint)}</span>
            </button>
          ))}
        </div>
      </div>

      {quiet === 'motion' ? (
        <p className="field__hint">{t('Reduce motion is on, so the weather layer is paused.')}</p>
      ) : quiet === 'power' ? (
        <p className="field__hint">{t('Super energy saving is on, so the weather layer is paused.')}</p>
      ) : null}
    </Dialog>
  );
}
