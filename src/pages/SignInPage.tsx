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
 * **The sign-in screen, in the words every other site already uses.**
 *
 * One field and one button: the default is a link by email, because it asks for nothing to be
 * invented and works whether the account is new or old. A password is one quiet line away.
 *
 * The wording is deliberately ordinary — "Sign in", "Check your email", "Resend email",
 * "Use a different email" — because a sign-in screen is the last place to be original. Every
 * sentence here is the sentence a traveller has already read a hundred times elsewhere.
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
  const [sent, setSent] = useState<{ to: string; purpose: 'link' | 'reset' } | null>(null);
  const [resent, setResent] = useState(false);

  const go = async (work: () => Promise<void>, then: () => void) => {
    setBusy(true);
    setProblem(null);
    setOfferCreate(false);
    try {
      await work();
      then();
    } catch (error) {
      const code = (error as { code?: string } | null)?.code ?? '';
      setOfferCreate(code === 'auth/user-not-found' || code === 'auth/invalid-credential');
      setProblem(explainAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const back = () => navigate(returnTo, { replace: true });

  /* --------------------------------------------------- email sent, waiting */

  if (sent !== null) {
    const resend = async () => {
      setBusy(true);
      setProblem(null);
      setResent(false);
      try {
        if (sent.purpose === 'reset') await sendResetMail(sent.to);
        else await sendSignInLink(sent.to);
        setResent(true);
      } catch (error) {
        setProblem(explainAuthError(error));
      } finally {
        setBusy(false);
      }
    };

    return (
      <main style={SHELL}>
        <div className="stack-4">
          <div className="stack-1">
            <h1 className="t-title">Check your email</h1>
            <p className="t-sm t-muted">
              {sent.purpose === 'reset'
                ? 'We sent a password reset link to '
                : 'We sent a sign-in link to '}
              <b>{sent.to}</b>.
            </p>
          </div>

          <Card>
            <div className="stack-3">
              <p className="t-sm">
                {sent.purpose === 'reset'
                  ? 'Click the link in the email to choose a new password.'
                  : 'Click the link in the email to sign in. It works once and expires after an hour.'}
              </p>
              <p className="t-sm t-muted">Didn&rsquo;t get it? Check your spam folder.</p>

              {resent ? <p className="t-sm t-muted">Email sent again.</p> : null}
              {problem !== null ? (
                <p className="t-sm" role="alert" style={{ margin: 0 }}>
                  {problem}
                </p>
              ) : null}

              <div className="row-wrap">
                <Button variant="surface" size="sm" disabled={busy} onClick={() => void resend()}>
                  {busy ? 'Sending' : 'Resend email'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSent(null);
                    setResent(false);
                    setProblem(null);
                  }}
                >
                  Use a different email
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

  /* -------------------------------------------------------------- the form */

  return (
    <main style={SHELL}>
      <div className="stack-4">
        <div className="stack-1">
          <h1 className="t-title">Sign in</h1>
          <p className="t-sm t-muted">Sync your stops and journeys across your devices.</p>
        </div>

        {!firebaseConfigured ? (
          <Banner tone="coral" icon="info" title="Sign-in is unavailable">
            This build was published without sign-in keys. Everything else works; your data stays on
            this device.
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
                    () => setSent({ to: address, purpose: 'link' }),
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
                  Create account
                </Button>
              ) : null}

              <Button variant="accent" block type="submit" disabled={busy || !firebaseConfigured}>
                {busy ? 'Please wait' : mode === 'link' ? 'Send sign-in link' : 'Sign in'}
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
                {mode === 'link' ? 'Use a password instead' : 'Use a sign-in link instead'}
              </Button>
              {mode === 'password' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy || email.trim().length === 0}
                  onClick={() => {
                    const address = email.trim();
                    void go(
                      () => sendResetMail(address),
                      () => setSent({ to: address, purpose: 'reset' }),
                    );
                  }}
                >
                  Forgot password?
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
