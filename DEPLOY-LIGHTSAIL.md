# Deploying Brainotix to AWS Lightsail — full walkthrough

This hosts the Node app (site + contact API) on a small always-on Ubuntu server,
behind Nginx, with a free auto-renewing SSL certificate and your custom domain.

**Architecture:** `Visitor → DNS → Nginx (ports 80/443, SSL) → Node app (PM2, port 3000)`

Replace `brainotix.com` everywhere with your real domain.

---

## Part 0 — Prerequisites
- An **AWS account** (https://aws.amazon.com → "Create an AWS Account").
- Your **domain** and access to its DNS settings (registrar dashboard).
- Your **SMTP email credentials** (e.g. Zoho/Gmail App Password) for the contact form.
- Your project on **GitHub** (recommended) — makes updates a one-line `git pull`.
  Private repo is fine.

---

## Part 1 — Create the Lightsail instance
1. Go to **https://lightsail.aws.amazon.com**.
2. Top-right: set the **Region** to **Mumbai (ap-south-1)** for India latency/residency.
3. Click **Create instance**.
4. **Platform:** Linux/Unix → **Blueprint:** **OS Only → Ubuntu 22.04 LTS**.
5. **Instance plan:** the **$5/mo** plan (1 GB RAM) is plenty. (First months may be free.)
6. Name it `brainotix-web` → **Create instance**. Wait ~1 minute until it shows "Running".

## Part 2 — Give it a permanent IP
1. Lightsail → **Networking** tab → **Create static IP**.
2. Attach it to `brainotix-web`. **Note this IP** (e.g. `13.234.x.x`) — you'll point DNS at it.
   (Without this, the IP would change on every restart.)

## Part 3 — Open the firewall for HTTPS
1. Click the instance → **Networking** tab → **IPv4 Firewall**.
2. Ensure these rules exist; **add HTTPS** if missing:
   - SSH — TCP 22 (default)
   - HTTP — TCP 80 (default)
   - **HTTPS — TCP 443  ← add this**
   (Leave port 3000 closed — only Nginx talks to the app internally.)

## Part 4 — Connect to the server
Easiest: click the instance → **Connect using SSH** (opens a browser terminal).
Everything below is typed into that terminal.

> **Fast path:** after Part 6 (code is on the server), you can run
> `bash deploy/setup.sh` to do Parts 5, 7 and 8 automatically (installs Node/git/nginx,
> `npm install`, `npm run build`, creates `.env`, starts PM2). Then just edit `.env`,
> configure Nginx (Part 9), DNS (Part 10) and SSL (Part 11). The manual steps below
> explain what the script does.

## Part 5 — Install Node, Git, Nginx
```bash
sudo apt update && sudo apt upgrade -y
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx
node -v && npm -v        # confirm versions
```

## Part 6 — Get the code onto the server
**Option A — GitHub (recommended):**
```bash
cd ~
git clone https://github.com/<your-username>/<your-repo>.git brainotix
cd brainotix
```
> Private repo? Generate a GitHub Personal Access Token and use it as the password,
> or set up an SSH deploy key.

**Option B — Upload from Windows (no GitHub):**
On your PC use **WinSCP** or `scp` to copy the project folder to `/home/ubuntu/brainotix`
(exclude `node_modules`, `.env`, and `data/`). Then `cd ~/brainotix` on the server.

## Part 7 — Install deps, build, configure email
```bash
cd ~/brainotix
npm install                 # installs prod + dev deps (needed for the build)
npm run build               # compiles Tailwind CSS + generates favicons/og-image

# Create the .env with your real email credentials:
cp .env.example .env
nano .env                   # fill SMTP_HOST/PORT/USER/PASS, CONTACT_TO, etc.
                            # Ctrl+O, Enter, Ctrl+X to save & exit
```
> Cloud hosts block raw SMTP port 25 — use **587** (or **465** with SMTP_SECURE=true)
> to an external provider. That's how the app is already configured.

Quick sanity check:
```bash
node server.js              # should print "SMTP connection verified" if creds are right
# Ctrl+C to stop after confirming
```

## Part 8 — Run it 24/7 with PM2
```bash
sudo npm install -g pm2
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup systemd         # prints ONE command — copy/paste & run it (re-launches app on reboot)
pm2 status                  # should show "brainotix" = online
```

## Part 9 — Put Nginx in front
```bash
sudo cp deploy/nginx-brainotix.conf /etc/nginx/sites-available/brainotix
sudo nano /etc/nginx/sites-available/brainotix   # replace brainotix.com with your domain
sudo ln -s /etc/nginx/sites-available/brainotix /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default       # remove the default placeholder site
sudo nginx -t                                     # test config
sudo systemctl reload nginx
```
Now visiting `http://<your-static-IP>` should already show the site.

## Part 10 — Point your domain at the server (DNS)
At your domain's DNS settings (registrar, or create a Lightsail DNS zone), add:

| Type | Name | Value |
|------|------|-------|
| A    | `@`  (apex/root) | your **static IP** |
| A    | `www`            | your **static IP** |

> If your registrar doesn't allow an A record on the root, use Lightsail's **DNS zone**:
> Networking → Create DNS zone → add the two A records → then set your registrar's
> **nameservers** to the four Lightsail nameservers it shows you.

DNS takes ~15 min to a few hours to propagate. Check with: `nslookup brainotix.com`.

## Part 11 — Free HTTPS (SSL) with Let's Encrypt
Once DNS resolves to your IP:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d brainotix.com -d www.brainotix.com
# choose "redirect HTTP → HTTPS" when asked
```
Certbot installs the cert, edits Nginx for port 443, and **auto-renews** every 90 days.
Visit **https://brainotix.com** — you should see the padlock. Done. 🎉

## Part 12 — Final polish
- In `index.html`, set the `og:image` / `twitter:image` meta tags to the absolute URL
  `https://brainotix.com/assets/og-image.png`, then on the server:
  `npm run build:css` (if you changed classes) and `pm2 restart brainotix`.

---

## Updating the site later
```bash
cd ~/brainotix
git pull                      # (or re-upload changed files)
npm install                   # only if dependencies changed
npm run build                 # rebuild CSS/assets
pm2 restart brainotix
```

## Handy operations
```bash
pm2 logs brainotix            # live app logs
pm2 restart brainotix         # restart after changes
pm2 monit                     # live CPU/memory
sudo tail -f /var/log/nginx/error.log
```

## Notes & gotchas
- **Contact-form log (`data/submissions.json`) persists** on a VPS (unlike Render's
  ephemeral disk), so you keep a local record in addition to the emails.
- **Backups:** Lightsail → instance → **Snapshots** → enable automatic snapshots.
- **Security updates:** occasionally run `sudo apt update && sudo apt upgrade -y`.
- **Cost:** ~$5/mo for the instance; the static IP is free *while attached*.
- The Node app listens only on `127.0.0.1:3000` reachability via Nginx; port 3000 is
  not open in the Lightsail firewall, so it can't be hit directly from the internet.
