import { useState } from 'react';
import { useInstallPrompt } from '../../lib/install';
import { useT } from '../../lib/useT';
import { Icon } from './Icons';
import { Button, Dialog, IconButton } from './primitives';

/**
 * **"Add OVVO to your home screen", asked once, by the app's own banner.**
 *
 * The browser will install this site, but the way each one asks is either ugly or missing:
 * Chromium draws a mini bar of its own along the bottom of the window, and iOS draws nothing at
 * all. So the app asks instead. The rules are short:
 *
 *   - **It is drawn only when there is something to offer** — a saved install event, or Safari on
 *     an iPhone or iPad, where the button shows instructions. On a desktop browser that cannot
 *     install, in Firefox, or in a tab that has already installed the app, nothing is on screen.
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
  const { visible, needsIosHelp, install, dismiss } = useInstallPrompt();
  const [helpOpen, setHelpOpen] = useState(false);

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
        className={`install-banner${visible ? '' : ' is-hidden'}`}
        role="region"
        aria-label={t('Install OVVO')}
      >
        <span className="install-banner__icon" aria-hidden="true">
          <Icon name="plus" size={18} />
        </span>
        <div className="install-banner__words">
          <p className="t-strong t-sm">{t('Add OVVO to your home screen')}</p>
          <p className="t-sm t-muted">{t('It then opens like an app, with no address bar.')}</p>
        </div>
        <div className="install-banner__actions">
          {/* One button, two jobs: on iOS there is no prompt to call, so it shows the way. */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (needsIosHelp) setHelpOpen(true);
              else void install();
            }}
          >
            {t('Install')}
          </Button>
          <IconButton icon="close" label={t('Not now')} onClick={dismiss} />
        </div>
      </div>

      <Dialog
        open={helpOpen}
        title={t('Add OVVO to your home screen')}
        description={t('Safari has no install button. This is the way in.')}
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
              {t('Tap the Share button in the Safari bar, the square with an arrow pointing up.')}{' '}
              <span className="install-steps__glyph">
                <ShareGlyph />
              </span>
            </span>
          </li>
          <li>
            <span className="install-steps__mark" aria-hidden="true">
              2
            </span>
            <span>{t('Choose "Add to Home Screen".')}</span>
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
