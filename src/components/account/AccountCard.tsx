import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Pill, SectionHeading } from '../ui/primitives';
import { firebaseConfigured } from '../../lib/firebase';
import { eraseRemote, signOutNow, syncNow, watchAccount } from '../../lib/account';

type Status = 'idle' | 'syncing' | 'ok' | 'failed';

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

          <div className="row-wrap">
            <Button
              variant="surface"
              size="sm"
              onClick={() => void save()}
              disabled={status === 'syncing'}
            >
              {status === 'syncing' ? 'Syncing' : status === 'ok' ? 'Synced' : 'Sync now'}
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
              Delete cloud data
            </Button>
          </div>

          {status === 'failed' ? (
            <p className="t-sm t-muted" style={{ margin: 0 }}>
              Couldn&rsquo;t sync. Your data is still saved on this device.
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
}
