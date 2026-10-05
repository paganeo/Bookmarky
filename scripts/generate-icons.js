import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconsDir = path.resolve(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Tabler outline bookmarks SVG with transparent background and pure white stroke
// + subtle semi-transparent dark outline for visibility on both light and dark browser bars
const svgTemplate = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
  <!-- Soft subtle backdrop outline for 100% visibility on light & dark toolbars -->
  <g stroke="rgba(0,0,0,0.35)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 10v11l-5 -3l-5 3v-11a3 3 0 0 1 3 -3h4a3 3 0 0 1 3 3z" />
    <path d="M11 3h5a3 3 0 0 1 3 3v11" />
  </g>
  <!-- Foreground crisp white Tabler bookmark stroke -->
  <g stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 10v11l-5 -3l-5 3v-11a3 3 0 0 1 3 -3h4a3 3 0 0 1 3 3z" fill="rgba(255,255,255,0.12)" />
    <path d="M11 3h5a3 3 0 0 1 3 3v11" />
  </g>
</svg>
`;

// Pure white SVG without shadow as well
const pureWhiteSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M15 10v11l-5 -3l-5 3v-11a3 3 0 0 1 3 -3h4a3 3 0 0 1 3 3z" />
  <path d="M11 3h5a3 3 0 0 1 3 3v11" />
</svg>
`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), pureWhiteSvg.trim());

const sizes = [16, 32, 48, 128];

async function generate() {
  for (const size of sizes) {
    const svgBuffer = Buffer.from(svgTemplate(size));
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon${size}.png`));
    console.log(`Generated icon${size}.png`);
  }
}

generate().catch(console.error);
