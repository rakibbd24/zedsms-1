#!/usr/bin/env bash
# Build and go live on the VPS (run by .github/workflows/deploy.yml, or by hand as the cPanel user).
# The site keeps serving the previous build while this one compiles: PM2 runs a copy in .live/,
# which is only swapped for the new build once it succeeds — a failed build changes nothing.
set -euo pipefail
cd "$(dirname "$0")/.."

./scripts/build-standalone.sh

rm -rf .live.new .live.old
cp -r .next/standalone .live.new
if [ -d .live ]; then mv .live .live.old; fi
mv .live.new .live
# start fresh from ecosystem.config.cjs so cwd/PORT/HOSTNAME always come from that file —
# `restart --update-env` would pick up the login shell's HOSTNAME=server1... and bind off localhost
pm2 delete zedsms-web >/dev/null 2>&1 || true
pm2 start ecosystem.config.cjs
pm2 save
rm -rf .live.old

# fail the deploy (red in GitHub Actions) if the site doesn't answer on the port Apache proxies to
for _ in $(seq 1 15); do
  curl -sf -o /dev/null http://127.0.0.1:3005/ && break
  sleep 2
done
curl -sf -o /dev/null http://127.0.0.1:3005/ || { echo "zedsms-web is not answering on 127.0.0.1:3005" >&2; exit 1; }

echo "Deployed $(git rev-parse --short HEAD)"
