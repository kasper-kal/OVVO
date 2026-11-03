#!/usr/bin/env bash
# **Build the routing graph, but only from complete inputs.**
#
# A half-downloaded street map does not fail loudly in OTP: it fails as a puzzling parse error deep
# in the log, or worse, it builds a graph of half the country. So this waits until the PBF is the
# size the server promised and has stopped growing, checks the timetable the pipeline already
# validated, and only then builds. The result is `data/otp/graph.obj`; `data/logs/otp-build.done`
# or `.failed` says how it ended, and the whole run is in `data/logs/otp-build.log`.
set -u
cd "$(dirname "$0")/.." || exit 1
LOG=data/logs/otp-build.log
PBF=data/osm/netherlands-latest.osm.pbf
EXPECTED=${EXPECTED_PBF_BYTES:-1409687325}
mkdir -p data/otp data/logs
: > "$LOG"
echo "otp-build started $(date -Is)" >> "$LOG"

# 1. The street map: complete, and no longer growing.
last=0
for i in $(seq 1 240); do
  now=$(stat -c%s "$PBF" 2>/dev/null || echo 0)
  echo "pbf $now of $EXPECTED" >> "$LOG"
  if [ "$now" -eq "$EXPECTED" ] && [ "$now" -eq "$last" ]; then break; fi
  last=$now
  sleep 15
done
now=$(stat -c%s "$PBF" 2>/dev/null || echo 0)
if [ "$now" -ne "$EXPECTED" ]; then
  echo "FAIL street map is $now bytes, expected $EXPECTED" >> "$LOG"
  touch data/logs/otp-build.failed
  exit 1
fi

# 2. The timetable, as the pipeline left it.
if [ ! -f data/gtfs/current/stop_times.txt ]; then
  echo "FAIL no validated timetable in data/gtfs/current" >> "$LOG"
  touch data/logs/otp-build.failed
  exit 1
fi

# 3. Inputs OTP will actually look at: a copy named so OTP sees "gtfs" and ".zip", and the PBF.
rm -rf data/otp/inputs
mkdir -p data/otp/inputs
cp data/gtfs/incoming/gtfs-openov-nl.zip data/otp/inputs/nl.gtfs.zip
cp "$PBF" data/otp/inputs/netherlands.osm.pbf
echo "inputs staged $(date -Is)" >> "$LOG"

# 4. Build. -Xmx10G on a 16GB box leaves room for the OS and the page cache.
tools/jdk/bin/java -Xmx10G -jar tools/otp-shaded-2.10.0.jar --build --save data/otp >> "$LOG" 2>&1
status=$?
echo "otp-build finished $(date -Is) exit=$status" >> "$LOG"
if [ $status -eq 0 ] && [ -f data/otp/graph.obj ]; then
  ls -l data/otp/graph.obj >> "$LOG"
  touch data/logs/otp-build.done
else
  touch data/logs/otp-build.failed
fi
exit $status
