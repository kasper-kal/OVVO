import { useEffect } from 'react';
import { Button, Dialog } from '../ui/primitives';
import { useT } from '../../lib/useT';
import { dismissKeyboard } from '../../lib/dismissKeyboard';
import type { Stop } from '../../data/types';

/**
 * The two-choice Plan dialog: "is this where you leave from, or where you are going?".
 *
 * It belongs to a stop, not to a screen — the stop cards on Stations & stops opened it, and
 * the stop page itself now does too, instead of carrying a pair of PLAN FROM HERE / PLAN TO
 * HERE buttons at the head of the page. One control, one question, one answer, wherever a
 * stop is offered as an end of a journey.
 */
export function PlanStopDialog({
  stop,
  onClose,
  onPlan,
}: {
  /** The stop the question is about; `null` keeps the dialog closed. */
  stop: Stop | null;
  onClose: () => void;
  onPlan: (direction: 'from' | 'to') => void;
}) {
  const t = useT();
  /*
   * A stop was chosen from a list that may sit under a search field, so this dialog is the answer
   * to a choice and nothing here is typed into: the phone keyboard has to go, or it covers the two
   * buttons that are the whole question.
   */
  useEffect(() => {
    if (stop) dismissKeyboard();
  }, [stop]);

  return (
    <Dialog
      open={stop !== null}
      title={t('Plan with {stop}', { stop: stop?.name ?? '' })}
      description={t('Is this where you leave from, or where you are going?')}
      onClose={onClose}
      footer={
        <>
          {/* `route` for both ends of the question: planning is what these do, and the
              crosshair is the *use my location* control's glyph (W3C COGA, one glyph, one
              meaning). */}
          <Button icon="route" onClick={() => onPlan('from')}>
            {t('Plan from here')}
          </Button>
          {/* `to here` wore `ghost` — no border, no fill — beside a solid `from here` in the same
              footer, so the same question was asked twice in two shapes (WCAG 3.2.4). The
              departure board's own pair are both solid, so both ends are solid here too: the
              words carry the direction, not a second material. */}
          <Button icon="route" onClick={() => onPlan('to')}>
            {t('Plan to here')}
          </Button>
        </>
      }
    />
  );
}
