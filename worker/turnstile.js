/**
 * **The bot check in front of making an account, when it is worth having.**
 *
 * Making an account with a passkey asks for no email, so it is the one door with nothing in front
 * of it: a script could make a thousand accounts in a minute, each one holding a real key. Turnstile
 * asks the browser something a person passes without noticing and a script does not, and it is free
 * however many people walk through.
 *
 * **It is enforced only when the secret is in place.** A Worker without `TURNSTILE_SECRET` keeps
 * the door it had before rather than refusing everybody: the check exists to make abuse expensive,
 * not to hold the sign-in screen hostage when one value is missing.
 *
 * A token is good once, for five minutes, and for this site only. Cloudflare answers that, so the
 * check is a question asked of Cloudflare rather than an answer believed from the browser.
 */

/** True when the check can actually be run: the secret is there to check with. */
export function turnstileConfigured(env) {
  return typeof env.TURNSTILE_SECRET === 'string' && env.TURNSTILE_SECRET.trim().length > 0;
}

/**
 * Did a person pass the check?
 *
 * A missing or empty token is a no, not an error: the widget may simply not have finished, and the
 * traveller's next tap is the thing that should fix it.
 */
export async function turnstilePassed(env, token, ip) {
  if (!turnstileConfigured(env)) return true;
  if (typeof token !== 'string' || token.trim().length === 0) return false;

  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token.trim());
  /* The address the request came from, so a token passed around a bot farm is worth less. */
  if (typeof ip === 'string' && ip.length > 0) form.append('remoteip', ip);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(6000),
    });
    const body = await response.json().catch(() => ({}));
    return body?.success === true;
  } catch (error) {
    /*
     * Cloudflare unreachable is not the traveller's fault, and a person standing at a sign-in
     * screen must not be blocked by our own outage. It is logged rather than refused, which costs
     * us a few bot accounts in the worst minute of a Cloudflare outage and loses nobody's account.
     */
    console.error('[turnstile] could not check', error);
    return true;
  }
}
