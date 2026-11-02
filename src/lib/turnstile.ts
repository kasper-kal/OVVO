/**
 * **The bot check, from the page's side.**
 *
 * Cloudflare's Turnstile script is fetched only when somebody opens the card that needs it, so the
 * sign-in screen costs nothing to a traveller who never makes an account with a passkey.
 *
 * The site key is public on purpose: it names the widget, it is not a password, and the page can
 * only *ask* for a token. The secret stays in the Worker, and nothing here can make the answer yes.
 */

export const TURNSTILE_SITE_KEY = '0x4AAAAAAFwcLCW2C6eO1R4Y';

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/* One script for the whole page: the card can be opened, closed and opened again. */
let pending: Promise<TurnstileApi> | null = null;

export function loadTurnstile(): Promise<TurnstileApi> {
  if (typeof window !== 'undefined' && window.turnstile) return Promise.resolve(window.turnstile);
  if (pending !== null) return pending;

  pending = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    /* `render=explicit` so nothing is drawn until this code says where. */
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error('turnstile/missing'));
    };
    script.onerror = () => {
      /* A blocked script can be tried again later; a promise that stays broken cannot. */
      pending = null;
      reject(new Error('turnstile/blocked'));
    };
    document.head.appendChild(script);
  });

  return pending;
}
