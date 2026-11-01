import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Pill, SectionHeading } from '../ui/primitives';
import { firebaseConfigured } from '../../lib/firebase';
import { signOutNow, watchAccount, syncNow } from '../../lib/account';

/**
 * **The account card says who you are, and nothing else.**
 *
 * There is no Save button, because there is nothing to save by hand. Every write the app makes is
 * already followed by a sync (`lib/account` watches the storage funnel and sends after a change),
 * and signing in sends the whole document. A control that only repeats what happens anyway is a
 * question the traveller should never have been asked - and renaming it "Sync now" was not a fix,
 * it was the same mistake wearing a new word.
 *
 * What is left is the two facts worth knowing - signed in as whom, and whether the last sync
 * reached the server - plus the one action a person actually wants: sign out.
 */
export function AccountCard() {
  const [email, setEmail] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const stop = watchAccount((user) => {
      setEmail(user?.email ?? null);
      setFailed(false);
      if (user) {
        void syncNow().then((result) => {
          if (alive) setFailed(result === 'failed');
        });
      }
    });
    return () => {
      alive = false;
      stop();
    };
  }, []);

  return (
    <Card>
      <SectionHeading title="Account" />

      {!firebaseConfigured ? (
        <p className="t-sm t-muted">Sign-in is unavailable in this build.</p>
      ) : email === null ? (
        <div className="row-wrap">
          <p className="t-sm t-muted" style={{ margin: 0 }}>
            You are signed out. Your data is saved on this device only.
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

          {failed ? (
            <p className="t-sm t-muted" style={{ margin: 0 }}>
              Couldn&rsquo;t sync. Your data is still saved on this device.
            </p>
          ) : null}

          <div className="row-wrap">
            <Button variant="ghost" size="sm" onClick={() => void signOutNow()}>
              Sign out
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
