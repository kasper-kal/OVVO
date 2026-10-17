#!/usr/bin/env bash
# Start the dev server with this VM's private preview hostname allowed.
#
# Vite blocks requests whose Host header is not localhost/an IP unless the host
# is whitelisted. The preview hostname changes whenever the workspace is
# restored, so it is passed in at launch instead of being written into the repo:
#
#   ./scripts/dev-preview.sh pv-<id>.style.dev
#
# Preview hostname changes after a restore — re-run with the current one.
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
exec vite --host 0.0.0.0 --port "$PORT"
