/**
 * Generates raster brand assets from SVG:
 *   assets/favicon-32.png        (browser tab fallback)
 *   assets/apple-touch-icon.png  (iOS home screen, 180x180)
 *   assets/og-image.png          (1200x630 social share card)
 *
 * Run: node scripts/generate-assets.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');
fs.mkdirSync(ASSETS, { recursive: true });

const markGradient = `
  <linearGradient id="bx" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#38BDF8"/>
    <stop offset="1" stop-color="#8B5CF6"/>
  </linearGradient>`;

// Brainotix brand mark: the split "O" — orange left half, grey right half.
// Matches assets/favicon.svg. `withBg` adds a white rounded tile (for the iOS
// home-screen icon, which doesn't support transparency well).
function markSVG(size, withBg) {
  const bg = withBg ? `<rect width="64" height="64" rx="14" fill="#ffffff"/>` : '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    ${bg}
    <path d="M31 7 A25 25 0 0 0 31 57 Z" fill="#DE7500"/>
    <path d="M33 7 A25 25 0 0 1 33 57 Z" fill="#828282"/>
  </svg>`;
}

// 1200x630 social-share card
const ogSVG = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${markGradient}
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#070B16"/>
      <stop offset="1" stop-color="#0B1120"/>
    </linearGradient>
    <radialGradient id="glow1" cx="18%" cy="22%" r="55%">
      <stop offset="0" stop-color="#0EA5E9" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#0EA5E9" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="88%" cy="85%" r="55%">
      <stop offset="0" stop-color="#8B5CF6" stop-opacity="0.4"/>
      <stop offset="1" stop-color="#8B5CF6" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#38BDF8"/>
      <stop offset="0.5" stop-color="#818CF8"/>
      <stop offset="1" stop-color="#22D3EE"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  <rect width="1200" height="630" fill="url(#glow1)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>
  <rect x="20" y="20" width="1160" height="590" rx="28" fill="none" stroke="#ffffff" stroke-opacity="0.08"/>

  <!-- brand row -->
  <g transform="translate(90, 96)">
    <rect x="0" y="0" width="76" height="76" rx="20" fill="url(#bx)"/>
    <g transform="translate(6,6) scale(0.98)" stroke="#fff" stroke-width="4" fill="#fff" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 24 H44 M20 24 L32 44 M44 24 L32 44" fill="none"/>
      <circle cx="20" cy="24" r="4.6"/>
      <circle cx="44" cy="24" r="4.6"/>
      <circle cx="32" cy="44" r="4.6"/>
    </g>
    <text x="100" y="52" font-family="'Segoe UI', Arial, sans-serif" font-size="40" font-weight="700" fill="#ffffff">Brainotix <tspan fill="#7DD3FC">Solutions</tspan></text>
  </g>

  <!-- headline -->
  <text x="90" y="320" font-family="'Segoe UI', Arial, sans-serif" font-size="74" font-weight="700" fill="#ffffff">The complete software suite</text>
  <text x="90" y="406" font-family="'Segoe UI', Arial, sans-serif" font-size="74" font-weight="700" fill="url(#accent)">for every financial institution.</text>

  <!-- subline -->
  <text x="92" y="476" font-family="'Segoe UI', Arial, sans-serif" font-size="30" font-weight="400" fill="#94A3B8">Banking IT · Procure-to-Pay · Payments · Security · Assets · Workflow · Compliance</text>

  <text x="92" y="556" font-family="'Segoe UI', Arial, sans-serif" font-size="26" font-weight="600" fill="#38BDF8">Serving clients across the world</text>
</svg>`;

(async () => {
  await sharp(Buffer.from(markSVG(32, false))).png().toFile(path.join(ASSETS, 'favicon-32.png'));
  await sharp(Buffer.from(markSVG(96, false))).png().toFile(path.join(ASSETS, 'favicon-96.png'));
  await sharp(Buffer.from(markSVG(180, true))).png().toFile(path.join(ASSETS, 'apple-touch-icon.png'));
  await sharp(Buffer.from(ogSVG)).png().toFile(path.join(ASSETS, 'og-image.png'));
  console.log('✓ Generated favicon-32.png, favicon-96.png, apple-touch-icon.png, og-image.png');
})().catch((e) => {
  console.error('Asset generation failed:', e);
  process.exit(1);
});
