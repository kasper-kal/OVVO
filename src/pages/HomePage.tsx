import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { Button, Card, Dialog, IconButton, Panel } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { WIDGETS, WIDGET_CATEGORIES, WidgetTierContext, widgetById } from '../widgets/registry';
import type { WidgetSize, WidgetTier, WidgetWidth } from '../state/types';
import { NETWORK } from '../data/network';
import { DISRUPTIONS } from '../data/disruptions';
import { STOPS } from '../data/stops';
import { plural } from '../lib/format';
import { useT } from '../lib/useT';

/** How long the home screen has to be held before it opens its customising mode. */
const HOLD_MS = 1000;

/** How long before the hold becomes deliberate enough to say so on screen. */
const HOLD_HINT_MS = 350;

/**
 * The four widths, smallest first — the ladder the corner walks.
 *
 * Whether a card may take one of them is its own business: each widget declares a `resizeFrom`
 * device width, and below that it is drawn full width at its default height. The stored value is
 * never rewritten by the window, so a size chosen on a laptop is waiting when the card is next
 * shown on one.
 */
const WIDTHS: WidgetWidth[] = [4, 6, 8, 12];

/** Every tier, smallest first. Every widget offers all three; they differ in what a tier shows. */
const TIERS: WidgetTier[] = ['compact', 'standard', 'tall'];

/** How far the corner travels before the card shows one more row (the content threshold). */
const TIER_STEP_PX = 56;

/** The tier names, in the dictionary's own words — used only for the screen-reader announcement. */
const TIER_LABEL: Record<WidgetTier, string> = { compact: 'Compact', standard: 'Standard', tall: 'Tall' };

/** A press that moves further than this is a scroll, not a hold. */
const HOLD_SLOP_PX = 12;

/** A press that moves further than this is a drag, not a tap on a widget. */
const DRAG_SLOP_PX = 8;

/**
 * What a press must *not* land on to count as "the home screen itself": controls do their own
 * thing on press, and a widget is content rather than the surface — holding a widget must not
 * put the screen into customising (asked for by name). Handles are exempt at the call site.
 */
const NO_PRESS =
  'a, button, input, select, textarea, label, summary, [role="button"], [contenteditable="true"]';

/**
 * The home screen: a grid of widgets the traveller can customise.
 *
 * Layout is a 12-column grid — widgets declare a span of 4, 6, 8 or 12 and
 * collapse to a single column on narrow screens. Customising is deliberately
 * quiet: one small control at the foot turns on a mode in which every widget
 * shows the same remove button in the same place, the catalogue ("Add widget")
 * becomes reachable, and each widget can be **dragged into a new slot**.
 *
 * There are two ways in, because a control at the foot of a 2400px page is not
 * a way in at all on a phone: press the control, or **press and hold the home
 * screen itself for one second** — the gesture a phone's home screen uses, and
 * the one that was asked for. The hold is measured on the surface (the page
 * around and between widgets), not on what is drawn on it, so holding a widget
 * does nothing at all.
 */
export function HomePage() {
  const { homeWidgets, addHomeWidget, removeHomeWidget, moveHomeWidget, resetHomeWidgets, widgetSizes, setWidgetSize } =
    useApp();
  const t = useT();
  const [params] = useSearchParams();
  const [editing, setEditing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  /* The layout while a widget is being dragged. It is local — nothing is written to storage
     until the card is dropped — and it is what the grid renders, so the widgets step out of the
     way as the hand passes them rather than on release. */
  const [previewOrder, setPreviewOrder] = useState<string[] | null>(null);
  const order = previewOrder ?? homeWidgets;
  /* The drop can be run from a window listener (see the drag effect below), where the render's
     own `previewOrder` is the one from when the listener was attached, not the latest. */
  const previewRef = useRef<string[] | null>(previewOrder);
  previewRef.current = previewOrder;

  const focusWidget = params.get('widget');
  const requestedStop = params.get('stop');
  const requestedJourney = params.get('journey');

  /** Deep links such as "view on map" land here and point at the map widget. */
  useEffect(() => {
    if (!focusWidget) return undefined;
    setFlash(focusWidget);
    const target = document.getElementById(`widget-${focusWidget}`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = window.setTimeout(() => setFlash(null), 2600);
    return () => window.clearTimeout(timer);
  }, [focusWidget, requestedStop, requestedJourney]);

  const visible = useMemo(
    () => order.map((id) => widgetById(id)).filter((widget): widget is NonNullable<typeof widget> => Boolean(widget)),
    [order],
  );
  const available = WIDGETS.filter((widget) => !homeWidgets.includes(widget.id));

  /* ------------------------------------------------------------- hold to edit */
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const hintTimer = useRef<number | null>(null);
  const holdPoint = useRef<{ x: number; y: number } | null>(null);

  /* Timers only — this runs on unmount, where setting state would be a leak. */
  const clearHoldTimers = useCallback(() => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (hintTimer.current !== null) {
      window.clearTimeout(hintTimer.current);
      hintTimer.current = null;
    }
    holdPoint.current = null;
  }, []);

  const cancelHold = useCallback(() => {
    clearHoldTimers();
    setHolding(false);
  }, [clearHoldTimers]);

  /*
   * **The surface, in one place**, because two gestures use it: the one that enters customising and
   * the one that leaves it. "Every pixel the hold works on" is the tap's surface too — same filter,
   * same exemptions — so the two can never disagree about where the home screen itself is.
   *
   * Controls do their own thing on press, and a widget is content rather than the surface (holding
   * or tapping a widget must not put the screen into customising); a dialogue, a menu, the sidebar
   * and the dock are none of the surface either. What is left is the shell around the routed page —
   * the band above and beside the mark, the page column and the empty strip under the last widget.
   * That strip used to be excluded ("anything inside `.app-body`"), so holding the bottom of the
   * page started no clock at all: measured at 20px under the "Customise home" control, the element
   * there is `.app-main`'s own padding, and the `.home-surface` box had already ended above it.
   */
  const isHomeSurface = useCallback((target: Element) => {
    if (target.closest('.widget, .overlay, [role="dialog"], [role="menu"], .app-sidebar, .app-dock')) return false;
    if (target.closest(NO_PRESS)) return false;
    return Boolean(target.closest('.app-shell'));
  }, []);

  /*
   * The hold is measured **on the document**, not on the home screen's wrapper.
   *
   * The screen's own box starts below the app header, so a press on the empty space around the
   * mark — the widest empty surface the home screen has — did nothing at all. A listener on the
   * document, filtered to the shell that holds the routed page and away from anything that acts on
   * a press, makes every part of the page count without making the sidebar, the dock or a dialogue
   * part of the gesture.
   *
   * One second from the press, exactly: `HOLD_MS` is on the `pointerdown`, the hint only says
   * that the clock is running, and nothing between the press and the mode re-arms the timer.
   */
  useEffect(() => {
    if (editing) return undefined;

    const onDown = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const target = event.target as Element | null;
      if (!target || !isHomeSurface(target)) return;

      clearHoldTimers();
      holdPoint.current = { x: event.clientX, y: event.clientY };
      hintTimer.current = window.setTimeout(() => setHolding(true), HOLD_HINT_MS);
      holdTimer.current = window.setTimeout(() => {
        clearHoldTimers();
        setHolding(false);
        setEditing(true);
        /* A short buzz is the confirmation a held gesture needs; a browser that refuses it simply
           does not vibrate. */
        try {
          navigator.vibrate?.(12);
        } catch {
          /* not available */
        }
      }, HOLD_MS);
    };

    const onMove = (event: PointerEvent) => {
      const start = holdPoint.current;
      if (!start) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > HOLD_SLOP_PX) cancelHold();
    };

    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', cancelHold);
    document.addEventListener('pointercancel', cancelHold);
    document.addEventListener('contextmenu', cancelHold);
    window.addEventListener('blur', cancelHold);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', cancelHold);
      document.removeEventListener('pointercancel', cancelHold);
      document.removeEventListener('contextmenu', cancelHold);
      window.removeEventListener('blur', cancelHold);
      clearHoldTimers();
      setHolding(false);
    };
  }, [editing, cancelHold, clearHoldTimers, isHomeSurface]);

  /*
   * Leaving is a **tap**, not a hold: in customising, a press and release on that same surface
   * finishes the mode, exactly as the Done button does. Arranging cards is a light activity — you
   * move one and want out — and holding the screen still for a second to leave a mode you are
   * already in is work a tap should not require.
   *
   * Three things it deliberately does not do:
   *   - **it never fires from the press that entered the mode.** This listener is attached while
   *     `editing` is true, one render after the held press completed, so the release of that press
   *     arrives with no `pointerdown` of its own on record and is ignored.
   *   - **a swipe is not a tap.** Movement past `HOLD_SLOP_PX` mid-press cancels it, so scrolling a
   *     long home screen while customising cannot drop the mode — the same rule, and the same
   *     number, that keeps a scroll from being read as a hold on the way in.
   *   - **a widget drag is not a tap on the surface.** A press that begins on a card never reaches
   *     this listener (`isHomeSurface` excludes `.widget`), and one that becomes a drag is refused
   *     explicitly, so dropping a card over empty space does not also close the mode.
   */
  useEffect(() => {
    if (!editing) return undefined;

    let press: { x: number; y: number; pointerId: number } | null = null;
    const onDown = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (dragActive.current) return;
      const target = event.target as Element | null;
      if (!target || !isHomeSurface(target)) return;
      press = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    };
    const onUp = (event: PointerEvent) => {
      const start = press;
      press = null;
      if (!start || event.pointerId !== start.pointerId) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > HOLD_SLOP_PX) return;
      if (dragActive.current) return;
      setEditing(false);
    };
    const onCancel = () => {
      press = null;
    };

    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancel);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onCancel);
    };
  }, [editing, isHomeSurface]);

  /* ------------------------------------------------------------ drag to reorder */
  /*
   * The drag re-sorts **while it happens**, the way a phone's home screen does: the hand moves
   * the card, the card's slot closes up behind it and the widgets it passes step out of the way,
   * and the drop only settles the layout that is already on screen.
   *
   * Two things make that possible without the card jumping out from under the finger:
   *
   *   1. The order being shown is *local* state (`previewOrder`), so a move is a re-render and
   *      not a write to storage — nothing is saved until the drop.
   *   2. The card is positioned by hand — `transform`, written straight to the element, in a
   *      layout effect that runs **after** the re-order and **before** the paint — from where the
   *      card now sits in the grid to where the finger is. Without that second half, the block
   *      would leave a hole and the card would jump to the hole's new position on every swap.
   */
  const gridRef = useRef<HTMLDivElement>(null);
  const dragFrom = useRef<{ id: string; pointerId: number; x: number; y: number } | null>(null);
  const dragNode = useRef<HTMLElement | null>(null);
  /* The section the press started on — the card that is lifted, read before any re-order moves it. */
  const dragPendingNode = useRef<HTMLElement | null>(null);
  /** Where inside the card it was taken hold of, so it does not snap its corner to the finger. */
  const dragGrab = useRef({ x: 0, y: 0 });
  const dragPointer = useRef({ x: 0, y: 0 });
  /** The translate currently written to the card — subtracted back out to read its layout box. */
  const dragShift = useRef({ dx: 0, dy: 0 });
  const [drag, setDrag] = useState<string | null>(null);
  /* Whether the card has actually been lifted. A ref, not the state above: the state is one render
     behind for the second and third move of a burst, and re-running the "lift" branch with the
     card already transformed would recompute the grab point from the moved box. */
  const dragActive = useRef(false);

  /* ------------------------------------------------------------------ sizing */
  /**
   * The device width, measured once and then followed.
   *
   * Each widget declares the smallest device (`resizeFrom`) at which resizing is any use to it —
   * a departure row needs close to 700, a clock survives 480. Below that threshold a card is full
   * width at its default height and the corner is not offered, so the control cannot make a card
   * worse than leaving it alone.
   */
  const [viewport, setViewport] = useState(() => (typeof window === 'undefined' ? 1440 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setViewport(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /** What the traveller chose, or what the registry declares. */
  const sizeOf = (widget: { id: string; span: WidgetWidth }): WidgetSize => {
    const stored = widgetSizes[widget.id];
    return {
      w: stored?.w ?? widget.span,
      h: stored && TIERS.includes(stored.h) ? stored.h : 'standard',
    };
  };

  /**
   * The size being dragged, and the frame that will draw it.
   *
   * Pointer moves arrive faster than frames, and each one that reaches React re-renders the whole
   * grid — which is what made the first attempt feel like a stutter rather than a resize. So the
   * move only records the pointer; one `requestAnimationFrame` per frame computes the size and
   * renders it. Everything the eye sees is therefore at most one frame old, and at most once.
   */
  const corner = useRef<{
    id: string;
    pointerId: number;
    x: number;
    y: number;
    size: WidgetSize;
    heights: WidgetTier[];
  } | null>(null);
  const cornerPointer = useRef({ x: 0, y: 0 });
  const cornerFrame = useRef<number | null>(null);
  const [resize, setResize] = useState<{ id: string; size: WidgetSize } | null>(null);
  /* The phone's height control announces its own result through the same live region below. */
  const [sizeNote, setSizeNote] = useState('');
  const resizeLive = useRef<{ id: string; size: WidgetSize } | null>(null);

  const drawCorner = () => {
    cornerFrame.current = null;
    const start = corner.current;
    const grid = gridRef.current;
    if (!start || !grid) return;
    const gap = Number.parseFloat(window.getComputedStyle(grid).columnGap) || 16;
    const column = (grid.clientWidth - gap * 11) / 12;
    const step = column + gap;
    const dx = cornerPointer.current.x - start.x;
    const dy = cornerPointer.current.y - start.y;
    const widthIndex = WIDTHS.indexOf(start.size.w) + Math.round(dx / step);
    const w = WIDTHS[Math.max(0, Math.min(WIDTHS.length - 1, widthIndex))];
    /* Vertically the drag asks for *more content*, not a taller box: the card grows by a tier when
       the finger has travelled far enough, and its body shows the rows that tier allows. */
    const tierIndex =
      start.heights.indexOf(start.size.h) + Math.round(dy / TIER_STEP_PX);
    const h = start.heights[Math.max(0, Math.min(start.heights.length - 1, tierIndex))];
    const live = { id: start.id, size: { w, h } };
    if (resizeLive.current?.size.w === w && resizeLive.current?.size.h === h) return;
    resizeLive.current = live;
    setResize(live);
  };

  const beginCorner = (event: ReactPointerEvent<HTMLButtonElement>, widget: (typeof WIDGETS)[number]) => {
    if (!editing || !event.isPrimary) return;
    /* The card itself answers pointer-down with a *move*; resizing is not moving. */
    event.stopPropagation();
    event.preventDefault();
    const size = sizeOf(widget);
    corner.current = { id: widget.id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, size, heights: TIERS };
    cornerPointer.current = { x: event.clientX, y: event.clientY };
    resizeLive.current = { id: widget.id, size };
    setResize({ id: widget.id, size });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveCorner = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!corner.current) return;
    event.preventDefault();
    cornerPointer.current = { x: event.clientX, y: event.clientY };
    if (cornerFrame.current === null) cornerFrame.current = window.requestAnimationFrame(drawCorner);
  };

  const endCorner = () => {
    const start = corner.current;
    if (!start) return;
    if (cornerFrame.current !== null) {
      window.cancelAnimationFrame(cornerFrame.current);
      cornerFrame.current = null;
      /* The last pointer position has not been drawn yet; draw it now so the size that is saved
         is the size the finger was on, not the one from the frame before. */
      drawCorner();
    }
    corner.current = null;
    const live = resizeLive.current;
    resizeLive.current = null;
    setResize(null);
    if (!live) return;
    if (live.size.w === start.size.w && live.size.h === start.size.h) return;
    setWidgetSize(start.id, live.size);
  };

  /** Put the card back under the finger: its layout box (transform subtracted) to the pointer. */
  const placeCard = () => {
    const node = dragNode.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    const baseLeft = box.left - dragShift.current.dx;
    const baseTop = box.top - dragShift.current.dy;
    const dx = dragPointer.current.x - dragGrab.current.x - baseLeft;
    const dy = dragPointer.current.y - dragGrab.current.y - baseTop;
    dragShift.current = { dx, dy };
    node.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  };

  /* After the grid has re-flowed and before it is painted, so the card never shows a frame in
     the slot it has just left. */
  useLayoutEffect(() => {
    if (drag) placeCard();
  }, [drag, previewOrder]);

  /**
   * The slots the drag can land in, **measured once, when the card is lifted**.
   *
   * The grid re-sorts while the drag runs, so asking a card where it is now would ask a layout
   * that the drag itself just changed: drop on the map, the map moves up under the finger, and the
   * next move reads "the finger is on the map" again — the order flipped back and forth between
   * two slots. These are the zones as the hand found them, so the same place under the finger is
   * the same slot for the whole gesture, however much the grid re-flows around it.
   *
   * They are kept in **page** coordinates, not viewport ones, because the drag can scroll the
   * page under its own hand at the edges of the screen (see `edgeScroll`): a viewport box would
   * slide up past the finger while the finger stayed still.
   */
  const zones = useRef<Array<{ id: string; index: number; left: number; top: number; right: number; bottom: number }>>(
    [],
  );

  const captureZones = () => {
    const grid = gridRef.current;
    if (!grid) return;
    const offsetX = window.scrollX;
    const offsetY = window.scrollY;
    zones.current = Array.from(grid.querySelectorAll<HTMLElement>('[data-widget-id]')).map((slot, index) => {
      const box = slot.getBoundingClientRect();
      return {
        id: slot.dataset.widgetId ?? '',
        index,
        left: box.left + offsetX,
        right: box.right + offsetX,
        top: box.top + offsetY,
        bottom: box.bottom + offsetY,
      };
    });
  };

  /**
   * The slot a page point belongs to — the one it is in, or the nearest one when it is in none.
   *
   * The nearest fallback is what makes **the top slot as easy as any other**. The grid keeps the
   * cards' own boxes as its targets, and above the first card there is 96px of header and page
   * padding that belongs to no slot: dragging a widget to the top of the window used to need the
   * finger inside the first card's rectangle — a narrow band at the very top of a scrolled page —
   * while every other move only needed a card under the hand. With the gap closed by distance, the
   * top of the screen means the top slot. It is safe to be greedy here because these boxes do not
   * move during the drag: the same point is the same slot for the whole gesture, so the target
   * cannot flip back and forth.
   */
  const zoneUnder = (x: number, y: number) => {
    let nearest: { index: number; distance: number } | null = null;
    for (const zone of zones.current) {
      if (x >= zone.left && x <= zone.right && y >= zone.top && y <= zone.bottom) return zone.index;
      const dx = Math.max(zone.left - x, 0, x - zone.right);
      const dy = Math.max(zone.top - y, 0, y - zone.bottom);
      const distance = Math.hypot(dx, dy);
      if (!nearest || distance < nearest.distance) nearest = { index: zone.index, distance };
    }
    return nearest ? nearest.index : null;
  };

  /** Put the dragged card into the slot the finger is over, if that is not where it already is. */
  const updateTarget = () => {
    const from = dragFrom.current;
    if (!from) return;
    const target = zoneUnder(dragPointer.current.x + window.scrollX, dragPointer.current.y + window.scrollY);
    if (target === null) return;
    const current = homeWidgets.indexOf(from.id);
    if (current < 0 || target === current) return;
    const next = homeWidgets.slice();
    next.splice(current, 1);
    next.splice(target, 0, from.id);
    setPreviewOrder(next);
  };

  /*
   * **Scrolling under the drag.** Holding a card against the top or bottom of the window scrolls
   * the page that way — the gesture every list with a drag in it has, and the one that makes a
   * home screen longer than the screen usable: the card is picked up where it was, and the slots
   * it can be dropped into travel past it.
   *
   * It runs on `requestAnimationFrame`, not on pointer moves: a hand held still against the edge
   * sends no events at all, which is exactly when the page has to keep moving. The card is put
   * back under the finger after every scroll and the slot under the finger is re-read, so the
   * grid re-sorts while the page slides. Speed rises as the finger gets nearer the edge and is
   * capped; the step is scaled by the frame time so a 120Hz screen scrolls at the same pace as a
   * 60Hz one.
   */
  const scrollFrame = useRef<number | null>(null);
  const scrollStamp = useRef(0);
  const EDGE_PX = 96;
  const EDGE_SPEED = 16;

  const edgeScroll = (time: number) => {
    if (!dragNode.current) {
      scrollFrame.current = null;
      return;
    }
    /* One 60Hz frame is 16.67ms; clamped so a stall does not become a jump. */
    const dt = scrollStamp.current ? Math.min(64, time - scrollStamp.current) / 16.67 : 1;
    scrollStamp.current = time;

    const y = dragPointer.current.y;
    const height = window.innerHeight;
    let speed = 0;
    if (y < EDGE_PX) speed = -EDGE_SPEED * Math.min(1, (EDGE_PX - y) / EDGE_PX);
    else if (y > height - EDGE_PX) speed = EDGE_SPEED * Math.min(1, (y - (height - EDGE_PX)) / EDGE_PX);

    if (speed !== 0) {
      /*
       * The scroll stops at the end of the **content**, not at the end of the document: a
       * transformed card is part of the page's scrollable overflow, so `scrollHeight` grows while
       * the card is dragged downwards and the page would keep scrolling into blank space under the
       * last widget, then snap back the moment it was dropped. The body's own box is layout, which
       * a child's transform does not change.
       */
      const contentBottom = document.body.getBoundingClientRect().bottom + window.scrollY;
      const maxScroll = Math.max(0, contentBottom - height);
      const before = window.scrollY;
      window.scrollTo(0, Math.max(0, Math.min(maxScroll, before + speed * dt)));
      if (window.scrollY !== before) {
        placeCard();
        updateTarget();
      }
    }
    scrollFrame.current = window.requestAnimationFrame(edgeScroll);
  };

  const stopEdgeScroll = () => {
    if (scrollFrame.current !== null) {
      window.cancelAnimationFrame(scrollFrame.current);
      scrollFrame.current = null;
    }
    scrollStamp.current = 0;
  };

  const beginDrag = (event: ReactPointerEvent<HTMLElement>, id: string) => {
    if (!editing) return;
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const target = event.target as Element;
    /* The handle is the touch way in — a card-wide `touch-action: none` would stop the page
       scrolling at all on a phone. A mouse can take hold anywhere on the card instead. */
    const onHandle = Boolean(target.closest('[data-drag-handle]'));
    if (!onHandle && (event.pointerType !== 'mouse' || target.closest(NO_PRESS))) return;

    dragFrom.current = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    dragPendingNode.current = event.currentTarget;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  /**
   * One pointer position, from either listener.
   *
   * The card's **pointer capture does not survive the first re-order**: React moves the section in
   * the grid with `insertBefore`, which takes the node out and puts it back, and a browser drops
   * the capture of a node that leaves the document (spec: *implicit release of pointer capture*).
   * The section would then stop hearing moves halfway through a drag — measured: the card froze at
   * the fifth of six steps, and only a window listener kept the drag alive. So moves are handled
   * here and listened for on the section *and* on the window; every call is idempotent.
   */
  const handlePointer = (pointerId: number, x: number, y: number) => {
    const from = dragFrom.current;
    if (!from || from.pointerId !== pointerId) return;
    const dx = x - from.x;
    const dy = y - from.y;
    if (!dragActive.current && Math.hypot(dx, dy) < DRAG_SLOP_PX) return;
    dragPointer.current = { x, y };

    if (!dragActive.current) {
      /* The press has become a drag: take the card, remember where it was held, and map the slots
         as the hand found them. The frame loop that scrolls at the edges is started by the drag's
         effect, once the lifted state has committed. */
      const node = dragPendingNode.current;
      if (!node) return;
      const box = node.getBoundingClientRect();
      dragNode.current = node;
      dragGrab.current = { x: x - box.left, y: y - box.top };
      dragShift.current = { dx: 0, dy: 0 };
      captureZones();
      dragActive.current = true;
      setDrag(from.id);
    }
    placeCard();

    /* …and if the finger is over another card, take that card's slot **now**: the grid re-flows
       under the hand and `placeCard` puts the held card back where the hand is. */
    updateTarget();
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.cancelable) event.preventDefault();
    handlePointer(event.pointerId, event.clientX, event.clientY);
  };

  const finishDrag = (keep: boolean) => {
    const node = dragNode.current;
    const from = dragFrom.current;
    /* Idempotent: the pointerup is listened for on the section and on the window, and whichever
       arrives first finishes the drag. */
    if (!from) return;
    if (node) {
      node.style.transform = '';
      node.style.willChange = '';
    }
    dragNode.current = null;
    dragPendingNode.current = null;
    dragShift.current = { dx: 0, dy: 0 };
    dragFrom.current = null;
    dragActive.current = false;
    zones.current = [];
    stopEdgeScroll();
    /* The layout is already the dropped one; this only saves it. */
    const dropped = previewRef.current;
    if (keep && dropped) {
      const index = dropped.indexOf(from.id);
      if (index >= 0) moveHomeWidget(from.id, index);
    }
    setDrag(null);
    setPreviewOrder(null);
  };

  /*
   * Everything that has to run for as long as a card is in the air: the frame loop that scrolls
   * the page at the edges (a hand held still against an edge sends no pointer events at all, so
   * this cannot be driven by moves), and a window-level end to the drag. The `pointerup` on the
   * section covers the usual case; this one covers the release that lands outside the page —
   * a drag that scrolled the card under the pointer and let go over the browser chrome.
   */
  useEffect(() => {
    if (!drag) return undefined;
    scrollStamp.current = 0;
    scrollFrame.current = window.requestAnimationFrame(edgeScroll);
    const track = (event: PointerEvent) => handlePointer(event.pointerId, event.clientX, event.clientY);
    const drop = () => finishDrag(true);
    const abort = () => finishDrag(false);
    window.addEventListener('pointermove', track);
    window.addEventListener('pointerup', drop);
    window.addEventListener('pointercancel', abort);
    return () => {
      window.removeEventListener('pointermove', track);
      window.removeEventListener('pointerup', drop);
      window.removeEventListener('pointercancel', abort);
      stopEdgeScroll();
    };
  }, [drag]);

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const from = dragFrom.current;
    if (!from || from.pointerId !== event.pointerId) return;
    finishDrag(true);
  };

  const cancelDrag = () => {
    if (!dragFrom.current) return;
    finishDrag(false);
  };

  /** The handle's keyboard contract: one slot per arrow press, so reordering is not drag-only. */
  const nudge = (id: string, step: 1 | -1) => {
    const from = homeWidgets.indexOf(id);
    if (from < 0) return;
    moveHomeWidget(id, from + step);
  };

  return (
    <div className="stack-6 home-surface">
      {/* Named for assistive technology only: Home is in the navigation, so the page does not
          need to say its own name on screen (see PageHeader). */}
      <PageHeader
        title={t('Home')}
        description={`Plan a journey, check the network, and pick up where you left off. ${plural(STOPS.length, 'stop')}, ${plural(NETWORK.length, 'service')} and ${plural(DISRUPTIONS.length, 'alert')}.`}
      />

      {visible.length === 0 ? (
        <Card className="stack">
          <span className="t-strong">{t('Your home screen is empty')}</span>
          <span className="t-sm t-muted">{t('Turn on customising at the foot of the page to add a widget.')}</span>
        </Card>
      ) : null}

      <div
        ref={gridRef}
        className={`widget-grid${editing ? ' widget-grid--editing' : ''}${drag ? ' widget-grid--dragging' : ''}${resize ? ' widget-grid--resizing' : ''}`}
      >
        {visible.map((widget, index) => {
          const Body = widget.Body;
          const isDragging = drag === widget.id;
          /*
           * Below its own threshold a widget is drawn full width: the stored width is kept for
           * the window that can honour it, not overwritten by this one.
           *
           * On a phone the height is the one thing a full-width card can still choose, so the
           * stored height is honoured there too and the card's own control cycles it (F3). Between
           * a phone and a widget's own width threshold nothing is offered and nothing is applied,
           * which is the shape this rule has always had.
           */
          const canResize = viewport >= widget.resizeFrom;
          const phone = viewport < 641;
          const stored = sizeOf(widget);
          const size: WidgetSize = phone
            ? { w: 12 as WidgetWidth, h: stored.h }
            : canResize
              ? stored
              : { w: 12 as WidgetWidth, h: 'standard' as WidgetTier };
          const live = resize?.id === widget.id ? resize.size : size;
          const heights = TIERS;
          return (
            <section
              key={widget.id}
              id={`widget-${widget.id}`}
              data-widget-id={widget.id}
              className={[
                'widget',
                `widget--span-${live.w}`,
                `widget--h-${live.h}`,
                resize?.id === widget.id ? 'widget--resizing' : '',
                flash === widget.id ? 'widget--flash' : '',
                editing ? 'widget--editable' : '',
                isDragging ? 'widget--dragging' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              /* No `style` here on purpose: the drag's transform is written straight to the node
                 (see `placeCard`), because a render per pointer move would re-render the map. */
              /* Only customising mode listens: outside it a widget cannot be picked up at all,
                 so a swipe across the home screen scrolls the page and nothing else. */
              onPointerDown={editing ? (event) => beginDrag(event, widget.id) : undefined}
              onPointerMove={editing ? moveDrag : undefined}
              onPointerUp={editing ? endDrag : undefined}
              onPointerCancel={editing ? cancelDrag : undefined}
            >
              <Card className="widget__card">
                <div className="widget__head">
                  {/* Title only. The one-line description is the catalogue's job — on the grid
                      it was five lines of explanation above the five things they explain. */}
                  <h2 className="t-section">{t(widget.title)}</h2>
                  {editing ? (
                    <div className="widget__actions">
                      {/*
                        Two taps, not a drag (F1): the grip's ←/→/↑/↓ contract has always existed
                        for a keyboard, and a phone has no arrow keys. Up and down are the same
                        `nudge` the grip listens for, so a widget can be put back where it was
                        without lifting it — which is the half of the report that is not about
                        the drag at all ("its hard to move it back without pressing done and going
                        back to customize mode"). Disabled at the ends, where the move would be
                        a no-op.
                      */}
                      <IconButton
                        icon="chevronUp"
                        label={t('Move {title} up', { title: t(widget.title) })}
                        disabled={index === 0}
                        onClick={() => nudge(widget.id, -1)}
                      />
                      <IconButton
                        icon="chevronDown"
                        label={t('Move {title} down', { title: t(widget.title) })}
                        disabled={index === visible.length - 1}
                        onClick={() => nudge(widget.id, 1)}
                      />
                      {/*
                        The phone's resizing control (F3). The corner is hidden below each
                        widget's own `resizeFrom` — which is every widget at 378px — because a
                        one-column grid makes the width ladder meaningless. The height ladder is
                        not: this cycles Compact → Standard → Tall, pins the card to 12/12 and
                        writes the same stored size the corner writes, so the choice survives a
                        reload and the corner picks it up on a wide screen.
                      */}
                      {phone ? (
                        <IconButton
                          icon="swap"
                          label={t('Change the height of {title} ({height})', {
                            title: t(widget.title),
                            height: t(TIER_LABEL[live.h]),
                          })}
                          onClick={() => {
                            const nextTier = TIERS[(TIERS.indexOf(live.h) + 1) % TIERS.length];
                            setWidgetSize(widget.id, { w: 12 as WidgetWidth, h: nextTier });
                            setSizeNote(`${t(widget.title)} · ${t(TIER_LABEL[nextTier])}`);
                          }}
                        />
                      ) : null}
                      <button
                        type="button"
                        className="widget__grip"
                        data-drag-handle
                        aria-label={t('Move {title}', { title: t(widget.title) })}
                        title={t('Drag to move')}
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                            event.preventDefault();
                            nudge(widget.id, -1);
                          }
                          if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                            event.preventDefault();
                            nudge(widget.id, 1);
                          }
                        }}
                      >
                        <Icon name="grip" size={17} />
                      </button>
                      {!widget.required ? (
                        <IconButton
                          icon="close"
                          label={`${t('Remove')} ${t(widget.title)}`}
                          onClick={() => removeHomeWidget(widget.id)}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <WidgetTierContext.Provider value={live.h}>
                  <Body />
                </WidgetTierContext.Provider>
              </Card>
              {/*
                The corner: a small curved mark hugging the card's bottom-right corner, inside a
                44px target that is otherwise invisible.

                It is deliberately not an icon in a circle — that reads as a button to press, and
                this is a thing to drag. The mark is drawn by `styles/components.css`
                (`.widget__corner::after`) so it can hug the card's own radius instead of being a
                shape pasted near it, and it exists only while the screen is being customised.

                The arrow keys are not a courtesy: WCAG 2.5.7 requires a single-pointer
                alternative to a drag, so the same control takes ←/→ for width, ↑/↓ for one more
                row of content, and Home to return the card to its declared size.
              */}
              {editing && canResize ? (
                <button
                  type="button"
                  className="widget__corner"
                  data-resize-handle
                  aria-label={t('Resize {title}', { title: t(widget.title) })}
                  onPointerDown={(event) => beginCorner(event, widget)}
                  onPointerMove={moveCorner}
                  onPointerUp={endCorner}
                  onPointerCancel={endCorner}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                      event.preventDefault();
                      const index = WIDTHS.indexOf(size.w) + (event.key === 'ArrowRight' ? 1 : -1);
                      setWidgetSize(widget.id, { ...size, w: WIDTHS[Math.max(0, Math.min(WIDTHS.length - 1, index))] });
                      return;
                    }
                    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                      /* Swallowed even with one tier: a focused corner must not scroll the page. */
                      event.preventDefault();
                      if (heights.length < 2) return;
                      const index = heights.indexOf(size.h) + (event.key === 'ArrowUp' ? 1 : -1);
                      setWidgetSize(widget.id, { ...size, h: heights[Math.max(0, Math.min(heights.length - 1, index))] });
                      return;
                    }
                    if (event.key === 'Home') {
                      event.preventDefault();
                      setWidgetSize(widget.id, {
                        w: widget.span,
                        h: heights.includes('standard') ? 'standard' : heights[0],
                      });
                    }
                  }}
                />
              ) : null}
            </section>
          );
        })}
      </div>

      {/* The size is never written on the card — the card *is* the size. A screen reader still
          needs to hear what the drag did, so one live region says it and nothing else does. */}
      <span className="sr-only" aria-live="polite">
        {resize
          ? `${resize.size.w}/12 · ${t(TIER_LABEL[resize.size.h])}`
          : sizeNote}
      </span>

      {holding ? (
        <div className="home-hold-hint" role="status">
          <Icon name="layout" size={15} />
          {t('Keep holding to customise')}
        </div>
      ) : null}

      {/*
        At the foot, under the widgets, by request: this control was moved to the page head in the
        OVERWHELMING_FIX round (item 9) and is back here, which is where it is least in the way of
        the dashboard itself. Nothing else about it changed.
      */}
      <div className="widget-customise">
        {editing ? (
          <Panel className="widget-customise__panel">
            <span className="t-strong t-sm grow">{t('Customising home')}</span>
            <div className="row-wrap">
              <Button size="sm" variant="primary" icon="plus" onClick={() => setAddOpen(true)}>
                {t('Add widget')}
              </Button>
              <Button size="sm" icon="refresh" onClick={resetHomeWidgets}>
                {t('Reset layout')}
              </Button>
              <Button size="sm" variant="surface" icon="check" onClick={() => setEditing(false)}>
                {t('Done')}
              </Button>
            </div>
          </Panel>
        ) : (
          /* `layout`, not `sliders`: `sliders` is the options/filters glyph everywhere else
             (Options, Travel preferences, Manage avoidance preferences), and this control edits
             the page rather than filtering it (W3C COGA, one glyph, one meaning). */
          <button
            type="button"
            className="widget-customise__trigger"
            onClick={() => setEditing(true)}
            title={t('Or press and hold the home screen')}
          >
            <Icon name="layout" size={15} />
            {t('Customise home')}
          </button>
        )}
      </div>

      <Dialog
        open={addOpen}
        title={t('Add a widget')}
        onClose={() => setAddOpen(false)}
        footer={
          /* "Done" here means done with the catalogue **and** with customising, not just with this
             dialog: the traveller who has finished adding widgets is finished arranging the screen,
             so the mode closes with it rather than leaving a screen of × buttons and grips behind.
             Closing the dialog any other way (Esc, the backdrop, its ×) only closes the dialog. */
          <Button
            type="button"
            variant="surface"
            onClick={() => {
              setAddOpen(false);
              setEditing(false);
            }}
          >
            {t('Done')}
          </Button>
        }
      >
        <div className="stack">
          <span className="t-sm t-muted">
            {available.length === 0
              ? t('Every widget in the catalogue is already on your home screen.')
              : t(available.length === 1 ? '{count} widget available.' : '{count} widgets available.', {
                  count: available.length,
                })}
          </span>
          {WIDGET_CATEGORIES.map((category) => {
            const items = available.filter((widget) => widget.category === category);
            if (items.length === 0) return null;
            return (
              <div key={category} className="stack-2">
                <span className="field__label">{t(category)}</span>
                <ul className="stack-1">
                  {items.map((widget) => (
                    <li key={widget.id} className="list-row list-row--static">
                      <span className="stack-1 grow">
                        <span className="t-strong t-sm">{t(widget.title)}</span>
                        <span className="t-sm t-faint">{t(widget.description)}</span>
                      </span>
                      <Button size="sm" icon="plus" onClick={() => addHomeWidget(widget.id)}>
                        {t('Add')}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <div className="row-wrap">
            <Button size="sm" icon="refresh" onClick={resetHomeWidgets}>
              {t('Reset to the default layout')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
