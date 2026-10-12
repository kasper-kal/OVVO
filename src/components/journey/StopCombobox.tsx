import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../state/AppState';
import { STOPS, getStop, stopLabel } from '../../data/stops';
import { Icon, ModeIcon } from '../ui/Icons';
import { Pill } from '../ui/primitives';
import type { Stop } from '../../data/types';

interface Props {
  id: string;
  label: string;
  value: Stop | null;
  onSelect: (stop: Stop | null) => void;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
}

function score(stop: Stop, query: string): number {
  const haystack = `${stop.name} ${stop.city} ${stop.code}`.toLowerCase();
  if (!query) return 0;
  if (haystack.startsWith(query)) return 3;
  if (stop.name.toLowerCase().startsWith(query)) return 2;
  if (haystack.includes(query)) return 1;
  return -1;
}

export function StopCombobox({ id, label, value, onSelect, placeholder, invalid, describedBy }: Props) {
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
    const normalised = query.trim().toLowerCase();
    if (!normalised) {
      const favourites = favouriteStopIds.map((stopId) => getStop(stopId)).filter((s): s is Stop => Boolean(s));
      const popular = ['amsterdam-centraal', 'utrecht-centraal', 'rotterdam-centraal', 'schiphol-airport', 'den-haag-centraal', 'eindhoven-centraal']
        .map((stopId) => getStop(stopId))
        .filter((s): s is Stop => Boolean(s));
      const merged = [...favourites, ...popular.filter((p) => !favourites.some((f) => f.id === p.id))];
      return merged.slice(0, 8);
    }
    return STOPS.map((stop) => ({ stop, rank: score(stop, normalised) }))
      .filter((entry) => entry.rank > 0)
      .sort((a, b) => b.rank - a.rank || a.stop.name.localeCompare(b.stop.name, 'nl'))
      .slice(0, 8)
      .map((entry) => entry.stop);
  }, [query, favouriteStopIds]);

  const commit = (stop: Stop | null) => {
    typingRef.current = false;
    selectedIdRef.current = stop?.id ?? null;
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
      if (open && suggestions[activeIndex]) {
        event.preventDefault();
        commit(suggestions[activeIndex]);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="combobox">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className={`input-group${invalid ? ' input-group--invalid' : ''}`}>
        <Icon name="location" size={18} />
        <input
          id={id}
          ref={inputRef}
          className="input-group__field"
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
                  <span className="t-strong t-sm">{stop.name}</span>
                  <span className="t-sm t-muted">
                    {stop.city} · {stop.code} · {stop.type}
                  </span>
                </span>
                <span className="suggestion__modes">
                  {stop.modes
                    .filter((mode) => mode !== 'walk' && mode !== 'bike')
                    .slice(0, 3)
                    .map((mode) => (
                      <ModeIcon key={mode} mode={mode} size={15} />
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
            <span className="t-strong t-sm">No stops match “{query}”</span>
            <span className="t-sm t-muted">
              This prototype searches its own local list of demonstration stops, stations and landmarks.
            </span>
          </li>
        </ul>
      ) : null}
      {value ? (
        <p className="field__hint row">
          <Pill tone="sage">{value.code}</Pill>
          {value.modes.join(', ')}
        </p>
      ) : null}
    </div>
  );
}
