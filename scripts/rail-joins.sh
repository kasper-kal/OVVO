#!/usr/bin/env bash
# Every join on the rail, checked by script rather than by eye.
#
# Playwright's browser needs its libraries from this workspace's own folder; without them Chromium exits
# with "libnspr4.so: cannot open shared object file" and the check looks like a code failure. The server
# is started here when nothing answers, so the check runs before a deploy and not only while a dev
# server happens to be up.
set -euo pipefail
cd "$(dirname "$0")/.."

LIBS="${PLAYWRIGHT_LIBS:-$HOME/libs/usr/lib/x86_64-linux-gnu}"
if [ -d "$LIBS" ]; then
  export LD_LIBRARY_PATH="$LIBS${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi

BASE="${BASE_URL:-http://127.0.0.1:4180}"
SERVER=""
if ! curl -sf -o /dev/null "$BASE/"; then
  npx vite preview --port 4180 --strictPort --host 127.0.0.1 > /tmp/rail-joins-preview.log 2>&1 &
  SERVER=$!
  trap 'kill "$SERVER" 2>/dev/null || true' EXIT
  for _ in $(seq 1 30); do
    sleep 1
    curl -sf -o /dev/null "$BASE/" && break
  done
fi

BASE_URL="$BASE" node scripts/rail-joins.mjs
python3 scripts/rail-joins.py
