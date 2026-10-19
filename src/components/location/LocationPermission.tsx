import { useState } from 'react';
import { useApp } from '../../state/AppState';
import { Button, Dialog } from '../ui/primitives';
import { useT } from '../../lib/useT';

/**
 * Asked once, on the very first open.
 *
 * The answer is stored, so the prompt never returns by itself — but "Current
 * location" in the From/To menus always re-requests a fresh fix on demand, and
 * Settings can turn location back on at any time.
 */
export function LocationPermission() {
  const { locationConsent, setLocationConsent, requestLocation, pushToast } = useApp();
  const t = useT();
  const [busy, setBusy] = useState(false);

  if (locationConsent !== 'unknown') return null;

  const allow = () => {
    setBusy(true);
    /* Only a failure is announced: a granted request fills the end of the journey with the
       address, which is the feedback. */
    requestLocation()
      .catch((error: unknown) => {
        pushToast(error instanceof Error ? error.message : 'Location access was not granted', 'warning');
      })
      .finally(() => setBusy(false));
  };

  return (
    <Dialog
      open
      title={t('Use your location?')}
      description={t("OVVO uses this device's position to fill in where you are.")}
      onClose={() => setLocationConsent('denied')}
      footer={
        <>
          <Button variant="primary" icon="location" onClick={allow} disabled={busy}>
            {busy ? t('Requesting…') : t('Allow location')}
          </Button>
          <Button variant="ghost" onClick={() => setLocationConsent('denied')}>
            {t('Not now')}
          </Button>
        </>
      }
    >
      {/* One line, and the two facts that have to be said: where it goes, and that it is kept nowhere. */}
      <p className="t-sm t-muted">{t('Sent once to OpenStreetMap to name the street. Not stored.')}</p>
    </Dialog>
  );
}
