import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/*
 * The chunk rule, in one place: five rows.
 *
 * "When a screen shows 1 at a time, load 5; when a screen shows 2 at a time, load 10; when a
 * screen shows 3 at a time, load 15" — the number that loads follows the number the layout puts
 * side by side, so every list in the app is **five rows deep**, whatever the screen is doing. A
 * phone with one card per row loads five; a wide screen laying three out loads fifteen; a chip
 * row that wraps two to a line loads ten.
 *
 * It is a formula rather than a number, and it is read off the laid-out element rather than from
 * a breakpoint, because the layout is what decides: the batch and the grid cannot drift apart,
 * and a resize re-reads it for free (`usePerRow` re-measures on resize, on a container change and
 * on the next frames).
 */
export const ROWS_PER_LOAD = 5;

/** How many items a layout showing `perRow` side by side loads at a time. */
export function loadCount(perRow: number, rows: number = ROWS_PER_LOAD): number {
  return Math.max(1, Math.round(perRow)) * rows;
}

/**
 * How many items the element puts side by side, measured from what is on screen.
 *
 * Two layouts, two readings: a grid answers with its own track list, and anything that wraps
 * answers with the number of items sitting on the first item's top edge. `null` means "not laid
 * out yet" (no tracks, no box) — the caller keeps the number it had rather than reading a
 * half-drawn element as a one-column layout, which is a defect this rule has already produced
 * once: the first frame answered nothing and the page settled on one column's worth of cards
 * while the grid drew three.
 */
export function measurePerRow(node: HTMLElement, itemSelector?: string): number | null {
  const items = [...node.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement && (!itemSelector || child.matches(itemSelector)),
  );
  if (items.length === 0) return null;

  const tracks = getComputedStyle(node)
    .gridTemplateColumns.split(' ')
    .filter((track) => track && track !== 'none');
  if (tracks.length) return tracks.length;

  const first = items[0].getBoundingClientRect();
  if (!first.width && !first.height) return null;
  const top = Math.round(first.top);
  return items.filter((item) => Math.round(item.getBoundingClientRect().top) === top).length;
}

/**
 * The measured "at a time" count for one element, kept current as the layout changes.
 *
 * The element is held as state through a callback ref rather than read from a `useRef` box, and
 * for a reason a check found: the carrier row on the results screen only exists once the Options
 * panel is opened, and a hook that reads `ref.current` in an effect with an empty dependency list
 * measures `null`, keeps its initial one, and never looks again — the row then loads five chips
 * while the layout shows twenty-five. A node that arrives later re-runs the effect.
 */
export function usePerRow<T extends HTMLElement>(
  itemSelector?: string,
): { ref: (node: T | null) => void; perRow: number } {
  const [node, setNode] = useState<T | null>(null);
  const [perRow, setPerRow] = useState(1);

  useEffect(() => {
    if (!node || typeof window === 'undefined') return undefined;
    const read = () => {
      const measured = measurePerRow(node, itemSelector);
      if (measured !== null) setPerRow(measured);
    };
    read();
    const frames: number[] = [];
    frames.push(requestAnimationFrame(() => frames.push(requestAnimationFrame(read))));
    window.addEventListener('resize', read);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(read);
    observer?.observe(node);
    return () => {
      frames.forEach((frame) => cancelAnimationFrame(frame));
      window.removeEventListener('resize', read);
      observer?.disconnect();
    };
  }, [node, itemSelector]);

  return { ref: setNode, perRow };
}

/**
 * A list that grows five rows at a time.
 *
 * `shown` is what is on screen, `next` is what one press adds (`min(batch, hidden)` — the button
 * says the number it will bring), `loadMore` appends exactly one batch and never the whole rest,
 * which is what "load 5" means, and `collapse` goes back to the first batch. `grown` is `null`
 * until a press, so a resize re-sizes the first batch instead of freezing it.
 */
export function useChunkedList<T>(
  items: readonly T[],
  itemSelector?: string,
): {
  /** Give this to the element whose children are the items. */
  ref: (node: HTMLElement | null) => void;
  perRow: number;
  batch: number;
  shown: readonly T[];
  hidden: number;
  next: number;
  hasMore: boolean;
  expanded: boolean;
  loadMore: () => void;
  collapse: () => void;
  reset: () => void;
} {
  const { ref, perRow } = usePerRow<HTMLElement>(itemSelector);
  const batch = loadCount(perRow);
  const [grown, setGrown] = useState<number | null>(null);

  const count = grown ?? batch;
  const shown = items.length > count ? items.slice(0, count) : items;
  const hidden = items.length - shown.length;

  const loadMore = useCallback(() => setGrown((current) => (current ?? batch) + batch), [batch]);
  const collapse = useCallback(() => setGrown(null), []);
  const reset = collapse;

  return {
    ref,
    perRow,
    batch,
    shown,
    hidden,
    next: Math.min(batch, hidden),
    hasMore: hidden > 0,
    expanded: grown !== null,
    loadMore,
    collapse,
    reset,
  };
}

/**
 * The chunked list, plus the two things that turn it into an endless-feeling one: the sentinel
 * the loader watches, and the scroll that arms it.
 *
 * "The rest load once you start scrolling down" — so the observer is armed by a scroll. A tall
 * desktop window can otherwise hold a batch and the sentinel at once and pull the whole list in
 * without anybody asking; before the first scroll the button is the way to more.
 *
 * It lives here, in one place, because two screens now grow their lists this way — Stations &
 * stops and the alerts list — and a rule with two copies is two rules. The button below the list
 * stays a real button: the sentinel is a convenience on top of it, not the only way to more.
 */
export function useLoadOnScroll<T>(
  items: readonly T[],
  itemSelector?: string,
): ReturnType<typeof useChunkedList<T>> & {
  /** Give this to an empty element at the foot of the list. It has no look of its own. */
  sentinelRef: RefObject<HTMLDivElement | null>;
  /** True once the page has been scrolled at all — what arms the loader. */
  hasScrolled: boolean;
} {
  const list = useChunkedList(items, itemSelector);
  const { hasMore, loadMore, shown } = list;
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mark = () => setHasScrolled(true);
    window.addEventListener('scroll', mark, { once: true, passive: true });
    return () => window.removeEventListener('scroll', mark);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || !hasScrolled || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: '400px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, hasScrolled, loadMore, shown.length]);

  return { ...list, sentinelRef, hasScrolled };
}
