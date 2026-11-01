import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banner, Button, Card, Pill, SectionHeading } from '../ui/primitives';
import { firebaseConfigured } from '../../lib/firebase';
import { eraseRemote, signOutNow, syncNow, watchAccount } from '../../lib/account';

type Status = 'idle' | 'syncing' | 'ok' | 'failed';

/**
 * **One card, one question: is this traveller signed in, and is their stuff on the server?**
 *
 * Signed out, it explains what signing in buys and offers the door. Signed in, it shows the
 * address, whether the last save went through, and two controls — save now, and sign out. The
 * reset control further down the screen is the app's own reset; this card is the account's only
 * place, so there is no second menu hiding a second answer.
 *
 * The words are English only, like the sign-in screen. Everything this card calls is in
 * `lib/account`.
 */
export function AccountCard() {
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(
    () =>
      watchAccount((user) => {
        setEmail(user?.email ?? null);
        setStatus('idle');
        setProblem(null);
      }),
    [],
  );

  const save = async () => {
    setStatus('syncing');
    setProblem(null);
    const result = await syncNow();
    setStatus(result === 'ok' ? 'ok' : result === 'failed' ? 'failed' : 'idle');
    if (result === 'failed') setProblem('The server did not answer. Your things are still on this device.');
  };

  return (
    <Card>
      <SectionHeading
        title="Your account"
        description="Signing in keeps your saved stops, journeys and searches on every device."
      />

      {!firebaseConfigured ? (
        <div className="stack-3">
          <Banner tone="butter" icon="info" title="Sign-in is off in this build">
            The sign-in keys were missing when this copy was built, so the account controls are
            switched off. Your things stay on this device.
          </Banner>
        </div>
      ) : email === null ? (
        <div className="stack-3">
          <p className="t-sm t-muted">
            You are using OVVO without an account. Nothing is sent anywhere, and everything stays in
            this browser.
          </p>
          <div className="row-wrap">
            <Link className="btn btn--accent" to="/signin">
              Sign in or make an account
            </Link>
          </div>
        </div>
      ) : (
        <div className="stack-3">
          <div className="row-wrap">
            <Pill tone="sage" dot>
              Signed in
            </Pill>
            <span className="t-sm">{email}</span>
          </div>

          <p className="t-sm t-muted">
            {status === 'syncing'
              ? 'Saving your things'
              : status === 'ok'
                ? 'Your things are on the server, so another device gets them.'
                : status === 'failed'
                  ? 'The last save did not reach the server.'
                  : 'Saved on this device, and sent to the server after every change.'}
          </p>

          {problem ? (
            <Banner tone="coral" icon="info" title="Not saved yet">
              {problem}
            </Banner>
          ) : null}

          <div className="row-wrap">
            <Button variant="surface" size="sm" onClick={() => void save()} disabled={status === 'syncing'}>
              Save now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                /* The server copy goes with the account's sign-out only by the traveller's choice;
                   the reset control below is the one that empties everything. */
                void signOutNow();
              }}
            >
              Sign out
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus('syncing');
                void eraseRemote().then((done) => {
                  setStatus(done ? 'idle' : 'failed');
                  if (!done) setProblem('The server copy could not be removed.');
                });
              }}
            >
              Remove the copy on the server
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
