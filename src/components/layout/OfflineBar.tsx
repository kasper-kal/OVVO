import { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icons';
import { useT } from '../../lib/useT';
import { useOnline } from '../../lib/useOnline';

/**
 * The connection, said once, at the top of every screen.
 *
 * The promise the app makes offline is a good one — the planner, the boards, the timetable and
 * everything saved are local, so nothing stops working — but it is not the whole truth, because a
 * departure board that cannot hear about a delay is showing the timetable rather than the platform.
 * The report was blunt: offline must be *very* clear, or a traveller reads a five-minute-old board
 * as live. So this is a full-width strip that stays at the top of the page while it is in force
 * (`position: sticky`, above the header), names the loss in the same breath as the promise, and
 * goes away by itself when the connection returns — with one short confirmation so the change is
 * not silent.
 *
 * It is `role="status"` and polite: both the loss and the return are announced once, without
 * interrupting whatever the traveller is doing.
 */
export function OfflineBar() {
  const online = useOnline();
  const t = useT();
  const [back, setBack] = useState(false);
  /*
   * Whether a worker has the shell, so a reload with no network will draw the app.
   *
   * `public/sw.js` makes the sentence above true across a reload, but only once it is in control:
   * not on a first visit, not in the development build (where it is deliberately not registered),
   * and not in a browser that refused it. Where it is not true, the strip says so in one clause
   * rather than promising something the next reload cannot keep.
   */
  const shellCached =
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    Boolean(navigator.serviceWorker.controller);
  const seen = useRef(online);
  useEffect(() => {
    const was = seen.current;
    seen.current = online;
    if (was || !online) return undefined;
    /* Came back: say so for four seconds, then let the screen be quiet again. */
    setBack(true);
    const timer = window.setTimeout(() => setBack(false), 4000);
    return () => window.clearTimeout(timer);
  }, [online]);

  if (online && !back) return null;

  if (!online) {
    return (
      <div className="offline-bar" role="status" aria-live="polite">
        <span className="offline-bar__inner">
          <span className="offline-bar__icon" aria-hidden="true">
            <Icon name="alert" size={18} />
          </span>
          <span className="offline-bar__text">
            <strong>{t("You're offline")}</strong>{' '}
            {t('OVVO still works. Your journeys, boards and saved stops are all here.')}{' '}
            <strong>{t('Departure times are not live.')}</strong>{' '}
            {t('They come from the timetable until the connection is back.')}{' '}
            {shellCached ? null : t('Reloading this page needs a connection.')}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="offline-bar offline-bar--back" role="status" aria-live="polite">
      <span className="offline-bar__inner">
        <span className="offline-bar__icon" aria-hidden="true">
          <Icon name="check" size={18} />
        </span>
        <span className="offline-bar__text">{t('Back online. Live times resume.')}</span>
      </span>
    </div>
  );
}
