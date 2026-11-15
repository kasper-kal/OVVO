/**
 * **Live running times, asked for by trip.**
 *
 * The page plans a journey, then asks the app's own `/api/live` for those exact trips. The worker
 * reads the national realtime feed and answers with the delays it knows and nothing else. If the
 * feed cannot be read, the page says live times are unavailable — it never falls back to "on time",
 * because a made-up delay is worse than no delay.
 */

export interface LiveReport {
  /** The feed's own timestamp: when this snapshot was made. */
  generatedAt: string | null;
  fetchedAt: string;
  /** How many trips the feed carries at all. */
  known: number;
  /** How many of the trips this page asked about were found. */
  matched: number;
  /** How many trips were asked about. */
  requested: number;
  /** How many services nationally are running a minute or more late. */
  late: number;
}

export interface LiveDelays {
  report: LiveReport;
  /** Trip identifier → delay in seconds. Negative means running early. */
  delays: Record<string, number>;
}

export async function fetchLiveDelays(tripIds: string[]): Promise<LiveDelays> {
  const unique = [...new Set(tripIds.filter(Boolean))].slice(0, 200);
  const query = unique.join(',');
  const response = await fetch(`/api/live?trips=${encodeURIComponent(query)}`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(detail?.message ?? `live times answered ${response.status}`);
  }
  const body = (await response.json()) as { delays?: Record<string, number> } & Omit<LiveReport, 'requested'>;
  return {
    delays: body.delays ?? {},
    report: {
      generatedAt: body.generatedAt ?? null,
      fetchedAt: body.fetchedAt,
      known: body.known,
      matched: body.matched,
      requested: unique.length,
      late: body.late ?? 0,
    },
  };
}
