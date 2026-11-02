import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Banner, Button, Card } from '../components/ui/primitives';
import { TurnstileBox } from '../components/account/TurnstileBox';
import { firebaseConfigured } from '../lib/firebase';
import {
  createAccount,
  explainAuthError,
  sendResetMail,
  sendSignInLink,
  signInWithGoogle,
  signInWithPassword,
} from '../lib/account';
import {
  createAccountWithPasskey,
  explainPasskeyError,
  passkeyStatus,
  passkeysSupported,
  signInWithPasskey,
} from '../lib/passkeys';

type Mode = 'link' | 'password';

/**
 * **The address the sign-in mail actually comes from.**
 *
 * The mail is sent by Firebase through Brevo, from a mailbox of VibeCreations' own rather than the
 * shared no-reply address Firebase uses by default, and that is what stopped it landing in spam.
 * A traveller who is told the exact sender knows what to look for in a crowded inbox, and knows the
 * message is ours rather than something that borrowed our name.
 */
const MAIL_FROM = 'ovvo.vibecreations@outlook.com';

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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [offerCreate, setOfferCreate] = useState(false);
  const [sent, setSent] = useState<{ to: string; purpose: 'link' | 'reset' } | null>(null);
  const [resent, setResent] = useState(false);
  const [passkeyReady, setPasskeyReady] = useState(false);
  const [newWithPasskey, setNewWithPasskey] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileTrouble, setTurnstileTrouble] = useState(false);

  /*
   * **Whether passkeys are worth offering is asked once, on arrival.** The browser says whether it
   * can make one, and the site says whether it is switched on. Until both say yes, the screen is
   * exactly the screen it was before passkeys existed, rather than a button that cannot work.
   */
  const canUsePasskeys = passkeysSupported();

  useEffect(() => {
    if (!canUsePasskeys) return;
    let alive = true;
    void passkeyStatus().then((status) => {
      if (alive) setPasskeyReady(status.available);
    });
    return () => {
      alive = false;
    };
  }, [canUsePasskeys]);

  const withPasskey = async (work: () => Promise<void>) => {
    setBusy(true);
    setProblem(null);
    setOfferCreate(false);
    try {
      await work();
      back();
    } catch (error) {
      setProblem(explainPasskeyError(error));
    } finally {
      setBusy(false);
    }
  };

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
              <p className="t-sm t-muted">
                It comes from <b>{MAIL_FROM}</b>. Adding that address to your contacts keeps it out
                of spam next time.
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
            {/*
              * **The passkey goes first, because it is the shortest way in.** No password to
              * recall and no mail to wait for: the phone shows a face or a fingerprint and the
              * account is there. It is only offered when the browser and the site both say yes.
              */}
            {passkeyReady ? (
              <>
                <Button
                  variant="primary"
                  block
                  disabled={busy || !firebaseConfigured}
                  onClick={() => void withPasskey(signInWithPasskey)}
                >
                  Sign in with a passkey
                </Button>
                <p className="t-sm t-faint" style={{ textAlign: 'center', margin: 0 }}>
                  or
                </p>
              </>
            ) : null}

            <Button
              variant={passkeyReady ? 'surface' : 'primary'}
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

              {/*
                * **Making an account asks for a name.** The first name is required and the second
                * is not, and these boxes only appear once a sign-in has told us there is no
                * account on this address - so nobody is asked for a name on the way into an
                * account that already exists.
                */}
              {offerCreate ? (
                <div className="stack-3">
                  <label className="field">
                    <span className="field__label">First name</span>
                    <input
                      className="input"
                      name="given-name"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    <span className="field__label">Last name (optional)</span>
                    <input
                      className="input"
                      name="family-name"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                    />
                  </label>
                  <Button
                    variant="surface"
                    block
                    disabled={
                      busy ||
                      email.trim().length === 0 ||
                      password.length < 6 ||
                      firstName.trim().length === 0
                    }
                    onClick={() =>
                      void go(
                        () => createAccount(email, password, firstName, lastName),
                        back,
                      )
                    }
                  >
                    Create account
                  </Button>
                </div>
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
                  setFirstName('');
                  setLastName('');
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

        {/*
          * **A new account can be a passkey and nothing else.** No email box, so nothing to wait
          * for and nothing to land in a spam folder. The name is asked because an account with no
          * name cannot be recognised on the next phone.
          */}
        {passkeyReady ? (
          <Card>
            <div className="stack-3">
              <p className="t-strong" style={{ margin: 0 }}>
                New to OVVO?
              </p>
              {!newWithPasskey ? (
                <Button
                  variant="surface"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setTurnstileTrouble(false);
                    setNewWithPasskey(true);
                  }}
                >
                  Create an account with a passkey
                </Button>
              ) : (
                <div className="stack-3">
                  <p className="t-sm t-muted" style={{ margin: 0 }}>
                    No email and no password. Your face, fingerprint or PIN is the key.
                  </p>
                  <label className="field">
                    <span className="field__label">First name</span>
                    <input
                      className="input"
                      name="given-name"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span className="field__label">Last name (optional)</span>
                    <input
                      className="input"
                      name="family-name"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                    />
                  </label>
                  {/*
                    * **The quick check, right above the button it unlocks.** This is the only
                    * door into OVVO that asks for nothing, so it is the only one a script could
                    * walk through a thousand times. Nothing to press until it has finished.
                    */}
                  <TurnstileBox
                    onToken={setTurnstileToken}
                    onTrouble={() => setTurnstileTrouble(true)}
                  />
                  {turnstileTrouble ? (
                    <p className="t-sm t-muted" style={{ margin: 0 }}>
                      That check could not load, so an account with a passkey cannot be made right
                      now. You can still make one with an email above.
                    </p>
                  ) : null}
                  <Button
                    variant="accent"
                    block
                    disabled={
                      busy ||
                      turnstileToken === null ||
                      firstName.trim().length === 0 ||
                      !firebaseConfigured
                    }
                    onClick={() =>
                      void withPasskey(() =>
                        createAccountWithPasskey(firstName, lastName, turnstileToken ?? ''),
                      )
                    }
                  >
                    {busy ? 'Waiting for your device' : 'Create with a passkey'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewWithPasskey(false);
                      setTurnstileToken(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : null}

        <p className="t-sm">
          <Link to={returnTo}>Back to OVVO</Link>
        </p>
      </div>
    </main>
  );
}
