import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './primitives';
import { useOverlay } from '../../lib/useOverlay';
import { useT } from '../../lib/useT';

/**
 * A screen that takes over everything — the OVVO mark, the dock, the lot — with a back
 * arrow on the left and a centred title, the shape the 9292 picker uses.
 *
 * The map screen is the reason this is not the ordinary `Dialog`: a picker needs the
 * whole viewport and its own header, and the sheet is a screen you can be in rather than
 * a panel over one. Escape goes back, like the arrow.
 *
 * The five overlay facts — initial focus, a real trap, Escape, focus return and a locked
 * document — come from `lib/useOverlay`, the same hook `Dialog` uses. They used to be missing
 * here (27.1, 28.1, 29.1, 30.8): the keyboard left through the page behind, the page scrolled
 * under a fixed screen, and every exit dropped focus on `<body>` instead of the row that opened
 * it. A screen that wants its field focused on open still wins: the hook leaves an already
 * focused element inside the panel alone.
 */
export function FullScreen({
  title,
  onClose,
  right,
  children,
  label,
  flush = false,
}: {
  title: string;
  onClose: () => void;
  /** Top-right slot (the map's "centre the network" control). */
  right?: ReactNode;
  children: ReactNode;
  /** Announced name when the visible title is not enough. */
  label?: string;
  /**
   * The body does not scroll and carries no padding: the screen's child owns every pixel.
   *
   * The picture screens need this — a photograph that can be dragged and a loupe that follows a
   * pointer cannot live inside a scroller, where a finger moving over them would pan the page
   * instead of a picture. A plain document-shaped screen (the colour picker) keeps the default.
   */
  flush?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const t = useT();
  useOverlay(true, panel, onClose);

  /*
   * **A full-screen screen is rendered at the top of the document, not inside the card that opened
   * it.**
   *
   * It used to be a child of whatever opened it — the stop picker lived inside the planner's card —
   * so it inherited that card's derived ink ramp: with a black primary colour the card's ink is
   * light, and the picker's own cream surface then carried `#a9c0a8` text at **1.88:1** (measured;
   * the screenshot of "Use my current location" greyed out). A screen with its own surface has to
   * own its own tokens, and the only way a node inherits none of a card's is to not be inside it.
   * Porting to `body` also puts the overlay above every stacking context instead of inside one.
   */
  const body = (
    <div
      className={`fullscreen${flush ? ' fullscreen--flush' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={label ?? title}
      tabIndex={-1}
      ref={panel}
    >
      <div className="fullscreen__bar">
        {/* `back-arrow` is the app's one back-control shape (see the stylesheet); this bar is
            where that shape came from, and `fullscreen__back` only places it in the grid.

            The name is translated here, once, because this bar is shared by four screens: a
            literal "Back" left the one control on the Dutch stop picker, the photo sampler and
            the crop in English (28.6, 29.7, 30.7). */}
        <IconButton icon="arrowLeft" label={t('Back')} onClick={onClose} className="back-arrow fullscreen__back" />
        <h2 className="fullscreen__title">{title}</h2>
        <div className="fullscreen__slot">{right ?? <span className="fullscreen__spacer" aria-hidden="true" />}</div>
      </div>
      <div className="fullscreen__body">{children}</div>
    </div>
  );
  /* A server render (see `scripts/render-check.ts`) has no document to portal onto. */
  return typeof document === 'undefined' ? body : createPortal(body, document.body);
}
