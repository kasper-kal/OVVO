import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

type Mode = 'link' | 'password';

const SHELL = { maxWidth: 520, margin: '0 auto', padding: '28px 16px 72px' } as const;

/**
 * **One field. One button. No decisions.**
 *
 * This screen used to offer three methods, four quiet buttons and three banners at once, which
 * made joining OVVO look like filling in a form at a bank. It is one question now — the email
 * address — and the honest default is the one with no password: type the address, get a link, tap
 * it, done. That is two taps and nothing to invent or forget, and it works the same whether the
 * account is brand new or years old, so there is no "sign in or create an account?" to get wrong.
 *
 * A password is still there for anyone who wants it, one quiet line away. The reset mail and the
 * account itself are one tap from the thing they belong to, not a menu of their own.
 */
export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string } | null)?.from ?? '/';

  const [mode, setMode] = useState<Mode>('link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [offerCreate, setOfferCreate] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const go = async (work: () => Promise<void>, then: () => void) => {
    setBusy(true);
    setProblem(null);
    setOfferCreate(false);
    try {
      await work();
      then();
    } catch (error) {
      const code = (error as { code?: string } | null)?.code ?? '';
      /* The one failure worth a second button: no account on this address yet. */
      setOfferCreate(code === 'auth/user-not-found' || code === 'auth/invalid-credential');
      setProblem(explainAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const back = () => navigate(returnTo, { replace: true });

  /* ------------------------------------------------- the link has been sent */

  if (sentTo !== null) {
    return (
      <main style={SHELL}>
        <div className="stack-4">
          <div className="stack-1">
            <h1 className="t-title">Check your email</h1>
            <p className="t-sm t-muted">
              We sent {mode === 'password' ? 'a reset link' : 'a sign-in link'} to <b>{sentTo}</b>.
            </p>
          </div>
          <Card>
            <div className="stack-3">
              <p className="t-sm">
                {mode === 'password'
                  ? 'Open it and choose a new password. The link works once.'
                  : 'Open it on this device and you are in. The link works once, so use it soon.'}
              </p>
              <p className="t-sm t-faint">
                Nothing arrived? Look in the spam folder, then ask for another one.
              </p>
              <div className="row-wrap">
                <Button variant="surface" size="sm" onClick={() => setSentTo(null)}>
                  Use a different address
                </Button>
              </div>
            </div>
          </Card>
          <p className="t-sm">
            <Link to={returnTo}>Back to OVVO</Link>
          </p>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------------------------- the form */

  return (
    <main style={SHELL}>
      <div className="stack-4">
        <div className="stack-1">
          <h1 className="t-title">Sign in</h1>
          <p className="t-sm t-muted">Your saved stops and journeys follow you to every device.</p>
        </div>

        {!firebaseConfigured ? (
          <Banner tone="coral" icon="info" title="Sign-in is off in this build">
            The sign-in keys were missing when this copy was built. Everything else works; it just
            stays on this device.
          </Banner>
        ) : null}

        <Card>
          <div className="stack-3">
            <Button
              variant="primary"
              block
              disabled={busy || !firebaseConfigured}
              onClick={() => void go(() => signInWithGoogle(), back)}
            >
              Continue with Google
            </Button>

            <p className="t-sm t-faint" style={{ textAlign: 'center', margin: 0 }}>
              or
            </p>

            <form
              className="stack-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (mode === 'link') {
                  const address = email.trim();
                  void go(
                    () => sendSignInLink(address),
                    () => setSentTo(address),
                  );
                  return;
                }
                void go(
                  () => signInWithPassword(email, password),
                  back,
                );
              }}
            >
              <label className="field">
                <span className="field__label">Email</span>
                <input
                  className="input"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              {mode === 'password' ? (
                <label className="field">
                  <span className="field__label">Password</span>
                  <input
                    className="input"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>
              ) : null}

              {problem !== null ? (
                <p className="t-sm" role="alert" style={{ margin: 0 }}>
                  {problem}
                </p>
              ) : null}

              {offerCreate ? (
                <Button
                  variant="surface"
                  block
                  disabled={busy || email.trim().length === 0 || password.length < 6}
                  onClick={() =>
                    void go(
                      () => createAccount(email, password),
                      back,
                    )
                  }
                >
                  Make an account with this email
                </Button>
              ) : null}

              <Button variant="accent" block type="submit" disabled={busy || !firebaseConfigured}>
                {mode === 'link' ? 'Email me a sign-in link' : 'Sign in'}
              </Button>
            </form>

            <div className="row-wrap">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setMode(mode === 'link' ? 'password' : 'link');
                  setProblem(null);
                  setOfferCreate(false);
                }}
              >
                {mode === 'link' ? 'Use a password instead' : 'Email me a link instead'}
              </Button>
              {mode === 'password' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy || email.trim().length === 0}
                  onClick={() =>
                    void go(
                      () => sendResetMail(email),
                      () => setSentTo(email.trim()),
                    )
                  }
                >
                  Forgot password
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        <p className="t-sm">
          <Link to={returnTo}>Back to OVVO</Link>
        </p>
      </div>
    </main>
  );
}
