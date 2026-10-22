import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { BrandMark, Icon, type IconName } from '../ui/Icons';
import { Button, Dialog, Toaster } from '../ui/primitives';
import { DISRUPTIONS } from '../../data/disruptions';
import { LocationPermission } from '../location/LocationPermission';
import { OfflineBar } from './OfflineBar';
import { useT } from '../../lib/useT';
import { translate } from '../../lib/i18n';
import { useApp } from '../../state/AppState';

/**
 * Application shell.
 * [OCR Visual Transcode - Structural Layout Diagram Map]
 * TOP_ROW: no bar, mark centred in its own column, alerts entry top right |
 * SIDEBAR: L2 #FFFFFF card, R=28 |
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

/** The navigation, in the language the traveller chose. */
export function useNavigation(): NavGroup[] {
  const { settings } = useApp();
  const t = (key: string) => translate(settings.language, key);
  return [
    {
      title: t('Home'),
      items: [
        { to: '/', label: t('Home'), icon: 'home', hint: t('Plan a journey and browse the network') },
        /*
          There was a "Journey results" entry here, and it was a way to a screen that answers a
          question — the results of a search you have just made. The planner's second stop goes
          there by itself, so a menu entry only led to "No search has been run in this browser
          yet" for anyone who had not searched. Removed on the traveller's instruction; the route
          itself is untouched, because that is where a search lands.
        */
      ],
    },
    {
      title: t('Travel information'),
      items: [
        { to: '/stops', label: t('Stations & stops'), icon: 'station', hint: t('Stops, facilities and access') },
        { to: '/departures', label: t('Departure boards'), icon: 'board', hint: t('Departure times per stop') },
        /*
          The alerts list was reachable from the header's alert icon alone, which is one tap
          from every screen but says nothing about where it goes. Named here again, it is a way
          to the list from the menu as well — and the entry carries the count the header shows,
          so the two agree about how many alerts there are.
        */
        { to: '/disruptions', label: t('Disruptions'), icon: 'alert', hint: t('Delays, cancellations and planned works'), badge: DISRUPTIONS.length },
      ],
    },
    {
      title: t('Yours'),
      items: [
        { to: '/settings', label: t('Settings'), icon: 'settings' },
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
  const t = useT();
  return (
    <nav className="app-sidebar" aria-label={t('Main navigation')}>
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
    </nav>
  );
}

const DOCK_ITEMS: { to: string; key: string; icon: IconName }[] = [
  { to: '/', key: 'Home', icon: 'home' },
  { to: '/departures', key: 'Boards', icon: 'board' },
];

function MobileDock({ onOpenMenu }: { onOpenMenu: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();
  /*
   * **A double tap on Home opens the basic journey planner.**
   *
   * One tap is still "go home", which is what a navigation entry promises; the second tap inside
   * the double-tap window goes one step further and opens the planner's own picker on its first
   * question — `/?pick=from`, the From picker the planner already opens from `?pick=` — because on
   * a phone Home *is* the planner's screen, so "open the planner" has to mean the field you type in,
   * not the screen you are already standing on.
   *
   * 320ms is the window: short enough that two deliberate taps count, long enough that a thumb
   * rolling over the same 44px target while reading does not. The first tap is never delayed, so
   * single-tap navigation keeps its own timing — the Link does the work, and only the second tap
   * is taken away from it.
   */
  /*
   * **The dock yields while the page is being read.**
   *
   * It is fixed, so wherever it hangs it is over content — at 768×844 it sat on the first
   * result's own controls (2.3), and on the map screen on sixteen stop dots (3.4). Nothing in
   * the layout can reserve its band at every scroll position, so it stops being an obstruction
   * the moment the reader starts moving down the page: the bar slides out on a downward scroll
   * and comes back on an upward one, which is also the gesture that summons the departure
   * board's refresh button. It never hides while it holds the focus, so the keyboard can always
   * reach it, and it is present at the very top of every screen.
   */
  const [yielded, setYielded] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const delta = y - last;
        if (Math.abs(delta) < 6) return;
        last = y;
        setYielded(delta > 0 && y > 24);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const lastHomeTap = useRef(0);
  const onHomeClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const now = Date.now();
    const secondTap = now - lastHomeTap.current < 320;
    lastHomeTap.current = secondTap ? 0 : now;
    if (!secondTap) return;
    event.preventDefault();
    navigate('/?pick=from');
  };
  return (
    <nav className={`app-dock${yielded ? ' app-dock--yielded' : ''}`} aria-label={t('Quick navigation')}>
      {DOCK_ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="app-dock__item"
          aria-current={isActivePath(location.pathname, item.to) ? 'page' : undefined}
          aria-label={t(item.key)}
          title={t(item.key)}
          onClick={item.to === '/' ? onHomeClick : undefined}
        >
          <Icon name={item.icon} size={20} />
        </Link>
      ))}
      <button
        type="button"
        className="app-dock__item"
        aria-label={t('All sections')}
        title={t('All sections')}
        onClick={onOpenMenu}
      >
        <Icon name="menu" size={20} />
      </button>
    </nav>
  );
}

function MenuDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const groups = useNavigation();
  const location = useLocation();
  const t = useT();
  return (
    <Dialog open={open} title={t('All sections')} onClose={onClose}>
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

/**
 * The page's name and description are kept and not drawn: the mark says who the app is and
 * the navigation highlights where you are, so a display title that repeats both cost the
 * first screenful of every page. They stay in the document (screen readers, the outline, a
 * browser's reader mode) as `sr-only`, and what is left on screen is the page's own actions.
 *
 * That holds for the screens the navigation can name (Home, Stations & stops, Departure
 * boards, Disruptions, Settings) and only for those: on the five that are not in the
 * navigation — an alert's page, journey results, journey detail, travel preferences and
 * not-found — nothing on screen said where you were. Those pass `showTitle`, which draws the
 * same heading as one line beside the page's actions instead of hiding it.
 *
 * The alerts list names itself too, and for a reason the navigation cannot supply: a menu entry
 * is a way in, while a list of fourteen alerts with filters over it needs to say on screen what
 * it is. It is the one screen on both sides of that line.
 */
export function PageHeader({
  title,
  description,
  actions,
  badge,
  showTitle = false,
  mobileTitle = false,
}: {
  /* A heading can carry a glyph between its words (the journey page's `from → to`), so the title
     is a node rather than a string — the icon is `aria-hidden`, and the words are still the name. */
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
  badge?: ReactNode;
  /** Draw the page's own name on screen. For screens the navigation cannot name. */
  showTitle?: boolean;
  /*
   * Draw the name on a phone only: the stop page's head holds the name and its three controls as
   * one left-aligned block at 378px, and from 641px up the name is not drawn and the controls go
   * back to the trailing edge — the head that page had before (F18).
   */
  mobileTitle?: boolean;
}) {
  return (
    <>
      {description ? <p className="sr-only">{description}</p> : null}
      {mobileTitle ? (
        <header className="page-head page-head--mobile-title">
          <h1 className="page-head__title t-section">{title}</h1>
          {badge || actions ? (
            <div className="row-wrap page-head__actions">
              {badge}
              {actions}
            </div>
          ) : null}
        </header>
      ) : showTitle ? (
        <header className="page-head">
          <div className="row-wrap">
            {/* No `grow`: the name and the page's controls are one left-aligned group. Growing the
                title pushed the controls to the far edge of the page, which is the right-aligned
                band that was reported ("I'm not Arabic"). */}
            <h1 className="page-head__title t-section">{title}</h1>
            {badge}
            {actions}
          </div>
        </header>
      ) : (
        <>
          <h1 className="sr-only">{title}</h1>
          {badge || actions ? (
            <header className="page-head">
              {/*
                A page's controls stand on the page's own left edge.

                They were moved to the trailing edge to match the rows *inside* cards, and that is
                the wrong reading of the same rule: inside a card a control shares its line with a
                heading, and above a card there is nothing on the left for it to answer — so a
                lone control floated at the far right of an empty band (reported: "Why are SO MANY
                buttons and other things located on the right side (above a widget)"). The card
                rows keep theirs on the right; the page band starts on the left.
              */}
              <div className="row-wrap page-head__actions">
                {badge}
                {actions}
              </div>
            </header>
          ) : null}
        </>
      )}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const [announcement, setAnnouncement] = useState('');
  const location = useLocation();
  const navigationType = useNavigationType();
  const t = useT();
  const alertCount = DISRUPTIONS.length;
  const headerBack = useHeaderBack();
  const { homeEditing, setHomeEditing, homeMenuOpen, setHomeMenuOpen } = useApp();
  /*
   * The home screen's editing controls, drawn in the two corners a phone's home screen uses: **+**
   * where the way back goes, **Done** where the alerts entry sits. They exist only on the home
   * screen and only while it is being customised, so no other screen loses its alerts entry and
   * no screen grows a control for a mode it does not have.
   */
  const onHome = isActivePath(location.pathname, '/');
  const editingHome = homeEditing && onHome;

  /*
   * Coming back is not arriving.
   *
   * Going back to a *screen* is only half of going back to where you were: the results list
   * reopens at the top, so the journey that was tapped — the reason the trip out was made — is a
   * screenful down and has to be found again. So each history entry remembers how far down its
   * page had been scrolled, and a back navigation restores it. A forward navigation still starts
   * at the top, because that is a new screen and nothing in it has been read yet.
   */
  const reachedAt = useRef(new Map<string, number>());
  const previousPath = useRef(location.pathname);

  /*
   * Arriving somewhere is an event, not just a paint.
   *
   * A hash route changes no document and fires no navigation event, so the old behaviour left the
   * keyboard on `<body>` and said nothing at all: following a stale link replaced the whole screen
   * in silence (12.2). Now the new screen is both announced (`role="status"`, below) and focused —
   * `main` carries `tabIndex={-1}` so it can take the caret without becoming a tab stop — which is
   * what a screen-reader traveller hears and what a keyboard traveller tabs on from.
   */
  useEffect(() => {
    const moved = previousPath.current !== location.pathname;
    previousPath.current = location.pathname;
    if (navigationType === 'POP') {
      window.scrollTo({ top: reachedAt.current.get(location.key) ?? 0, behavior: 'auto' });
    } else if (moved) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    if (moved) {
      const heading = mainRef.current?.querySelector('h1');
      setAnnouncement(heading?.textContent?.trim() ?? '');
      mainRef.current?.focus({ preventScroll: true });
    }
  }, [location.pathname, location.key, navigationType]);

  /*
   * The name in the tab, the history and a bookmark.
   *
   * Every screen used to carry the app's own title, so ten open tabs could not be told apart and a
   * 404 looked like Home (8.6, 9.8, 12.4). The screens with a name of their own — a stop, an alert,
   * a journey — set theirs from their data (see `lib/usePageTitle`); this is the app's own list of
   * names for the screens that have a fixed one.
   */
  useEffect(() => {
    const fixed: Record<string, string> = {
      '/': 'Home',
      '/results': 'Journey results',
      '/map': 'Network map',
      '/stops': 'Stations & stops',
      '/departures': 'Departure boards',
      '/disruptions': 'Disruptions',
      '/preferences': 'Travel preferences',
      '/settings': 'Settings',
    };
    const name = fixed[location.pathname];
    if (name === undefined) return;
    document.title = `${name} · OVVO`;
  }, [location.pathname]);

  /* Remembered as it is scrolled, not on the way out: by the time the leaving effect runs the
     document is already the next screen, and its height is what `scrollY` would have answered. */
  useEffect(() => {
    const key = location.key;
    const remember = () => reachedAt.current.set(key, window.scrollY);
    window.addEventListener('scroll', remember, { passive: true });
    return () => window.removeEventListener('scroll', remember);
  }, [location.key]);

  return (
    <div className="app-shell">
      {/*
        A hash link cannot skip anything in a hash-routed app: `href="#main"` *is* a route, so
        Enter on the first control sent the router to a page called `main` and drew the 404 over
        the screen the traveller was reading (12.1). The skip is a focus move now — prevented from
        changing the hash, landing on the `main` landmark, which takes the caret because it is
        `tabIndex={-1}`.
      */}
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus({ preventScroll: false });
          mainRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
        }}
      >
        {t('Skip to main content')}
      </a>
      {/* What a screen reader hears when the screen changes (12.2). Empty at rest. */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      {/*
        The connection, before anything else on the screen. It is sticky and above the header, so
        "you are offline and these times are not live" is still the top line of the page after the
        traveller has scrolled a board — see `layout/OfflineBar`.
      */}
      <OfflineBar />
      {/*
        No app bar: the mark is the only thing across the top and it is centred, saying the
        name on its own. The alerts entry keeps the place it has always had (top right, one
        tap from anywhere) with nothing painted behind it but the page. Both live in a
        three-column row — a name in the middle column is centred by the grid, not by
        matching paddings, and all three of its children share one top edge — their sizes are
        their own, and only the line they start on is common — and the row scrolls away with
        the page like everything else, because anything that stays put has to be painted over
        the content passing under it, and that paint is the bar (see `.app-header` and
        `.app-header__inner` in `styles/base.css`).
      */}
      <header className="app-header">
        <div className="app-header__inner">
          {/*
            The bar's left column, which the centered mark leaves empty and the full-screen
            pickers fill with their own way back. A page that has one puts it here and nowhere
            else — see `useHeaderBack`.
          */}
          <div className="app-header__back">
            {onHome ? (
              /*
               * **Edit** and the `+` it becomes are **one control**, with two faces.
               *
               * In the corner a phone's home screen keeps it, there before the mode is on so the
               * way in is visible rather than at the foot of a page the dock covers. Pressing it
               * enters the mode; while editing it opens the layout menu, which hangs from this
               * same box (`data-home-menu-trigger`).
               *
               * The two labels are stacked in one grid cell rather than swapped for each other
               * (`app-header__pill--faces`), because a pill is as wide as what is in it: the `+`
               * alone took the pill's 36px minimum and drew a **circle**, so entering the mode
               * changed the shape of the corner. Both faces share the cell, so the word sizes the
               * box in both states and the `+` sits centred inside Edit's own oval — same place,
               * same size, same paint, and the only difference is the character on it.
               */
              <button
                type="button"
                className="app-header__pill app-header__pill--faces"
                data-home-menu-trigger={editingHome ? '' : undefined}
                aria-haspopup={editingHome ? 'dialog' : undefined}
                aria-expanded={editingHome ? homeMenuOpen : undefined}
                aria-label={editingHome ? t('Home layout') : undefined}
                title={editingHome ? t('Home layout') : t('Or press and hold the home screen')}
                onClick={() => (editingHome ? setHomeMenuOpen(!homeMenuOpen) : setHomeEditing(true))}
              >
                {/* Plain text, as a phone's home screen writes it: the word is the control. */}
                <span className="app-header__pill-face" aria-hidden={editingHome || undefined}>
                  {t('Edit')}
                </span>
                {/*
                 * The glyph is the app's own **plus icon**, not a `+` character: at the pill's 12px
                 * type size a text plus draws about 8px wide and reads as a speck inside a 49px
                 * oval ("the + thing is much too small, replace it with an icon"). An icon is
                 * drawn at its own size — 18px, the size the header's alerts and way-back glyphs
                 * use — and the word still sizes the pill, so the box does not move.
                 */}
                <span className="app-header__pill-face" aria-hidden={!editingHome || undefined}>
                  <Icon name="plus" size={18} />
                </span>
              </button>
            ) : (
              headerBack
            )}
          </div>
          <Link to="/" className="app-header__brand" aria-label={t('OVVO home')}>
            <span className="app-header__mark">
              <BrandMark size={56} />
            </span>
          </Link>
          {editingHome ? (
            <button
              type="button"
              className="app-header__pill"
              onClick={() => setHomeEditing(false)}
            >
              {t('Done')}
            </button>
          ) : (
            <Link
              to="/disruptions"
              className="app-header__alerts"
              aria-label={`${t('Disruptions')}: ${alertCount}`}
              title={t('Disruptions')}
            >
              <Icon name="alert" size={18} />
              {alertCount ? <span className="app-header__alert-count">{alertCount}</span> : null}
            </Link>
          )}
        </div>
      </header>

      <div className="app-body">
        <Sidebar />
        <main className="app-main" id="main" ref={mainRef} tabIndex={-1}>
          {children}
        </main>
      </div>

      <MobileDock onOpenMenu={() => setMenuOpen(true)} />
      <MenuDialog open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Toaster />
      <LocationPermission />
    </div>
  );
}

/**
 * The way back on a page, in `BACK_ARROW`'s one shape.
 *
 * It used to be a labelled ghost pill — `All alerts`, `Back` — sitting wherever it happened to
 * land in the header's wrapping row, which on a phone meant a line of its own under the title and
 * a different position on every screen. The shape and the place now come from the full-screen
 * pickers (`FullScreen`, the "Choose a stop on the map" bar), which were the one consistent pair:
 * a bare arrow at the start of the header row, and the name of the destination as the accessible
 * name rather than as a word on screen, exactly as the picker's arrow works. Its size is its own —
 * the 44px disc the pickers' bar draws, which is also the minimum target this app measures a
 * control against; the only thing it takes from the mark beside it is the step that puts the two
 * of them on one top edge (see `.app-header__back` in `styles/base.css`).
 */
const BACK_ARROW = 'btn btn--icon-circle back-arrow';

export function BackButton({ to, label = 'Back' }: { to: string; label?: string }) {
  const t = useT();
  return (
    <Link to={to} className={BACK_ARROW} aria-label={t(label)} title={t(label)}>
      <Icon name="arrowLeft" size={18} />
    </Link>
  );
}

/**
 * The way back to where you were.
 *
 * `BackButton` is a link to a fixed place, which is right when a screen has one obvious parent
 * ("All alerts") and wrong when it has four ways in. A map opened from a journey, from a stop,
 * from the results screen or from the alert you are reading is one screen with four doors, and a
 * link can only name one of them; the traveller who came through a different door is then sent
 * somewhere they have never been. So this asks the history instead: React Router writes an index
 * into every entry it pushes, and an index above zero means there is a screen behind this one.
 *
 * What it says when there is nothing behind — the first screen of a fresh tab, or a link pasted
 * into the address bar — is the `fallback`, rather than a button that does nothing.
 */
export function HistoryBackButton({ fallback = '/', label = 'Back' }: { fallback?: string; label?: string }) {
  const navigate = useNavigate();
  const t = useT();
  const canGoBack = typeof window !== 'undefined' && Number(window.history.state?.idx ?? 0) > 0;
  return (
    <button
      type="button"
      className={BACK_ARROW}
      aria-label={t(label)}
      title={t(label)}
      onClick={() => {
        /* Two calls rather than one ternary argument: `navigate` takes a delta or a path,
           and `-1` in a union with a string stops matching either overload. */
        if (canGoBack) navigate(-1);
        else navigate(fallback);
      }}
    >
      <Icon name="arrowLeft" size={18} />
    </button>
  );
}

/**
 * Which screens have a way back, and where it goes — decided by the bar rather than by the screen.
 *
 * The bar belongs to the shell, so the slot at its start does too, and that is the point: a screen
 * cannot put its way back anywhere else. The same control used to be one of a page's `actions`,
 * where it was just another pill in a wrapping row — on a phone it fell to a line of its own under
 * the title, which put it in a different place on every screen, and in the pickers' bar it was not
 * there at all. Here the position is `styles/base.css`'s business alone and the destination is the
 * arrow's accessible name, exactly as the picker's arrow works (see `BACK_ARROW`).
 *
 * **The rule: the arrow belongs to a screen you opened *from* a tab, never to the tab itself.**
 * The five screens the navigation names — Home, Stations & stops, Departure boards, Disruptions
 * and Settings — are the app's tabs, its top level, and a way back on one of them is a lie: there
 * is nothing above them to go back to, and the navigation is already showing where you are. They
 * are exactly the entries `useNavigation` returns, so the rule is read off that list rather than
 * kept beside it: a screen the menu names is a tab, and *only* the screen itself — `/stops` and
 * not `/stops/haarlem`, which is a stop opened out of the list.
 *
 * Everything reached *from* one of those tabs carries the arrow: a stop's page, an alert's page,
 * a journey, the results a search opens, travel preferences, the network map, and the not-found
 * screen (a banner on the ends of the earth — a typo'd link, a stale bookmark — where a way back
 * is the only useful control on the screen).
 *
 * Where it goes is decided here and not by the screen, in this order: a detail screen with a
 * certain parent names that parent (`/disruptions/:id` → the alerts list), and everything else
 * asks the history first, so the arrow returns to the screen you actually came from, falling back
 * to the tab it was opened from when there is nothing to ask — the case a pasted link opens in.
 */
function useHeaderBack(): ReactNode {
  const { pathname } = useLocation();
  const { search } = useApp();
  const navigation = useNavigation();

  /* The tabs themselves: the rule is the navigation's own list, so adding a destination to the
     menu cannot leave an arrow behind on it. */
  const isTab = navigation.some((group) => group.items.some((item) => item.to === pathname));
  if (isTab) return null;

  /* The alert you are reading sits under the list of alerts — the one place on the screen that
     says what it is, which the arrow's name takes over from the old word "All alerts". */
  if (/^\/disruptions\/[^/]+$/.test(pathname)) {
    return <BackButton to="/disruptions" label="All alerts" />;
  }

  /* A stop's page is under the list of stops, and it is reached from there, from the planner's
     search, from an alert's affected stops and from a journey's legs — so the history first, and
     the stops list when there is no history to ask. */
  if (/^\/stops\/[^/]+$/.test(pathname)) {
    return <HistoryBackButton fallback="/stops" />;
  }

  /* A journey is under the results that found it — but it can also be opened from a stop, an alert
     or a pasted link, so it asks the history first and falls back to the results. */
  if (/^\/journey\/[^/]+$/.test(pathname)) {
    return <HistoryBackButton fallback="/results" />;
  }

  /*
   * Everything reached from a tab goes back where it came from: journey results, travel
   * preferences, the network map, the not-found screen. Home is what each of them falls back to,
   * because it is the one screen any of them can be entered from — except the map, whose other
   * door is the results (see `MapPage`, which a search opens as well).
   */
  return <HistoryBackButton fallback={pathname === '/map' && search ? '/results' : '/'} />;
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
