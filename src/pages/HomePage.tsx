import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { Button, Card, Dialog } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { WIDGETS, WIDGET_CATEGORIES, widgetById } from '../widgets/registry';
import { NETWORK } from '../data/network';
import { DISRUPTIONS } from '../data/disruptions';
import { STOPS } from '../data/stops';
import { plural } from '../lib/format';
import { useT } from '../lib/useT';

/** How long the home screen has to be held before it opens its customising mode. */
const HOLD_MS = 1000;

/** How long before the hold becomes deliberate enough to say so on screen. */
const HOLD_HINT_MS = 350;

/*
 * **There is no resizing.**
 *
 * A card is the width its widget declares (`span` — 4, 6, 8 or 12 columns) and as tall as its own
 * content, at every width and in both appearances. That is how the home screen looked before the
 * size tiers arrived, and it is the shape a home screen wants: a row is filled by the cards whose
 * spans add up to twelve, so nothing has to be negotiated to put three cards side by side.
 *
 * The corner handle, the four widths, the three heights, the stored `widget-sizes` and the menu's
 * *Match sizes* row are gone with it. On a phone the corner was the wrong thing to offer at all — a
 * finger on a card is for dragging it — and on a wide screen a card resized out of its span was the
 * reason a row would not fill: the map, the tallest card in the catalogue, is the one that most
 * often left a hole beside it, because a neighbouring card could not be made to fit it. Every card
 * now draws the middle of what it can hold, which is what it did before the sizes existed.
 */

/** A press that moves further than this is a scroll, not a hold. */
const HOLD_SLOP_PX = 12;

/** A press that moves further than this is a drag, not a tap on a widget. */
const DRAG_SLOP_PX = 8;

/** The gap between the screen's edge and the layout menu — the header's own 12px padding. */
const MENU_STEP = 12;

/**
 * **The press lock.**
 *
 * On a phone, holding still with a finger down for about half a second is how a page starts a *text
 * selection* — and on iOS that selection, its callout and its magnifier take the press away from
 * anything the page was counting: the hold would reach a second with the pointer already cancelled
 * (reported: "holding the home screen doesn't work on mobile, it just selects text instead").
 *
 * So while a press on the home screen is running, the shell cannot be selected at all: the flag is
 * on `<html>`, the stylesheet locks `.app-shell` (see `components.css`), and a `selectstart` inside
 * that press is refused outright. It is removed the moment the press ends — a cancelled press, a
 * scroll, the release, or the second the mode opens — so selecting text on this page is only ever
 * refused while a hold is in flight, never afterwards.
 */
function lockPress(locked: boolean) {
  const root = document.documentElement;
  if (locked) root.setAttribute('data-home-press', '');
  else root.removeAttribute('data-home-press');
}
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
 * quiet: **Edit** in the header's first corner turns on a mode in which every
 * widget shows the same remove button in the same place, the catalogue ("Add
 * widget") becomes reachable from the `+` beside it, and each widget can be
 * **dragged into a new slot**.
 *
 * There are two ways in, because a phone's home screen offers both: the Edit
 * pill, or **press and hold the home screen itself for one second** — the
 * gesture a phone's home screen uses, and the one that was asked for. The hold
 * starts on the page *and on the cards* (see `isHoldSurface`), because this
 * screen is almost all cards; what it will not start on is a control, and a
 * press that moves is a scroll or a drag rather than a hold. On touch devices
 * the press also locks text selection while it runs, or the browser's own
 * half-second selection would take the gesture away (`lockPress`).
 */
export function HomePage() {
  const {
    homeWidgets,
    addHomeWidget,
    removeHomeWidget,
    moveHomeWidget,
    resetHomeWidgets,
    restoreHomeLayout,
    /*
     * The mode and its menu live in the store, because their controls are in the shell's header:
     * `+` where the way back goes and `Done` where the alerts entry is (see `AppShell`).
     */
    homeEditing: editing,
    setHomeEditing: setEditing,
    homeMenuOpen,
    setHomeMenuOpen,
    power,
  } = useApp();
  const t = useT();
  const [params] = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);
  /*
   * Where the layout menu hangs from.
   *
   * The trigger lives in the shell's header (`+`, in the first corner the keep it in), so this
   * page cannot draw the menu next to it by layout: it reads the trigger's box once, when the
   * menu opens, and pins the panel under it — the corner it drops from is the corner it belongs
   * to, at any width. Nothing is measured while it is closed (`menuPos` is null), and the panel
   * is not in the page at all, so a closed menu cannot take a tap or a Tab stop.
   */
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
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

  /**
   * Read inside the effect below through a ref: a smooth scroll is movement, and battery saving
   * is exactly when there should not be any — but a deep link should not be re-run, and the flash
   * restarted, by the phone being plugged in.
   */
  const powerRef = useRef(power.mode);
  powerRef.current = power.mode;

  /** Deep links such as "view on map" land here and point at the map widget. */
  useEffect(() => {
    if (!focusWidget) return undefined;
    setFlash(focusWidget);
    const target = document.getElementById(`widget-${focusWidget}`);
    if (target) target.scrollIntoView({ behavior: powerRef.current === 'off' ? 'smooth' : 'auto', block: 'center' });
    const timer = window.setTimeout(() => setFlash(null), 2600);
    return () => window.clearTimeout(timer);
  }, [focusWidget, requestedStop, requestedJourney]);

  /*
   * Super energy saving draws **only the cards that answer "when does the bus go"**.
   *
   * The home screen is the expensive screen: a map of the whole network, saved journeys, prose.
   * At a tenth of a battery none of that is what the traveller opened the app for, and drawing it
   * costs a repaint every minute and a slice of the GPU between. So the grid is filtered to the
   * widgets the registry marks `essential` — the planner, the departures card and the hearted
   * stops — and the screen says so rather than silently losing most of itself.
   *
   * Customising is exempt: the mode is for *drawing* less, and a card that is not on screen cannot
   * be dragged, resized or removed. Nothing is deleted, so leaving the mode (a charger, or the
   * battery climbing back above 12%) puts the whole layout back exactly as it was.
   */
  const thinning = power.mode === 'super' && !editing;
  const visible = useMemo(() => {
    const all = order
      .map((id) => widgetById(id))
      .filter((widget): widget is NonNullable<typeof widget> => Boolean(widget));
    if (!thinning) return all;
    const essential = all.filter((widget) => widget.essential);
    /* The planner cannot be removed, so this is never empty in practice; keeping the first card
       if it ever were is what stops a thinned home screen from claiming to be an empty one. */
    return essential.length ? essential : all.slice(0, 1);
  }, [order, thinning]);
  /*
   * Counted over the cards that exist, not over the stored ids: a layout can still name a widget
   * that has been cut (the id is left alone so a returning card returns to its place), and a
   * missing card is not a card "waiting for the charger".
   */
  const knownWidgets = useMemo(() => order.filter((id) => Boolean(widgetById(id))).length, [order]);
  const hiddenBySaving = thinning ? knownWidgets - visible.length : 0;
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
    lockPress(false);
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
    /* The layout menu and its scrim are a surface of their own: a tap on the blur is the tap that
       dismisses the menu, and it must not also leave the mode behind it. */
    if (
      target.closest(
        '.widget, .overlay, [role="dialog"], [role="menu"], .home-menu, .home-menu__scrim, .app-sidebar, .app-dock',
      )
    )
      return false;
    if (target.closest(NO_PRESS)) return false;
    return Boolean(target.closest('.app-shell'));
  }, []);

  /**
   * **Where a hold starts** — the surface above, plus the cards themselves.
   *
   * A phone puts a home screen into its edit mode from the icons as well as the wallpaper: press
   * and hold an icon and it starts to wiggle. This screen is almost entirely cards, so a hold that
   * only worked on the thin strip of page around them was a hold that did not work at all — and
   * what a person got instead was the browser selecting the card's own text (reported: "holding the
   * home screen doesn't work on mobile, it just selects text instead of going to customizing").
   *
   * It is deliberately **not** the tap's surface: in customising, a tap on a card is the card's own
   * business (it is how a widget is used), and a tap outside one is how the mode is left. Widening
   * the tap to cards would make using a widget exit the mode. Two gestures, two surfaces, and this
   * is only the one the clock runs on. Controls inside a card are still exempt (`NO_PRESS`), so a
   * hold on a button in a widget is that button's press and nothing else.
   */
  const isHoldSurface = useCallback((target: Element) => {
    if (target.closest('.overlay, [role="dialog"], [role="menu"], .home-menu, .home-menu__scrim, .app-sidebar, .app-dock'))
      return false;
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
      if (!target || !isHoldSurface(target)) return;

      clearHoldTimers();
      holdPoint.current = { x: event.clientX, y: event.clientY };
      lockPress(true);
      hintTimer.current = window.setTimeout(() => setHolding(true), HOLD_HINT_MS);
      holdTimer.current = window.setTimeout(() => {
        clearHoldTimers();
        setHolding(false);
        lockPress(false);
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

    /*
     * A selection cannot begin inside a press that is already being counted. `user-select: none`
     * (the lock above) is what stops it starting; this stops it the moment a browser tries anyway,
     * because on iOS the callout is offered before the style is consulted.
     */
    const onSelectStart = (event: Event) => {
      if (holdPoint.current) event.preventDefault();
    };

    /*
     * A long press on the home screen **is** the gesture; the browser's own menu is not wanted.
     *
     * Android fires `contextmenu` at the same moment a long press is recognised, and cancelling
     * the hold on it meant the clock stopped at ~500ms and the menu opened over a screen that was
     * never going to enter customising. Refusing the menu while a press is live lets the second run
     * out; with no press in flight (a long press on a link, a widget, an empty page) the browser's
     * menu is left exactly as it was.
     */
    const onContextMenu = (event: Event) => {
      if (holdPoint.current) {
        event.preventDefault();
        return;
      }
      cancelHold();
    };

    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', cancelHold);
    document.addEventListener('pointercancel', cancelHold);
    document.addEventListener('selectstart', onSelectStart);
    document.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('blur', cancelHold);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', cancelHold);
      document.removeEventListener('pointercancel', cancelHold);
      document.removeEventListener('selectstart', onSelectStart);
      document.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('blur', cancelHold);
      clearHoldTimers();
      lockPress(false);
      setHolding(false);
    };
  }, [editing, cancelHold, clearHoldTimers, isHoldSurface]);

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

  /*
   * One live region says what the layout just did, and nothing else does (see the `sr-only`
   * status line at the foot of the page): the last arrangement change, and whether an undo put the
   * screen back. It is a string rather than two flags because only one thing happens at a time, and
   * the last thing said is the thing worth saying.
   */
  const [note, setNote] = useState('');
  /*
   * **The way back (R85).** Every move that changed the layout is kept as the one thing needed to
   * invert it — the widget, and the slot it came from — and `moveHomeWidget` is its own inverse
   * (`remove and insert at i` undone by `remove and insert at j`), so stepping back through this
   * list restores the order exactly, in reverse, however many moves ago it was. Last ten, which
   * is more than a screen of arrangements has ever been worth and still a bounded list.
   */
  const [moves, setMoves] = useState<Array<{ id: string; from: number }>>([]);
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

  /** How deep the band at each edge of the window is, and how fast it scrolls the page. */
  const EDGE_PX = 96;
  /** The band that means "the first slot": the header, plus a sliver under it. */
  const TOP_SLOT_PX = 136;
  const EDGE_SPEED = 16;

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

  /**
   * The slot an **edge of the window** means, or null in the middle of it.
   *
   * This is the fix for the report that the drag worked and the way back did not: "once you drag
   * one widget, you cant drag it back to its original place". The zones are frozen where the hand
   * found them, in **page** coordinates, so a slot that is scrolled off the top of the window
   * cannot be pointed at — the finger would have to be at a negative y. Dragging a card back to
   * the top of the screen therefore did *not* mean the top of the list: the finger's page point
   * landed in whichever slot happened to be under it, which was often the slot the card was
   * already in, and the card was dropped back where it started. Measured at 390x844: the map —
   * the second card, 586px of an 844px window — could only reach slot 1 by dragging the page
   * itself up to within 250px of the top, which is not a thing a hand is doing while it drags.
   *
   * So the bands mean what they look like they mean: the top of the window is the **first** slot
   * and the bottom of it is the **last**, whatever the page is scrolled to and whether or not the
   * page has finished scrolling there. What the card is drawn over is what it will become, which
   * is the only promise a drag makes.
   */
  const edgeSlot = (y: number): number | null => {
    const found = zones.current;
    if (found.length === 0) return null;
    /*
     * The top band is **deeper than the scroll band**, because on a phone the top of the window
     * is the app's own header: a finger held at the very top is over the mark, not over the page,
     * and the first slot has to be reachable from there. Making the first slot's band the header
     * plus a thumb's width is what makes "back to the top" as easy as any other slot; the scroll
     * band below it stays where it was, so the page does not start running away sooner.
     */
    if (y < TOP_SLOT_PX) return found[0].index;
    if (y > window.innerHeight - EDGE_PX) return found[found.length - 1].index;
    return null;
  };

  /** The slot the finger is over right now, in the order the drag started from. */
  const slotAtPointer = (): number | null => {
    const band = edgeSlot(dragPointer.current.y);
    return (
      band ?? zoneUnder(dragPointer.current.x + window.scrollX, dragPointer.current.y + window.scrollY)
    );
  };

  /**
   * Put the dragged card into the slot the finger is over — **every time**, including back over the
   * slot it came from.
   *
   * The preview used to be skipped when the finger returned to the card's own slot
   * (`target === current` → return), which left the last preview standing: a card picked up, moved
   * down and brought back over its own slot stayed drawn one slot down and was *saved* one slot
   * down on release, because the drop committed whatever the last preview had been. A finger that
   * comes back to where it started must look — and land — where it started, so the preview is
   * rebuilt from the committed order on every move, and cleared when that is the answer.
   */
  const updateTarget = () => {
    const from = dragFrom.current;
    if (!from) return;
    const target = slotAtPointer();
    if (target === null) return;
    const current = homeWidgets.indexOf(from.id);
    if (current < 0) return;
    if (target === current) {
      if (previewRef.current !== null) setPreviewOrder(null);
      return;
    }
    const next = homeWidgets.slice();
    next.splice(current, 1);
    next.splice(target, 0, from.id);
    if (previewRef.current && previewRef.current.join('\u0000') === next.join('\u0000')) return;
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
    /*
     * **The head is the finger's grip**, and the body is not.
     *
     * A card-wide `touch-action: none` would stop the page scrolling at all on a phone, so the
     * touch drag has to start on a strip that can claim the gesture: the title's row, which is the
     * one part of a card that is never a control. It is not a drawn handle — nothing is added to
     * the card — it is the line the card is named by, which is where a hand goes naturally. The
     * body below it keeps scrolling the page. A mouse can take hold anywhere on the card.
     */
    const onHandle = Boolean(target.closest('[data-drag-handle], .widget__head'));
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
    /*
     * **The drop is decided by the finger, not by the last frame that painted.** The preview is
     * state, and a release can arrive in the same frame as the move that would have changed it —
     * so the slot is read once more, from the pointer, at the moment of release. `zones` were
     * captured at the start of this gesture and the committed order has not changed since, so the
     * index read here is the same index `moveHomeWidget` is about to be given. Read *before* the
     * drag's own state is cleared, which is what empties the zones.
     */
    const fromIndex = homeWidgets.indexOf(from.id);
    const pointerSlot = dragActive.current ? slotAtPointer() : null;
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
    /*
     * The layout is already the dropped one; this only saves it — and remembers how to unsave it.
     *
     * `fromIndex` is read from `homeWidgets`, which nothing writes during a drag (the preview is
     * local state and the drop is the only writer), so it is the slot the card was taken from.
     * A drop that changed nothing — the card let go over its own slot — leaves no move behind,
     * which is what keeps "Put it back" from being offered for a drag that did not move anything.
     */
    const index =
      keep && pointerSlot !== null
        ? pointerSlot
        : previewRef.current
          ? previewRef.current.indexOf(from.id)
          : -1;
    if (keep && index >= 0 && fromIndex >= 0 && index !== fromIndex) {
      setMoves((list) => [...list.slice(-9), { id: from.id, from: fromIndex }]);
      moveHomeWidget(from.id, index);
    }
    setDrag(null);
    setPreviewOrder(null);
  };

  /**
   * **Put it back.** One tap restores the order as it was before the last move — and the tap
   * before that the one before it, because the move being undone is removed from the list as it
   * is applied.
   *
   * It lives in the customising panel rather than on the card on purpose. The card's own head is
   * two controls because the report about it was that the controls were in the way; the way back
   * from a wrong arrangement is a step in arranging, and the panel is where arranging is done.
   */
  const undoMove = () => {
    const last = moves[moves.length - 1];
    if (!last) return;
    setMoves((list) => list.slice(0, -1));
    moveHomeWidget(last.id, last.from);
    setNote(t('Move undone'));
  };

  /* The arrangement is settled when the mode closes, so the offer to undo it goes with it. */
  useEffect(() => {
    if (!editing) setMoves([]);
  }, [editing]);

  /*
   * Pin the menu under its trigger, and take focus into it once it is up.
   *
   * It is placed from the box the header reports, and placed again if the window changes size —
   * a menu left hanging where the old corner used to be is a menu pointing at nothing.
   */
  useLayoutEffect(() => {
    if (!homeMenuOpen) {
      setMenuPos(null);
      return undefined;
    }
    const place = () => {
      const anchor = document.querySelector<HTMLElement>('[data-home-menu-trigger]');
      if (!anchor) return;
      const box = anchor.getBoundingClientRect();
      const width = Math.min(300, window.innerWidth - 2 * MENU_STEP);
      setMenuPos({
        top: Math.round(box.bottom + 8),
        left: Math.round(Math.min(Math.max(MENU_STEP, box.left), window.innerWidth - width - MENU_STEP)),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [homeMenuOpen]);

  /*
   * Focus enters once, and leaves to the control that opened the menu.
   *
   * The effect was keyed on the placed position, so it re-ran on every re-place — a resize put the
   * caret back on the first row (31.3) — and every exit (Escape, the scrim, a row) dropped focus on
   * `<body>` (31.1). Now the first placement focuses the first row, a later one does not, and a
   * close hands the keyboard back to the header's + while it is still on screen.
   */
  const menuFocused = useRef(false);
  useEffect(() => {
    if (!homeMenuOpen) {
      menuFocused.current = false;
      const trigger = document.querySelector<HTMLElement>('[data-home-menu-trigger]');
      trigger?.focus({ preventScroll: true });
      return;
    }
    if (menuFocused.current) return;
    menuRef.current?.querySelector<HTMLElement>('button')?.focus();
    menuFocused.current = true;
  }, [homeMenuOpen, menuPos]);

  /**
   * Esc closes the menu; Tab stays inside it, because the scrim makes it the only thing on screen.
   *
   * The rows are plain buttons rather than a `role="menu"`: this is a small sheet of actions, and
   * a menu role would promise arrow-key navigation the sheet does not need to keep.
   */
  const menuKeys = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setHomeMenuOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('button') ?? [])];
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  /**
   * Reset throws the whole arrangement away, so an old move can no longer describe it.
   *
   * The mode stays open: a reset is a change to the layout you are arranging, and dropping the
   * furniture out from under the traveller is not what pressing it asked for.
   */
  const [preReset, setPreReset] = useState<string[] | null>(null);
  const resetLayout = () => {
    /* The arrangement is kept before it goes, so the menu can offer it back (31.2). */
    setPreReset(homeWidgets);
    resetHomeWidgets();
    setMoves([]);
    setNote(t('Layout reset'));
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
    const to = Math.max(0, Math.min(homeWidgets.length - 1, from + step));
    if (to === from) return;
    /*
     * A press of an arrow key is the same move as a drag, so it is remembered the same way and
     * offered back the same way ("Put it back" in the panel). It used not to be: only the drag
     * path pushed onto `moves`, so a keyboard reorder was the one arrangement change with no
     * way back inside the mode ("when you move a widget on the home screen, its hard to move it
     * back without pressing done", 2026-10-17t20-45-42 — the same difficulty, reached by the
     * keyboard). A press that would leave the card where it is records nothing, exactly as a
     * drag dropped over its own slot does.
     */
    setMoves((list) => [...list.slice(-9), { id, from }]);
    moveHomeWidget(id, to);
  };

  return (
    <div className="stack-6 home-surface">
      {/* Named for assistive technology only: Home is in the navigation, so the page does not
          need to say its own name on screen (see PageHeader). */}
      <PageHeader
        title={t('Home')}
        description={`Plan a journey, check the network, and pick up where you left off. ${plural(STOPS.length, 'stop')}, ${plural(NETWORK.length, 'service')} and ${plural(DISRUPTIONS.length, 'alert')}.`}
      />

      {/*
        * A thinned home screen says so.
        *
        * Half the cards are not a bug to be discovered, so the screen explains itself in one line
        * where the missing cards would have started — no card of its own, no icon, no control: a
        * sentence on the surface, which is all that is worth drawing at a tenth of a battery.
        * `role="status"` so a screen reader is told when the mode begins, rather than the page
        * quietly changing under it.
        */}
      {thinning ? (
        <p className="t-sm t-muted" role="status">
          {t('Super energy saving is on — {cards} come back when this device is charged.', {
            cards: plural(hiddenBySaving, 'card'),
          })}{' '}
          {t('Only what you need to catch a bus is drawn.')}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <Card className="stack">
          <span className="t-strong">{t('Your home screen is empty')}</span>
          <span className="t-sm t-muted">{t('Tap Edit at the top to add a widget.')}</span>
        </Card>
      ) : null}

      <div
        ref={gridRef}
        className={`widget-grid${editing ? ' widget-grid--editing' : ''}${drag ? ' widget-grid--dragging' : ''}`}
      >
        {visible.map((widget) => {
          const Body = widget.Body;
          const isDragging = drag === widget.id;
          return (
            <section
              key={widget.id}
              id={`widget-${widget.id}`}
              data-widget-id={widget.id}
              className={[
                'widget',
                `widget--span-${widget.span}`,
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
              /*
               * **The card itself is the move control** — the grip that used to say so is gone.
               *
               * A phone's home screen has no handle: you press and drag the icon. This card can
               * always be dragged by its body (the grip was a *label* for the gesture, not the
               * thing that made it work), so removing it costs the hand nothing — but it took the
               * keyboard's only way to move a card with it. WCAG 2.5.7 wants a single-pointer
               * alternative to a drag, so the focusable card takes ↑/↓/←/→ and moves itself, one
               * slot a press, exactly as the grip did.
               */
              tabIndex={editing ? 0 : undefined}
              role={editing ? 'group' : undefined}
              aria-label={editing ? t('Move {title}', { title: t(widget.title) }) : undefined}
              onKeyDown={
                editing
                  ? (event) => {
                      /* Only the card itself: a button or a link inside it keeps its own keys. */
                      if (event.target !== event.currentTarget) return;
                      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                        event.preventDefault();
                        nudge(widget.id, -1);
                      }
                      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                        event.preventDefault();
                        nudge(widget.id, 1);
                      }
                    }
                  : undefined
              }
            >
              <Card className="widget__card">
                <div className="widget__head">
                  {/* Title only. The one-line description is the catalogue's job — on the grid
                      it was five lines of explanation above the five things they explain. */}
                  <h2 className="t-section">{t(widget.title)}</h2>
                </div>
                {/*
                  One box for the body, so a short card centres its content instead of leaving the
                  slack under it. There is no tier to read any more: every card draws the middle of
                  what it can hold, which is what it did before the sizes existed.
                */}
                <div className="widget__body">
                  <Body />
                </div>
              </Card>
              {/*
                **The − badge**, at the card's top-right, the way a home screen deletes an app.

                It replaces the × that sat in the card's head beside a grip. One round, floating
                control on the corner reads as "this card can go" without a row of glyphs above
                every title, and the 44px target is behind a 30px disc: the mark is what you see
                and the circle around it is what the thumb gets. A required widget has no badge at
                all rather than a disabled one — a control that cannot do its job is not a control.
              */}
              {editing && !widget.required ? (
                <button
                  type="button"
                  className="widget__remove"
                  aria-label={`${t('Remove')} ${t(widget.title)}`}
                  title={`${t('Remove')} ${t(widget.title)}`}
                  onClick={() => removeHomeWidget(widget.id)}
                >
                  <Icon name="minus" size={16} />
                </button>
              ) : null}
            </section>
          );
        })}
      </div>

      {/* The arrangement is never written on the card — the card's own place is the arrangement. A
          screen reader still needs to hear what a drag or an undo did, so one live region says it
          and nothing else does. */}
      <span className="sr-only" aria-live="polite">
        {note}
      </span>

      {holding ? (
        <div className="home-hold-hint" role="status">
          <Icon name="layout" size={15} />
          {t('Keep holding to customise')}
        </div>
      ) : null}

      {/*
        The layout menu: what the + in the header opens.

        It hangs from the corner it was opened in and blurs the page behind it, the way a phone's
        home screen raises its menu over a blurred screen: the panel points at the control it
        belongs to, and there is no sheet across the middle of the screen to come back out of.
        The scrim closes it — a home screen's menu is dismissed by touching anywhere else, so no
        *Cancel* row is needed. Nothing here is a footer button any more: "get rid of the buttons
        in the footer".

        Two things, in this order — Add widget, Reset layout. *Match sizes* is gone with the sizes
        themselves: every card is the width its widget declares and as tall as its content, so
        there is nothing left to match. *Put it back* follows, but only when there is a move to
        take back: it is the one row here that is not one of the two.
      */}
      {homeMenuOpen && menuPos ? (
        <>
          <div className="home-menu__scrim" aria-hidden="true" onClick={() => setHomeMenuOpen(false)} />
          <div
            ref={menuRef}
            role="dialog"
            aria-label={t('Home layout')}
            className="home-menu"
            style={{ top: menuPos.top, left: menuPos.left }}
            onKeyDown={menuKeys}
          >
            <button
              type="button"
              className="list-row home-menu__row"
              onClick={() => {
                setHomeMenuOpen(false);
                setAddOpen(true);
              }}
            >
              <Icon name="plus" size={18} />
              <span className="grow">{t('Add widget')}</span>
            </button>

            <button
              type="button"
              className="list-row home-menu__row"
              onClick={() => {
                resetLayout();
                setHomeMenuOpen(false);
              }}
            >
              <Icon name="refresh" size={18} />
              <span className="grow">{t('Reset layout')}</span>
            </button>

            {moves.length > 0 ? (
              <button
                type="button"
                className="list-row home-menu__row"
                onClick={() => {
                  undoMove();
                  setHomeMenuOpen(false);
                }}
              >
                <Icon name="arrowLeft" size={18} />
                <span className="grow">{t('Put it back')}</span>
              </button>
            ) : null}

            {/* The reset was the one arrangement change with no way back: it cleared the move
                history in the same instant, so the "Put it back" a row lower was gone with the
                layout it described (31.2). */}
            {preReset ? (
              <button
                type="button"
                className="list-row home-menu__row"
                onClick={() => {
                  restoreHomeLayout(preReset);
                  setPreReset(null);
                  setHomeMenuOpen(false);
                  setNote(t('Arrangement restored'));
                }}
              >
                <Icon name="arrowLeft" size={18} />
                <span className="grow">{t('Put the arrangement back')}</span>
              </button>
            ) : null}
          </div>
        </>
      ) : null}

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
                      <Button
                        size="sm"
                        icon="plus"
                        aria-label={t('Add {widget}', { widget: t(widget.title) })}
                        onClick={() => {
                          /*
                           * The list must not move under the finger (24.3). Removing the row above
                           * where the traveller pressed pulled everything up by a row's height, so
                           * a second press landed on a different widget's Add. The sheet's scroll
                           * offset is kept, so the pressed row leaves and nothing else moves.
                           */
                          const sheet = document.querySelector<HTMLElement>('.modal');
                          const scrolled = sheet?.scrollTop ?? 0;
                          addHomeWidget(widget.id);
                          requestAnimationFrame(() => {
                            if (sheet) sheet.scrollTop = scrolled;
                          });
                          /* Adding was silent: the count simply dropped 12 → 11 and the row left
                             the list (24.4). The live region above says what happened. */
                          setNote(t('{widget} added to the home screen', { widget: t(widget.title) }));
                        }}
                      >
                        {t('Add')}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <div className="row-wrap">
            <Button size="sm" icon="refresh" onClick={resetLayout}>
              {t('Reset to the default layout')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
