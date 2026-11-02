/**
 * **A ceiling on how often one caller may do something, kept in the database we already have.**
 *
 * Cloudflare's own rate-limiting rules need a zone, and OVVO has no domain by decision. The free
 * Worker plan also has no per-caller limit of its own: a hundred thousand requests a day are free,
 * and one script can spend all of them. So the count lives in D1, next to the data it protects.
 *
 * **It counts by window, not by timestamp per request.** One row per caller per thing: the number
 * of hits and when the window ends. That is one small write per allowed request and a delete for
 * each expired window, which the free database carries comfortably at this size.
 *
 * The buckets are deliberately different shapes for different doors:
 *
 *   - saving a traveller's own copy: generous, because a busy phone is not an attack;
 *   - uploading a photo: tight, because a photo is the largest thing anyone sends here;
 *   - making a new account: tightest of all, and counted by address rather than by account,
 *     because it is the only door that asks for nothing at all.
 */

/** Give the row room to disappear: a window that ended an hour ago is not evidence of anything. */
const KEEP_MS = 60 * 60 * 1000;

/**
 * Count one hit against `bucket`, and say whether it is allowed.
 *
 * Returns `{ ok }` when allowed and `{ ok: false, retryAfter }` when not, so the caller can answer
 * 429 with an honest `Retry-After` rather than a bare refusal.
 */
export async function allow(env, bucket, max, windowMs) {
  const now = Date.now();
  const row = await env.DB.prepare(
    'SELECT hits, resets_at FROM api_limit WHERE bucket = ?1',
  )
    .bind(bucket)
    .first();

  if (!row || row.resets_at <= now) {
    await env.DB.prepare(
      `INSERT INTO api_limit (bucket, hits, resets_at) VALUES (?1, 1, ?2)
       ON CONFLICT(bucket) DO UPDATE SET hits = 1, resets_at = ?2`,
    )
      .bind(bucket, now + windowMs)
      .run();
    /* The sweep rides along with the first hit of a new window: no clock, no cron, no cost. */
    await env.DB.prepare('DELETE FROM api_limit WHERE resets_at < ?1')
      .bind(now - KEEP_MS)
      .run();
    return { ok: true };
  }

  if (row.hits >= max) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((row.resets_at - now) / 1000)) };
  }

  await env.DB.prepare('UPDATE api_limit SET hits = hits + 1 WHERE bucket = ?1').bind(bucket).run();
  return { ok: true };
}

/** The refusal itself, with the one header that makes a 429 useful rather than mysterious. */
export function tooMany(retryAfter) {
  return new Response(JSON.stringify({ error: 'slow-down' }), {
    status: 429,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'retry-after': String(retryAfter),
    },
  });
}
