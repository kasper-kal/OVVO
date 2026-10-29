import { useEffect, useRef, useState } from 'react';
import { useInstallPrompt } from '../../lib/install';
import { useOnline } from '../../lib/useOnline';
import { useT } from '../../lib/useT';
import { Button, Dialog, IconButton } from './primitives';
/* The bytes come with the page: a host that answers the icon's own address with a page cannot
   leave this card blank (see `lib/manifest` for the same reasoning about the manifest's icons). */
import appIcon from '../../../public/icons/icon-192.png?inline';

/**
 * **"Add OVVO to your home screen", asked once, by the app's own banner.**
 *
 * The browser will install this site, but the way each one asks is either ugly or missing:
 * Chromium draws a mini bar of its own along the bottom of the window, and iOS draws nothing at
 * all. So the app asks instead. The rules are short:
 *
 *   - **It is drawn on the first visit of a browser that can install**, whichever way that browser
 *     allows it: an install event to spend, Safari's Share sheet, another browser's own menu, or a
 *     tab of its own when the page is shown inside another page. A browser that cannot install at
 *     all (Firefox, desktop Safari), a device that already has the app, and a traveller who has
 *     answered the banner all get nothing on screen.
 *   - **It is hidden until then.** The element is always mounted (so the banner never pops into
 *     existence and shifts the page), and `.install-banner.is-hidden` is `display: none`.
 *   - **It is asked once.** Refusing it, or finishing an install, writes that down, and the banner
 *     does not come back on the next visit. Only the traveller's own tap closes it: nothing here
 *     times out or closes itself while somebody is reading.
 *
 * The words are the same in both languages (`lib/i18n`), and the button is the app's own pill, so
 * this does not look like a browser's notification bar stapled to the page.
 */
export function InstallBanner() {
  const t = useT();
  const { visible, route, install, dismiss } = useInstallPrompt();
  const [helpOpen, setHelpOpen] = useState(false);
  const bannerRef = useRef<HTMLDivElement | null>(null);

  /*
   * **The page is told how much room the banner is taking, and the banner is told where the row
   * above it ends.**
   *
   * It floats over the top of the page, and the page reserves nothing there, so with the offer on
   * screen the first card of a screen, and any control in it, sat underneath the banner and could
   * not be pressed. (At the foot the same fault was found by trying to press *Reset the app* at the
   * end of Settings: the tap landed on the banner instead, "It then opens like an app" intercepted
   * it. Moving the banner to the top moved the reserve with it, not the problem.) The height is
   * measured rather than guessed, because the card is two rows on every phone and either row can
   * grow (the words wrap to a third line in Dutch); a `ResizeObserver` keeps that number true when
   * they do. The reserve is that height plus the step the card hangs below the header by, and
   * nothing more: the page's own top padding is already the gap between the offer and the first
   * card, so a spare step added here left a **32px hole** under a banner that was touching the
   * header (reported).
   *
   * The row above is measured for the same reason. At rest it is the app's own header and the
   * stylesheet's own default already puts the offer under it, but the offline strip is sticky
   * above that row and takes the top of the screen when the connection drops, which pushes the
   * mark and the alerts entry down, and the offer is asked once and never times out: it can still
   * be on screen when that happens. The measurement is that row's `bottom` **plus the stylesheet's
   * own step**, because the resting offset is `--header-h` plus the same token: without it the two
   * cases disagreed and the offer sat flush against the header until the strip moved the row.
   * `online` is in the dependency list because that strip appearing, and going, is the event that
   * moves the row.
   */
  const online = useOnline();
  useEffect(() => {
    const root = document.documentElement;
    if (!visible) {
      root.style.removeProperty('--install-offer-space');
      root.style.removeProperty('--install-offer-top');
      return undefined;
    }
    /*
     * The step the card hangs below the header by, read from the stylesheet rather than repeated
     * here, so the resting offset (`.install-banner`'s own `top`) and the measured one cannot drift
     * apart again. A stylesheet that cannot answer leaves it at nothing, which is where it was.
     */
    const step = Number.parseFloat(getComputedStyle(root).getPropertyValue('--s-3')) || 0;
    /*
     * **The icon is one size, so nothing here measures it.**
     *
     * It used to be measured to the height of the words beside it, which fed the card's own layout
     * back into the measurement: a taller tile took width from the words, the words wrapped onto more
     * lines and asked for a taller tile still. On a screen of an unusual size that ended with a tile
     * that filled the card and pushed the way out of its corner (reported twice). The box is now a
     * plain 32px in the stylesheet (`--install-tile`), the same on every screen, and this effect has
     * only the two numbers the page needs: the room the card takes at the top, and where the row
     * above it ends.
     */
    const measure = () => {
      const height = bannerRef.current?.getBoundingClientRect().height ?? 0;
      root.style.setProperty('--install-offer-space', `${Math.ceil(height + step)}px`);
      const row = document.querySelector<HTMLElement>('.app-header');
      if (row) {
        root.style.setProperty('--install-offer-top', `${Math.round(row.getBoundingClientRect().bottom + step)}px`);
      }
    };
    measure();
    /*
     * The card is watched **and so are the words, and so is the font**. The words re-wrap when the
     * app's own font arrives, and if the card came out the height it already had, nothing would
     * fire and the page would reserve room measured in the fallback font. The words themselves, and
     * the font's own promise, are watched for that.
     */
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    if (observer && bannerRef.current) observer.observe(bannerRef.current);
    const words = bannerRef.current?.querySelector<HTMLElement>('.install-banner__words');
    if (observer && words) observer.observe(words);
    let watching = true;
    void document.fonts?.ready.then(() => {
      if (watching) measure();
    });
    return () => {
      watching = false;
      observer?.disconnect();
      root.style.removeProperty('--install-offer-space');
      root.style.removeProperty('--install-offer-top');
    };
  }, [visible, online]);
  /* Safari's Share sheet, or the browser's own menu: both are words, not a prompt. */
  const explains = route === 'safari' || route === 'menu';

  /*
   * Closing the instructions counts as having been told: the banner has done its job, and the
   * traveller now knows where the button is. Either way it is their click that closes it.
   */
  const closeHelp = () => {
    setHelpOpen(false);
    dismiss();
  };

  return (
    <>
      <div
        ref={bannerRef}
        className={`install-banner${visible ? '' : ' is-hidden'}`}
        role="region"
        aria-label={t('Install OVVO')}
      >
        {/*
          **The tile the phone will actually put on the home screen.**
          *
          * The words beside it promise one particular object, and the app's own icon *is* that
          * object: this is the same file `index.html` names as `apple-touch-icon` and
          * `public/manifest.json` lists for the manifest, so the picture is the thing itself rather
          * than a likeness of it. A traveller who installs meets no surprise on their home screen,
          * and one who does not still knows what the offer leads to.
          *
          * A glyph stood here before, a house with a plus (`addToHome`, still in `Icons`). It said
          * "somewhere on a device" without saying what would be waiting there, which is the one
          * question this card exists to answer. It also needed the sage disc behind it, and the
          * mark on a disc read as a sticker on a circle; the disc goes with the glyph.
          *
          * **A small tile beside the words it introduces, rounded like a home-screen tile.** Its
          * size is the stylesheet's own (`--install-tile`), one 32px square on every screen, so no
          * width of window can make it grow into the card (the effect above says why it is no longer
          * measured). Its corners are rounded by a fifth of its own side, which is the shape a phone
          * gives an app icon, so the card
          * shows the traveller what they will meet. It is drawn from bytes that come with the page,
          * not from the icon's own address, so a host that answers that address with a page cannot
          * leave the card blank. It never turns over with the theme
          * (`tokens.css`, `--brand-tile`): the artwork is one design on its own ground, and in the
          * dark appearance its two obsidian tiles meet the dark card the way they would meet a dark
          * wallpaper.
        */}
        <span className="install-banner__icon" aria-hidden="true">
          <img src={appIcon} alt="" width={32} height={32} />
        </span>
        <div className="install-banner__words">
          <p className="t-strong t-sm">{t('Add OVVO to your home screen')}</p>
          <p className="t-sm t-muted">{t('It then opens like an app, with no address bar.')}</p>
        </div>
        {/*
          The way out is the card's own top-right corner, which is where every other floating
          surface in the app keeps it: a sheet's sits in the panel's corner (`.modal__close`, the
          same disc and the same ink) and a toast's sits at the end of its one row. Here it used to
          follow the Install pill on the buttons' row, which is a place nothing else in the app puts
          a close, and it read as a third control in a row of two (reported).
        */}
        <IconButton
          className="install-banner__close"
          icon="close"
          label={t('Not now')}
          onClick={dismiss}
        />
        <div className="install-banner__actions">
          {/* One button, and what it does is this browser's answer (`InstallRoute`). */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (explains) setHelpOpen(true);
              else void install();
            }}
          >
            {route === 'frame' ? t('Open in a tab') : t('Install')}
          </Button>
        </div>
      </div>

      <Dialog
        open={helpOpen}
        title={t('Add OVVO to your home screen')}
        description={
          route === 'safari'
            ? t('Safari has no install button. This is the way in.')
            : t('Your browser does this from its own menu.')
        }
        onClose={closeHelp}
        footer={
          <Button variant="primary" onClick={closeHelp}>
            {t('Got it')}
          </Button>
        }
      >
        <ol className="install-steps">
          <li>
            <span className="install-steps__mark" aria-hidden="true">
              1
            </span>
            <span>
              {route === 'safari' ? (
                <>
                  {t('Tap the Share button in the Safari bar, the square with an arrow pointing up.')}{' '}
                  <span className="install-steps__glyph">
                    <ShareGlyph />
                  </span>
                </>
              ) : (
                t('Open the browser menu, the three dots at the top or the bottom of the screen.')
              )}
            </span>
          </li>
          <li>
            <span className="install-steps__mark" aria-hidden="true">
              2
            </span>
            <span>
              {route === 'safari'
                ? t('Choose "Add to Home Screen".')
                : t('Choose "Install app" or "Add to Home screen".')}
            </span>
          </li>
        </ol>
      </Dialog>
    </>
  );
}

/**
 * The Share mark, drawn at the set's own stroke so it sits beside the step's words rather than
 * above them. It is not a Lucide glyph because the app's icon file has none: this is the one picture
 * the instruction is about, and a traveller on iOS is looking for exactly this square.
 */
function ShareGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.5v11" />
      <path d="M8 7.5l4-4 4 4" />
      <path d="M7 11.5H5.5A1.5 1.5 0 004 13v6.5A1.5 1.5 0 005.5 21h13a1.5 1.5 0 001.5-1.5V13a1.5 1.5 0 00-1.5-1.5H17" />
    </svg>
  );
}
