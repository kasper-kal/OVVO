import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Banner, Button, Card } from '../components/ui/primitives';
import {
  explainAuthError,
  finishEmailLink,
  isEmailLinkHere,
  rememberedLinkEmail,
} from '../lib/account';

/**
 * **The page the emailed link lands on.**
 *
 * Firebase's link comes back here with a one-time code in the address. Two things can be true and
 * both are handled: this browser remembers which address the mail was sent to, or it does not —
 * a link opened on another device, which is the whole point of a link. In the second case the
 * page asks for the address before it finishes, which is what Firebase requires anyway.
 *
 * It is finished once and then replaced, so a back button does not arrive at a dead sign-in and
 * does not fake a second one.
 */
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

  /*
   * **The remembered address finishes on its own.** One less tap for the ordinary case, and no
   * write during render: it happens once, after the first paint.
   */
  useEffect(() => {
    const remembered = rememberedLinkEmail();
    if (!linkIsPresent || remembered.length === 0) return;
    void finish(remembered);
    // Intentionally once: the link is single-use and re-running would fail the second time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!linkIsPresent) {
    return (
      <div className="stack-4" style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 64px' }}>
        <h1 className="t-title">This page finishes a sign-in link</h1>
        <p className="t-sm t-muted">
          It is reached from the email OVVO sends, and there is nothing to do here on its own.
        </p>
        <p className="t-sm">
          <Link to="/signin">Sign in another way</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="stack-4" style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 64px' }}>
      <h1 className="t-title">Finish signing in</h1>

      {problem ? (
        <Banner tone="coral" icon="info" title="That link did not work">
          {problem}
        </Banner>
      ) : null}

      <Card>
        <form
          className="stack-3"
          onSubmit={(event) => {
            event.preventDefault();
            void finish(email);
          }}
        >
          <label className="field">
            <span className="field__label">The address the link was sent to</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <Button variant="primary" type="submit" block disabled={busy}>
            {busy ? 'Signing in' : 'Finish signing in'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
