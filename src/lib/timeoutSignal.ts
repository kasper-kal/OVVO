/**
 * A `fetch` signal that gives up after `ms`.
 *
 * This is `AbortSignal.timeout(ms)` written out, and it is here for one reason: the one-liner is
 * from Safari 16, and an iPhone that stopped updating at iOS 14 does not have it. The call does not
 * half-work there — it throws a `TypeError` before the request is made, and both callers catch and
 * return nothing, so the request was never sent at all. The encyclopaedia card and the "near me"
 * estimate quietly never appeared, on exactly the phones with the slowest connections and the most
 * reason to want them.
 *
 * `AbortController` has been in every browser this app runs on since long before iOS 14, and the
 * signal it hands out is the same object the modern call would have returned.
 *
 * The timer is not cleared when the request finishes first: it is one number in a table for a few
 * seconds, and clearing it would mean handing the caller something extra to remember to do.
 */
export function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}
