# Brainotix Solutions — Backend

The contact form posts to a small Node.js + Express backend that validates the
submission, **saves it to `data/submissions.json`**, and **emails it to you**.

## 1. Install (one time)

```bash
npm install
```

## 1b. Build CSS + brand assets

The site uses a **compiled** Tailwind stylesheet (`assets/styles.css`) instead of
the dev CDN, plus generated favicons/og-image. Rebuild after editing markup:

```bash
npm run build        # CSS + image assets
npm run build:css    # just the stylesheet
npm run watch:css    # auto-rebuild CSS while editing
```

> If you edit class names in `index.html`, re-run `npm run build:css` or styles
> won't update. When you deploy, set the `og:image` / `twitter:image` tags to the
> full absolute URL (e.g. `https://www.brainotix.com/assets/og-image.png`) so
> social-media scrapers can fetch the preview card.

## 2. Configure email

```bash
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux
```

Open `.env` and fill in your SMTP details. Common providers:

| Provider   | SMTP_HOST            | SMTP_PORT | SMTP_SECURE | Notes |
|------------|----------------------|-----------|-------------|-------|
| Gmail      | smtp.gmail.com       | 587       | false       | Use a Google **App Password**, not your login password |
| Office 365 | smtp.office365.com   | 587       | false       | |
| Zoho (IN)  | smtp.zoho.in         | 465       | true        | |
| SendGrid   | smtp.sendgrid.net    | 587       | false       | `SMTP_USER=apikey`, `SMTP_PASS=<api key>` |

`CONTACT_TO` is where enquiry emails are delivered (defaults to `contactus@brainotix.com`).

> You can skip this step to start — without SMTP the server still runs and saves
> every submission to `data/submissions.json`. Add SMTP later to enable email.

## 3. Run

```bash
npm start        # production
npm run dev      # auto-restart on file changes
```

Then open **http://localhost:3000** (open it via the server, not the raw file,
so the form can reach the API).

## Endpoints

- `GET  /` — the website
- `POST /api/contact` — `{ name, email, company, interest, message }` → `{ ok: true }`
- `GET  /api/health` — `{ ok: true, smtp: <bool> }`

## Security / anti-spam built in

- Input validation + length limits
- Hidden **honeypot** field that traps bots
- **Rate limiting** (8 submissions per IP / 15 min)
- `helmet` security headers
- `.env`, `server.js`, and `data/` are never served to the browser

## Deploying

Any Node host works (Render, Railway, Fly.io, a VPS, or IIS/Node on Windows).
Set the same environment variables there. If you host the **static HTML on a
different domain** than the API, set `ALLOWED_ORIGIN` in `.env` to that domain
to enable CORS.
