import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

// 1. Standard SVG Icon: Blue circle (#4169E1) with black border and bold white lightning/circuit symbol
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Background transparent -->
  <!-- Outer Blue Circle with Black Border -->
  <circle cx="256" cy="256" r="236" fill="#4169E1" stroke="#000000" stroke-width="20"/>
  <!-- Circuit lead lines connecting into center -->
  <line x1="20" y1="256" x2="160" y2="256" stroke="#000000" stroke-width="22" stroke-linecap="round"/>
  <line x1="352" y1="256" x2="492" y2="256" stroke="#000000" stroke-width="22" stroke-linecap="round"/>
  <circle cx="50" cy="256" r="16" fill="#FFFFFF" stroke="#000000" stroke-width="10"/>
  <circle cx="462" cy="256" r="16" fill="#FFFFFF" stroke="#000000" stroke-width="10"/>
  <!-- Central Bold White Lightning Bolt Symbol with thick black stroke -->
  <polygon points="280,68 150,268 250,268 232,444 362,244 262,244" 
           fill="#FFFFFF" 
           stroke="#000000" 
           stroke-width="18" 
           stroke-linejoin="round"/>
</svg>`;

// 2. Maskable SVG Icon: Solid #4169E1 bleed background, symbol scaled within central 80% safe zone
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Full bleed background for Android maskable safe zone -->
  <rect width="512" height="512" fill="#4169E1"/>
  <!-- Inner circular boundary within 80% safe zone -->
  <circle cx="256" cy="256" r="185" fill="#4169E1" stroke="#000000" stroke-width="16"/>
  <!-- Circuit lead lines -->
  <line x1="75" y1="256" x2="180" y2="256" stroke="#000000" stroke-width="16" stroke-linecap="round"/>
  <line x1="332" y1="256" x2="437" y2="256" stroke="#000000" stroke-width="16" stroke-linecap="round"/>
  <circle cx="95" cy="256" r="12" fill="#FFFFFF" stroke="#000000" stroke-width="8"/>
  <circle cx="417" cy="256" r="12" fill="#FFFFFF" stroke="#000000" stroke-width="8"/>
  <!-- Lightning bolt within safe zone (80% circle) -->
  <polygon points="275,108 170,266 250,266 237,404 342,246 262,246" 
           fill="#FFFFFF" 
           stroke="#000000" 
           stroke-width="16" 
           stroke-linejoin="round"/>
</svg>`;

async function generateIcons() {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write SVGs
  const iconSvgPath = path.join(publicDir, 'icon.svg');
  fs.writeFileSync(iconSvgPath, standardSvg, 'utf-8');
  console.log('Created public/icon.svg');

  // Generate 192x192 PNG
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated public/pwa-192x192.png');

  // Generate 512x512 PNG
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated public/pwa-512x512.png');

  // Generate 512x512 Maskable PNG
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated public/pwa-maskable-512x512.png');

  // Generate 180x180 Apple Touch Icon PNG
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated public/apple-touch-icon.png');

  // Generate favicon.ico / 64x64 PNG
  await sharp(Buffer.from(standardSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Generated public/favicon.ico');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
