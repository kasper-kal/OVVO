import type { CSSProperties, ReactNode } from 'react';
import { customStopName } from '../../data/stops';
import { modeLabel } from '../../data/preferences';
import type { Departure, Stop } from '../../data/types';
import { stopTypeLabel } from '../../lib/format';
import { useFormat } from '../../lib/useFormat';
import { useT } from '../../lib/useT';
import { ModeIcon } from './Icons';
import { Pill } from './primitives';

/**
 * **A skeleton is the screen's own layout, drawn in grey — one mark per row.**
 *
 * Four versions of this file were wrong, and the fourth is the one that explained the other three:
 * **the fault was the number of marks, not their size.**
 *
 *   1. marks the size of the *boxes* — 26px capsules, a 44px disc — read as fat slabs;
 *   2. marks the size of the *text*, still fully round, read as soap bubbles;
 *   3. thin blocks with a bar per *element*: one for each time, a 14×10 dash for the arrow, three
 *      chips for the chain, a disc for the heart, a dot for the fare. Eleven marks on one card, in
 *      four heights and two radii. Every one of them was the right size and the card was still
 *      ugly, because a scatter of small marks is not a held line — it is debris;
 *   4. and this: **a row is one mark, and every mark is the same size.** The times are one mark,
 *      the label is one, the chain is one, the fare is one. Nothing is smaller than anything else,
 *      so nothing reads as a speck.
 *
 * The shape is the shape of the thing being held: a **pill** where the card has a pill (a duration,
 * a label, a chain of service badges, a button), a **line** where it has a line of text, a
 * **circle** where it has an avatar or a glyph. The app is drawn in pills, so a held card is pills
 * too — sized to the row they stand in, and 16px tall so the card still reads light.
 *
 * **One stripe is heavier than the rest.** The times are the card's own headline — the thing a
 * traveller scans down the list — so that mark is 24px tall and the other three stay 16. That is
 * the card's hierarchy, drawn in grey: one heavy line, three light ones.
 *
 * The rows themselves are the real card's (`journey-card__head`, `__times`, `__tags`, `__meta`),
 * empty heart slot included, so a held card has exactly the height of the card that replaces it at
 * every width — the list never jumps when the journeys land.
 *
 * Shown only while something is genuinely pending: the photo decode, the picker's address lookup
 * and the stops list's wait for a position to order itself by are the app's real waits (the
 * planner and the stop search are local and synchronous, and never hold).
 */

/** The one mark. Size it to the thing it stands in for; give it that thing's shape. */
export function SkeletonBar({
  width,
  height = 10,
  shape = 'line',
  phase = 0,
}: {
  width: number | string;
  height?: number;
  /** `pill` for a pill, a chip or a button; `circle` for an avatar or a glyph; `line` for text. */
  shape?: 'line' | 'pill' | 'circle';
  /**
   * Where in its 1.7s cycle this mark's band of light starts, in seconds. Give the marks of one
   * card different phases and the light runs across them as a wave instead of in lockstep.
   */
  phase?: number;
}) {
  const style: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height,
    ...(phase ? ({ '--skeleton-phase': `-${phase}s` } as CSSProperties) : null),
  };
  return (
    <span
      className={`skeleton${shape === 'line' ? '' : ` skeleton--${shape}`}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * The card the marks sit in: the app's own `.card` surface, so a held card and a real one are the
 * same object with different contents. `as` exists because the stops list is a `ul` of `li` and
 * the results list is a `div`.
 */
function SkeletonCard({
  as: Tag = 'div',
  className,
  children,
}: {
  as?: 'div' | 'li';
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Tag className={`card skeleton-card${className ? ` ${className}` : ''}`} aria-hidden="true">
      {children}
    </Tag>
  );
}

/**
 * A journey card, in grey: four marks, each the width of the writing it stands in for (measured on
 * the real card at 390px — the times with the duration 221, the label 100, the chain 193, the fare
 * 61), and the first of them 24px tall against the others' 16.
 *
 * Four, not eleven. The row of vehicles used to be three chips and the events of a journey used to
 * be nine grey rectangles; what a held card needs is one mark where a thought goes, not a diagram
 * of the thought.
 *
 * The four are a quarter-cycle out of step with each other (`phase`), so the band of light travels
 * down the card as a wave — and because each band is half the mark wide, two or three of them are
 * always on the card somewhere, which is what keeps the hold looking alive.
 */
export function JourneyCardSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="stack-2">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index}>
          <div className="journey-card__head">
            <div className="journey-card__times">
              {/* `09:12 → 09:41` with `1 hr 26 min` beside it: one line, one mark — and the
                  heaviest on the card, because the times are what the eye scans for. */}
              <SkeletonBar width={220} height={24} shape="pill" />
            </div>
            <div className="journey-card__tags">
              {/*
                `Fastest`, as one mark — and the heart's own 44px slot, left empty. The slot is what
                gives this row the height the card needs. A grey disc alone at the far edge was the
                loudest speck on the card, and a held card does not need to announce a control.
              */}
              <SkeletonBar width={100} height={16} shape="pill" phase={0.48} />
              <span className="journey-card__save journey-card__save--held" />
            </div>
          </div>
          <div className="journey-card__meta">
            {/* The vehicles in the order they are taken, and what the trip costs. */}
            <SkeletonBar width={190} height={16} shape="pill" phase={0.95} />
            <SkeletonBar width={58} height={16} shape="pill" phase={1.43} />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

/**
 * **The one list that really waits: the stop picker's address lookup.**
 *
 * The picker asks a map database on the network for street addresses, which is the app's only
 * list that is genuinely pending (the planner and the stop search are local). Its rows are the
 * circle-and-two-lines shape a traveller already knows from every other loading screen: the
 * marker's disc, the name, the meta line — grey, in the places the addresses will land.
 *
 * Rendered inside the picker's own `<ul role="listbox">`, so the held rows sit in the list rather
 * than beside it; they are `aria-hidden`, and the sentence that tells a screen reader what is
 * happening stays at the call site.
 */
export function PickerRowSkeletons({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="picker__item" aria-hidden="true">
          <span className="picker-row picker-row--held">
            <SkeletonBar width={32} height={32} shape="circle" />
            <span className="stack-1 grow">
              <SkeletonBar width="56%" height={12} />
              <SkeletonBar width="34%" height={10} />
            </span>
            <SkeletonBar width={18} height={18} shape="circle" />
          </span>
        </li>
      ))}
    </>
  );
}

/**
 * **A stop card, held at the card's own measurements.**
 *
 * This is the one hold in the app that has to be *exactly* the height of the card it stands in
 * for, and the earlier version was not: it drew three fixed pills and three fixed rows, so a card
 * with six badges on two lines, or a stop with no board at all, arrived a whole line away from the
 * place it had been held. A pixel or two was tolerated there on the grounds that nobody could see
 * it, which is the wrong standard — a held shape that is the wrong height is a list that jumps,
 * whether or not the eye catches the jump.
 *
 * So the hold is given **the stop it is holding** and draws the card's real shape, the way the
 * card itself would:
 *
 *   · the badges are the card's real chips — the same icon, the same label, the same padding —
 *     with the ink taken out (`stop-skeleton__badge`), so they are exactly as wide and as tall as
 *     the coloured ones and they wrap in exactly the same places;
 *   · the board is the card's real rows — time, destination, delay, platform, cancelled — with the
 *     ink taken out and one grey mark drawn over them (`stop-skeleton__row`), so every row is
 *     exactly as tall as the departure it stands in for, whatever it says;
 *   · the head keeps the heart's own 44px slot, which is what gives that row its height, and the
 *     foot keeps the controls' 44px.
 *
 * All of it is `aria-hidden`: a hold is a picture of the card, and a screen reader is told what is
 * happening in words at the call site, not in grey.
 */
export interface HeldStopCard {
  stop: Stop;
  /** The departures the card will draw — empty for a stop with no board, and held as empty. */
  departures: Departure[];
}

export function StopCardSkeletons({ cards }: { cards: HeldStopCard[] }) {
  const t = useT();
  const format = useFormat();

  return (
    <ul className="grid-2 stops-grid skeleton-grid" aria-hidden="true">
      {cards.map(({ stop, departures }) => (
        <SkeletonCard as="li" key={stop.id} className="stop-skeleton">
          <div className="between wrap stop-card__head">
            <div className="stack-1">
              {/*
                The card's own name and meta line, with the ink taken out — not two bars of a
                guessed length. A long name wraps exactly where the real one wraps, and the meta
                is exactly as wide as the words in it, so the head is the head of the card that
                replaces it at every width.
              */}
              <span className="t-strong tap-target stop-skeleton__ink">
                {customStopName(stop.id) ?? stop.name}
              </span>
              <span className="t-sm t-muted stop-card__meta stop-skeleton__ink">
                {customStopName(stop.id) ? `${stop.name} · ` : ''}
                {stop.city} · {stop.code} · {stopTypeLabel(stop.type)}
              </span>
            </div>
            {/* The heart's own 44px target, empty: the slot is what gives this row the height a
                real card's row has, and a lone 18px disc at the edge was the loudest speck on the
                card (the journey card drops its disc for the same reason). */}
            <span className="stop-skeleton__action" />
          </div>

          {/* The row is drawn when the card draws it: a stop with no chips has no badge row. */}
          {stop.modes.some((mode) => mode !== 'walk' && mode !== 'bike') || stop.ovFiets ? (
            <div className="row-wrap">
              {stop.modes
                .filter((mode) => mode !== 'walk' && mode !== 'bike')
                .map((mode) => (
                  /* The real chip, with `stop-skeleton__badge` taking its ink out. */
                  <span key={mode} className={`mode-badge mode-badge--${mode} stop-skeleton__badge`}>
                    <ModeIcon mode={mode} size={13} />
                    {t(modeLabel(mode))}
                  </span>
                ))}
              {stop.ovFiets ? (
                <Pill tone="outline" className="stop-skeleton__badge">
                  OV-fiets
                </Pill>
              ) : null}
            </div>
          ) : null}

          {departures.length ? (
            <ul className="stop-card__board">
              {departures.map((departure) => (
                /*
                  The card's own row, word for word — the times, the destination, the delay and
                  the platform are what give the row its width and height, so they are all here,
                  transparent, rather than a bar of a guessed length.
                */
                <li key={departure.id} className="stop-card__departure stop-skeleton__row">
                  <span className={`t-mono-num${departure.cancelled ? ' strike' : ''}`}>
                    {format.time(departure.cancelled ? departure.planned : departure.expected)}
                  </span>
                  <span className="grow">{departure.destinationLabel}</span>
                  {departure.delayMinutes > 0 && !departure.cancelled ? (
                    <span className="delay">+{departure.delayMinutes}</span>
                  ) : null}
                  {departure.cancelled ? (
                    <span className="delay">{t('Cancelled')}</span>
                  ) : (
                    <span className="t-sm t-faint">P{departure.platform}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="row-wrap stop-skeleton__foot">
            {/* `Board` and `Plan` — two words, so two lines rather than two pills: the real pair is
                text-only, and a grey capsule standing in for a word reads as a button that is not
                there. The row keeps the controls' height (`stop-skeleton__foot` in the stylesheet). */}
            <SkeletonBar width={62} height={12} />
            <SkeletonBar width={48} height={12} />
          </div>
        </SkeletonCard>
      ))}
    </ul>
  );
}
