/**
 * Génère les icônes PNG pour la PWA FitChallenge.
 * Dessin : haltère (dumbbell) blanc sur fond dégradé vert→teal, coins arrondis.
 * Usage : npm run icons
 */
import { Jimp } from 'jimp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');

const C1 = { r: 22,  g: 163, b: 74  }; // #16a34a green-600
const C2 = { r: 13,  g: 148, b: 136 }; // #0d9488 teal-600

// Coordonnées normalisées [0..1] du haltère (viewBox 100x100)
const BAR   = { x: 0.32, y: 0.44, w: 0.36, h: 0.12, r: 0.06 };
const LEFT  = { x: 0.12, y: 0.32, w: 0.16, h: 0.36, r: 0.08 };
const RIGHT = { x: 0.72, y: 0.32, w: 0.16, h: 0.36, r: 0.08 };

function inRoundedRect(px, py, { x, y, w, h, r }) {
  if (px < x || px > x + w || py < y || py > y + h) return false;
  if (px < x + r && py < y + r)       return (px-(x+r))**2   + (py-(y+r))**2   <= r*r;
  if (px > x+w-r && py < y + r)       return (px-(x+w-r))**2 + (py-(y+r))**2   <= r*r;
  if (px < x + r && py > y + h - r)   return (px-(x+r))**2   + (py-(y+h-r))**2 <= r*r;
  if (px > x+w-r && py > y + h - r)   return (px-(x+w-r))**2 + (py-(y+h-r))**2 <= r*r;
  return true;
}

function inDumbbell(nx, ny) {
  return inRoundedRect(nx, ny, BAR)
      || inRoundedRect(nx, ny, LEFT)
      || inRoundedRect(nx, ny, RIGHT);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
}

async function generateIcon(size) {
  const img = new Jimp({ width: size, height: size, color: 0x00000000 });
  const r = 0.22;

  img.scan((x, y, idx) => {
    const nx = x / size;
    const ny = y / size;

    // Coins arrondis
    const inTL = nx < r && ny < r;
    const inTR = nx > 1 - r && ny < r;
    const inBL = nx < r && ny > 1 - r;
    const inBR = nx > 1 - r && ny > 1 - r;
    if (inTL && (nx - r) ** 2 + (ny - r) ** 2 > r * r) return;
    if (inTR && (nx - (1-r)) ** 2 + (ny - r) ** 2 > r * r) return;
    if (inBL && (nx - r) ** 2 + (ny - (1-r)) ** 2 > r * r) return;
    if (inBR && (nx - (1-r)) ** 2 + (ny - (1-r)) ** 2 > r * r) return;

    const t = (nx + ny) / 2;

    if (inDumbbell(nx, ny)) {
      img.bitmap.data[idx]     = 255;
      img.bitmap.data[idx + 1] = 255;
      img.bitmap.data[idx + 2] = 255;
      img.bitmap.data[idx + 3] = 255;
    } else {
      img.bitmap.data[idx]     = lerp(C1.r, C2.r, t);
      img.bitmap.data[idx + 1] = lerp(C1.g, C2.g, t);
      img.bitmap.data[idx + 2] = lerp(C1.b, C2.b, t);
      img.bitmap.data[idx + 3] = 255;
    }
  });

  return img;
}

await mkdir(outDir, { recursive: true });

for (const size of [512, 192]) {
  console.log(`Génération ${size}×${size}…`);
  const icon = await generateIcon(size);
  await icon.write(join(outDir, `icon-${size}.png`));
  console.log(`  → icon-${size}.png ✓`);
}

console.log('Terminé !');
