/**
 * **A round-based search over routes, labelled by station rather than by platform.**
 *
 * The connection scan reads every connection in the window, which is the whole free budget. This
 * search stands at stations it has actually reached, takes the first departures it can catch on the
 * routes serving them, and jumps along those routes. Routes it never touches cost nothing.
 *
 * It labels **stations**, because a traveller asks for Utrecht Centraal, not for platform 18. All the
 * platforms of a station share one arrival time, so the whole station is reached at once and no walk
 * is charged for changing platform. Labelling platforms separately was both wrong and slow: wrong
 * because a change of train at a station was never expanded from the other platforms, and slow
 * because the same work was repeated for every platform of a busy station.
 *
 * What it does not do yet: more than one journey (k-best), "arrive by", step-free routing, bicycle
 * carriage. Nothing claims those until they are built and tested.
 */

const INF = 2 ** 30;

/**
 * @param {object} graph
 * @param {Buffer|Uint8Array} graph.patternsBuffer
 * @param {Buffer|Uint8Array} graph.indexBuffer
 * @param {number[][]} graph.stations          platform stop indices per station
 * @param {Uint32Array} graph.stationOf        station index of every stop
 * @param {number[][]} graph.places            station indices per place (one physical station)
 * @param {Uint32Array} graph.placeOf          place index of every station
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

  /* Walking links, grouped by the stop they leave from. Same-station platforms are not walks. */
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

  const stations = graph.stations;
  const stationOf = graph.stationOf;
  const places = graph.places;
  const placeOf = graph.placeOf;
  const placeCount = places.length;

  /*
   * A place is one physical station: the feed can split Groningen's platforms over several station
   * groups, and a journey must be allowed to leave from, or arrive at, any of them. Flattening the
   * platforms of a place once keeps the inner loop simple.
   */
  const placePlatforms = places.map((members) => {
    const platforms = [];
    for (const station of members) for (const platform of stations[station]) platforms.push(platform);
    return platforms;
  });
  const placeOfStop = new Uint32Array(graph.stopCount);
  for (let stop = 0; stop < graph.stopCount; stop += 1) placeOfStop[stop] = placeOf[stationOf[stop]];
  const minTransferSeconds = graph.minTransferSeconds ?? 120;
  const maxRounds = graph.maxRounds ?? 5;
  const tripCandidates = graph.tripCandidates ?? 3;

  const stationBest = new Int32Array(placeCount);
  const patternStamp = new Int32Array(patternCount);
  const stationStamp = new Int32Array(placeCount);
  let stampValue = 0;
  let stationStampValue = 0;

  const stats = {
    patternsScanned: 0,
    tripsExamined: 0,
    stationsImproved: 0,
    roundsUsed: 0,
    walksRelaxed: 0,
    stationsVisited: 0,
  };

  function search(originStation, destinationStation, startTime, rounds = maxRounds) {
    for (const key of Object.keys(stats)) stats[key] = 0;

    stationBest.fill(INF);
    stationBest[originStation] = startTime;
    let destinationBest = INF;

    let marked = [originStation];

    for (let round = 0; round < rounds && marked.length > 0; round += 1) {
      stampValue += 1;
      stats.roundsUsed += 1;
      marked.sort((a, b) => stationBest[a] - stationBest[b]);

      stationStampValue += 1;
      const improved = [];

      const improve = (station, time) => {
        if (time >= stationBest[station]) return;
        stationBest[station] = time;
        stats.stationsImproved += 1;
        if (station === destinationStation && time < destinationBest) destinationBest = time;
        if (stationStamp[station] !== stationStampValue) {
          stationStamp[station] = stationStampValue;
          improved.push(station);
        }
      };

      for (const station of marked) {
        stats.stationsVisited += 1;
        const ready = stationBest[station] + minTransferSeconds;
        if (ready >= destinationBest) break;

        for (const platform of placePlatforms[station]) {
          for (let entry = indexStart[platform]; entry < indexStart[platform + 1]; entry += 1) {
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

            /* The first trip that could possibly be caught here. */
            const earliestPossible = ready - largestAtPosition[position];
            let low = 0;
            let high = tripCount;
            while (low < high) {
              const middle = (low + high) >> 1;
              if (deps[middle] < earliestPossible) low = middle + 1;
              else high = middle;
            }

            /*
             * The first catchable trip and the next few after it: a stopper that leaves first can be
             * overtaken by an express, and taking only the first one lost real journeys.
             */
            let considered = 0;
            for (let trip = low; trip < tripCount && considered < tripCandidates; trip += 1) {
              stats.tripsExamined += 1;
              const departure = deps[trip];
              if (departure + offsets[trip * stopCount + position] < ready) continue;
              considered += 1;

              for (let ahead = position + 1; ahead < stopCount; ahead += 1) {
                const time = departure + offsets[trip * stopCount + ahead];
                if (time >= destinationBest) break;
                improve(placeOfStop[stops[ahead]], time);
              }
            }
          }
        }
      }

      /* Walking between nearby stops of *different* stations. */
      const next = [];
      stationStampValue += 1;
      for (const station of improved) {
        if (stationBest[station] + 60 >= destinationBest) continue;
        for (const platform of placePlatforms[station]) {
          for (let link = walkStart[platform]; link < walkStart[platform + 1]; link += 1) {
            const candidate = stationBest[station] + walkTime[link];
            const targetStation = placeOfStop[walkTarget[link]];
            if (candidate < stationBest[targetStation]) {
              improve(targetStation, candidate);
              stats.walksRelaxed += 1;
              if (stationStamp[targetStation] !== stationStampValue) {
                stationStamp[targetStation] = stationStampValue;
                next.push(targetStation);
              }
            }
          }
        }
      }

      marked = next.length > 0 ? improved.concat(next) : improved;
    }

    return destinationBest === INF ? null : { seconds: destinationBest, station: destinationStation };
  }

  return { search, patternCount, minTransferSeconds, stats };
}
