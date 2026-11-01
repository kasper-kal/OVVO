import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { PickerRowSkeletons } from '../ui/Skeletons';
import { useDev } from '../../lib/dev';
import { transferMs } from '../../lib/link';
import { useT } from '../../lib/useT';

/**
 * **What a claimed link speed does to the app itself.**
 *
 * A speed set in the developer panel changes nothing on its own: this app's data is already in the
 * browser, so lowering a number cannot make a local array take longer. What a slow connection
 * actually costs is *the screen arriving*, so that is what is simulated: a navigation waits for the
 * time this screen's weight would take at the claimed speed, and the app's own held shape stands in
 * its place until then.
 *
 * **The weight is stated rather than measured.** `SCREEN_BYTES` is one screen's worth of header,
 * cards and list — the number the panel quotes, so what is described and what is drawn agree. At
 * 0.37 Mbps that is a second; at 0.05 it is seven; at 12.5 it is three hundredths, which is the
 * point where the switch is felt as nothing, because on a fast link it is nothing.
 *
 * Two rules keep it honest:
 *
 *   1. **The first paint is not held.** A reload with a speed set draws the page it asked for: the
 *      bundle was already here before the switch was touched, and an empty app would be a claim
 *      about the network that is wrong.
 *   2. **No speed, no hold at all.** `wifiMbps === null` returns the children untouched, so the app
 *      off the panel is exactly the app that ships, with no timer in the path.
 */
export const SCREEN_BYTES = 45_000;

export function LinkHold({ children }: { children: ReactNode }) {
  const { wifiMbps } = useDev();
  const { pathname } = useLocation();
  const t = useT();
  const waitMs = transferMs(SCREEN_BYTES, wifiMbps);
  /* The address whose screen is on the glass — not the address being asked for. */
  const [shown, setShown] = useState(pathname);

  useEffect(() => {
    if (waitMs === 0) {
      /* The speed was handed back mid-wait: the screen that was coming arrives at once. */
      setShown(pathname);
      return undefined;
    }
    if (shown === pathname) return undefined;
    const timer = window.setTimeout(() => setShown(pathname), waitMs);
    return () => window.clearTimeout(timer);
  }, [pathname, waitMs, shown]);

  if (waitMs === 0 || shown === pathname) return <>{children}</>;

  return (
    <div className="stack-2" role="status" aria-live="polite" aria-busy="true">
      <p className="t-sm t-muted">{t('Bringing this screen over your connection.')}</p>
      <ul className="stack-2" aria-hidden="true">
        <PickerRowSkeletons count={3} />
      </ul>
    </div>
  );
}
