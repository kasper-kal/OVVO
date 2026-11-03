#!/usr/bin/env bash
# Screenshots and their verdict, from one run: see the note at the top of scripts/screen.mjs.
# The browser needs this workspace's own libraries, and a built copy of the site has to be answering,
# so both are arranged here rather than remembered.
set -euo pipefail
cd "$(dirname "$0")/.."

LIBS="${PLAYWRIGHT_LIBS:-$HOME/libs/usr/lib/x86_64-linux-gnu}"
if [ -d "$LIBS" ]; then
  export LD_LIBRARY_PATH="$LIBS${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi

BASE="${BASE_URL:-http://127.0.0.1:4181}"
if ! curl -sf -o /dev/null "$BASE/"; then
  npx vite preview --port 4181 --strictPort --host 127.0.0.1 > /tmp/screen-preview.log 2>&1 &
  SERVER=$!
  trap 'kill "$SERVER" 2>/dev/null || true' EXIT
  for _ in $(seq 1 30); do
    sleep 1
    curl -sf -o /dev/null "$BASE/" && break
  done
fi

BASE_URL="$BASE" node scripts/screen.mjs "$@"
