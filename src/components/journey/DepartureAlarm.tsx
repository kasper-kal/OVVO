import { useEffect, useRef, useState } from 'react';
import { Dialog } from '../ui/primitives';
import { Icon } from '../ui/Icons';
import { useFormat } from '../../lib/useFormat';
import { useT } from '../../lib/useT';
import { readStored, removeStored, writeStored } from '../../lib/storage';
import type { Journey } from '../../data/types';

/*
 * **The clock that tells you when to go.**
 *
 * 9292's clock opens a departure alarm: a slider, a minus and a plus, five minutes to begin with,
 * Cancel and Save under it. What it really sets is a minute — the walk to the stop and the warning
 * taken off the departure — and that minute is the whole feature: "warn me five minutes before I
 * have to leave" is a sentence you cannot act on, "leave at 06:44" is one you can.
 *
 * Two honest limits, stated on the sheet rather than discovered later. The alarm fires while this
 * page is open in a tab; a phone that has closed the tab will not wake up for it. The calendar entry
 * in the share sheet is the one that alarms with the site closed, which is why it is offered in the
 * same breath (see `ShareSheet`).
 */
interface Alarm {
  minutes: number;
  leaveBy: number;
}

/** Outside `readStored`'s own call so a test can see the same key. */
const alarmKey = (journeyId: string) => `alarm:${journeyId}`;

export function DepartureAlarm({ journey }: { journey: Journey }) {
  const t = useT();
  const format = useFormat();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<Alarm | null>(() => readStored<Alarm | null>(alarmKey(journey.id), null));
  const [draft, setDraft] = useState<number>(() => readStored<Alarm | null>(alarmKey(journey.id), null)?.minutes ?? 5);
  const [fired, setFired] = useState(false);
  const notified = useRef(false);
  const [now, setNow] = useState(() => {
    const clock = new Date();
    return clock.getHours() * 60 + clock.getMinutes();
  });

  /* The first leg may be the walk to the stop; its minutes come off the departure. */
  const first = journey.legs[0];
  const walkMinutes = first.mode === 'walk' || first.mode === 'bike' ? first.arrival - first.departure : 0;
  const leaveByFor = (minutes: number) => journey.departure - walkMinutes - minutes;

  useEffect(() => {
    const tick = () => {
      const clock = new Date();
      setNow(clock.getHours() * 60 + clock.getMinutes());
    };
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);

  /* Due when the minute has arrived and it is still this journey's own hour. */
  const due = Boolean(saved) && now >= (saved?.leaveBy ?? 0) && now < (saved?.leaveBy ?? 0) + 60;
  useEffect(() => {
    if (!due || notified.current) return;
    notified.current = true;
    setFired(true);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(t('Time to leave for your journey'), {
          body: t('Leave at {time}', { time: format.time(saved?.leaveBy ?? journey.departure) }),
        });
      } catch {
        /* A notification that cannot be drawn is not a reason to lose the in-page one. */
      }
    }
  }, [due, format, journey.departure, saved, t]);

  const save = () => {
    const alarm = { minutes: draft, leaveBy: leaveByFor(draft) };
    writeStored(alarmKey(journey.id), alarm);
    setSaved(alarm);
    setFired(false);
    notified.current = false;
    setOpen(false);
    /*
     * Asked for on Save, not on load: a permission prompt the traveller has not asked for is a
     * prompt they will refuse, and a refused one cannot be asked again.
     */
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  };

  const cancel = () => {
    setDraft(saved?.minutes ?? 5);
    setOpen(false);
  };

  /*
   * **Never zero.** "Warn me nought minutes before leaving" is not a warning, it is the departure
   * itself, and the sheet could be slid down to it and saved. One minute is the smallest warning
   * that is still a warning; the minus stops there and the slider cannot be dragged below it.
   */
  const MIN_MINUTES = 1;
  const MAX_MINUTES = 30;
  const step = (delta: number) => setDraft((value) => Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, value + delta)));

  /* **Taking the alarm off.** A journey with an alarm had no way back to a journey without one. */
  const remove = () => {
    removeStored(alarmKey(journey.id));
    setSaved(null);
    setDraft(5);
    setFired(false);
    notified.current = false;
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="btn"
        aria-label={t('Set a departure alarm')}
        aria-pressed={Boolean(saved)}
        onClick={() => {
          setDraft(saved?.minutes ?? 5);
          setOpen(true);
        }}
      >
        <Icon name="clock" size={16} />
        {saved ? t('Alarm {minutes} min', { minutes: saved.minutes }) : t('Alarm')}
      </button>

      <Dialog
        open={open}
        title={t('Departure alarm')}
        description={t('Warn me before I have to leave.')}
        onClose={cancel}
        footer={
          <>
            {/* Only offered when there is something to remove. */}
            {saved ? (
              <button
                type="button"
                className="btn alarm__remove"
                aria-label={t('Remove the alarm')}
                onClick={remove}
              >
                {t('Remove alarm')}
              </button>
            ) : null}
            <button type="button" className="btn" onClick={cancel}>
              {t('Cancel')}
            </button>
            <button type="button" className="btn btn--primary" onClick={save}>
              {t('Save')}
            </button>
          </>
        }
      >
        <div className="alarm">
          <p className="alarm__value">
            <strong>{draft}</strong> {t('minutes before leaving')}
          </p>
          <div className="alarm__row">
            <button
              type="button"
              className="btn btn--icon-circle"
              aria-label={t('One minute less')}
              disabled={draft <= MIN_MINUTES}
              onClick={() => step(-1)}
            >
              <Icon name="minus" size={16} />
            </button>
            <input
              className="alarm__slider"
              type="range"
              min={MIN_MINUTES}
              max={MAX_MINUTES}
              step={1}
              value={draft}
              aria-label={t('Warn me {minutes} minutes before leaving', { minutes: draft })}
              onChange={(event) => setDraft(Number(event.target.value))}
            />
            <button
              type="button"
              className="btn btn--icon-circle"
              aria-label={t('One minute more')}
              onClick={() => step(1)}
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
          <p className="alarm__leave">
            <Icon name="walk" size={15} />
            {t('Leave at {time}', { time: format.time(leaveByFor(draft)) })}
            {walkMinutes > 0 ? <span className="t-sm t-muted"> · {t('{count} min walk included', { count: walkMinutes })}</span> : null}
          </p>
          <p className="t-xs t-faint">
            {t('The alarm rings while this page is open. For a reminder with the app closed, add the journey to your calendar.')}
          </p>
        </div>
      </Dialog>

      {due || fired ? (
        <p className="journey-alarm-line" role="status">
          <Icon name="clock" size={15} />
          {t('Time to leave for your journey, {time}', { time: format.time(saved?.leaveBy ?? 0) })}
        </p>
      ) : null}
    </>
  );
}
