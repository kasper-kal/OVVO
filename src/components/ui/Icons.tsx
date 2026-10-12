import type { ReactNode } from 'react';
import type { TravelMode } from '../../data/types';

/** Hairline line-icon set drawn in the design system's 1.75px structural stroke. */
const PATHS: Record<string, ReactNode> = {
  train: (
    <>
      <rect x="5" y="4" width="14" height="12" rx="3" />
      <path d="M5 10h14M9.5 20l1.5-4M14.5 20L13 16" />
      <path d="M9 14h.01M15 14h.01" />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="5" width="16" height="12" rx="3" />
      <path d="M4 11h16M8 5V3h8v2" />
      <circle cx="8" cy="19.5" r="1.6" />
      <circle cx="16" cy="19.5" r="1.6" />
    </>
  ),
  tram: (
    <>
      <rect x="6" y="4" width="12" height="13" rx="3" />
      <path d="M6 11h12M12 4V2M9 20h.01M15 20h.01" />
    </>
  ),
  metro: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 16V9l3.5 4.5L15.5 9v7" />
    </>
  ),
  ferry: (
    <>
      <path d="M4 14.5l1.5-5h13L20 14.5" />
      <path d="M3 15c1.8 2.8 3.6 2.8 5.4 0 1.8 2.8 3.6 2.8 5.4 0 1.8 2.8 3.6 2.8 5.4 0" />
      <path d="M12 9.5V6M9.5 6h5" />
    </>
  ),
  walk: (
    <>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M10.5 8L9 14h3l1 6.5M13.5 8l3 3.5" />
    </>
  ),
  bike: (
    <>
      <circle cx="6" cy="17" r="3.2" />
      <circle cx="18" cy="17" r="3.2" />
      <path d="M9 17l3-8 3 8M10 9h4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.6-4.6" />
    </>
  ),
  swap: <path d="M7 4.5v15M7 19.5l-3-3M7 19.5l3-3M17 19.5v-15M17 4.5l-3 3M17 4.5l3 3" />,
  location: (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="4" />
      <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  star: <path d="M12 4l2.4 5 5.6.8-4 4 1 5.6L12 16.8 7 19.4l1-5.6-4-4 5.6-.8z" />,
  bookmark: <path d="M7 4.5h10a1.5 1.5 0 011.5 1.5v14L12 16l-6.5 4V6A1.5 1.5 0 017 4.5z" />,
  map: (
    <>
      <path d="M9 4.5L4 6.5v13l5-2 6 2 5-2v-13l-5 2-6-2z" />
      <path d="M9 4.5v13M15 6.5v13" />
    </>
  ),
  station: (
    <>
      <rect x="4.5" y="8" width="15" height="12" rx="3" />
      <path d="M4.5 13h15M12 8V4M8 20v-3h8v3" />
    </>
  ),
  board: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="4" />
      <path d="M8 9.5h8M8 13h5" />
    </>
  ),
  alert: <path d="M12 4l8.5 15H3.5L12 4zM12 10v4M12 16.5h.01" />,
  heart: <path d="M12 19s-6.5-4.2-6.5-8.4A4.1 4.1 0 0112 7.6a4.1 4.1 0 016.5 3C18.5 14.8 12 19 12 19z" />,
  sliders: (
    <>
      <path d="M5 7h14M5 12h14M5 17h14" />
      <circle cx="9" cy="7" r="1.8" />
      <circle cx="15" cy="12" r="1.8" />
      <circle cx="10" cy="17" r="1.8" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" />
    </>
  ),
  chevronDown: <path d="M6 9.5l6 6 6-6" />,
  chevronUp: <path d="M6 14.5l6-6 6 6" />,
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  chevronLeft: <path d="M14.5 6l-6 6 6 6" />,
  arrowRight: <path d="M4.5 12h14M13 6.5l5.5 5.5L13 17.5" />,
  arrowLeft: <path d="M19.5 12h-14M11 6.5L5.5 12 11 17.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  minus: <path d="M5.5 12h13" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8h.01" />
    </>
  ),
  refresh: <path d="M19.5 12a7.5 7.5 0 11-2.5-5.6M19.5 4v4.5H15" />,
  filter: <path d="M4 6.5h16M7 12h10M10 17.5h4" />,
  trash: <path d="M5 8h14M9.5 8V5.5h5V8M7 8l1 12h8l1-12" />,
  share: (
    <>
      <circle cx="17" cy="6" r="2.5" />
      <circle cx="7" cy="12" r="2.5" />
      <circle cx="17" cy="18" r="2.5" />
      <path d="M9.2 10.8l5.6-3.1M9.2 13.2l5.6 3.1" />
    </>
  ),
  zoomIn: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.4-4.4M11 8.5v5M8.5 11h5" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.4-4.4M8.5 11h5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  home: <path d="M4 11l8-6.5 8 6.5v8a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 19v-8z" />,
  users: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19.5a5.5 5.5 0 0111 0M16 6.5a3 3 0 010 5.6M17.5 14.7a5 5 0 013 4.8" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M8.5 18h4.5a3 3 0 000-6h-1a3 3 0 010-6h4.5" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 9.5A2.5 2.5 0 016.5 7h11A2.5 2.5 0 0120 9.5v1.2a1.8 1.8 0 000 3.6v1.2a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 15.5v-1.2a1.8 1.8 0 000-3.6z" />
      <path d="M12 7v10" />
    </>
  ),
  history: (
    <>
      <path d="M4.5 12a7.5 7.5 0 107.5-7.5A7.5 7.5 0 005 9" />
      <path d="M4.5 5v4h4M12 8.5V12l2.5 1.8" />
    </>
  ),
  accessibility: (
    <>
      <circle cx="12" cy="5" r="1.8" />
      <path d="M7 9.5h10L14 13l1.5 7M10 13l-1.5 7M12 10v3" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.75,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

export const MODE_ICON_NAME: Record<TravelMode, IconName> = {
  walk: 'walk',
  bike: 'bike',
  train: 'train',
  bus: 'bus',
  tram: 'tram',
  metro: 'metro',
  ferry: 'ferry',
};

export function ModeIcon({ mode, size = 16 }: { mode: TravelMode; size?: number }) {
  return <Icon name={MODE_ICON_NAME[mode]} size={size} />;
}
