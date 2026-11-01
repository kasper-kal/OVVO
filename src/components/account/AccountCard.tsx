import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, SectionHeading } from '../ui/primitives';
import { firebaseConfigured } from '../../lib/firebase';
import { signOutNow, watchAccount, syncNow } from '../../lib/account';

/** The address on this account, kept in one place so both cards agree about it. */
function useAccount() {
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

  return { email, failed };
}

/**
 * **Who you are, and nothing announcing it.**
 *
 * The "Signed in" pill is gone: a card showing your address does not need a badge telling you the
 * address belongs to you. What is left is the email, and one quiet line if a sync did not reach
 * the server.
 */
export function AccountCard() {
  const { email, failed } = useAccount();

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
        <div className="stack-2">
          <p className="t-sm" style={{ margin: 0 }}>
            {email}
          </p>
          {failed ? (
            <p className="t-sm t-muted" style={{ margin: 0 }}>
              Couldn&rsquo;t sync. Your data is still saved on this device.
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
}

/**
 * **Signing out is a foot-of-page act, on the lightest surface there is.**
 *
 * It sits beside the app's reset because that is what it is: a way to leave, not a setting. But it
 * wears the *lighter* of the two surfaces on purpose - the reset button below it wears the accent
 * colour and this panel is the plain raised one - because emptying everything is the heavier
 * decision of the pair, and a quiet act should look quiet. Signing out costs nothing either:
 * everything stays on the device, and signing back in brings it down from the server again.
 */
export function SignOutPanel() {
  const { email } = useAccount();

  if (email === null) return null;

  return (
    <Card variant="flat">
      <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
        <p className="t-sm t-muted" style={{ margin: 0 }}>
          Signed in as {email}
        </p>
        <Button variant="surface" size="sm" onClick={() => void signOutNow()}>
          Sign out
        </Button>
      </div>
    </Card>
  );
}
