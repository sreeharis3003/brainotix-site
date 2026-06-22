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

echo "==> [1/6] Installing system packages (Node 20, git, nginx)…"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo apt-get install -y git nginx

echo "==> [2/6] Checking memory / swap…"
# On low-memory instances (e.g. the $5 / 512 MB plan) add a 1 GB swap file so the
# build step (sharp image processing + Tailwind) doesn't get OOM-killed.
TOTAL_MEM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
if [ "${TOTAL_MEM_KB:-0}" -lt 1100000 ] && [ ! -f /swapfile ]; then
  echo "    Low memory detected (~$((TOTAL_MEM_KB/1024)) MB) — creating a 1 GB swap file…"
  sudo fallocate -l 1G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=1024
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
else
  echo "    Memory OK or swap already present — skipping."
fi

echo "==> [3/6] Installing npm dependencies…"
npm install

echo "==> [4/6] Building CSS + image assets…"
npm run build

echo "==> [5/6] Preparing environment file…"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "    Created .env from template — you MUST edit it with your SMTP credentials."
fi

echo "==> [6/6] Starting app with PM2…"
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
