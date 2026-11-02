/**
 * **The photograph, from the account rather than from this browser alone.**
 *
 * The app still keeps a copy in this browser so the face is there on the first frame after a
 * reload, and the copy on the account is what makes it follow the traveller to the next phone.
 * Nothing here decides what a photograph looks like: `lib/avatar.ts` makes the square, this hands
 * it over.
 *
 * Every call carries the account's own token, and the Worker answers only that account, so there
 * is no address that shows a face to anyone else.
 */

import { auth } from './firebase';

async function call(method: 'GET' | 'PUT' | 'DELETE', data?: string): Promise<unknown> {
  const user = auth()?.currentUser;
  /* Signed out is not a failure: there is simply no account to keep a face on. */
  if (!user) return null;
  const token = await user.getIdToken();
  const response = await fetch('/api/photo', {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
      ...(data ? { 'content-type': 'application/json' } : {}),
    },
    ...(data ? { body: JSON.stringify({ data }) } : {}),
  });
  if (!response.ok) throw new Error(`photo/${response.status}`);
  return response.json().catch(() => ({}));
}

/** Copies this browser's photograph onto the account. */
export async function savePhotoToAccount(data: string): Promise<void> {
  await call('PUT', data);
}

/** The photograph the account holds, or null when it has none. */
export async function loadPhotoFromAccount(): Promise<string | null> {
  const body = (await call('GET')) as { data?: string | null } | null;
  const data = typeof body?.data === 'string' ? body.data : '';
  return data.length > 0 ? data : null;
}

/** Forgets the photograph on the account, so a removed face does not come back on the next phone. */
export async function removePhotoFromAccount(): Promise<void> {
  await call('DELETE');
}
