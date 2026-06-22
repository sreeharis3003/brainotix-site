/**
 * One-time: knock out white backgrounds → transparent, trim margins.
 * Writes cleaned logos as <name>-clean.png next to the originals.
 * ESAF keeps its blue tile (white figures need a backing) — only trimmed.
 *
 * Run: node scripts/process-logos.js
 */
const sharp = require('sharp');
const path = require('path');

const DIR = path.join(__dirname, '..', 'assets', 'logos');

// Upscale small sources with a high-quality resampler so they stay crisp on
// retina screens, then knock out white with a soft feather for smooth edges.
async function knockoutWhite(inFile, outFile, thr = 236, target = 360, feather = 42) {
  const { data, info } = await sharp(path.join(DIR, inFile))
    .resize({ width: target, height: target, fit: 'inside', kernel: 'lanczos3' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info; // 4
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const m = Math.min(r, g, b);
    if (m >= thr) {
      data[i + 3] = 0; // near-white → fully transparent
    } else if (m >= thr - feather) {
      // ramp alpha across the anti-aliased edge → no white halo, smooth border
      const a = Math.round(((thr - m) / feather) * 255);
      data[i + 3] = Math.min(data[i + 3], a);
    }
  }
  await sharp(data, { raw: { width, height, channels } })
    .trim()
    .png({ compressionLevel: 9 })
    .toFile(path.join(DIR, outFile));
  console.log('✓', outFile, `(${width}x${height})`);
}

async function justTrim(inFile, outFile, target = 600) {
  await sharp(path.join(DIR, inFile))
    .resize({ width: target, height: target, fit: 'inside', kernel: 'lanczos3' })
    .trim()
    .png({ compressionLevel: 9 })
    .toFile(path.join(DIR, outFile));
  console.log('✓', outFile, '(upscaled + trimmed, kept tile)');
}

(async () => {
  await knockoutWhite('Canara-Bank.png', 'canara-clean.png');
  await knockoutWhite('Union-Bank.png', 'union-clean.png');
  await knockoutWhite('south-indian-bank.png', 'sib-clean.png');
  await knockoutWhite('Karnataka-Grameen.png', 'grameen-clean.png');
  await justTrim('Esaf-Bank.png', 'esaf-clean.png');
})().catch((e) => { console.error(e); process.exit(1); });
