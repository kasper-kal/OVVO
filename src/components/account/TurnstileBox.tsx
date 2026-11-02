import { useEffect, useRef } from 'react';
import { loadTurnstile, TURNSTILE_SITE_KEY } from '../../lib/turnstile';

/**
 * **The little "verifying" box, drawn where it is needed.**
 *
 * It appears only inside the card that makes an account with a passkey, because that is the only
 * door with nothing in front of it. Everything it draws is Cloudflare's own, in a frame it owns.
 *
 * Two things about the wiring are deliberate:
 *
 *  - **the callbacks are held in refs**, so typing a name does not tear the widget down and build
 *    it again on every keystroke (a rebuilt widget throws away the token it just earned);
 *  - **a check that cannot load says so**, rather than leaving an empty space and a button that
 *    silently never enables.
 */
export function TurnstileBox({
  onToken,
  onTrouble,
}: {
  onToken: (token: string | null) => void;
  onTrouble: () => void;
}) {
  const holder = useRef<HTMLDivElement | null>(null);
  const widget = useRef<string | null>(null);
  const answer = useRef(onToken);
  const trouble = useRef(onTrouble);
  answer.current = onToken;
  trouble.current = onTrouble;

  useEffect(() => {
    let alive = true;
    void loadTurnstile()
      .then((turnstile) => {
        if (!alive || holder.current === null) return;
        widget.current = turnstile.render(holder.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'auto',
          callback: (token: string) => answer.current(token),
          'expired-callback': () => answer.current(null),
          'error-callback': () => {
            answer.current(null);
            trouble.current();
          },
        });
      })
      .catch(() => {
        if (alive) trouble.current();
      });

    return () => {
      alive = false;
      const turnstile = window.turnstile;
      if (turnstile && widget.current !== null) turnstile.remove(widget.current);
      widget.current = null;
    };
  }, []);

  return <div ref={holder} style={{ minHeight: 65 }} />;
}
