# Brainotix Solutions — Website

Marketing site for **Brainotix Solutions** — a complete suite of IT solutions for
the banking and financial industry (Procure-to-Pay, Digital Banking, Trade Finance,
Expense Management, Vendor Management & Self-Service, Fixed/IT Asset Management,
Workflow Management, Patch Management, Application Whitelisting, GST/TDS
Reconciliation), with RPA at the core.

A single premium landing page (dark theme + gradient/animation effects) plus a small
Node/Express backend that serves the site and handles the contact form.

## Tech
- **Frontend:** single `index.html`, Tailwind CSS (compiled to `assets/styles.css`),
  vanilla JS animations (scroll reveal, count-up, cursor-reactive background).
- **Backend:** Node + Express (`server.js`) — validates the contact form, saves
  submissions to `data/submissions.json`, and emails them via SMTP (Nodemailer).

## Local development

```bash
npm install          # install dependencies
npm run build        # compile Tailwind CSS + generate favicons/OG image
cp .env.example .env # then add your SMTP credentials (optional for local)
npm run dev          # start with auto-reload  ->  http://localhost:3000
```

Open **http://localhost:3000** (via the server, not the raw file) so the contact
form can reach the API.

### Useful scripts
| Command | Does |
|---|---|
| `npm start` | Run the server (production) |
| `npm run dev` | Run with auto-restart on changes |
| `npm run build` | Build CSS + image assets |
| `npm run watch:css` | Auto-rebuild CSS while editing markup |

> If you change Tailwind classes in `index.html`, re-run `npm run build:css`.

## Project layout
```
index.html              The website (single page)
server.js               Express server + contact API
src/input.css           Tailwind source (compiled to assets/styles.css)
tailwind.config.js      Tailwind config
scripts/                Asset generators (favicons, OG image, logo processing)
assets/                 Compiled CSS, favicons, OG image, logos
deploy/                 PM2 + Nginx configs and setup/update scripts
data/                   Runtime contact submissions (git-ignored)
.env.example            Template for SMTP / config
```

## Configuration
Copy `.env.example` to `.env` and fill in SMTP details to enable email delivery.
See **BACKEND.md** for provider examples (Zoho / Gmail App Password / Office365 / SendGrid).

## Deployment
Full step-by-step for **AWS Lightsail** (Ubuntu + Nginx + PM2 + free SSL) is in
**DEPLOY-LIGHTSAIL.md**. On the server, after cloning this repo:

```bash
bash deploy/setup.sh   # installs Node/nginx, builds, starts under PM2
```

Then configure `.env`, Nginx, DNS, and HTTPS as described in the guide.

To redeploy after pushing changes:

```bash
bash deploy/update.sh  # git pull + build + pm2 restart
```

## Notes
- Secrets (`.env`) and submission data are git-ignored and never committed.
- If your live domain is not `www.brainotix.com`, find-and-replace it in
  `index.html` (canonical/OG tags) and in the Nginx/Certbot commands.
