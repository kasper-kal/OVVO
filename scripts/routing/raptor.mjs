/**
 * **A round-based search over routes, so a query reads routes instead of a whole slice.**
 *
 * The connection scan (`scan.mjs`) reads every connection in the window — 140,000 in the middle of a
 * day — and costs about 10 ms, which is the whole free budget. This search stands at stops it has
 * actually reached, takes the first departure it can catch on each route that serves that stop, and
 * jumps along the route to every stop after it. Routes it never touches cost nothing.
 *
 * The result must be the same earliest arrival as the connection scan: `compare.mjs` checks exactly
 * that, on real journeys, rather than trusting this comment.
 *
 * What it does not do yet: more than one journey (k-best), "arrive by" (the same search with time
 * reversed), step-free routing, bicycle carriage. Nothing claims those until they are built.
 */

const INF = 2 ** 30;

/**
 * @param {object} graph
 * @param {Buffer|Uint8Array} graph.patternsBuffer  patterns.bin from the graph builder
 * @param {Buffer|Uint8Array} graph.indexBuffer     index.bin from the graph builder
 * @param {Uint32Array} graph.walkFrom
 * @param {Uint32Array} graph.walkTo
 * @param {Uint16Array} graph.walkSeconds
 * @param {number} graph.stopCount
 * @param {number} [graph.minTransferSeconds]
 * @param {number} [graph.maxRounds]
 */
export function createRaptor(graph) {
  const patternsView = new DataView(graph.patternsBuffer.buffer, graph.patternsBuffer.byteOffset, graph.patternsBuffer.byteLength);
  const patternCount = patternsView.getUint32(0, true);

  const patternStart = new Uint32Array(patternCount);
  for (let index = 0; index < patternCount; index += 1) {
    patternStart[index] = patternsView.getUint32(4 + index * 4, true);
  }

  const patternStops = new Array(patternCount);
  const patternDeps = new Array(patternCount);
  const patternOffsets = new Array(patternCount);
  const patternLargestAtPosition = new Array(patternCount);
  const patternStopCount = new Uint32Array(patternCount);
  const patternTripCount = new Uint32Array(patternCount);

  /* The builder writes offsets relative to the pattern block; the header sits in front of it. */
  const patternsBase = 4 + patternCount * 8;

  for (let index = 0; index < patternCount; index += 1) {
    let at = patternsBase + patternStart[index];
    const stopsInPattern = patternsView.getUint32(at, true);
    at += 4;
    patternStops[index] = new Uint32Array(graph.patternsBuffer.buffer, graph.patternsBuffer.byteOffset + at, stopsInPattern);
    patternStopCount[index] = stopsInPattern;
    at += stopsInPattern * 4;
    patternLargestAtPosition[index] = new Uint32Array(graph.patternsBuffer.buffer, graph.patternsBuffer.byteOffset + at, stopsInPattern);
    at += stopsInPattern * 4;
    const trips = patternsView.getUint32(at, true);
    at += 4;
    patternDeps[index] = new Uint32Array(graph.patternsBuffer.buffer, graph.patternsBuffer.byteOffset + at, trips);
    patternTripCount[index] = trips;
    at += trips * 4;
    patternOffsets[index] = new Uint32Array(graph.patternsBuffer.buffer, graph.patternsBuffer.byteOffset + at, trips * stopsInPattern);
  }

  /* Per-stop pattern index: which routes serve this stop, and where along them. */
  const indexView = new DataView(graph.indexBuffer.buffer, graph.indexBuffer.byteOffset, graph.indexBuffer.byteLength);
  const indexedStops = indexView.getUint32(0, true);
  const indexStart = new Uint32Array(indexedStops + 1);
  for (let stop = 0; stop < indexedStops; stop += 1) {
    indexStart[stop + 1] = indexStart[stop] + indexView.getUint32(4 + stop * 4, true);
  }
  const entriesBase = 4 + indexedStops * 4;
  const indexEntries = new Uint32Array(
    graph.indexBuffer.buffer,
    graph.indexBuffer.byteOffset + entriesBase,
    indexStart[indexedStops] * 2,
  );

  /* Walking links, grouped by the stop they leave from, so a round only walks where something changed. */
  const walkStart = new Uint32Array(graph.stopCount + 1);
  for (let link = 0; link < graph.walkFrom.length; link += 1) walkStart[graph.walkFrom[link] + 1] += 1;
  for (let stop = 0; stop < graph.stopCount; stop += 1) walkStart[stop + 1] += walkStart[stop];
  const walkCursor = Uint32Array.from(walkStart.subarray(0, graph.stopCount));
  const walkTarget = new Uint32Array(graph.walkFrom.length);
  const walkTime = new Uint16Array(graph.walkFrom.length);
  for (let link = 0; link < graph.walkFrom.length; link += 1) {
    const slot = walkCursor[graph.walkFrom[link]] += 1;
    walkTarget[slot - 1] = graph.walkTo[link];
    walkTime[slot - 1] = graph.walkSeconds[link];
  }

  const minTransferSeconds = graph.minTransferSeconds ?? 120;
  const maxRounds = graph.maxRounds ?? 5;

  const best = new Int32Array(graph.stopCount);
  const patternStamp = new Int32Array(patternCount);
  /* Stamps instead of Sets: a Set lookup on every improvement cost more than the search itself. */
  const stopStamp = new Int32Array(graph.stopCount);
  let stampValue = 0;
  let stopStampValue = 0;

  const stats = { patternsScanned: 0, tripsExamined: 0, stopsImproved: 0, roundsUsed: 0, walksRelaxed: 0 };

  function search(origin, destination, startTime, rounds = maxRounds) {
    stats.patternsScanned = 0;
    stats.tripsExamined = 0;
    stats.stopsImproved = 0;
    stats.roundsUsed = 0;
    stats.walksRelaxed = 0;

    best.fill(INF);
    best[origin] = startTime;

    /*
     * Walk from the origin before anything else. A station like Utrecht Centraal is a parent node:
     * the trains leave from its platforms, which are separate stops a short walk away. Without this
     * the search stands at a stop no route serves and returns nothing at all.
     */
    let marked = [origin];
    for (let link = walkStart[origin]; link < walkStart[origin + 1]; link += 1) {
      const candidate = startTime + walkTime[link];
      if (candidate < best[walkTarget[link]]) {
        best[walkTarget[link]] = candidate;
        marked.push(walkTarget[link]);
      }
    }

    for (let round = 0; round < rounds && marked.length > 0; round += 1) {
      stampValue += 1;
      stats.roundsUsed += 1;
      marked.sort((a, b) => best[a] - best[b]);

      /* Nothing that arrives later than the destination's best arrival can improve it. */
      let destinationBest = best[destination];
      let reached = destinationBest !== INF;

      stopStampValue += 1;
      const improved = [];

      for (const stop of marked) {
        const ready = best[stop] + minTransferSeconds;
        if (ready >= destinationBest) break;

        for (let entry = indexStart[stop]; entry < indexStart[stop + 1]; entry += 1) {
          const pattern = indexEntries[entry * 2];
          const position = indexEntries[entry * 2 + 1];
          if (patternStamp[pattern] === stampValue) continue;
          patternStamp[pattern] = stampValue;
          stats.patternsScanned += 1;

          const stops = patternStops[pattern];
          const deps = patternDeps[pattern];
          const offsets = patternOffsets[pattern];
          const largestAtPosition = patternLargestAtPosition[pattern];
          const stopCount = patternStopCount[pattern];
          const tripCount = patternTripCount[pattern];
          if (position + 1 >= stopCount) continue;

          /* The first trip that could possibly be caught here; trips are sorted by start time, and
           * the largest running time at this position says how far back the search must look. */
          const earliestPossible = ready - largestAtPosition[position];
          let low = 0;
          let high = tripCount;
          while (low < high) {
            const middle = (low + high) >> 1;
            if (deps[middle] < earliestPossible) low = middle + 1;
            else high = middle;
          }

          /*
           * Take the first trip that can be caught **and the next few after it**. Only ever taking
           * the first one loses journeys: a stopper that leaves first can be overtaken by an express
           * a few minutes behind it, and the express was then never considered at all — one real
           * journey arrived five minutes later than the exhaustive scan because of it.
           */
          let considered = 0;
          for (let trip = low; trip < tripCount && considered < 3; trip += 1) {
            stats.tripsExamined += 1;
            const departure = deps[trip];
            const atPosition = departure + offsets[trip * stopCount + position];
            if (atPosition < ready) continue;
            considered += 1;

            for (let ahead = position + 1; ahead < stopCount; ahead += 1) {
              const time = departure + offsets[trip * stopCount + ahead];
              if (time >= destinationBest) break;
              const target = stops[ahead];
              if (time < best[target]) {
                best[target] = time;
                stats.stopsImproved += 1;
                if (target === destination) destinationBest = time;
                if (stopStamp[target] !== stopStampValue) {
                  stopStamp[target] = stopStampValue;
                  improved.push(target);
                }
              }
            }
          }
        }
      }

      /* Walking between nearby stops, only from stops that just improved. */
      const next = [];
      stopStampValue += 1;
      for (const stop of improved) {
        /* A walk from a stop that is already at the destination's time cannot beat it. */
        if (best[stop] + 60 >= destinationBest) continue;
        for (let link = walkStart[stop]; link < walkStart[stop + 1]; link += 1) {
          const candidate = best[stop] + walkTime[link];
          const target = walkTarget[link];
          if (candidate < best[target]) {
            best[target] = candidate;
            stats.walksRelaxed += 1;
            if (target === destination) destinationBest = candidate;
            if (stopStamp[target] !== stopStampValue) {
              stopStamp[target] = stopStampValue;
              next.push(target);
            }
          }
        }
      }

      /*
       * The next round starts from everything that changed: the stops a route reached **and** the
       * stops a short walk reached. An earlier version carried only the walking ones, so a journey
       * could take one route and then only continue on foot.
       */
      marked = next.length > 0 ? improved.concat(next) : improved;
      void reached;
    }

    return best[destination] === INF ? null : { seconds: best[destination], stop: destination };
  }

  return { search, patternCount, minTransferSeconds, stats };
}
