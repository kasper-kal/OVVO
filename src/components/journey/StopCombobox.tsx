import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../state/AppState';
import { customStopName, stopLabel } from '../../data/stops';
import { modeLabel } from '../../data/preferences';
import { rankStops } from '../../lib/stopSearch';
import { Icon, ModeIcon } from '../ui/Icons';
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
  filter,
  emptyHint,
}: Props) {
  const { favouriteStopIds } = useApp();
  const [query, setQuery] = useState(value ? stopLabel(value.id) : '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const suggestions = useMemo(() => {
    const ranked = rankStops(query, favouriteStopIds);
    return filter ? ranked.filter(filter) : ranked;
  }, [query, favouriteStopIds, filter]);

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
    if (!stop) setHeld(null);
    onSelect(stop);
    setQuery(stop ? stopLabel(stop.id) : '');
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
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
    <div className="combobox">
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
            aria-expanded={open}
            aria-controls={`${id}-listbox`}
            aria-autocomplete="list"
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
            onBlur={() => window.setTimeout(() => setOpen(false), 140)}
            onKeyDown={onKeyDown}
          />
          {query ? (
            <button
              type="button"
              className="btn btn--ghost btn--icon-circle"
              aria-label={`Clear ${label.toLowerCase()}`}
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
          <ul className="suggestions" id={`${id}-listbox`} role="listbox" aria-label={`${label} suggestions`}>
            {suggestions.map((stop, index) => (
              <li key={stop.id} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  className="suggestion"
                  data-active={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commit(stop)}
                >
                <span className="stack-1 grow">
                  <span className="t-strong t-body row">
                    {favouriteStopIds.includes(stop.id) ? <Icon name="heart" size={13} /> : null}
                    {customStopName(stop.id) ?? stop.name}
                  </span>
                  <span className="t-sm t-muted">
                    {stop.city} · {stop.code} · {stop.type}
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
          <ul className="suggestions" id={`${id}-listbox`} role="listbox" aria-label={`${label} suggestions`}>
            <li className="stack-1" style={{ padding: 'var(--s-3)' }}>
              <span className="t-strong t-body">No stops match “{query}”</span>
              <span className="t-sm t-muted">{emptyHint ?? 'Search by station, stop or landmark name.'}</span>
            </li>
          </ul>
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
