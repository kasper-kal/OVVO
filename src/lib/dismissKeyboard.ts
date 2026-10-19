/**
 * Put the on-screen keyboard away.
 *
 * A phone keyboard belongs to the focused **field**, and it outlives the thing the field was for:
 * a suggestion list closes on a choice but the input keeps focus, so the keyboard stayed up over
 * the board the station had just opened, over the map a search had just centred, and over the
 * results a pair had just asked for ("The keyboard should automatically close once a station is
 * chosen, with the board too, and this happens with other things too").
 *
 * Nothing in the DOM says a keyboard is up, so the honest test is the one the platform itself
 * uses: a **coarse pointer that cannot hover** — a finger. The act is a blur of whichever field
 * still has focus.
 *
 * Touch only, on purpose. On a desktop, focus is the keyboard navigation order, and taking it away
 * after a click would drop a keyboard user back to the top of the page and make them tab through
 * the whole screen again. `coarse` is a capability, not a width: a touch laptop gets the blur, and
 * a narrow window driven by a mouse does not.
 */
export function dismissKeyboard(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!window.matchMedia?.('(hover: none) and (pointer: coarse)').matches) return;
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return;
  /* Only a field can hold a keyboard; blurring a button would move focus for no reason. */
  if (!active.matches('input, textarea, select, [contenteditable="true"], [contenteditable=""]')) return;
  active.blur();
}
