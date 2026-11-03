import { useState } from 'react';
import { Dialog } from '../ui/primitives';
import { Icon } from '../ui/Icons';
import { useT } from '../../lib/useT';
import { stopLabel } from '../../data/stops';
import type { Journey } from '../../data/types';

/*
 * **Two things, exactly as 9292 offers them, and then a third step only where it is needed.**
 *
 * The share control used to be a bare glyph; now it is the two choices 9292 offers: hand the journey
 * advice to someone, or put the journey in the calendar. The second one used to write a file into the
 * Downloads folder, which is not a calendar entry and not a good time.
 *
 * So the calendar row opens a short list of names instead: **Google**, **Outlook**, and **Apple or
 * other**. The first two are prefilled links into that calendar's own event editor, so the traveller
 * lands on a filled-in event and presses Save. Nothing is downloaded, and there is no account to add,
 * because it is their own calendar in their own app.
 *
 * The third row hands the appointment to the phone's own share panel. Only when that panel cannot
 * take a file, and only then, is the calendar file written, which is the last resort rather than the
 * first: it is also the one version that still alarms with this site closed, so it stays as a floor
 * rather than being deleted.
 *
 * Times are sent as a wall clock plus a timezone name, never as UTC. Both calendars accept that, and
 * it removes the one arithmetic step that puts an event an hour out for the traveller.
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

/** The same moment as `2026-11-02T06:00:00`, which both web editors read in the traveller's zone. */
function isoLocal(date: string, minutes: number): string {
  const compact = icsStamp(date, minutes);
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}T${compact.slice(9, 11)}:${compact.slice(11, 13)}:00`;
}

/** Commas, semicolons and newlines end a field in an `.ics`; they have to be escaped. */
function icsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function ShareSheet({ journey, date }: { journey: Journey; date: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'choices' | 'calendar'>('choices');
  const [status, setStatus] = useState('');

  const from = journey.legs[0].fromLabel ?? stopLabel(journey.legs[0].fromStopId);
  const last = journey.legs[journey.legs.length - 1];
  const to = last.toLabel ?? stopLabel(last.toStopId);

  const title = `${from} → ${to}`;
  const details = t('Journey planned with OVVO. {count} changes, {span}.', {
    count: journey.transfers,
    span: `${Math.floor(journey.durationMinutes / 60)}:${String(journey.durationMinutes % 60).padStart(2, '0')}`,
  });

  const googleUrl =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${icsStamp(date, journey.departure)}/${icsStamp(date, journey.arrival)}` +
    '&ctz=Europe/Amsterdam' +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(from)}`;

  const outlookUrl = (host: string) =>
    `https://${host}/calendar/deeplink/compose?path=/calendar/action/compose&rru=addevent` +
    `&startdt=${encodeURIComponent(isoLocal(date, journey.departure))}` +
    `&enddt=${encodeURIComponent(isoLocal(date, journey.arrival))}` +
    `&subject=${encodeURIComponent(title)}` +
    `&body=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(from)}`;

  const icsFile = () => {
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
      `SUMMARY:${icsText(title)}`,
      `LOCATION:${icsText(from)}`,
      `DESCRIPTION:${icsText(details)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    return new File([lines.join('\r\n')], 'ovvo-journey.ics', { type: 'text/calendar' });
  };

  const downloadIcs = () => {
    const url = URL.createObjectURL(icsFile());
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ovvo-journey.ics';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const shareJourney = async () => {
    const url = `${window.location.origin}/journey/${journey.id}`;
    try {
      if (typeof navigator.share === 'function') {
        /* The journey's link, not a file: this row is about sending the advice to someone. */
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

  /**
   * The third row. The phone's own panel first, because the calendar app is already in it; the file
   * only when nothing on this device can take an appointment, which is the one case the file is for.
   */
  const addToThisDevice = async () => {
    const file = icsFile();
    const canShareFiles =
      typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
    if (canShareFiles) {
      try {
        await navigator.share({ files: [file], title });
        setStatus(t('Sent to your calendar'));
        return;
      } catch {
        /* Dismissed or refused: the file is still a way in, so do not leave them with nothing. */
      }
    }
    downloadIcs();
    setStatus(t('Saved for your calendar'));
  };

  const calendarRows = (
    <div className="share-rows">
      <a className="share-row" href={googleUrl} target="_blank" rel="noreferrer">
        <span className="share-row__icon">
          <Icon name="calendar" size={18} />
        </span>
        <span className="share-row__text">
          <span className="t-strong">{t('Google Calendar')}</span>
          <span className="t-sm t-muted">{t('Opens your own Google Calendar with the journey filled in.')}</span>
        </span>
        <Icon name="external" size={16} className="share-row__chevron" />
      </a>
      <a className="share-row" href={outlookUrl('outlook.live.com')} target="_blank" rel="noreferrer">
        <span className="share-row__icon">
          <Icon name="calendar" size={18} />
        </span>
        <span className="share-row__text">
          <span className="t-strong">{t('Outlook')}</span>
          <span className="t-sm t-muted">{t('Opens your own Outlook calendar with the journey filled in.')}</span>
        </span>
        <Icon name="external" size={16} className="share-row__chevron" />
      </a>
      <button type="button" className="share-row" onClick={addToThisDevice}>
        <span className="share-row__icon">
          <Icon name="external" size={18} />
        </span>
        <span className="share-row__text">
          <span className="t-strong">{t('Apple or other')}</span>
          <span className="t-sm t-muted">{t('Sends it to the calendar on this device.')}</span>
        </span>
        <Icon name="chevronRight" size={16} className="share-row__chevron" />
      </button>
      {/* A work account is a different Outlook; the row above goes to a personal one. */}
      <a className="share-work" href={outlookUrl('outlook.office.com')} target="_blank" rel="noreferrer">
        {t('Outlook for a work account')}
      </a>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="btn"
        aria-label={t('Share this journey')}
        onClick={() => {
          setView('choices');
          setStatus('');
          setOpen(true);
        }}
      >
        <Icon name="external" size={16} />
        {t('Share')}
      </button>
      <Dialog
        open={open}
        title={view === 'choices' ? t('Share this journey') : t('Add to calendar')}
        description={
          view === 'choices'
            ? t('Send the advice to someone, or put the journey in your calendar.')
            : t('Choose where it goes. Nothing is downloaded unless your device cannot take it.')
        }
        onClose={() => setOpen(false)}
      >
        {view === 'choices' ? (
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
            <button
              type="button"
              className="share-row"
              aria-label={t('Add to calendar')}
              onClick={() => setView('calendar')}
            >
              <span className="share-row__icon">
                <Icon name="calendar" size={18} />
              </span>
              <span className="share-row__text">
                <span className="t-strong">{t('Add to calendar')}</span>
                <span className="t-sm t-muted">{t('Google, Outlook, or the calendar on this device.')}</span>
              </span>
              <Icon name="chevronRight" size={16} className="share-row__chevron" />
            </button>
          </div>
        ) : (
          calendarRows
        )}

        {status ? (
          <p className="t-sm t-muted" role="status">
            {status}
          </p>
        ) : null}

        {view === 'calendar' ? (
          <button type="button" className="share-back" onClick={() => setView('choices')}>
            <Icon name="chevronLeft" size={15} />
            {t('Back')}
          </button>
        ) : null}
      </Dialog>
    </>
  );
}
