#!/usr/bin/env bash
# Make a real browser runnable in this VM, without root.
#
# The Cloud VM is Ubuntu 24.04 with no desktop libraries and no fonts. Chromium needs fifteen of
# them, so `npx playwright install` succeeds and then the binary dies on a missing `.so`. This
# unpacks the exact packages into `$HOME/syslibs` and points Chromium at them, which is enough to
# run the sweeps in `scripts/look.mjs`. Nothing here touches the system.
#
#   npm run browser:deps
#   npx playwright install chromium-headless-shell
#   node scripts/look.mjs --selftest
#
# The packages are taken from the Ubuntu **release** pocket, not from the newest build in the pool:
# the newest `libasound2t64` is built against glibc 2.43 and this machine has 2.39, so it loads and
# then dies with `version 'GLIBC_2.43' not found`. Each library is checked against the local glibc
# before it is trusted, and the check is the reason this script is not a one-liner.
set -euo pipefail

LIBS="${LOOK_SYSLIBS:-$HOME/syslibs}"
POOL="http://archive.ubuntu.com/ubuntu/pool/main"
GLIBC="$(ldd --version | head -1 | grep -o '2\.[0-9][0-9]*$')"
mkdir -p "$LIBS" /tmp/ovvo-debs

# pool path, package name
PACKAGES=(
  "libx/libxcomposite libxcomposite1"
  "libx/libxdamage libxdamage1"
  "libx/libxfixes libxfixes3"
  "libx/libxrandr libxrandr2"
  "libx/libxres libxres1"
  "libx/libxi libxi6"
  "libx/libxrender libxrender1"
  "libx/libxkbcommon libxkbcommon0"
  "a/alsa-lib libasound2t64"
  "a/at-spi2-core libatk1.0-0t64"
  "a/at-spi2-core libatk-bridge2.0-0t64"
  "a/at-spi2-core libatspi2.0-0t64"
  "n/nspr libnspr4"
  "n/nss libnss3"
  "f/fonts-dejavu fonts-dejavu-core"
)

needs_glibc() { # print the highest GLIBC_x.y a shared object asks for
  strings "$1" 2>/dev/null | grep -o 'GLIBC_2\.[0-9][0-9]*' | sort -V | tail -1
}

for entry in "${PACKAGES[@]}"; do
  read -r pool pkg <<<"$entry"
  # Newest first, then the first one whose glibc demand this machine can satisfy.
  for file in $(curl -s "$POOL/$pool/" | grep -o "${pkg}_[^\"]*_\(amd64\|all\)\.deb" | sort -V -u | tac); do
    deb="/tmp/ovvo-debs/$file"
    [ -f "$deb" ] || curl -s -o "$deb" "$POOL/$pool/$file"
    rm -rf /tmp/ovvo-unpack && mkdir -p /tmp/ovvo-unpack
    dpkg-deb -x "$deb" /tmp/ovvo-unpack 2>/dev/null || continue
    bad=""
    for so in /tmp/ovvo-unpack/usr/lib/x86_64-linux-gnu/*.so*; do
      [ -f "$so" ] || continue
      need="$(needs_glibc "$so")"
      [ -n "$need" ] || continue
      if [ "$(printf '%s\n%s\n' "$need" "$GLIBC" | sort -V | tail -1)" != "$GLIBC" ]; then bad="$need"; break; fi
    done
    if [ -n "$bad" ]; then continue; fi
    cp -a /tmp/ovvo-unpack/. "$LIBS/"
    echo "ok   $pkg  $(basename "$file")"
    break
  done
done

# Chromium will not repaint a page without a fontconfig file and at least one font.
mkdir -p "$LIBS/etc/fonts" "$HOME/.cache/fontconfig"
cat >"$LIBS/etc/fonts/fonts.conf" <<EOF
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>/usr/share/fonts</dir>
  <dir>$LIBS/usr/share/fonts</dir>
  <cachedir>$HOME/.cache/fontconfig</cachedir>
</fontconfig>
EOF

cat >"$LIBS/env.sh" <<EOF
export LD_LIBRARY_PATH="$LIBS/usr/lib/x86_64-linux-gnu"
export FONTCONFIG_FILE="$LIBS/etc/fonts/fonts.conf"
EOF

BIN="$(ls -d "$HOME"/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1 || true)"
if [ -n "$BIN" ]; then
  missing="$(LD_LIBRARY_PATH="$LIBS/usr/lib/x86_64-linux-gnu" ldd "$BIN" | awk '/not found/{print $1}' | sort -u)"
  if [ -n "$missing" ]; then
    echo "still missing: $missing" >&2
    exit 1
  fi
  echo "chromium can load: $(basename "$(dirname "$(dirname "$BIN")")")"
else
  echo "libraries ready; run: npx playwright install chromium-headless-shell" >&2
fi

echo
echo "use it:   source $LIBS/env.sh && node scripts/look.mjs --selftest"
