import type { ReactNode } from 'react';
import { Card, Chip } from './primitives';
import { Icon } from './Icons';
import { useT } from '../../lib/useT';

export type NoMatchFix = {
  id: string;
  label: string;
  /** What the list comes back to if this fix is pressed — the results screen's own promise. */
  count?: number;
  onSelect: () => void;
};

/**
 * One shape for "nothing matches", on every list that can be filtered to nothing.
 *
 * The four list screens used to answer this question four ways (MATCHING_PLAN rule 6): an
 * `EmptyState` with no way out on `/stops`, an `EmptyState` with one button on `/disruptions`, a
 * hand-built card with relaxation chips on `/results`, and nothing at all on the board. `EmptyState`
 * is the shape for **nothing yet** — a list with no question asked of it — and this is the shape for
 * **nothing matches**: it names what is on, and every fix is a chip that puts the list back.
 *
 * It sits where the list would be, under the filter row, so "why is it empty" is answered in the
 * place the traveller is looking rather than above the controls that caused it.
 */
export function NoMatches({
  title,
  description,
  reason,
  fixes = [],
  children,
}: {
  title: string;
  description: string;
  /** The one line naming which setting removed the list, when the screen can tell. */
  reason?: string;
  fixes?: NoMatchFix[];
  /** Anything else the screen wants to offer beside the fixes (a link, a reset, a retry). */
  children?: ReactNode;
}) {
  const t = useT();
  return (
    <Card className="stack">
      <div className="row-3">
        <span className="leg-row__marker">
          <Icon name="alert" size={18} />
        </span>
        <div className="stack-1">
          <span className="t-strong">{title}</span>
          <span className="t-sm t-muted">{description}</span>
          {reason ? <span className="t-sm t-faint">{reason}</span> : null}
        </div>
      </div>

      {fixes.length ? (
        <div className="stack-2">
          <span className="field__label">{t('Switch one of these back on and the list fills up again')}</span>
          <div className="row-wrap">
            {fixes.map((fix) => (
              <Chip key={fix.id} icon="plus" onClick={fix.onSelect}>
                {fix.label}
                {typeof fix.count === 'number' ? <span className="t-faint"> · {fix.count}</span> : null}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      {children ? <div className="row-wrap">{children}</div> : null}
    </Card>
  );
}
