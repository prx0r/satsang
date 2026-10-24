#!/bin/sh
# Recreates the screenshot toolchain in /tmp (wiped between sessions): puppeteer-core + Playwright's Chromium 130 + 5 missing libs.
set -e
[ -x "$HOME/.cache/ms-playwright/chromium-1140/chrome-linux/chrome" ] || { pip install -q playwright==1.48.0 && python3 -m playwright install chromium; }
mkdir -p /tmp/smoke /tmp/libs && cd /tmp/smoke && [ -d node_modules/puppeteer-core ] || { npm init -y >/dev/null; npm i puppeteer-core@23 >/dev/null 2>&1; }
cd /tmp/libs && B=https://deb.debian.org/debian/pool/main
for f in a/at-spi2-core/libatk-bridge2.0-0t64_2.56.2-1+deb13u2_arm64.deb a/at-spi2-core/libatk1.0-0t64_2.56.2-1+deb13u2_arm64.deb a/at-spi2-core/libatspi2.0-0t64_2.56.2-1+deb13u2_arm64.deb libx/libxcomposite/libxcomposite1_0.4.6-1+b2_arm64.deb libx/libxdamage/libxdamage1_1.1.6-1+b2_arm64.deb; do [ -f "$(basename $f)" ] || curl -sO $B/$f; dpkg-deb -x "$(basename $f)" root; done
printf '#!/bin/sh\nexport LD_LIBRARY_PATH=/tmp/libs/root/usr/lib/aarch64-linux-gnu\nexec %s/.cache/ms-playwright/chromium-1140/chrome-linux/chrome "$@"\n' "$HOME" > /tmp/chromium && chmod +x /tmp/chromium
/tmp/chromium --version
