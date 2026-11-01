import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Banner, Button, Card } from '../components/ui/primitives';
import { firebaseConfigured } from '../lib/firebase';
import {
  createAccount,
  explainAuthError,
  sendResetMail,
  sendSignInLink,
  signInWithGoogle,
  signInWithPassword,
} from '../lib/account';

type Method = 'password' | 'create' | 'link';

/**
 * **One screen, three ways in, and the same box for each.**
 *
 * Google, an email and password, or a link in the post. The three are the steerer's choice
 * (1 November 2026) and each is a real path through Firebase, not a picture of one: the password
 * box signs in or makes an account, the link sends mail and the finish page completes it.
 *
 * The words on this screen are English only. The rest of the app is translated (`lib/i18n`); this
 * one is new, and saying so is better than half a translation.
 */
export function SignInPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const run = async (work: () => Promise<void>, done?: string) => {
    setBusy(true);
    setProblem(null);
    setNote(null);
    try {
      await work();
      if (done) setNote(done);
      else navigate('/', { replace: true });
    } catch (error) {
      setProblem(explainAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack-4" style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 64px' }}>
      <div className="stack-1">
        <h1 className="t-title">Sign in</h1>
        <p className="t-sm t-muted">
          Your saved stops, journeys and searches then follow you to every device, and survive a
          browser being cleared.
        </p>
      </div>

      {!firebaseConfigured ? (
        <Banner tone="coral" icon="info" title="Sign-in is off in this build">
          The sign-in keys were missing when this copy was built. Everything else works; it just
          stays on this device.
        </Banner>
      ) : null}

      {problem ? (
        <Banner tone="coral" icon="info" title="That did not work">
          {problem}
        </Banner>
      ) : null}
      {note ? (
        <Banner tone="sage" icon="info" title="Check your post">
          {note}
        </Banner>
      ) : null}

      <Card>
        <div className="stack-3">
          <Button
            variant="primary"
            block
            disabled={busy || !firebaseConfigured}
            onClick={() => void run(() => signInWithGoogle())}
          >
            Continue with Google
          </Button>

          <p className="t-sm t-faint" style={{ textAlign: 'center' }}>
            or use an email address
          </p>

          <form
            className="stack-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (method === 'link') {
                void run(() => sendSignInLink(email), `A sign-in link is on its way to ${email}.`);
                return;
              }
              void run(() =>
                method === 'create' ? createAccount(email, password) : signInWithPassword(email, password),
              );
            }}
          >
            <label className="field">
              <span className="field__label">Email address</span>
              <input
                className="input"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            {method !== 'link' ? (
              <label className="field">
                <span className="field__label">Password</span>
                <input
                  className="input"
                  type="password"
                  autoComplete={method === 'create' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                />
              </label>
            ) : null}

            <Button variant="accent" block type="submit" disabled={busy || !firebaseConfigured}>
              {method === 'link'
                ? 'Send me a sign-in link'
                : method === 'create'
                  ? 'Make my account'
                  : 'Sign in'}
            </Button>
          </form>

          <div className="row-wrap">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setMethod(method === 'link' ? 'password' : 'link');
                setProblem(null);
                setNote(null);
              }}
            >
              {method === 'link' ? 'Use a password instead' : 'Email me a link instead'}
            </Button>
            {method === 'password' ? (
              <Button size="sm" variant="ghost" onClick={() => setMethod('create')}>
                I do not have an account
              </Button>
            ) : null}
            {method === 'create' ? (
              <Button size="sm" variant="ghost" onClick={() => setMethod('password')}>
                I already have an account
              </Button>
            ) : null}
            {method === 'password' ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy || email.trim().length === 0}
                onClick={() => void run(() => sendResetMail(email), 'A reset link is on its way.')}
              >
                Forgot the password
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <p className="t-sm t-muted">
        <Link to="/">Back to OVVO</Link>
      </p>
    </div>
  );
}
