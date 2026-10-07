#!/usr/bin/env bash
# Build a self-contained copy of the site in .next/standalone — the folder the VPS runs
# (see README → Deploy). Needs Node 20.9+ and .env.production.local (or .env.local) with
# the NEXT_PUBLIC_* values: they're baked in at build time.
set -euo pipefail
cd "$(dirname "$0")/.."

npm ci
# `output: "standalone"` leaves out static files on purpose — the postbuild step in
# package.json copies public/ and .next/static/ in next to server.js
npm run build

echo "Ready: cd .next/standalone && PORT=3005 HOSTNAME=127.0.0.1 node server.js"
