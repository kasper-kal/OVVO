import { Icon } from '../ui/Icons';

/**
 * **The screen a traveller sees when a screen cannot be drawn.**
 *
 * The app had none of its own. A render error reached React, which unmounts the tree it cannot
 * draw, and a blank page is what was left: no name, no way back, nothing to press. React Router's
 * fallback is not a substitute — it is only mounted for a *data* router (`createBrowserRouter`),
 * and this app uses the declarative `<BrowserRouter>`, so the library that ships a crash screen
 * never draws one here. What a crash produced was a white page, and what a developer saw in the bundle
 * was the library's own dev notice, with a waving hand and a disc in it, sitting in the code as
 * dead weight.
 *
 * So this is the app's own answer, in the app's own vocabulary: the drawn alert glyph (never an
 * emoji), one sentence, and two ways out — try the screen again, or go somewhere that works.
 *
 * Two shapes, because a crash has two sizes:
 *
 *   • `page` — the whole shell is gone, so the card stands in the middle of the canvas. Used by the
 *     boundary in `main.tsx`, which wraps everything.
 *   • `inline` — one screen died and the header, the dock and the navigation are still fine, so
 *     the card takes the page's place and the rest of the app stays usable. Used by the boundary
 *     around the shell's `<main>` (`components/layout/AppShell.tsx`).
 *
 * **No wordmark here, deliberately.** The first version drew it inside the full-page card, which
 * is a place the mark is never drawn: OVVO's logo lives in the header and nowhere else (`app-header__mark`
 * in `components/layout/AppShell.tsx`), and a second home for it — a card's top edge, in the middle
 * of a blank canvas — reads as a logo someone stuck on a poster. When the shell is what failed there
 * is no header to put it in, so the honest answer is no mark at all: the icon, the sentence and the
 * two ways out say everything the screen has to say.
 *
 * **It reads no context on purpose.** The thing that crashed may have been the app's state
 * provider, so `useApp`, `useT` and `Link` are all unsafe here — the buttons are plain elements
 * and the way home is a plain `/` link, which needs no router at all (the browser loads the app
 * from scratch, which is also the surest repair). The language is therefore English: a fallback
 * that cannot depend on the setting is allowed to be plain, and two sentences are not worth a
 * second failure mode.
 */
export function ErrorScreen({
  variant = 'inline',
  onRetry,
  retryLabel = 'Try again',
}: {
  variant?: 'page' | 'inline';
  /** What "try again" does — the boundary resets itself, or the page reloads. */
  onRetry: () => void;
  retryLabel?: string;
}) {
  return (
    <div className={`error-screen${variant === 'page' ? '' : ' error-screen--inline'}`}>
      {/* `role="alert"` because the card *replaces* a screen the traveller was already reading:
          silence would leave a screen reader on a page that no longer exists. */}
      <div className="error-screen__card" role="alert">
        <span className="empty__icon">
          <Icon name="alert" size={26} />
        </span>
        <h1 className="t-h2">Something went wrong</h1>
        <p className="t-sm t-muted">
          This screen could not be drawn. Nothing you have saved has been removed.
        </p>
        <div className="row-wrap" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn--primary" onClick={onRetry}>
            <Icon name="refresh" size={16} />
            {retryLabel}
          </button>
          <a className="btn" href="/">
            <Icon name="home" size={16} />
            Go to the planner
          </a>
        </div>
      </div>
    </div>
  );
}
