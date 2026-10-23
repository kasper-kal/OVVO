import { createContext, useContext, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
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
  const { settings, power } = useApp();
  const t = (key: string) => translate(settings.language, key);
  const groups: NavGroup[] = [
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

  /*
   * **At 10% or below, Settings is not on the way to anything.**
   *
   * Super energy saving exists to answer "when does the bus go" on a battery that is nearly out,
   * and Settings is the one screen in the app that is not that question: colour pickers, a photo
   * behind the canvas, live previews, four storage panels. It is left out of the navigation here,
   * and `/settings` itself redirects home while the mode is on (see `App.tsx`), so the screen is
   * genuinely unreachable rather than merely unlinked. A group is dropped when it has nothing
   * left in it — otherwise "Yours" would be a heading over an empty list. A charger puts it back,
   * because nothing is stored: the mode is a subtraction, never a change.
   */
  if (power.mode !== 'super') return groups;
  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.to !== '/settings') }))
    .filter((group) => group.items.length > 0);
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
  const { power } = useApp();
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
   * **The dock is always there.**
   *
   * It used to slide away on a downward scroll and come back on an upward one, because a fixed bar
   * sits over the content wherever it hangs (2.3, 3.4). A navigation that hides while you read is
   * the wrong trade: it moves under the thumb and it is missing exactly when the page is long
   * enough to want it. The page reserves its band at the end instead (`.app-body`'s bottom padding
   * is `--dock-h`), so nothing is ever buried under it, and the bar stays put at every scroll
   * position — asked for by name: "I want the bottom nav there ALWAYS".
   */

  /*
   * **The pressed tab lifts, and puts itself back down.**
   *
   * A phone has no hover, but `:hover` is applied on a tap and kept until the next touch — the
   * reason the pressed tab used to stay 4px up (and 2% larger) for as long as the screen was open,
   * which on the coral active tab looks like the disc straining out of the bar (see
   * `.app-dock__item.is-lifted` in `base.css`; the hover rule is now behind `hover: hover`). This
   * is the deliberate version: the tab answers the press with the same little jump, and is back in
   * its seat **1s** later whether or not anything else is touched — and the way down is a
   * `settle` phase of its own (`.is-settling`, 320ms) instead of the item's 120ms press curve, so
   * it glides back rather than snapping.
   */
  const [dial, setDial] = useState<{ id: string; settling: boolean } | null>(null);
  const liftTimer = useRef(0);
  const settleTimer = useRef(0);
  const lift = (id: string) => {
    /*
     * **Not in super energy saving — not even here.**
     *
     * The flattened tokens already stop the tab from moving, but the lift is driven by two timers
     * and a re-render one second after the tap, and a second re-render when it settles. At a tenth
     * of a battery a bar that answers a press by doing nothing is the point, so the timers are not
     * started at all: the tab is pressed, the screen changes, nothing else happens.
     */
    if (power.mode === 'super') return;
    window.clearTimeout(liftTimer.current);
    window.clearTimeout(settleTimer.current);
    setDial({ id, settling: false });
    liftTimer.current = window.setTimeout(() => {
      setDial({ id, settling: true });
      settleTimer.current = window.setTimeout(() => setDial(null), 320);
    }, 1000);
  };
  useEffect(
    () => () => {
      window.clearTimeout(liftTimer.current);
      window.clearTimeout(settleTimer.current);
    },
    [],
  );

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
    <nav className="app-dock" aria-label={t('Quick navigation')}>
      {DOCK_ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`app-dock__item${dial?.id === item.to ? (dial.settling ? ' is-settling' : ' is-lifted') : ''}`}
          aria-current={isActivePath(location.pathname, item.to) ? 'page' : undefined}
          aria-label={t(item.key)}
          title={t(item.key)}
          onPointerDown={() => lift(item.to)}
          onClick={item.to === '/' ? onHomeClick : undefined}
        >
          <Icon name={item.icon} size={20} />
        </Link>
      ))}
      <button
        type="button"
        className={`app-dock__item${dial?.id === 'menu' ? (dial.settling ? ' is-settling' : ' is-lifted') : ''}`}
        aria-label={t('All sections')}
        title={t('All sections')}
        onPointerDown={() => lift('menu')}
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
    /* `menu-sheet` is the rhythm of a list, not of a page: see the comment in `components.css`. */
    <Dialog open={open} title={t('All sections')} onClose={onClose} panelClassName="menu-sheet">
      <div className="stack">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="field__label" style={{ marginBottom: 'var(--s-1)' }}>
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

/**
 * **The bar's start corner, for the one page control that belongs there.**
 *
 * The slot at the start of the bar belongs to the shell (`useHeaderBack`), so a screen cannot put
 * anything in it — which was the point of moving the way back there. The boards screen is the one
 * exception: its refresh sat inside every board card, beside the sentence that says the board
 * refreshes itself, and it belongs where a phone user already looks for a screen's own control —
 * the corner the way back occupies on every other screen (asked for by name: "move the Refresh
 * button to the place of the back button on other pages").
 *
 * So a page *registers* a control instead of drawing it: the shell draws it in that corner, and
 * the page takes it away on unmount. A page that has a way back keeps the arrow — a control of its
 * own never displaces the navigation — so this is only used where the slot is otherwise empty.
 */
const HeaderControlContext = createContext<(control: ReactNode) => void>(() => {});

export function useHeaderControl() {
  return useContext(HeaderControlContext);
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  /* The page's own control in the bar's start corner, if it registered one. */
  const [headerControl, setHeaderControl] = useState<ReactNode>(null);
  const mainRef = useRef<HTMLElement>(null);
  /*
   * The live region is written to directly, never through state.
   *
   * It was `useState` — and because the shell's state change re-renders its children, every
   * navigation rendered the destination page a second time (and a third, when the title effect
   * followed) just to put one sentence in a hidden paragraph. Measured on a phone-speed CPU that
   * was the difference between a screen that appears in one frame and one that holds the previous
   * screen for a fifth of a second: the page was being built three times, the first two thrown
   * away. A live region only needs its text to change, so the text is set on the node.
   */
  const announcementRef = useRef<HTMLParagraphElement>(null);
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
   * **Customising is a mode of the home screen, so leaving it leaves the mode.**
   *
   * The flag lives in the app's state, which is what makes the mode outlive a re-render — and what
   * made it outlive the screen: arranging the cards, tapping *Departure boards* in the dock and
   * coming home again put you straight back into customising, cards showing their remove buttons
   * and the header reading **Done**, for a mode you had walked away from (reported: "Home tab
   * shouldnt stay in Customize mode after youve left it to go to another tab"). Nothing on another
   * tab can arrange a home screen, and the layout menu hangs from a control that is not drawn
   * there either, so both are closed the moment the route is not Home. Arriving home does not
   * reopen them.
   */
  useEffect(() => {
    if (onHome || (!homeEditing && !homeMenuOpen)) return;
    setHomeEditing(false);
    setHomeMenuOpen(false);
  }, [onHome, homeEditing, homeMenuOpen, setHomeEditing, setHomeMenuOpen]);

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
      if (announcementRef.current) announcementRef.current.textContent = heading?.textContent?.trim() ?? '';
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

  /*
   * **Nothing watches the scroll position for the header any more.**
   *
   * It used to set `data-scrolled`, which faded the canvas in under the row once the page moved —
   * a compromise for the card that travels under the mark. The row is clear again, with nothing
   * painted behind it at any scroll position (see `.app-header` in `styles/base.css`), so the flag,
   * the state and the frame-scheduled listener all went with the paint.
   */

  return (
    <HeaderControlContext.Provider value={setHeaderControl}>
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
        {/* What a screen reader hears when the screen changes (12.2). Empty at rest, and filled
            from the effect above rather than by a re-render — see `announcementRef`. */}
        <p className="sr-only" role="status" aria-live="polite" ref={announcementRef} />
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
                /* The page's own control (today only the boards' refresh) if it registered one —
                   otherwise the way back. A page with a way back keeps the arrow: navigation is not
                   displaced by a page control. */
                headerControl ?? headerBack
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
    </HeaderControlContext.Provider>
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

/**
 * A page's own control in the bar's start corner, in the way back's own shape.
 *
 * Today that is the departure boards' refresh, registered with `useHeaderControl`. It is drawn
 * here rather than by the page so the corner cannot grow a second look: the arrow and this share
 * `BACK_ARROW` — the same 44px disc, the same surface, the same size of glyph — and the only thing
 * that differs is the icon and what pressing it does.
 */
export function HeaderButton({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button type="button" className={BACK_ARROW} aria-label={label} title={label} onClick={onClick}>
      <Icon name={icon} size={18} />
    </button>
  );
}

/**
 * The way back to where you were.
 *
 * There used to be a second one of these, `BackButton`: a link to a fixed place, for the screens
 * that were said to have one obvious parent — an alert and the alerts list. No screen has one. A
 * map opened from a journey, from a stop, from the results screen or from the alert you are reading
 * is one screen with four doors; an alert opened from the journey results, from a stop's board or
 * from the alerts list is the same. A fixed link can only name one of those doors, so the traveller
 * who came through a different one is sent somewhere they have never been — reported as results →
 * warning → back, and back landing on Disruptions. So every screen asks the history instead: React
 * Router writes an index into each entry it pushes, and an index above zero means there is a screen
 * behind this one.
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
 * Where it goes is decided here and not by the screen: everything asks the history first, so the
 * arrow returns to the screen you actually came from, and falls back — to the alerts list from an
 * alert, to the stops list from a stop, to the results from a journey, to the tab otherwise — only
 * when there is nothing behind it to ask, which is the case a pasted link opens in. No screen gets
 * a fixed parent: an alert reached from the journey results has four ways out of it, not one.
 */
function useHeaderBack(): ReactNode {
  const { pathname } = useLocation();
  const { search } = useApp();
  const navigation = useNavigation();

  /* The tabs themselves: the rule is the navigation's own list, so adding a destination to the
     menu cannot leave an arrow behind on it. */
  const isTab = navigation.some((group) => group.items.some((item) => item.to === pathname));
  if (isTab) return null;

  /*
   * **An alert asks the history too, and the alerts list is only its fallback.**
   *
   * It was a fixed link to `/disruptions`, on the reasoning that the list is where an alert lives.
   * That is true of the list and false of every other door into an alert: the banner on the journey
   * results, the alert beside a stop's board, a saved journey's warning — and a traveller who opened
   * one from the results was sent to the alerts list, losing the search they had just run (reported
   * with exactly that path: results → warning → back, and back landed on Disruptions). So the arrow
   * returns to the screen the alert was opened from, and names — and goes to — the alerts list only
   * when there is nothing behind it to ask, which is the pasted-link case.
   *
   * Its name is **Back**, not `All alerts`: a name that promises a destination the arrow no longer
   * always goes to is worse than a plain one — opened from the results it said "All alerts" and
   * went to the search. Where the other screens' arrows are named is `HistoryBackButton`'s own
   * default, and that is where this one stays.
   */
  if (/^\/disruptions\/[^/]+$/.test(pathname)) {
    return <HistoryBackButton fallback="/disruptions" />;
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
