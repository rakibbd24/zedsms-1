#!/usr/bin/env bash
# Build a self-contained copy of the site in .next/standalone — the folder the VPS runs
# (see README → Deploy). Needs Node 20.9+ and .env.production.local (or .env.local) with
# the NEXT_PUBLIC_* values: they're baked in at build time.
set -euo pipefail
cd "$(dirname "$0")/.."

npm ci
npm run build

# `output: "standalone"` leaves out static files on purpose — copy them in next to server.js
cp -r public .next/standalone/
mkdir -p .next/standalone/.next
rm -rf .next/standalone/.next/static
cp -r .next/static .next/standalone/.next/

echo "Ready: cd .next/standalone && PORT=3005 HOSTNAME=127.0.0.1 node server.js"
