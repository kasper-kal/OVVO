/**
 * **The journey search, in one place.**
 *
 * Connection scan, over connections sorted by departure time. Given an origin, a destination and a
 * departure time, it finds the earliest arrival, honouring a minimum transfer time and walking links
 * between nearby stops.
 *
 * This lives here, in plain JavaScript, for two reasons: the feasibility experiment and the graph
 * builder must agree about what a search is, and step 2 ports this exact behaviour into the app's
 * Worker. Two copies would drift, and a drift would show up as a journey that is real in one place
 * and invented in the other.
 *
 * Deliberately *not* here yet: k-best journeys, "arrive by" (it is this scan run backwards over
 * arrival-sorted connections), step-free routing, bicycle carriage. None of them are claimed
 * anywhere until they are implemented and tested.
 */

/**
 * @param {object} graph
 * @param {Uint32Array} graph.from     departure stop of each connection
 * @param {Uint32Array} graph.to       arrival stop of each connection
 * @param {Uint32Array} graph.dep      departure time, seconds
 * @param {Uint32Array} graph.arr      arrival time, seconds
 * @param {Uint32Array} graph.trip     which trip the connection belongs to
 * @param {Uint32Array} graph.walkFrom stops with a walking link
 * @param {Uint32Array} graph.walkTo
 * @param {Uint16Array} graph.walkSeconds
 * @param {number} graph.stopCount
 * @param {number} graph.tripCount
 * @param {number} [graph.minTransferSeconds]
 */
export function createScanner(graph) {
  const { from, to, dep, arr, trip, walkFrom, walkTo, walkSeconds, stopCount, tripCount } = graph;
  const minTransferSeconds = graph.minTransferSeconds ?? 120;
  const EARLIEST = 0;
  const INF = 2 ** 30;

  /* Scratch buffers, reused between searches: allocating three arrays per request is spent
   * processor time, and on a free function that is the budget. */
  const arrival = new Int32Array(stopCount);
  const tripArrival = new Int32Array(tripCount);

  /**
   * @returns {{ seconds: number, stop: number } | null} earliest arrival, or null if unreachable
   */
  function search(origin, destination, startTime, windowSeconds = 24 * 3600) {
    arrival.fill(INF);
    tripArrival.fill(INF);
    arrival[origin] = startTime;

    /*
     * The scan and the walking links alternate until neither improves anything. Walking applied
     * only after the scan is wrong rather than slow: a station's platforms are separate stops, so a
     * journey beginning on one platform could never board a train leaving from another.
     */
    for (let pass = 0; pass < 4; pass += 1) {
      let changed = false;

      for (let index = EARLIEST; index < dep.length; index += 1) {
        if (dep[index] < startTime) continue;
        /* Nothing departing after the best arrival can arrive earlier, so stop reading. */
        if (dep[index] > arrival[destination]) break;
        if (dep[index] > startTime + windowSeconds) break;

        const tripNumber = trip[index];
        const ready = tripArrival[tripNumber] !== INF
          ? tripArrival[tripNumber]
          : arrival[from[index]] + minTransferSeconds;

        if (ready <= dep[index] && arr[index] < arrival[to[index]]) {
          arrival[to[index]] = arr[index];
          tripArrival[tripNumber] = arr[index];
          changed = true;
        }
      }

      for (let k = 0; k < walkFrom.length; k += 1) {
        const candidate = arrival[walkFrom[k]] + walkSeconds[k];
        if (candidate < arrival[walkTo[k]]) {
          arrival[walkTo[k]] = candidate;
          changed = true;
        }
      }

      if (!changed) break;
    }

    return arrival[destination] === INF ? null : { seconds: arrival[destination], stop: destination };
  }

  return { search, minTransferSeconds };
}
