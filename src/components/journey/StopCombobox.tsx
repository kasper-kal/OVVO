import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../state/AppState';
import { customStopName, stopLabel } from '../../data/stops';
import { modeLabel } from '../../data/preferences';
import { rankStops } from '../../lib/stopSearch';
import { dismissKeyboard } from '../../lib/dismissKeyboard';
import { Icon, ModeIcon } from '../ui/Icons';
import { stopTypeLabel } from '../../lib/format';
import { useT } from '../../lib/useT';
import { Pill } from '../ui/primitives';
import type { Stop } from '../../data/types';

interface Props {
  id: string;
  label: string;
  /**
   * Let the caller render the `<label htmlFor={id}>` instead of rendering it here.
   */
  hideLabel?: boolean;
  value: Stop | null;
  onSelect: (stop: Stop | null) => void;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  /**
   * Show the resolved-stop line under the box.
   */
  showHint?: boolean;
  /**
   * Offer only the stops this passes.
   *
   * The departure board's picker passes `hasBoard`: a board lists services, so an address with
   * no services is not a stop this field can open — it would commit to a board that cannot
   * exist. The planner's own pickers pass nothing, because you can perfectly well travel to a
   * museum; the two uses of the same control differ only in this.
   */
  filter?: (stop: Stop) => boolean;
  /** The line under “No stops match” — say why nothing matched when a filter is in play. */
  emptyHint?: string;
  /**
   * **Empty the field once a stop is picked**, instead of writing the choice into it.
   *
   * A field that *chooses an end* (the planner's, Settings' default origin) keeps the name so the
   * control can be read back. A field that **adds** something — the departure board's *Add a stop to
   * the board* — must not: the stop it just added is already on the page as a board of its own, so
   * leaving the name in the box says the same thing twice and leaves a filled field under an
   * instruction to add another one. Reported on the board: *"why does the old station stay in the
   * search box when its already pinned"* — and it stayed because `commit` wrote it there.
   */
  clearAfterPick?: boolean;
}

/**
 * A labelled stop field with its own suggestion list.
 *
 * The planner does not use this any more — its two rows open the full-screen picker — but
 * the departure board, the settings picker and the "find a stop" widget do, so the same
 * control still has to work inline. The ranking itself is shared with that picker
 * (`rankStops`), so the two can never disagree about what a query matches.
 */
export function StopCombobox({
  id,
  label,
  value,
  onSelect,
  placeholder,
  invalid,
  describedBy,
  showHint = true,
  hideLabel = false,
  clearAfterPick = false,
  filter,
  emptyHint,
}: Props) {
  const { favouriteStopIds, nearestOrigin } = useApp();
  const t = useT();
  const [query, setQuery] = useState(value ? stopLabel(value.id) : '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  /**
   * How tall the suggestion list may be, measured from where the field actually sits — **on phones
   * only**, which is the scope of the round this answers.
   *
   * A fixed `min(58vh, 460px)` was decided without knowing where the field is on the page, so a
   * picker near the foot of a phone screen drew a 425px list with only the top of it on screen —
   * the list could be scrolled, but its own scrollbar was below the viewport, which is what the
   * round reported as "its not possible to scroll through the options so you have to scroll using
   * the page" (2026-10-17t20-06-25). On a phone the cap is the room that is actually there, and
   * the list always hangs **downwards** from the field (see the measurement below for why). Wider
   * screens keep the old shape: there, `min(58vh, 460px)` is a promise the audit measures (six or
   * more rows may not be squeezed under 300px), and a desktop page always has room to scroll to a
   * list that reaches past its own fold.
   */
  const [cap, setCap] = useState(460);
  /** True when there are more rows than fit, so the panel must not show a sliver of the next one. */
  const [more, setMore] = useState(false);
  /** Mirrors the selected stop so external changes (reverse, quick fill, location) update the text. */
  const selectedIdRef = useRef<string | null>(value?.id ?? null);
  /** True while the traveller is typing, so we do not overwrite what they typed. */
  const typingRef = useRef(false);

  useEffect(() => {
    const nextId = value?.id ?? null;
    if (nextId === selectedIdRef.current) return;
    selectedIdRef.current = nextId;
    if (nextId === null && typingRef.current) return;
    setQuery(nextId ? stopLabel(nextId) : '');
  }, [value]);

  /* The room the list is allowed, re-read whenever the page moves under it. */
  useEffect(() => {
    if (!open) return undefined;
    const measure = () => {
      const field = rootRef.current?.querySelector('.combobox__field');
      if (!field) return;
      /*
       * Mobile mode only, on the stylesheet's one breakpoint (`base.css`, "the one breakpoint"):
       * below 720 the list is capped to the room under the field, above it there is height to
       * spare. This used to say 640, a fourth width of its own, so a 700px window got the phone
       * list inside the desktop page — the kind of half-treated width the breakpoint rule exists
       * to stop.
       */
      const box = field.getBoundingClientRect();
      /*
       * **The room below is measured to the bottom of what the traveller can see** — which, with
       * the phone's keyboard up, is the top of the keyboard. `visualViewport` is that box; the
       * window's own height is not, because the keyboard does not change it.
       */
      const view = window.visualViewport;
      const visibleFoot = view ? view.height + view.offsetTop : window.innerHeight;
      /*
       * **The dock is not room either.**
       *
       * The floating navigation dock is fixed over the foot of the screen on a phone, so a list
       * given all the space to the bottom edge ends with its last row drawn behind the dock — the
       * rows can be scrolled, but the part you are aiming at is covered. The room stops at the
       * dock's top edge when the dock is actually drawn.
       */
      const dock = document.querySelector<HTMLElement>('.app-dock');
      const dockTop = dock && dock.getBoundingClientRect().height > 0 ? dock.getBoundingClientRect().top : visibleFoot;
      const foot = Math.min(visibleFoot, dockTop);
      const below = foot - box.bottom - 12;
      /*
       * **A list is whole rows.**
       *
       * The cap used to be the exact number of pixels of room, so the last row in the panel was
       * cut across its second line and the first one was cut at the top — a panel that reads as
       * broken even though it scrolls (reported with that screenshot). The height is now a whole
       * number of the rows this list actually draws (measured, since a long name can make a row
       * taller than 56px) plus the panel's own padding and borders.
       */
      const rows = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('.suggestion') ?? []);
      /* The panel's own edges: 8px above the rows, a 1px border each side, 8px under the last row. */
      const above_rows = 10;
      const below_rows = 8;
      /*
       * **The list always hangs downwards.**
       *
       * It used to turn upwards whenever the room below was smaller than a full list, and briefly
       * only when there was not one row left — but any upward list is drawn over the card above the
       * field, which is where the traveller is reading (reported from the next-departures card with
       * a screenshot of the results sitting over the card above it, and the rows cut off at the top
       * of the screen, 2026-10-28). The keyboard is what made the room below look empty: opening it
       * shrinks the visible area without scrolling the page, so the list flipped up while there was
       * plenty of screen underneath. Measured to the visible foot and hung downwards, the cap is
       * what keeps a list on screen. A list that stays where it was put is worth a shorter list.
       */
      const room = Math.max(1, Math.min(460, below));
      if (rows.length === 0) {
        /* "No stops match" is a sentence, not rows: give it the room there is. */
        setCap(Math.min(room, 460));
        setMore(false);
        return;
      }
      /*
       * Rows are not all one height — a long station name wraps to a second line — so each is
       * measured and added while it still fits, instead of dividing the room by the first one. That
       * division is what left the bottom row cut across its middle edge at the panel's edge.
       */
      const heights = rows.map((row) => row.getBoundingClientRect().height);
      const all = heights.reduce((sum, height) => sum + height, 0);
      if (above_rows + all + below_rows <= room) {
        /* Every row fits: the panel is exactly as tall as its rows plus its padding. */
        setCap(above_rows + all + below_rows);
        setMore(false);
        return;
      }
      /*
       * More rows than fit. There is no bottom padding in this state (`suggestions--more` in the
       * stylesheet): a scrollport clips at its padding box, so 8px of padding under the last row is
       * a window onto the top of the row after it, which reads as a list ending in a cut-off line.
       * Whole rows only, and never fewer than one — the list scrolls, and an empty panel is not a
       * list.
       */
      let whole = 0;
      for (const height of heights) {
        if (above_rows + whole + height > room) break;
        whole += height;
      }
      setCap(Math.min(room, Math.max(above_rows + whole, Math.min(room, above_rows + heights[0]))));
      setMore(true);
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    /*
     * The keyboard is a resize of the *visual* viewport only: without these two the list keeps the
     * height it was given before the keyboard appeared (or before it went away), and a list capped
     * for a screen that is no longer there is either one row tall or taller than the room.
     */
    window.visualViewport?.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('scroll', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      window.visualViewport?.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('scroll', measure);
    };
  }, [open]);

  /*
   * What closes the list: a press outside it, or focus moving to something else. **Not** a blur on
   * its own, and never a scroll.
   *
   * The old rule was a 140ms timeout after the input's `blur`, and a page scroll blurs a focused
   * input on a phone — so reaching for the list by scrolling the page dismissed it, which is the
   * other half of the same report. A press outside is what the traveller means by leaving, and the
   * list's own scroll never touches the input's focus at all.
   */
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) setOpen(false);
    };
    const onFocusOut = (event: FocusEvent) => {
      const root = rootRef.current;
      const next = event.relatedTarget as Node | null;
      if (root && next && !root.contains(next)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    const root = rootRef.current;
    root?.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      root?.removeEventListener('focusout', onFocusOut);
    };
  }, [open]);

  const suggestions = useMemo(() => {
    const ranked = rankStops(query, favouriteStopIds, { origin: nearestOrigin });
    return filter ? ranked.filter(filter) : ranked;
  }, [query, favouriteStopIds, filter, nearestOrigin]);

  /*
   * The stop whose code and modes are shown in the hint line under the field.
   *
   * It is **not** just `value`: typing the first letter of a new stop makes the field clear its
   * value ("this end is no longer chosen"), and the hint used to vanish with it — so the line
   * appeared and disappeared under the caret while the traveller was still typing. What the field
   * still holds until another stop is committed is the previous one, and its code and modes are
   * still the useful description of it. Choosing another stop replaces it; clearing the field with
   * the × empties it (`commit(null)`).
   */
  const [held, setHeld] = useState<Stop | null>(value ?? null);
  useEffect(() => {
    if (value) setHeld(value);
  }, [value]);

  const commit = (stop: Stop | null) => {
    typingRef.current = false;
    selectedIdRef.current = stop?.id ?? null;
    if (!stop || clearAfterPick) setHeld(null);
    onSelect(stop);
    setQuery(stop && !clearAfterPick ? stopLabel(stop.id) : '');
    setOpen(false);
    /*
     * A stop has been chosen, so the field has finished its job and the phone's keyboard goes
     * with it — otherwise it stays up over the board the stop just opened. Clearing the field
     * (`commit(null)`, the ×) is not that moment: there the caller puts focus back to type again.
     */
    if (stop) dismissKeyboard();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      /*
       * The first press opens the list *on* its first row; the second moves down.
       *
       * It used to open and increment in one gesture, so the top-ranked suggestion was
       * unreachable with the arrows: on an empty field one press went from Leeuwarden to Alkmaar
       * and Enter wrote the second result (32.2).
       */
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
      } else {
        setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      if (open && activeIndex < suggestions.length) {
        event.preventDefault();
        const stop = suggestions[activeIndex];
        if (stop) commit(stop);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="combobox" ref={rootRef}>
      {hideLabel ? null : (
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="combobox__field">
        <div className={`input-group${invalid ? ' input-group--invalid' : ''}`}>
          <Icon name="search" size={18} />
          <input
            id={id}
            ref={inputRef}
            className="input-group__field"
            /* With the visible label hidden, the name still has to exist — a placeholder is not
               an accessible name, and it disappears the moment the field is typed in. */
            aria-label={hideLabel ? label : undefined}
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={`${id}-listbox`}
            aria-autocomplete="list"
            /* The option the arrows are on, by id: without this a screen reader heard the list's
               count and never which row Enter would take (1.3, 6.6, 32.3). */
            aria-activedescendant={open && suggestions.length > 0 ? `${id}-option-${activeIndex}` : undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            autoComplete="off"
            placeholder={placeholder ?? 'Type a station, stop or landmark'}
            value={query}
            onChange={(event) => {
              typingRef.current = true;
              selectedIdRef.current = null;
              setQuery(event.target.value);
              setOpen(true);
              setActiveIndex(0);
              if (value) onSelect(null);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
          />
          {query ? (
            <button
              type="button"
              className="btn btn--ghost btn--icon-circle"
              aria-label={t('Clear {label}', { label: label.toLowerCase() })}
              onClick={() => {
                commit(null);
                inputRef.current?.focus();
              }}
            >
              <Icon name="close" size={16} />
            </button>
          ) : null}
        </div>

        {open && suggestions.length > 0 ? (
          <ul
            className={`suggestions${more ? ' suggestions--more' : ''}`}
            id={`${id}-listbox`}
            role="listbox"
            aria-label={t('{label} suggestions', { label })}
            style={{ maxHeight: `${cap}px` }}
          >
            {suggestions.map((stop, index) => (
              <li
                key={stop.id}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
              >
                <button
                  type="button"
                  className="suggestion"
                  data-active={index === activeIndex}
                  /*
                   * `-1`, not a tab stop. Eight suggestion buttons used to sit between the field and
                   * the next control on the page — eight presses through a list whose rows are
                   * chosen with the arrows, and Escape stopped working the moment the keyboard was
                   * inside one (11.8, 32.3). The arrows and Enter are the list's keyboard route;
                   * a press still works for a pointer.
                   */
                  tabIndex={-1}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commit(stop)}
                >
                <span className="stack-1 grow">
                  <span className="t-strong t-body row">
                    {/* Solid, because a favourite is on: the same filled heart the control that
                        set it wears (see `pressedIcon` in `components/ui/Icons`). */}
                    {favouriteStopIds.includes(stop.id) ? <Icon name="heartFilled" size={13} /> : null}
                    {customStopName(stop.id) ?? stop.name}
                  </span>
                  <span className="t-sm t-muted">
                    {/* The raw type ("station") was printed at a Dutch traveller (6.8). */}
                    {stop.city} · {stop.code} · {t(stopTypeLabel(stop.type))}
                  </span>
                </span>
                  <span className="suggestion__modes">
                    {stop.modes
                      .filter((mode) => mode !== 'walk' && mode !== 'bike')
                    .slice(0, 3)
                    .map((mode) => (
                      <ModeIcon key={mode} mode={mode} size={17} />
                    ))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {open && query && suggestions.length === 0 ? (
          /*
           * No matches is a **message**, not a listbox with no options: a listbox role announced
           * an empty list and the sentence inside it belonged to no option (32.5). `role="status"`
           * says it once, and the field stops claiming its list is open.
           */
          <div
            className="suggestions"
            role="status"
            aria-label={t('{label} suggestions', { label })}
            style={{ maxHeight: `${cap}px` }}
          >
            <p className="stack-1" style={{ padding: 'var(--s-3)', margin: 0 }}>
              <span className="t-strong t-body">
                {t('No stops match “{query}”', { query })}
              </span>
              <span className="t-sm t-muted">
                {emptyHint ?? t('Search by station, stop or landmark name.')}
              </span>
            </p>
          </div>
        ) : null}

      </div>
      {showHint && held ? (
        <p className="field__hint row">
          <Pill tone="sage">{held.code}</Pill>
          {held.modes.map(modeLabel).join(', ')}
        </p>
      ) : null}
    </div>
  );
}
