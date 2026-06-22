#!/usr/bin/env bash
#
# Redeploy the latest version. Run from the project directory on the server:
#
#     bash deploy/update.sh
#
set -euo pipefail

echo "==> Pulling latest code…"
git pull

echo "==> Installing dependencies (if changed)…"
npm install

echo "==> Rebuilding CSS + assets…"
npm run build

echo "==> Restarting app…"
pm2 restart brainotix

echo "==> Done. Live logs:  pm2 logs brainotix"
