import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/ui/primitives';
import {
  explainAuthError,
  finishEmailLink,
  isEmailLinkHere,
  rememberedLinkEmail,
} from '../lib/account';

const SHELL = { maxWidth: 520, margin: '0 auto', padding: '28px 16px 72px' } as const;

export function AuthFinishPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => rememberedLinkEmail());
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const linkIsPresent = isEmailLinkHere();

  const finish = async (address: string) => {
    setBusy(true);
    setProblem(null);
    try {
      await finishEmailLink(address);
      navigate('/', { replace: true });
    } catch (error) {
      setProblem(explainAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  /* Once, after the first paint: the link is single-use, so a second run would fail. */
  useEffect(() => {
    const remembered = rememberedLinkEmail();
    if (!linkIsPresent || remembered.length === 0) return;
    void finish(remembered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!linkIsPresent) {
    return (
      <main style={SHELL}>
        <div className="stack-4">
          <h1 className="t-title">Sign in</h1>
          <p className="t-sm t-muted">This link is invalid or has expired.</p>
          <p className="t-sm">
            <Link to="/signin">Back to sign in</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={SHELL}>
      <div className="stack-4">
        <h1 className="t-title">Sign in</h1>
        <p className="t-sm t-muted">Confirm the email address this link was sent to.</p>

        {problem !== null ? (
          <>
            <p className="t-sm" role="alert" style={{ margin: 0 }}>
              {problem}
            </p>
            <p className="t-sm">
              <Link to="/signin">Back to sign in</Link>
            </p>
          </>
        ) : (
          <Card>
            <form
              className="stack-3"
              onSubmit={(event) => {
                event.preventDefault();
                void finish(email);
              }}
            >
              <label className="field">
                <span className="field__label">Email</span>
                <input
                  className="input"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <Button variant="accent" block type="submit" disabled={busy}>
                {busy ? 'Signing in' : 'Sign in'}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </main>
  );
}
