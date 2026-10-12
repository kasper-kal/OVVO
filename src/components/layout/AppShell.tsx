import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon, type IconName } from '../ui/Icons';
import { Button, Dialog, IconButton, Toaster } from '../ui/primitives';
import { useApp } from '../../state/AppState';

/**
 * Application shell.
 * [OCR Visual Transcode - Structural Layout Diagram Map]
 * HEADER: Fill=#18181B, R=32, min-H=60 | SIDEBAR: L2 #FFFFFF card, R=28 |
 * FLOATING_DOCK: Fill=#18181B, R=9999, item 44x44 | ACTIVE=Fill #FF7E67
 */

interface NavEntry {
  to: string;
  label: string;
  icon: IconName;
  badge?: number;
  hint?: string;
}

interface NavGroup {
  title: string;
  items: NavEntry[];
}

export function useNavigation(): NavGroup[] {
  const { savedJourneys, favouriteStopIds, recentSearches } = useApp();
  return [
    {
      title: 'Plan a journey',
      items: [
        { to: '/', label: 'Journey planner', icon: 'search', hint: 'Plan a new journey' },
        { to: '/results', label: 'Journey results', icon: 'route', hint: 'Your current search results' },
        { to: '/map', label: 'Illustrative map', icon: 'map', hint: 'Stops and routes on the prototype map' },
      ],
    },
    {
      title: 'Travel information',
      items: [
        { to: '/stops', label: 'Stations & stops', icon: 'station', hint: 'Stops, facilities and access' },
        { to: '/departures', label: 'Departure boards', icon: 'board', hint: 'Simulated departure times' },
        { to: '/disruptions', label: 'Disruptions', icon: 'alert', hint: 'Example delays and works' },
      ],
    },
    {
      title: 'Yours',
      items: [
        { to: '/favourites', label: 'Favourite locations', icon: 'star', badge: favouriteStopIds.length },
        { to: '/journeys', label: 'Saved journeys', icon: 'bookmark', badge: savedJourneys.length },
        { to: '/recent', label: 'Recent searches', icon: 'history', badge: recentSearches.length },
        { to: '/preferences', label: 'Travel preferences', icon: 'sliders' },
        { to: '/settings', label: 'Settings', icon: 'settings' },
      ],
    },
  ];
}

function isActivePath(current: string, to: string): boolean {
  if (to === '/') return current === '/' || current === '';
  return current === to || current.startsWith(`${to}/`);
}

function Sidebar() {
  const groups = useNavigation();
  const location = useLocation();
  return (
    <nav className="app-sidebar" aria-label="Main navigation">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="nav-group__title field__label">{group.title}</p>
          <ul className="nav-list">
            {group.items.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="nav-item"
                  aria-current={isActivePath(location.pathname, item.to) ? 'page' : undefined}
                  title={item.hint}
                >
                  <Icon name={item.icon} size={18} />
                  <span className="grow">{item.label}</span>
                  {item.badge ? <span className="nav-item__badge">{item.badge}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="t-sm t-faint">
        Prototype — every time, delay and platform in this app is simulated demonstration data.
      </p>
    </nav>
  );
}

const DOCK_ITEMS: NavEntry[] = [
  { to: '/', label: 'Plan', icon: 'search' },
  { to: '/map', label: 'Map', icon: 'map' },
  { to: '/departures', label: 'Boards', icon: 'board' },
  { to: '/disruptions', label: 'Alerts', icon: 'alert' },
];

function MobileDock({ onOpenMenu }: { onOpenMenu: () => void }) {
  const location = useLocation();
  return (
    <nav className="app-dock" aria-label="Quick navigation">
      {DOCK_ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="app-dock__item"
          aria-current={isActivePath(location.pathname, item.to) ? 'page' : undefined}
          aria-label={item.label}
          title={item.label}
        >
          <Icon name={item.icon} size={20} />
        </Link>
      ))}
      <button type="button" className="app-dock__item" aria-label="All sections" title="All sections" onClick={onOpenMenu}>
        <Icon name="menu" size={20} />
      </button>
    </nav>
  );
}

function MenuDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const groups = useNavigation();
  const location = useLocation();
  return (
    <Dialog open={open} title="All sections" description="Prototype navigation" onClose={onClose}>
      <div className="stack">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="field__label" style={{ marginBottom: 'var(--s-2)' }}>
              {group.title}
            </p>
            <ul className="nav-list">
              {group.items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="nav-item"
                    onClick={onClose}
                    aria-current={isActivePath(location.pathname, item.to) ? 'page' : undefined}
                  >
                    <Icon name={item.icon} size={18} />
                    <span className="grow">{item.label}</span>
                    {item.badge ? <span className="nav-item__badge">{item.badge}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Dialog>
  );
}

function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings } = useApp();
  return (
    <Dialog
      open={open}
      title="About this prototype"
      description="Stage 1 — interface prototype with demonstration data"
      onClose={onClose}
      footer={
        <>
          <Link to="/settings" className="btn btn--primary" onClick={onClose}>
            Open settings
          </Link>
          <Link to="/preferences" className="btn" onClick={onClose}>
            Travel preferences
          </Link>
        </>
      }
    >
      <div className="stack">
        <p className="t-sm">
          OV Planner is an independent Dutch public transport journey planner concept. This build is the
          first-stage frontend prototype: it contains no live feeds, no routing service and no production
          backend.
        </p>
        <ul className="stack-2">
          <li className="row-3">
            <span className="status-dot status-dot--coral" />
            <span className="t-sm">Every timetable, delay, platform and alert is simulated demonstration data.</span>
          </li>
          <li className="row-3">
            <span className="status-dot status-dot--coral" />
            <span className="t-sm">The map is illustrative and not geographically accurate.</span>
          </li>
          <li className="row-3">
            <span className="status-dot" />
            <span className="t-sm">
              Favourites, saved journeys, recent searches and preferences are stored only in this browser.
            </span>
          </li>
        </ul>
        <p className="t-sm t-muted">
          Display mode: {settings.density === 'compact' ? 'compact' : 'comfortable'} ·{' '}
          {settings.timeFormat === '24h' ? '24-hour' : '12-hour'} clock ·{' '}
          {settings.dateFormat === 'short' ? 'dd-mm-yyyy' : 'descriptive'} dates
        </p>
      </div>
    </Dialog>
  );
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
}: {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <header className="page-head">
      {breadcrumbs?.length ? (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="row">
              {crumb.to ? (
                <Link to={crumb.to}>{crumb.label}</Link>
              ) : (
                <span aria-current="page">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 ? <Icon name="chevronRight" size={14} /> : null}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="between wrap">
        <div className="stack-1">
          <h1 className="t-display">{title}</h1>
          {description ? <p className="t-sm t-muted" style={{ maxWidth: 720 }}>{description}</p> : null}
        </div>
        <div className="row-wrap">
          {badge}
          {actions}
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/" className="app-header__brand" aria-label="OV Planner home">
            <span className="app-header__mark" aria-hidden="true">
              OV
            </span>
            <span className="app-header__title">OV Planner</span>
          </Link>
          <span className="grow" />
          <span className="app-header__chip">Demo data</span>
          <IconButton
            icon="info"
            label="About this prototype"
            className="app-header__info"
            variant="ghost"
            onClick={() => setAboutOpen(true)}
          />
        </div>
      </header>

      <div className="app-body">
        <Sidebar />
        <main className="app-main" id="main">
          {children}
        </main>
      </div>

      <MobileDock onOpenMenu={() => setMenuOpen(true)} />
      <MenuDialog open={menuOpen} onClose={() => setMenuOpen(false)} />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <Toaster />
    </div>
  );
}

export function BackButton({ to, label = 'Back' }: { to: string; label?: string }) {
  return (
    <Link to={to} className="btn btn--ghost">
      <Icon name="arrowLeft" size={16} />
      {label}
    </Link>
  );
}

export function ActionRow({ children }: { children: ReactNode }) {
  return <div className="row-wrap">{children}</div>;
}

export function ButtonLink({
  to,
  children,
  variant = 'surface',
  icon,
}: {
  to: string;
  children: ReactNode;
  variant?: 'primary' | 'accent' | 'ghost' | 'sage' | 'butter' | 'surface';
  icon?: IconName;
}) {
  return (
    <Link to={to} className={['btn', variant !== 'surface' ? `btn--${variant}` : ''].filter(Boolean).join(' ')}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </Link>
  );
}

export { Button };
