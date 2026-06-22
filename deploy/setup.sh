#!/usr/bin/env bash
#
# One-shot server bootstrap for the Brainotix site on Ubuntu (AWS Lightsail).
# Run from inside the project directory AFTER cloning/uploading the code:
#
#     bash deploy/setup.sh
#
# It installs Node 20 + git + nginx, installs npm deps, builds the assets,
# creates .env from the template, and starts the app under PM2.
#
set -euo pipefail

echo "==> [1/5] Installing system packages (Node 20, git, nginx)…"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo apt-get install -y git nginx

echo "==> [2/5] Installing npm dependencies…"
npm install

echo "==> [3/5] Building CSS + image assets…"
npm run build

echo "==> [4/5] Preparing environment file…"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "    Created .env from template — you MUST edit it with your SMTP credentials."
fi

echo "==> [5/5] Starting app with PM2…"
if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi
pm2 start deploy/ecosystem.config.js 2>/dev/null || pm2 restart brainotix
pm2 save

cat <<'NEXT'

============================================================
 App is running on http://127.0.0.1:3000 (behind Nginx soon)
 Next steps:
   1) Add your email creds:   nano .env   ->   pm2 restart brainotix
   2) Enable auto-start:      pm2 startup systemd   (run the line it prints)
   3) Configure Nginx:
        sudo cp deploy/nginx-brainotix.conf /etc/nginx/sites-available/brainotix
        sudo nano /etc/nginx/sites-available/brainotix   # set your real domain
        sudo ln -s /etc/nginx/sites-available/brainotix /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        sudo nginx -t && sudo systemctl reload nginx
   4) Point DNS (A records) at your static IP, then enable HTTPS:
        sudo apt install -y certbot python3-certbot-nginx
        sudo certbot --nginx -d brainotix.com -d www.brainotix.com
 Full guide: DEPLOY-LIGHTSAIL.md
============================================================
NEXT
