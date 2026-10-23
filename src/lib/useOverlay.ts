import { useEffect, useRef, type RefObject } from 'react';
import { dismissKeyboard } from './dismissKeyboard';

/*
 * One behaviour for every overlay in the app.
 *
 * The audit found the same five defects on Dialogs 13–26, on FullScreen 27–30 and on the home
 * layout menu: nothing was focused on open, Tab walked the page *behind* a dialog declared
 * `aria-modal="true"`, Escape closed the panel and dropped focus on `<body>`, the trigger that
 * opened it was never focused again, and a wheel over the scrim scrolled the page underneath.
 * None of that is a per-screen mistake — it is the shared container's job, and it was missing
 * from both shared containers (`ui/primitives` `Dialog` and `ui/FullScreen`). This hook is that
 * job, so a screen cannot be written without it: both containers call it, and they are the only
 * two containers the app has.
 */

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableInside(panel: HTMLElement | null): HTMLElement[] {
  if (!panel) return [];
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (node) =>
      !node.hasAttribute('hidden') &&
      node.getAttribute('aria-hidden') !== 'true' &&
      // A control in a collapsed disclosure is still in the DOM; offsetParent is null for it.
      (node.offsetWidth > 0 || node.offsetHeight > 0 || node.getClientRects().length > 0),
  );
}

/* The stack is what makes nested overlays work: the photo sampler opens over the widgets
   dialog, the colour picker opens over the background screen. Only the top layer answers
   Escape or owns the trap, and the document is unlocked when the last one closes. */
const openStack: HTMLElement[] = [];
let lockDepth = 0;
let savedScrollY = 0;
let savedBody: { overflow: string; paddingRight: string; overscroll: string } | null = null;
let savedRootOverflow = '';

function lockDocument(): void {
  if (lockDepth++ > 0) return;
  const root = document.documentElement;
  const body = document.body;
  savedScrollY = window.scrollY;
  savedRootOverflow = root.style.overflow;
  savedBody = {
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
    overscroll: body.style.overscrollBehavior,
  };
  const scrollbar = window.innerWidth - root.clientWidth;
  root.style.overflow = 'hidden';
  body.style.overflow = 'hidden';
  body.style.overscrollBehavior = 'contain';
  /* The scrollbar disappearing would otherwise pull every centred card 8px sideways. */
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
}

function unlockDocument(): void {
  if (lockDepth === 0) return;
  lockDepth -= 1;
  if (lockDepth > 0) return;
  const root = document.documentElement;
  root.style.overflow = savedRootOverflow;
  if (savedBody) {
    document.body.style.overflow = savedBody.overflow;
    document.body.style.paddingRight = savedBody.paddingRight;
    document.body.style.overscrollBehavior = savedBody.overscroll;
  }
  savedBody = null;
  /* Restoring `overflow` can reset the scroll offset in some engines; put it back. */
  window.scrollTo({ top: savedScrollY, behavior: 'auto' });
}

/* What a phone's keyboard belongs to: the same list `dismissKeyboard` blurs. */
const FIELD = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]';

export function useOverlay(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
): () => void {
  /*
   * The close handler is held in a ref so the effect depends on `open` alone. Call sites pass
   * an inline arrow, which is a new function every render; depending on it would tear the
   * effect down and rebuild it on every keystroke, moving focus and re-locking the document.
   */
  const close = useRef(onClose);
  close.current = onClose;
  /*
   * The control that will get the focus back when this overlay closes — read by `requestClose`
   * below, which is called from a button press rather than from inside the effect.
   */
  const restoreRef = useRef<HTMLElement | null>(null);

  /*
   * **A sheet closing is not a typing moment.**
   *
   * Closing a screen while its field still has the caret used to leave the field focused and the
   * screen was simply taken out of the page — no blur, ever. A phone's keyboard belongs to that
   * field, so it stayed up over whatever the screen had been covering: the full-screen stop picker
   * is opened *over* the results, so cancelling it left the keyboard sitting on "Journey results"
   * (reported as "sometimes the keyboard stays when you're already in journey results"). Measured
   * with taps dispatched without a focus change, the way a thumb behaves: on the picker's back
   * arrow **no blur was raised by the app at all**, and the field went away still focused. The
   * browser moves focus afterwards, which is clean-up and not an answer.
   *
   * The one case that keeps the keyboard on purpose is the caret going **back into a field** — a
   * sheet opened over a search box returns to that box, and blurring it would close the keyboard
   * only to reopen it a frame later. `restoreRef` is how that is known before the focus moves.
   */
  const requestClose = () => {
    const trigger = restoreRef.current;
    if (!trigger || !trigger.matches(FIELD)) dismissKeyboard();
    close.current();
  };

  useEffect(() => {
    if (!open) return undefined;
    const panel = panelRef.current;
    const restoreTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    restoreRef.current = restoreTo;

    lockDocument();
    openStack.push(panel ?? document.body);

    /*
     * Focus moves once the overlay is in the document. `data-autofocus` wins (a field a screen
     * wants the caret in); otherwise the first focusable control — for these panels the close
     * button, which is a control the traveller can act on at once. The panel itself is the last
     * resort, so a screen with no controls still takes the keyboard.
     */
    let frame = 0;
    const placeFocus = () => {
      frame = window.requestAnimationFrame(() => {
        if (!panel) return;
        /* A screen that focused its own field in the same commit keeps it. */
        if (document.activeElement && panel.contains(document.activeElement)) return;
        const target =
          panel.querySelector<HTMLElement>('[data-autofocus]') ?? focusableInside(panel)[0] ?? panel;
        target.focus({ preventScroll: true });
      });
    };
    placeFocus();

    const onKeyDown = (event: KeyboardEvent) => {
      /* Only the topmost overlay reacts — the one underneath keeps its state untouched. */
      if (openStack[openStack.length - 1] !== (panel ?? document.body)) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        /* The same act as the close button (see `requestClose`). */
        if (!restoreTo || !restoreTo.matches(FIELD)) dismissKeyboard();
        close.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const stops = focusableInside(panel);
      if (stops.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      const first = stops[0];
      const last = stops[stops.length - 1];
      const active = document.activeElement;
      const outside = !panel.contains(active ?? null);

      if (event.shiftKey) {
        if (outside || active === first) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else if (outside || active === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    /*
     * The document is locked, so this is belt and braces: a wheel over the scrim must not move
     * the page even where `overflow: hidden` on the root is ignored. A wheel *inside* a panel
     * that can scroll stays the panel's own.
     */
    const onWheel = (event: WheelEvent) => {
      const top = openStack[openStack.length - 1];
      if (!top || top === document.body) {
        event.preventDefault();
        return;
      }
      if (top.contains(event.target as Node)) {
        const scroller = (event.target as HTMLElement).closest<HTMLElement>(
          '.modal, .fullscreen__body, .sheet__body, [data-overlay-scroll]',
        );
        if (scroller && scroller.scrollHeight > scroller.clientHeight) return;
      }
      event.preventDefault();
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('wheel', onWheel, { capture: true, passive: false });

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('wheel', onWheel, true);
      const index = openStack.lastIndexOf(panel ?? document.body);
      if (index >= 0) openStack.splice(index, 1);
      unlockDocument();
      /*
       * Whatever closed it — Escape, the ×, the scrim, a row that navigates — the keyboard goes
       * back to the control that opened the overlay, when that control still exists. A deleted
       * trigger has nothing to return to, and focus then stays where the browser puts it rather
       * than being sent to the top of the document.
       */
      if (restoreTo && document.contains(restoreTo) && !restoreTo.closest('[aria-hidden="true"]')) {
        restoreTo.focus({ preventScroll: true });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* The containers' × , back arrow and scrim close through this (see `requestClose`). */
  return requestClose;
}
