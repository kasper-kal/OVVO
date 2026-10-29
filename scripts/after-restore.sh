#!/usr/bin/env bash
#
# **Everything a restored workspace is missing, put back in one command.**
#
# A restore keeps the files and throws away everything that is not in the repository: the app's
# `node_modules`, the built `dist/`, the Chromium the browser checks drive, the system libraries
# Chromium needs and cannot be given for lack of root, the copy of the app's font those checks
# measure text with, and anything that was running. This puts all of it back and leaves the dev
# server listening on the port the preview uses.
#
#   bash scripts/after-restore.sh pv-<workspace-id>.style.dev
#   PREVIEW_HOST=pv-<workspace-id>.style.dev bash scripts/after-restore.sh
#   bash scripts/after-restore.sh          # localhost only, when there is no preview hostname
#
# Every step checks before it acts, so running it on a workspace that is already up prints what it
# found, starts nothing twice, and changes nothing. It is the wrapper that gets the machine to the
# point where the other scripts mean something: the launching is `scripts/dev-preview.sh` and the
# browser's libraries are `scripts/browser-env.sh` (which is also what a browser check sources by
# hand, so the exports it needs are set here too).
#
# Nothing is written into the repository. The preview hostname changes on every restore, so it is
# passed in (or pinned in the untracked `.env.local`, which Vite reads itself and which this script
# then does not have to know about).
set -uo pipefail

cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"
HOSTNAME_ARG="${1:-${PREVIEW_HOST:-}}"
LOG=".logs/dev.log"
PIDFILE=".logs/dev.pid"
BROWSERS="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"
SHELL_BIN_GLOB="$BROWSERS/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell"

mkdir -p .logs

step() { printf '\n== %s\n' "$1"; }
ok()   { printf '   ok      %s\n' "$1"; }
did()  { printf '   done    %s\n' "$1"; }
warn() { printf '   warn    %s\n' "$1"; }
die()  { printf '   FAILED  %s\n' "$1" >&2; exit 1; }

listening() { ss -ltnH "sport = :$PORT" 2>/dev/null | grep -q .; }
listener_pid() { ss -ltnpH "sport = :$PORT" 2>/dev/null | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -1; }

printf 'OVVO after a restore: putting back dependencies, the browser, its libraries and the server.\n'

# ---------------------------------------------------------------------------- the toolchain
step 'the toolchain'
command -v node >/dev/null 2>&1 || die 'node is not on PATH'
command -v npm  >/dev/null 2>&1 || die 'npm is not on PATH'
ok "node $(node --version), npm $(npm --version)"

# ------------------------------------------------------------------- the app dependencies
# `node_modules/.bin/vite` is the sentinel, the same way `browser-env.sh` uses one library: a
# directory that exists but is half-populated is the fault this is here to catch, and the lockfile
# is the source of truth for what goes in it.
step 'the app dependencies'
if [ -x node_modules/.bin/vite ]; then
  ok 'node_modules is already there'
else
  if [ -f package-lock.json ]; then
    npm ci || die 'npm ci failed (the lockfile decides the versions; do not edit it to get past this)'
    did 'installed with npm ci, from package-lock.json'
  else
    npm install || die 'npm install failed'
    did 'installed with npm install (there is no lockfile)'
  fi
  [ -x node_modules/.bin/vite ] || die 'vite is still missing after installing'
fi
[ -d node_modules/playwright ] || warn 'playwright is not installed: the browser checks cannot run'

# ------------------------------------------------------------------- the built app
# `dist/` is ignored by git, so a restore can take it while two checks read it straight off the disk
# (`scripts/install-audit.mjs` reads `dist/manifest.json`, `scripts/old-phone-check.mjs` reads
# `dist/assets`). `npm run verify` builds its own, so this is for a check run on its own.
step 'the built app'
if [ -f dist/index.html ]; then
  ok 'dist/ is already built'
else
  npm run build >/dev/null 2>&1 || die 'the build failed (run npm run build by hand to see why)'
  did 'built into dist/'
fi

# ------------------------------------------------------------------- the browser it drives
step 'the browser the checks drive'
if compgen -G "$BROWSERS/chromium-*" >/dev/null || compgen -G "$BROWSERS/chromium_headless_shell-*" >/dev/null; then
  ok "Chromium is already in $BROWSERS"
else
  npx playwright install chromium || die 'playwright could not fetch Chromium'
  did "Chromium fetched into $BROWSERS"
fi

# ------------------------------------------------------------- the libraries it needs
# No root here, so these are unpacked into $HOME/syslibs as .deb files and pointed at with
# `LD_LIBRARY_PATH` (see `scripts/browser-env.sh`). Sourcing it also exports the font config the
# browser needs to repaint at all, which is what makes the version check below an honest test.
step "Chromium's system libraries"
if [ -e "$HOME/syslibs/usr/lib/x86_64-linux-gnu/libcups.so.2" ]; then
  ok "the libraries are unpacked in $HOME/syslibs"
else
  bash scripts/browser-env.sh >/dev/null 2>&1 || die 'the libraries could not be fetched (run scripts/browser-env.sh by hand to see why)'
  did 'the libraries were unpacked into $HOME/syslibs'
fi
# shellcheck source=/dev/null
source scripts/browser-env.sh >/dev/null 2>&1
SHELL_BIN="$(ls $SHELL_BIN_GLOB 2>/dev/null | head -1)"
if [ -n "$SHELL_BIN" ]; then
  BROWSER_VERSION="$("$SHELL_BIN" --version 2>/dev/null)" || die 'the browser will not start: a library or the font config is still missing'
  ok "$BROWSER_VERSION starts, with LD_LIBRARY_PATH and FONTCONFIG_FILE exported"
else
  warn 'no headless shell to test with'
fi

# ------------------------------------------------------------------- the font copy
# A browser check that measures text or takes a picture has to be in the app's own font, and this VM
# has no working DNS to ask Google Fonts for it, so `scripts/font-guard.mjs` keeps a copy. The step
# is a warning rather than a failure because it needs the network once, and nothing else here does.
step "the copy of the app's font the browser checks measure text with"
if timeout 45 node -e "import('./scripts/font-guard.mjs').then((m) => m.localFontCss())" >/dev/null 2>&1; then
  ok 'the font stylesheet is cached for the browser checks'
else
  warn 'no cached font copy: a check that measures text will throw until one can be fetched (needs the network once)'
fi

# ------------------------------------------------------------------- the dev server
step "the dev server on port $PORT"
if listening; then
  ok "something is already listening (pid $(listener_pid)) and it is being left alone"
else
  if [ -n "$HOSTNAME_ARG" ]; then
    setsid nohup bash scripts/dev-preview.sh "$HOSTNAME_ARG" >"$LOG" 2>&1 </dev/null &
  else
    warn 'no preview hostname given, so the server is started localhost-friendly only (pass one, or pin PREVIEW_HOST in .env.local)'
    setsid nohup node_modules/.bin/vite --host 0.0.0.0 --port "$PORT" >"$LOG" 2>&1 </dev/null &
  fi
  for _ in $(seq 1 60); do
    listening && break
    sleep 0.5
  done
  listening || die "nothing came up on $PORT (see $LOG)"
  echo "$(listener_pid)" >"$PIDFILE"
  did "started, log in $LOG, pid in $PIDFILE"
fi

# ------------------------------------------------------------------- is it really there
step 'the app answering'
if [ -n "$HOSTNAME_ARG" ]; then
  CODE="$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $HOSTNAME_ARG" "http://127.0.0.1:$PORT/")"
else
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/")"
fi
if [ "$CODE" = '200' ]; then
  ok "200 for ${HOSTNAME_ARG:-localhost:3000}"
elif [ "$CODE" = '403' ]; then
  die "403 for $HOSTNAME_ARG. The server that is running was started with a different hostname, so stop it (kill $(listener_pid)) and run this again."
else
  die "the server answered $CODE (see $LOG)"
fi

printf '\nReady. Everything a restore removes is back:\n'
printf '  the app        http://0.0.0.0:%s  (log %s, pid %s)\n' "$PORT" "$LOG" "$PIDFILE"
printf '  the browser    %s\n' "${BROWSER_VERSION:-already present}"
printf '\nFor a browser check in this shell, the exports it needs are set by:\n'
printf '  source scripts/browser-env.sh\n'
printf 'and on a VM with no external DNS, add the host-resolver rules from the README, so the\n'
printf 'blocking Google font request cannot hang a page load:\n'
printf '  NODE_OPTIONS=--dns-result-order=ipv4first ...   # see README, "Dev-only checks"\n'
printf '\nThe one thing a shell script cannot do is show the app in the Browser panel: ask for the\n'
printf 'preview tool after this, or open the address yourself.\n'
