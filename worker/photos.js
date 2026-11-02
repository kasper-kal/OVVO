/**
 * **A traveller's photograph, kept with their account instead of only on one phone.**
 *
 * The picture used to live in the browser's own storage, which meant a new phone showed a plain
 * initial until the whole travel document arrived. It is a face; it belongs to the account.
 *
 * **It is stored in the database, not in a bucket.** R2 was the tidier place and Cloudflare will
 * not switch it on without a payment method, which this project does not have and will not add.
 * A squared photograph is about thirty kilobytes; a year of them is smaller than one journey
 * document, and the free database holds five gigabytes. Nothing was given up except tidiness.
 *
 * **Only the owner can read it.** The picture is fetched with the account's own token and handed
 * back to that account, so there is no address that shows somebody's face to a stranger who
 * happens to have the link.
 */

/** About a hundred kilobytes of picture, encoded. The app makes thirty; this is the ceiling. */
const MAX_PHOTO_CHARS = 140 * 1024;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/** The photograph this account has, as the same data URL the app draws. */
export async function photoRoute(request, env, claims) {
  if (claims === null || !claims.uid) return json({ error: 'unauthorized' }, 401);

  if (request.method === 'GET') {
    const row = await env.DB.prepare('SELECT photo FROM profile_photo WHERE uid = ?1')
      .bind(claims.uid)
      .first();
    if (!row || typeof row.photo !== 'string' || row.photo.length === 0) {
      return json({ data: null });
    }
    /* A photograph changes when the traveller changes it, and not before. */
    return new Response(JSON.stringify({ data: row.photo }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'private, max-age=300',
      },
    });
  }

  if (request.method === 'PUT') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'body' }, 400);
    }
    const data = typeof body?.data === 'string' ? body.data : '';
    /* Only the shape this app makes: a JPEG data URL. Anything else is not a photograph here. */
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(data)) return json({ error: 'photo' }, 400);
    if (data.length > MAX_PHOTO_CHARS) return json({ error: 'too-big' }, 413);

    await env.DB.prepare(
      `INSERT INTO profile_photo (uid, photo, updated_at) VALUES (?1, ?2, ?3)
       ON CONFLICT(uid) DO UPDATE SET photo = ?2, updated_at = ?3`,
    )
      .bind(claims.uid, data, new Date().toISOString())
      .run();
    return json({ saved: true });
  }

  if (request.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM profile_photo WHERE uid = ?1').bind(claims.uid).run();
    return json({ removed: true });
  }

  return json({ error: 'method' }, 405);
}
