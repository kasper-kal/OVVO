import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Dialog, SectionHeading } from '../ui/primitives';
import { Avatar } from './Avatar';
import { firebaseConfigured } from '../../lib/firebase';
import { deleteAccount, signOutNow, syncNow, watchAccount } from '../../lib/account';
import { PHOTO_KEY, squarePhoto } from '../../lib/avatar';
import { readStored, writeStored } from '../../lib/storage';

type Account = { uid: string; email: string | null; name: string | null };

function useAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const stop = watchAccount((user) => {
      setAccount(user ? { uid: user.uid, email: user.email, name: user.displayName } : null);
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

  return { account, failed };
}

/**
 * **The account card: a face, a name, and the two things a person may want to change.**
 *
 * The card is `stack`, which is the whole of the spacing story here: a card is a plain block, so
 * without it the heading and the row under it sit flush against each other and the avatar's circle
 * starts exactly where the word "Account" ends - which is what was reported as the card looking
 * broken (the avatar drawn over the title, the address floating beside it, one button shaped and the
 * next one bare text).
 *
 * The two lines beside the face are the name and then the address under it, muted, because they are
 * two different facts and only the first is the person's own. The buttons are the same kind of
 * thing as each other - the picture actions in a row of their own, and the one irreversible act
 * below them, away from the rest.
 */
export function AccountCard() {
  const { account, failed } = useAccount();
  const [photo, setPhoto] = useState<string>(() => readStored(PHOTO_KEY, ''));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const choosePhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const square = await squarePhoto(file);
      setPhoto(square);
      writeStored(PHOTO_KEY, square);
      setNote(null);
    } catch {
      setNote('That picture could not be read. Try another one.');
    }
  };

  const removePhoto = () => {
    setPhoto('');
    writeStored(PHOTO_KEY, '');
    setNote(null);
  };

  const removeAccount = async () => {
    setDeleting(true);
    const result = await deleteAccount();
    setDeleting(false);
    setConfirmDelete(false);
    if (result === 'recent-sign-in') {
      setNote('For safety, sign out and sign in again, then delete your OVVO ID.');
    } else if (result === 'failed') {
      setNote('Your OVVO ID could not be deleted. Nothing was changed.');
    }
  };

  return (
    <Card className="stack">
      <SectionHeading title="OVVO ID" />

      {!firebaseConfigured ? (
        <p className="t-sm t-muted" style={{ margin: 0 }}>
          Sign-in is unavailable in this build.
        </p>
      ) : account === null ? (
        <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
          <p className="t-sm t-muted" style={{ margin: 0 }}>
            You are signed out. Everything is saved on this device only.
          </p>
          <Link className="btn btn--accent btn--sm" to="/signin" state={{ from: '/settings' }}>
            Sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="row-3">
            <Avatar seed={account.uid} photo={photo || null} size={48} />
            <div className="stack-1" style={{ minWidth: 0 }}>
              <p className="t-strong" style={{ margin: 0 }}>
                {account.name ?? account.email}
              </p>
              {account.name ? (
                <p className="t-sm t-muted" style={{ margin: 0 }}>
                  {account.email}
                </p>
              ) : null}
            </div>
          </div>

          {failed ? (
            <p className="t-sm t-muted" style={{ margin: 0 }}>
              Couldn&rsquo;t reach your OVVO ID. Your changes are saved on this device.
            </p>
          ) : null}
          {note ? (
            <p className="t-sm" role="alert" style={{ margin: 0 }}>
              {note}
            </p>
          ) : null}

          <p className="t-sm t-muted" style={{ margin: 0 }}>
            Your stops, journeys and settings are saved with this OVVO ID, so they are on your other
            devices too.
          </p>

          <div className="row-wrap">
            <Button variant="surface" size="sm" onClick={() => fileInput.current?.click()}>
              {photo ? 'Change photo' : 'Add a photo'}
            </Button>
            {photo ? (
              <Button variant="ghost" size="sm" onClick={removePhoto}>
                Remove photo
              </Button>
            ) : null}
          </div>

          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            accept="image/*"
            aria-label="Choose a profile picture"
            onChange={(event) => {
              void choosePhoto(event.target.files?.[0]);
              event.target.value = '';
            }}
          />

          <div className="row-wrap">
            <Button variant="ghost" size="sm" icon="trash" onClick={() => setConfirmDelete(true)}>
              Delete OVVO ID
            </Button>
          </div>
        </>
      )}

      <Dialog
        open={confirmDelete}
        title="Delete this OVVO ID?"
        description="Your OVVO ID and the copy of your data on the server are deleted. This cannot be undone."
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <Button variant="accent" icon="trash" disabled={deleting} onClick={() => void removeAccount()}>
              {deleting ? 'Deleting' : 'Delete OVVO ID'}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <p className="t-sm">
          Everything saved with your OVVO ID goes with it. This device keeps its own copy until you
          empty it with the reset at the foot of this page.
        </p>
      </Dialog>
    </Card>
  );
}

/**
 * **Signing out is a foot-of-page act, on the lightest surface there is.**
 *
 * It sits above the app's reset because that is what it is: a way to leave, not a setting. The
 * plain raised surface is the lighter of the two on purpose - the reset below it wears the accent
 * colour - because emptying everything is the heavier decision of the pair.
 */
export function SignOutPanel() {
  const { account } = useAccount();

  if (account === null) return null;

  /*
   * The button stands on the page itself: it is one action, and a card drawn around a single
   * button is a backdrop that says "this is a section" about something that is not one.
   */
  return (
    <div className="row-wrap">
      <Button variant="surface" size="sm" onClick={() => void signOutNow()}>
        Sign out
      </Button>
    </div>
  );
}
