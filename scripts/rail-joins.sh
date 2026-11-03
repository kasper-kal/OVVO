#!/usr/bin/env bash
# Every join on the rail, checked by script rather than by eye.
#
# Playwright's browser needs its libraries from this workspace's own folder; without them Chromium exits
# with "libnspr4.so: cannot open shared object file" and the check looks like a code failure.
set -euo pipefail
cd "$(dirname "$0")/.."

LIBS="${PLAYWRIGHT_LIBS:-$HOME/libs/usr/lib/x86_64-linux-gnu}"
if [ -d "$LIBS" ]; then
  export LD_LIBRARY_PATH="$LIBS${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi

node scripts/rail-joins.mjs
python3 scripts/rail-joins.py
