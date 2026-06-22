/**
 * Optimize the client bank logos: resize to ~2x display size (logos render at
 * max 48x130px) and compress to a palette PNG. Cuts each from tens/hundreds of
 * KB down to a few KB so they load instantly with no "pop-in".
 *
 * Run: node scripts/optimize-logos.js
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets', 'logos');
const files = [
  'canara-clean.png',
  'union-clean.png',
  'sib-clean.png',
  'esaf-clean.png',
  'grameen-clean.png',
];

(async () => {
  for (const f of files) {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) { console.log('skip (missing):', f); continue; }
    const before = fs.statSync(p).size;
    const buf = await sharp(p)
      .resize({ width: 280, height: 112, fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true, quality: 90, effort: 9 })
      .toBuffer();
    fs.writeFileSync(p, buf);
    const after = fs.statSync(p).size;
    console.log(`${f}: ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`);
  }
  console.log('Done.');
})();
