import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Dialog, SectionHeading } from '../ui/primitives';
import { Avatar } from './Avatar';
import { firebaseConfigured } from '../../lib/firebase';
import { deleteAccount, signOutNow, syncNow, watchAccount } from '../../lib/account';
import {
  addPasskey,
  explainPasskeyError,
  listPasskeys,
  passkeyStatus,
  passkeysSupported,
  removePasskey,
  type PasskeyInfo,
} from '../../lib/passkeys';
import { PHOTO_KEY, squarePhoto } from '../../lib/avatar';
import { loadPhotoFromAccount, removePhotoFromAccount, savePhotoToAccount } from '../../lib/photos';
import { readStored, writeStored } from '../../lib/storage';

type Account = { uid: string; email: string | null; name: string | null };

/**
 * **A name for the device a passkey was made on.**
 *
 * A list of five passkeys all called "This device" tells the traveller nothing when one of them has
 * to be removed, so the platform is read off the browser's own description of itself and the name
 * is made unique if that platform is already in the list.
 */
function deviceLabel(taken: string[]): string {
  const agent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  let base = 'This device';
  if (/iPhone/.test(agent)) base = 'iPhone';
  else if (/iPad/.test(agent)) base = 'iPad';
  else if (/Android/.test(agent)) base = 'Android phone';
  else if (/Macintosh/.test(agent)) base = 'Mac';
  else if (/Windows/.test(agent)) base = 'Windows PC';
  if (!taken.includes(base)) return base;
  for (let count = 2; count < 10; count += 1) {
    const next = `${base} ${count}`;
    if (!taken.includes(next)) return next;
  }
  return base;
}

function dayOf(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

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
  const [confirmRemovePhoto, setConfirmRemovePhoto] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [passkeysOn, setPasskeysOn] = useState(false);
  /* Whether the question was actually answered, as opposed to failing to be asked. */
  const [passkeysKnown, setPasskeysKnown] = useState(false);
  const [passkeyNote, setPasskeyNote] = useState<string | null>(null);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const canUsePasskeys = passkeysSupported();
  const uid = account?.uid ?? null;

  /*
   * **Whether passkeys are on is asked before anything is shown.** A switched-off feature that
   * draws a button is a broken feature; a switched-off feature that says so is a fact.
   *
   * The list is read whenever the account changes hands, so it is never another person's.
   */
  useEffect(() => {
    if (uid === null || !canUsePasskeys) {
      setPasskeys([]);
      setPasskeysOn(false);
      setPasskeysKnown(false);
      return;
    }
    let alive = true;
    void (async () => {
      const status = await passkeyStatus();
      if (!alive) return;
      setPasskeysOn(status.available);
      setPasskeysKnown(status.known);
      /*
       * **The list is read even when the feature reports itself off.** A passkey made before the
       * switch was turned on is still a real key on the device, and hiding it is how the card came
       * to say "no passkeys" to somebody holding one.
       */
      try {
        const result = await listPasskeys();
        if (alive) setPasskeys(result.passkeys);
      } catch {
        if (alive) setPasskeys([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [uid, canUsePasskeys]);

  const reloadPasskeys = async () => {
    try {
      const result = await listPasskeys();
      setPasskeys(result.passkeys);
    } catch {
      /* the list stays as it was; the note already says what went wrong */
    }
  };

  const generatePasskey = async () => {
    setPasskeyBusy(true);
    setPasskeyNote(null);
    try {
      await addPasskey(deviceLabel(passkeys.map((passkey) => passkey.name)));
      await reloadPasskeys();
      setPasskeyNote('Passkey added. You can sign in on this device without a password now.');
    } catch (error) {
      setPasskeyNote(explainPasskeyError(error));
    } finally {
      setPasskeyBusy(false);
    }
  };

  const dropPasskey = async (id: string) => {
    setPasskeyBusy(true);
    setPasskeyNote(null);
    try {
      await removePasskey(id);
      await reloadPasskeys();
      setPasskeyNote('Passkey removed.');
    } catch (error) {
      setPasskeyNote(explainPasskeyError(error));
    } finally {
      setPasskeyBusy(false);
    }
  };

  /*
   * **A new phone asks the account for the face.** The copy in this browser is drawn first because
   * it costs nothing; this is what makes a fresh device show the same person without waiting for
   * the travel document to arrive. A photograph already here wins, so nothing flickers on a phone
   * that already knows this face.
   */
  useEffect(() => {
    if (uid === null || photo.length > 0) return;
    let alive = true;
    void loadPhotoFromAccount()
      .then((data) => {
        if (!alive || data === null) return;
        setPhoto(data);
        writeStored(PHOTO_KEY, data);
      })
      .catch(() => {
        /* no face, or no connection: the initial is a fine answer */
      });
    return () => {
      alive = false;
    };
  }, [uid, photo]);

  /*
   * **A photograph chosen before the account could hold one is copied up once.** Most travellers
   * already have a face on this phone, and asking them to choose it again to get it onto their
   * account would be silly. One copy per visit, and a failure simply tries again next time.
   */
  const copied = useRef<string | null>(null);
  useEffect(() => {
    if (uid === null || photo.length === 0 || copied.current === uid) return;
    copied.current = uid;
    void savePhotoToAccount(photo).catch(() => {
      copied.current = null;
    });
  }, [uid, photo]);

  const choosePhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const square = await squarePhoto(file);
      setPhoto(square);
      writeStored(PHOTO_KEY, square);
      setNote(null);
      /*
       * The account keeps its own copy, so the next phone shows this face. If that copy fails the
       * picture is still here and still drawn, so the traveller is not alarmed about a photograph
       * they can already see.
       */
      void savePhotoToAccount(square).catch(() => undefined);
    } catch {
      setNote('That picture could not be read. Try another one.');
    }
  };

  const removePhoto = () => {
    setPhoto('');
    writeStored(PHOTO_KEY, '');
    setNote(null);
    /* A face removed here must not come back on the next phone. */
    void removePhotoFromAccount().catch(() => undefined);
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

          {/*
            * **Passkeys, listed by the device they were made on.** A new phone signs in with the
            * key it already has, through iCloud or Google, or with a code from the old phone, and
            * then makes its own key here, so the next sign-in is the short way again. Removing one
            * is allowed; the line underneath says what that costs when it is the only one.
            */}
          {canUsePasskeys ? (
            <div className="stack-3">
              <p className="t-strong" style={{ margin: 0 }}>
                Passkeys
              </p>

              {/*
                **"I could not ask" is not "it is switched off".** A failed status read used to be
                drawn as the switched-off sentence with the button greyed out, which told a
                traveller the feature did not exist and gave them nothing to press while the route
                itself was answering that it was on. A failure now says so and leaves the button
                live, so the real attempt is what decides.
              */}
              {!passkeysKnown && passkeys.length === 0 ? (
                <p className="t-sm t-muted" style={{ margin: 0 }}>
                  OVVO could not check whether passkeys are on just now. You can still try adding
                  one.
                </p>
              ) : !passkeysOn && passkeys.length === 0 ? (
                <p className="t-sm t-muted" style={{ margin: 0 }}>
                  Passkeys are not switched on for OVVO yet. When they are, you can sign in with
                  your face, fingerprint or PIN instead of a password.
                </p>
              ) : passkeys.length === 0 ? (
                <p className="t-sm t-muted" style={{ margin: 0 }}>
                  No passkey is saved with your OVVO ID yet. Add one here and you can sign in on this
                  device with your face, fingerprint or PIN instead of a password.
                </p>
              ) : (
                <div className="stack-1">
                  {passkeys.map((passkey) => (
                    <div
                      key={passkey.id}
                      className="row-wrap"
                      style={{ justifyContent: 'space-between' }}
                    >
                      <span className="t-sm">
                        {passkey.name}
                        {passkey.lastUsedAt ? (
                          <span className="t-muted">, last used {dayOf(passkey.lastUsedAt)}</span>
                        ) : (
                          <span className="t-muted">, added {dayOf(passkey.addedAt)}</span>
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={passkeyBusy}
                        onClick={() => void dropPasskey(passkey.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {!passkeysOn && passkeys.length > 0 ? (
                <p className="t-sm t-muted" style={{ margin: 0 }}>
                  This passkey is saved with your OVVO ID. It starts signing you in once passkeys
                  are switched on for OVVO.
                </p>
              ) : null}

              <div className="row-wrap">
                <Button
                  variant="surface"
                  size="sm"
                  disabled={passkeyBusy || (passkeysKnown && !passkeysOn)}
                  onClick={() => void generatePasskey()}
                >
                  {passkeyBusy ? 'Waiting for your device' : 'Generate a new Passkey'}
                </Button>
              </div>

              {passkeysOn ? (
                <p className="t-sm t-muted" style={{ margin: 0 }}>
                  One passkey per device, and five in all. To add another, open OVVO on your other
                  phone or computer and press Generate a new Passkey there.
                </p>
              ) : null}

              {passkeys.length === 1 ? (
                <p className="t-sm t-muted" style={{ margin: 0 }}>
                  This is your only passkey. Keep a password or Google sign-in as well, so losing
                  this device does not lock you out.
                </p>
              ) : null}

              {passkeyNote ? (
                <p className="t-sm" role="alert" style={{ margin: 0 }}>
                  {passkeyNote}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="row-wrap">
            <Button variant="surface" size="sm" onClick={() => fileInput.current?.click()}>
              {photo ? 'Change photo' : 'Add a photo'}
            </Button>
            {/*
              * **Removing the picture asks first.** A picture is not a setting that can be flicked
              * back: the file leaves this device and the traveller has to find it again to put it
              * back, so it is a decision rather than a tap.
              */}
            {photo ? (
              <Button variant="ghost" size="sm" onClick={() => setConfirmRemovePhoto(true)}>
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

      <Dialog
        open={confirmRemovePhoto}
        title="Remove your picture?"
        description="The picture is removed from this device. Your OVVO ID and everything saved with it stay as they are."
        onClose={() => setConfirmRemovePhoto(false)}
        footer={
          <>
            <Button
              variant="accent"
              icon="trash"
              onClick={() => {
                removePhoto();
                setConfirmRemovePhoto(false);
              }}
            >
              Remove photo
            </Button>
            <Button variant="ghost" onClick={() => setConfirmRemovePhoto(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <p className="t-sm">You can add another picture at any time.</p>
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
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [leaving, setLeaving] = useState(false);

  if (account === null) return null;

  /*
   * The button stands on the page itself: it is one action, and a card drawn around a single
   * button is a backdrop that says "this is a section" about something that is not one.
   */
  return (
    <>
      <div className="row-wrap">
        <Button variant="surface" size="sm" onClick={() => setConfirmSignOut(true)}>
          Sign out
        </Button>
      </div>

      {/*
        * **Signing out asks first.** It is not destructive, which is why the sheet says so plainly
        * rather than in the alarm colour: a traveller who tapped it by accident has one tap back,
        * and one who meant it loses nothing but the session. The sheet also answers the question
        * people actually have at that moment, which is whether their journeys are about to go.
        *
        * **The words say where the things live, and that is the account.** An earlier draft said
        * they "stay on this device", which is the wrong picture: with an OVVO ID the account is
        * what holds them, and this device keeps a copy so the app still works with no network.
        * Signing out changes neither of those, so the sentence promises nothing that has to be
        * taken back.
        */}
      <Dialog
        open={confirmSignOut}
        title="Sign out of your OVVO ID?"
        description="Your stops and journeys belong to your OVVO ID. Signing out does not delete them."
        onClose={() => setConfirmSignOut(false)}
        footer={
          <>
            <Button
              variant="accent"
              disabled={leaving}
              onClick={() => {
                setLeaving(true);
                void signOutNow().finally(() => {
                  setLeaving(false);
                  setConfirmSignOut(false);
                });
              }}
            >
              {leaving ? 'Signing out' : 'Sign out'}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmSignOut(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <p className="t-sm">
          They stay with your account and come back the next time you sign in. Until then OVVO keeps
          working with what this device already holds, offline as well.
        </p>
      </Dialog>
    </>
  );
}
