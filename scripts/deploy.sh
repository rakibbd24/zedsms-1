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
pm2 restart zedsms-web --update-env
rm -rf .live.old

echo "Deployed $(git rev-parse --short HEAD)"
