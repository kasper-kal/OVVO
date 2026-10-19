import { useEffect, type ReactNode } from 'react';
import { IconButton } from './primitives';

/**
 * A screen that takes over everything — the OVVO mark, the dock, the lot — with a back
 * arrow on the left and a centred title, the shape the 9292 picker uses.
 *
 * The map screen is the reason this is not the ordinary `Dialog`: a picker needs the
 * whole viewport and its own header, and the sheet is a screen you can be in rather than
 * a panel over one. Escape goes back, like the arrow. The container is not focus-trapped:
 * the two screens that use it put the caret in a field themselves.
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
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className={`fullscreen${flush ? ' fullscreen--flush' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={label ?? title}
    >
      <div className="fullscreen__bar">
        {/* `back-arrow` is the app's one back-control shape (see the stylesheet); this bar is
            where that shape came from, and `fullscreen__back` only places it in the grid. */}
        <IconButton icon="arrowLeft" label="Back" onClick={onClose} className="back-arrow fullscreen__back" />
        <h2 className="fullscreen__title">{title}</h2>
        <div className="fullscreen__slot">{right ?? <span className="fullscreen__spacer" aria-hidden="true" />}</div>
      </div>
      <div className="fullscreen__body">{children}</div>
    </div>
  );
}
