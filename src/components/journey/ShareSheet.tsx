import { useState } from 'react';
import { Dialog } from '../ui/primitives';
import { Icon } from '../ui/Icons';
import { useT } from '../../lib/useT';
import { stopLabel } from '../../data/stops';
import type { Journey } from '../../data/types';

/*
 * **Two things, exactly as 9292 offers them.**
 *
 * The share control used to be a bare glyph with nothing behind it. 9292's share button offers a
 * short list and the list is complete: hand the journey advice to someone, or put it in the
 * calendar so it alarms when the site is closed. Nothing else — no social buttons, no "copy" as a
 * third choice, because copying is what the first one does when the phone has no share sheet.
 *
 * The calendar file is written here rather than fetched: an `.ics` is nine lines of text and a
 * download, and a server round trip would only add a way for it to fail.
 */

function icsStamp(date: string, minutes: number): string {
  const fallback = new Date();
  const [year, month, day] = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? date.split('-').map(Number)
    : [fallback.getFullYear(), fallback.getMonth() + 1, fallback.getDate()];
  const hours = String(Math.floor(minutes / 60) % 24).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}T${hours}${mins}00`;
}

/** Commas, semicolons and newlines end a field in an `.ics`; they have to be escaped. */
function icsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function ShareSheet({ journey, date }: { journey: Journey; date: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');

  const from = journey.legs[0].fromLabel ?? stopLabel(journey.legs[0].fromStopId);
  const last = journey.legs[journey.legs.length - 1];
  const to = last.toLabel ?? stopLabel(last.toStopId);

  const shareJourney = async () => {
    const url = `${window.location.origin}/journey/${journey.id}`;
    const title = t('{from} to {to}', { from, to });
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, text: title, url });
        setOpen(false);
        setStatus('');
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus(t('Link copied'));
    } catch {
      /* A dismissed share sheet is not an error; a phone without either is. */
      setStatus(t('This journey could not be shared'));
    }
  };

  const saveToCalendar = () => {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//OVVO//Journey//NL',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${journey.id}@ovvo`,
      `DTSTAMP:${icsStamp(date, journey.departure)}`,
      `DTSTART:${icsStamp(date, journey.departure)}`,
      `DTEND:${icsStamp(date, journey.arrival)}`,
      `SUMMARY:${icsText(`${from} → ${to}`)}`,
      `LOCATION:${icsText(from)}`,
      `DESCRIPTION:${icsText(t('Journey planned with OVVO. {count} changes, {span}.', {
        count: journey.transfers,
        span: `${Math.floor(journey.durationMinutes / 60)}:${String(journey.durationMinutes % 60).padStart(2, '0')}`,
      }))}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ovvo-journey.ics';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(t('Saved for your calendar'));
  };

  return (
    <>
      <button type="button" className="btn" aria-label={t('Share this journey')} onClick={() => setOpen(true)}>
        <Icon name="external" size={16} />
        {t('Share')}
      </button>
      <Dialog open={open} title={t('Share this journey')} onClose={() => setOpen(false)}>
        <div className="share-rows">
          <button type="button" className="share-row" onClick={shareJourney}>
            <span className="share-row__icon">
              <Icon name="external" size={18} />
            </span>
            <span className="share-row__text">
              <span className="t-strong">{t('Share the journey')}</span>
              <span className="t-sm t-muted">{t('Send the advice to someone, or copy its link.')}</span>
            </span>
            <Icon name="chevronRight" size={16} className="share-row__chevron" />
          </button>
          <button type="button" className="share-row" onClick={saveToCalendar}>
            <span className="share-row__icon">
              <Icon name="calendar" size={18} />
            </span>
            <span className="share-row__text">
              <span className="t-strong">{t('Save it to your calendar')}</span>
              <span className="t-sm t-muted">{t('A calendar entry with both ends and both times.')}</span>
            </span>
            <Icon name="chevronRight" size={16} className="share-row__chevron" />
          </button>
        </div>
        {status ? (
          <p className="t-sm t-muted" role="status">
            {status}
          </p>
        ) : null}
      </Dialog>
    </>
  );
}
