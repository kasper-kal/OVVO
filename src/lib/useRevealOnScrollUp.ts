import { useEffect, useState } from 'react';

/** One wheel `line`, for the wheels that count their travel in lines rather than pixels. */
const LINE = 16;

/**
 * A control that has to be reached for from the top of the page.
 *
 * The **gesture** summons it, and the gesture only exists at the top: the traveller has to be
 * at the top of the page already and then keep pulling up a little further. Direction alone is
 * not enough to express that — midway down a long board, an upward scroll is just a scroll —
 * which is exactly how the control used to arrive uninvited every time someone scrolled up
 * from the bottom of the page. So the pull is only banked while the page is at the top:
 *
 *   * **At the top.** `scrollY` above `top` throws the pull away and puts the control back, so
 *     scrolling up anywhere else in the page neither reveals it nor keeps it.
 *   * **Keep pulling.** The first `pull` px of upward movement at the top are spent getting
 *     there; past that the control comes in, and it stays until something takes it away.
 *   * **Coming back is a gesture too.** Returning to the top does not re-reveal it: the page
 *     has to be at the top *and then* pulled again. Banked movement is what measures that.
 *   * **A short page can still make the gesture.** Wheel and touch are listened to directly,
 *     rather than inferred from scrolling, so a board with three departures on it — a page
 *     with no room to move — is not simply handed the control for being short.
 */
export function useRevealOnScrollUp({
  pull = 28,
  release = 10,
  top = 2,
}: {
  /** Upward px at the top of the page that reveal the control. */
  pull?: number;
  /** Downward px that take it away again. */
  release?: number;
  /** How close to the top still counts as the top. */
  top?: number;
} = {}): boolean {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let shown = false;
    let pulled = 0;
    let dropped = 0;
    /* Touch has no delta of its own: where the finger was is the whole measurement. */
    let lastTouchY: number | null = null;

    const clear = () => {
      pulled = 0;
      dropped = 0;
    };

    const reveal = () => {
      clear();
      if (shown) return;
      shown = true;
      setRevealed(true);
    };

    const hide = () => {
      clear();
      if (!shown) return;
      shown = false;
      setRevealed(false);
    };

    const atTop = () => window.scrollY <= top;

    /* One number, two gestures: a pull is positive, a push back is negative. */
    const bank = (movement: number) => {
      if (!atTop()) {
        hide();
        return;
      }
      if (movement > 0) {
        dropped = 0;
        pulled += movement;
        if (pulled >= pull) reveal();
      } else if (movement < 0) {
        pulled = 0;
        dropped += -movement;
        if (dropped >= release) hide();
      }
    };

    const onScroll = () => {
      /* Arriving at the top ends the page's own scrolling; what happens next is a gesture, so
         the pull starts from zero here rather than inheriting the run up to the top. */
      if (atTop()) clear();
      else hide();
    };

    /*
     * A wheel reports its travel in whichever unit it likes: a trackpad in pixels, a mouse in
     * lines, a page-down key in pages. The thresholds are in pixels, so the other two are
     * converted — otherwise one notch of a real mouse wheel (three lines) would count as three
     * pixels and the control would need ten notches to appear.
     */
    const wheelPixels = (event: WheelEvent) => {
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * LINE;
      if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
      return event.deltaY;
    };

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) return;
      /* Wheel up is a pull: the page's content moves down under the finger. */
      bank(-wheelPixels(event));
    };

    const onTouchStart = () => {
      lastTouchY = null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (y === undefined) return;
      if (lastTouchY === null) {
        lastTouchY = y;
        return;
      }
      const movement = y - lastTouchY;
      lastTouchY = y;
      bank(movement);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [pull, release, top]);

  return revealed;
}
