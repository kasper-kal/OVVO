#!/usr/bin/env bash
# Start the dev server with this VM's private preview hostname allowed.
#
# Vite blocks requests whose Host header is not localhost/an IP unless the host
# is whitelisted. The preview hostname changes whenever the workspace is
# restored, so it is passed in at launch instead of being written into the repo:
#
#   ./scripts/dev-preview.sh pv-<id>.style.dev
#
# Preview hostname changes after a restore — re-run with the current one, or pin it once in
# `.env.local` (`PREVIEW_HOST=pv-<id>.style.dev`, ignored by git) and use plain `npm run dev`:
# `vite.config.ts` reads that file too. This script keeps working for a one-off launch without
# touching the file, and it wins over it because the environment is checked first.
#
# REVIEW_BATCH=<name> chooses which folder under review/ the review dot saves into
# (default: desktop; REVIEW_BATCH=mobile writes to the archived phone batch).
#
# BUILT=1 serves the **built** app instead of the dev server:
#
#   PORT=3001 BUILT=1 ./scripts/dev-preview.sh pv-<id>.style.dev
#
# Same screens, same data, one difference that matters when judging speed: the dev server
# ships unminified React with the development runtime, and a route change there costs four to
# eight times what it costs in the build (measured: /stops took 105ms at normal CPU and 607ms on
# a 6x-throttled CPU in dev, against 23ms and 157ms built). The build has no `#/skeleton` lab —
# that route is `import.meta.env.DEV` — so the dev server stays the one for judging shapes.
set -euo pipefail

HOSTNAME_ARG="${1:-}"
PORT="${PORT:-3000}"

if [ -z "$HOSTNAME_ARG" ]; then
  echo "usage: $0 <preview-hostname>   (e.g. pv-abc123.style.dev)" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

# Run the locally installed Vite. Invoking this script with bash (rather than
# through an npm script) does not put node_modules/.bin on PATH, so `exec vite`
# used to fail with "vite: not found".
export PATH="$PWD/node_modules/.bin:$PATH"
export PREVIEW_HOST="$HOSTNAME_ARG"

if [ "${BUILT:-0}" = "1" ]; then
  # One build, then the built files. Re-run this command after changing source.
  vite build
  exec vite preview --host 0.0.0.0 --port "$PORT"
fi

exec vite --host 0.0.0.0 --port "$PORT"
