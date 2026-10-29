#!/usr/bin/env bash
# The audit and the screenshot probes drive a real Chromium, and a restored sandbox has no
# system libraries: Playwright's headless shell exits 127 with "libnspr4.so: cannot open
# shared object file". There is no root here (`sudo` is refused: "no new privileges"), so the
# libraries are fetched as .deb packages and unpacked into $HOME/syslibs instead, and the
# browser is pointed at them with LD_LIBRARY_PATH.
#
# Usage:  source scripts/browser-env.sh     # exports LD_LIBRARY_PATH
#         bash   scripts/browser-env.sh     # installs them if missing
#
# The list is what `ldd chrome-headless-shell | grep 'not found'` asks for, plus the two the
# first round of those libraries in turn needed (libXi, libXrender). Re-run `ldd` after
# installing to see whether anything else is missing.
#
# The browser also dies on the first repaint without fontconfig — `FATAL: SkFontMgr_
# FontConfigInterface.cpp:163 Not implemented.` — so a fontconfig configuration and one font
# family come along too, and `FONTCONFIG_FILE` points at the one written here (there is no
# /etc/fonts to write to).
set -u

: "${HOME:?}"
SYSLIBS="$HOME/syslibs"
# Where this script lives, so the packages can also be kept inside the workspace (see `install_libs`).
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# The copy that survives a restore: `$HOME` is not part of the checkpointed state, the workspace is.
KEPT="$REPO/.logs/debs"
export LD_LIBRARY_PATH="$SYSLIBS/usr/lib/x86_64-linux-gnu:$SYSLIBS/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export FONTCONFIG_FILE="$SYSLIBS/fonts.conf"

PACKAGES=(
  libnspr4 libnss3
  libatk1.0-0t64 libatk-bridge2.0-0t64 libatspi2.0-0t64
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libxi6 libxrender1
  libasound2t64 libxkbcommon0
  # `libcups.so.2` is only needed by the *home* browser (`$H/pw-browsers/chromium-*/chrome`,
  # which the round probes in `$H/pw` launch); the project's headless shell never asks for it, so
  # the first version of this list did not have it and every check that used that browser died
  # with "error while loading shared libraries: libcups.so.2" — which reads like a test failure
  # and is a missing package.
  libcups2t64
  fontconfig-config fonts-dejavu-core
)

install_libs() {
  local dir cached
  dir="$(mktemp -d)"
  # The .debs are the durable half of this: apt's lists do not survive a restore and the VM has no
  # working DNS, so `apt-get download` fails with "Unable to locate package" long after the run
  # that fetched them. `$H/pw/debs` and `$H/pw/debs2` are where the home harness keeps what it
  # downloaded, so they are used when they are there and apt is only the fallback.
  for cached in "${HOME}/pw/debs" "${HOME}/pw/debs2" "$KEPT"; do
    [ -d "$cached" ] && cp "$cached"/*.deb "$dir/" 2>/dev/null
  done
  if ! ls "$dir"/*.deb >/dev/null 2>&1; then
    ( cd "$dir" && apt-get download "${PACKAGES[@]}" ) || return 1
  fi
  mkdir -p "$SYSLIBS"
  for deb in "$dir"/*.deb; do dpkg-deb -x "$deb" "$SYSLIBS/"; done
  # **A copy inside the workspace, because `$HOME` is not part of a restore.** A restored workspace
  # keeps the files in it and loses what is outside, and this VM has no working DNS to fetch these
  # packages again, so the copy is what makes this step rebuildable with no network at all. It lands
  # in `.logs/`, which `.gitignore` excludes: twenty megabytes of other people's binaries do not
  # belong in the repository.
  mkdir -p "$KEPT" && cp "$dir"/*.deb "$KEPT/" 2>/dev/null
  rm -rf "$dir"
}

if [ ! -e "$SYSLIBS/usr/lib/x86_64-linux-gnu/libcups.so.2" ]; then
  # The sentinel is one library rather than the directory: an earlier run created the directory
  # without `libcups`, and a directory test would refuse to add it forever after.
  echo "installing the browser's system libraries into $SYSLIBS …"
  install_libs || { echo "could not fetch them (no cached .debs, no network?)" >&2; exit 1; }
fi

if [ ! -f "$SYSLIBS/fonts.conf" ]; then
  cat > "$SYSLIBS/fonts.conf" <<EOF
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>$SYSLIBS/usr/share/fonts</dir>
  <cachedir>$HOME/.cache/fontconfig</cachedir>
  <include ignore_missing="yes">$SYSLIBS/etc/fonts/conf.d</include>
</fontconfig>
EOF
fi

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  shell_bin="$(ls "$HOME"/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)"
  if [ -n "$shell_bin" ]; then
    missing="$(ldd "$shell_bin" 2>/dev/null | grep -c 'not found')"
    echo "chrome-headless-shell: $missing library/libraries still missing"
    "$shell_bin" --version || exit 1
  fi
fi
