import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Pill, SectionHeading } from '../ui/primitives';
import { firebaseConfigured } from '../../lib/firebase';
import { eraseRemote, signOutNow, syncNow, watchAccount } from '../../lib/account';

type Status = 'idle' | 'syncing' | 'ok' | 'failed';

/**
 * **Three lines, not a paragraph.**
 *
 * This card used to explain the whole arrangement in a screenful of prose. What a traveller wants
 * to know is one thing — am I signed in, and is my stuff safe — so that is all it says. The rest
 * (what signing in buys, what stays local) is said once on the sign-in screen, where it belongs,
 * because that is where the decision is made.
 */
export function AccountCard() {
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(
    () =>
      watchAccount((user) => {
        setEmail(user?.email ?? null);
        setStatus('idle');
      }),
    [],
  );

  const save = async () => {
    setStatus('syncing');
    const result = await syncNow();
    setStatus(result === 'ok' ? 'ok' : 'failed');
  };

  return (
    <Card>
      <SectionHeading title="Your account" />

      {!firebaseConfigured ? (
        <p className="t-sm t-muted">Sign-in is off in this build. Your things stay on this device.</p>
      ) : email === null ? (
        <div className="row-wrap">
          <p className="t-sm t-muted" style={{ margin: 0 }}>
            Not signed in. Everything stays in this browser.
          </p>
          <Link className="btn btn--accent" to="/signin" state={{ from: '/settings' }}>
            Sign in
          </Link>
        </div>
      ) : (
        <div className="stack-3">
          <div className="row-wrap">
            <Pill tone="sage" dot>
              Signed in
            </Pill>
            <span className="t-sm">{email}</span>
          </div>

          <div className="row-wrap">
            <Button
              variant="surface"
              size="sm"
              onClick={() => void save()}
              disabled={status === 'syncing'}
            >
              {status === 'syncing'
                ? 'Saving'
                : status === 'ok'
                  ? 'Saved'
                  : status === 'failed'
                    ? 'Try again'
                    : 'Save now'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void signOutNow()}>
              Sign out
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void eraseRemote();
              }}
            >
              Remove the server copy
            </Button>
          </div>

          {status === 'failed' ? (
            <p className="t-sm t-muted" style={{ margin: 0 }}>
              The server did not answer. Your things are still on this device.
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
}
