import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from './primitives';

/**
 * One card that is a way in.
 *
 * The stop card, the alert card and the journey card were three copies of one idea (MATCHING_PLAN
 * rule 4): a `Card` that opens a detail route on a press, one real link inside it for the keyboard
 * and the screen reader, controls that do not navigate twice, and the app's own hover/press lift.
 * They agreed by discipline; now they agree by construction — a fourth list cannot invent a fourth
 * behaviour.
 *
 * The rule the three copies were each writing by hand is done once, here, and it is a little
 * stronger than any of them: a press that lands on *any* control inside the card (a link, a
 * button, a field, a label) is the control's press and never the card's, whether or not that
 * control remembered to stop it.
 */
export function ResultCard({
  as = 'li',
  to,
  className,
  style,
  children,
}: {
  as?: 'li' | 'article' | 'div';
  /** The detail route the card opens. */
  to: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const openFromCard = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('a, button, input, select, textarea, label')) return;
    navigate(to);
  };
  return (
    <Card as={as} className={className} style={style} onClick={openFromCard}>
      {children}
    </Card>
  );
}

/**
 * The card's one real link — the accessible path into the same route the press on the card takes.
 *
 * It stops its own click so the card does not navigate a second time, and it is a `Link`, so
 * middle-click, "open in new tab" and every screen reader's link list work on it.
 */
export function ResultCardLink({
  to,
  className = 't-strong tap-target',
  children,
}: {
  to: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={className} onClick={(event) => event.stopPropagation()}>
      {children}
    </Link>
  );
}
