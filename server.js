/**
 * Brainotix Solutions — site + contact backend
 * -------------------------------------------------
 *  - Serves index.html
 *  - POST /api/contact  → validates, stores to data/submissions.json, emails you
 *  - GET  /api/health   → quick status (and whether SMTP is configured)
 *
 *  Configure email by copying .env.example → .env and filling in SMTP_* values.
 *  Without SMTP configured the server still runs and SAVES every submission to
 *  data/submissions.json, so nothing is ever lost.
 */
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------- middleware ----------
app.set('trust proxy', 1); // correct client IP behind a proxy/load balancer
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

// Optional CORS — only if you host the static HTML on a different origin.
// Set ALLOWED_ORIGIN in .env (e.g. https://www.brainotix.com).
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
if (ALLOWED_ORIGIN) {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
}

// Rate-limit the contact endpoint to blunt abuse / spam floods.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8,                   // 8 submissions per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Please try again in a little while.' },
});

// ---------- email transport (optional) ----------
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true', // true for 465
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  transporter
    .verify()
    .then(() => console.log('✓ SMTP connection verified — emails will be sent.'))
    .catch((e) => console.warn('⚠ SMTP verify failed:', e.message));
} else {
  console.warn(
    '⚠ SMTP not configured. Submissions will be saved to data/submissions.json but NOT emailed.\n' +
    '  Copy .env.example to .env and fill in SMTP_* to enable email.'
  );
}

// ---------- helpers ----------
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const clean = (s, max = 2000) => String(s == null ? '' : s).trim().slice(0, max);
const esc = (s) =>
  clean(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

function saveSubmission(entry) {
  let list = [];
  try {
    list = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8'));
    if (!Array.isArray(list)) list = [];
  } catch {
    list = [];
  }
  list.push(entry);
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(list, null, 2));
}

// ---------- API ----------
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const body = req.body || {};

    // Honeypot: real users never fill the hidden "website" field; bots do.
    if (clean(body.website)) return res.json({ ok: true }); // silently accept + drop

    const name = clean(body.name, 120);
    const email = clean(body.email, 160);
    const company = clean(body.company, 160);
    const interest = clean(body.interest, 120);
    const message = clean(body.message, 4000);

    if (!name || name.length < 2)
      return res.status(400).json({ ok: false, error: 'Please enter your name.' });
    if (!isEmail(email))
      return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });

    const entry = {
      name,
      email,
      company,
      interest,
      message,
      ip: req.ip,
      userAgent: clean(req.headers['user-agent'], 300),
      receivedAt: new Date().toISOString(),
    };
    saveSubmission(entry);

    if (transporter) {
      const to = process.env.CONTACT_TO || process.env.SMTP_USER;
      const from = process.env.CONTACT_FROM || process.env.SMTP_USER;
      await transporter.sendMail({
        from: `"Brainotix Website" <${from}>`,
        to,
        replyTo: `"${name}" <${email}>`,
        subject: `New enquiry — ${interest || 'General'} — ${name}`,
        text:
          `Name: ${name}\nCompany: ${company || '-'}\nEmail: ${email}\n` +
          `Interested in: ${interest || '-'}\n\n${message || '(no message)'}\n\n` +
          `Received: ${entry.receivedAt}\nIP: ${entry.ip}`,
        html:
          `<h2 style="margin:0 0 12px">New website enquiry</h2>` +
          `<p><strong>Name:</strong> ${esc(name)}</p>` +
          `<p><strong>Company:</strong> ${esc(company) || '&mdash;'}</p>` +
          `<p><strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>` +
          `<p><strong>Interested in:</strong> ${esc(interest) || '&mdash;'}</p>` +
          `<p><strong>Message:</strong><br>${esc(message).replace(/\n/g, '<br>') || '&mdash;'}</p>` +
          `<hr><p style="color:#888;font-size:12px">Received ${entry.receivedAt} &middot; IP ${esc(entry.ip)}</p>`,
      });
    }

    return res.json({ ok: true, emailed: !!transporter });
  } catch (err) {
    console.error('contact error:', err);
    return res
      .status(500)
      .json({ ok: false, error: 'Something went wrong on our end. Please email us directly.' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true, smtp: !!transporter }));

// ---------- static site ----------
// Brand/build assets (compiled CSS, favicons, og-image) live in /assets only.
app.use('/assets', express.static(path.join(ROOT, 'assets'), { maxAge: '7d' }));

// Browsers auto-request /favicon.ico at the root. Without this it would fall through
// to the catch-all and return index.html (HTML) — which makes the tab show a generic
// globe. Serve the real brand icon instead.
app.get('/favicon.ico', (req, res) =>
  res.sendFile(path.join(ROOT, 'assets', 'favicon-96.png'))
);

// Serve index.html for any other (non-API, non-asset) GET. This intentionally
// never exposes server.js, .env, package.json, or the data/ folder.
app.get(/^(?!\/(api|assets)\/).*/, (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

app.listen(PORT, () => {
  console.log(`\n➜ Brainotix site running at http://localhost:${PORT}`);
  console.log(`  Contact API: POST http://localhost:${PORT}/api/contact\n`);
});
