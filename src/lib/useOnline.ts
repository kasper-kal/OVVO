import { useEffect, useState } from 'react';

/**
 * Whether the browser has a network, as the browser itself reports it.
 *
 * OVVO is a local app: the planner, the boards, the timetable, every saved stop and setting live
 * in this browser, so losing the connection takes nothing away from it. What it does take away is
 * *live* data — the departure boards say so, and this hook is what lets the shell say so too, in
 * the one place a traveller looks first.
 *
 * `navigator.onLine` is a coarse answer: it reports true on a network that is up but cannot reach
 * the internet, and a captive portal or a dead Wi-Fi uplink is invisible to it. That is the right
 * trade here — the app has one real request (an approximate location) and no server it depends on,
 * so "the browser thinks it is online" is a strong enough signal to *stop* warning, while a
 * false negative (a wrong "you're offline") would be the only real cost, and it clears itself the
 * moment the browser fires `online`.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    /* Re-read on mount: a connection can have dropped between the store's creation and this
       effect, and the browser does not replay an event it fired before we were listening. */
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}
