import { Link } from 'react-router-dom';
import { getStop, stopLabel } from '../../data/stops';

/**
 * **A station's name, made the way to its page.**
 *
 * The station name is the one piece of text in the app that always *means* a place with a page of
 * its own — next departures, alerts at that stop, the lines that call there, what is nearby — so
 * wherever it is printed as a word rather than as a control, it is a link to `/stops/:id`.
 *
 * Three rules, and they are the whole of the behaviour:
 *
 *   1. **The words do not change.** The label is `stopLabel`, exactly what the screen printed
 *      before, so a renamed favourite reads "Work" here as it does everywhere else, and no screen
 *      gains a suffix or a chevron to prove it is now tappable. The thin underline is the
 *      affordance (see `.stop-link` in `styles/base.css`).
 *   2. **An end that is a place gets no link.** `Rijksstraatweg 9, Haarlem` is an address: it has
 *      no page and it is not a station, so the callers draw the label as plain text when one is
 *      present, and this component is never asked about it.
 *   3. **No padding, and no 44px target.** This is a word inside a line of other words — inside a
 *      sentence, a heading or a dense row — so it is sized by the line it sits in. Giving it a
 *      thumb-sized box would push the line apart and put an invisible square over the text beside
 *      it. `AGENTS.md` rule 8 says so, and `scripts/ui-audit.mjs` exempts `.stop-link` from its
 *      target-size probe for that reason.
 *
 * A link that is not inside another link, on purpose: every surface it is used on — a leg row, the
 * board's destination, an alert's line of stops — is plain text, not a card that opens something.
 * The one card that carries it (an alert card) is a `ResultCard`, which already sends a press on a
 * link to the link and not to the card.
 */
export function StopLink({
  stopId,
  label,
  className,
}: {
  stopId?: string;
  /**
   * The exact words the screen already printed, when they are not `stopLabel`'s.
   *
   * A departure row names its destination with the stop's own `name` ("Leidseplein"), not with the
   * label every other screen uses ("Amsterdam, Leidseplein"), and making that word a link is not a
   * reason to rename it. The caller that knows its column passes what it printed; everything else
   * leaves this out and gets the app's own label.
   */
  label?: string;
  className?: string;
}) {
  if (!stopId) return null;
  const stop = getStop(stopId);
  /*
   * An id with nothing behind it prints the words the screen would have printed and no link: a
   * journey can name a stop this build's file does not have (a stale saved journey), and a link to
   * a 404 is worse than the text it replaced.
   */
  if (!stop) return <>{label ?? stopLabel(stopId)}</>;
  return (
    <Link to={`/stops/${stop.id}`} className={`stop-link${className ? ` ${className}` : ''}`}>
      {label ?? stopLabel(stop.id)}
    </Link>
  );
}
