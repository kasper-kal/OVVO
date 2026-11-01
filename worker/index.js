/**
 * The Worker: it answers `/api/*` itself and hands every other request to the built site.
 *
 * One deploy carries the page, the API and the database, so there is no second service to keep
 * alive and nothing that can go stale on its own.
 */

import { verifyIdToken } from './auth.js';

/** A whole traveller's year, in one document. Small next to D1's limits, and refused above this. */
const MAX_DOC_BYTES = 200 * 1024;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/**
 * **Only this site may write.**
 *
 * A request that arrives from another origin carries that origin, and a browser will not let a
 * cross-site page read the answer without permission. Refusing here means the token in somebody
 * else's tab cannot be spent by a page that is not ours. Requests with no `Origin` at all are
 * allowed, because that is what a same-origin navigation and a curl check look like.
 */
function crossOrigin(request, url) {
  const origin = request.headers.get('origin');
  return origin !== null && origin !== url.origin;
}

async function identify(request, env) {
  const header = request.headers.get('authorization') ?? '';
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  if (token.length === 0) return null;
  try {
    return await verifyIdToken(token, env.FIREBASE_PROJECT_ID || 'ovvo-vibecreations');
  } catch (error) {
    console.error('[api] token check failed', error);
    return null;
  }
}

async function readProfile(env, uid) {
  const row = await env.DB.prepare(
    'SELECT email, doc, rev, updated_at FROM travel_sync WHERE uid = ?1',
  )
    .bind(uid)
    .first();
  if (!row) return { rev: 0, doc: {}, updatedAt: null, email: null };
  let doc = {};
  try {
    doc = JSON.parse(row.doc);
  } catch {
    doc = {};
  }
  return { rev: row.rev, doc, updatedAt: row.updated_at, email: row.email };
}

/**
 * **Saving is a compare-and-set, not a blind write.**
 *
 * Two devices signed in as the same traveller will both try to save, and the one that arrived
 * second must not silently erase the other. So the save carries the revision it was built on: if
 * the stored revision has moved on, the write is refused with the current copy, and the client
 * merges and tries again. Nobody loses a journey to a race they never saw.
 */
async function saveProfile(request, env, claims) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'body' }, 400);
  }
  if (!body || typeof body !== 'object' || typeof body.doc !== 'object' || body.doc === null) {
    return json({ error: 'doc' }, 400);
  }
  const doc = JSON.stringify(body.doc);
  if (new TextEncoder().encode(doc).length > MAX_DOC_BYTES) return json({ error: 'too-big' }, 413);

  const baseRev = Number.isFinite(body.baseRev) ? Math.max(0, Math.trunc(body.baseRev)) : 0;
  const now = new Date().toISOString();
  const current = await readProfile(env, claims.uid);

  if (current.rev === 0) {
    if (baseRev !== 0) return json({ error: 'stale', ...current }, 409);
    await env.DB.prepare(
      'INSERT INTO travel_sync (uid, email, doc, rev, updated_at) VALUES (?1, ?2, ?3, 1, ?4)',
    )
      .bind(claims.uid, claims.email, doc, now)
      .run();
    return json({ rev: 1, doc: body.doc, updatedAt: now });
  }

  if (baseRev !== current.rev) return json({ error: 'stale', ...current }, 409);

  await env.DB.prepare(
    'UPDATE travel_sync SET doc = ?2, email = ?3, rev = rev + 1, updated_at = ?4 WHERE uid = ?1 AND rev = ?5',
  )
    .bind(claims.uid, doc, claims.email, now, current.rev)
    .run();

  const after = await readProfile(env, claims.uid);
  return json(after);
}

async function api(request, env, url) {
  if (url.pathname === '/api/health') return json({ ok: true });

  if (request.method !== 'GET' && request.method !== 'HEAD' && crossOrigin(request, url)) {
    return json({ error: 'origin' }, 403);
  }

  const claims = await identify(request, env);
  if (!claims) return json({ error: 'unauthorized' }, 401);

  if (url.pathname === '/api/me' && request.method === 'GET') {
    const profile = await readProfile(env, claims.uid);
    return json({
      uid: claims.uid,
      email: claims.email,
      rev: profile.rev,
      doc: profile.doc,
      updatedAt: profile.updatedAt,
    });
  }

  if (url.pathname === '/api/sync' && request.method === 'PUT') {
    return saveProfile(request, env, claims);
  }

  /*
   * **A signed-in traveller may erase the copy on the server.**
   *
   * The app promises that the year can be emptied, and a promise that leaves the old copy sitting
   * on a server is not the promise it looks like. The row goes; the account stays.
   */
  if (url.pathname === '/api/sync' && request.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM travel_sync WHERE uid = ?1').bind(claims.uid).run();
    return json({ rev: 0, doc: {} });
  }

  return json({ error: 'not-found' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try {
        return await api(request, env, url);
      } catch (error) {
        console.error('[api]', error);
        return json({ error: 'server' }, 500);
      }
    }
    const response = await env.ASSETS.fetch(request);
    /*
     * **The page is never cached, so a deploy is never invisible.**
     *
     * The built files carry a hash in their names and can be cached for ever; the page that names
     * them cannot. A cached copy of the page is a browser loading last week's bundle and drawing
     * last week's labels with no way to tell - which is exactly what happened on 1 November 2026.
     */
    const type = response.headers.get('content-type') ?? '';
    if (!type.includes('text/html')) return response;
    const fresh = new Response(response.body, response);
    fresh.headers.set('cache-control', 'no-store');
    return fresh;
  },
};
