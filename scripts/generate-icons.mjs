/**
 * Génère les icônes PNG pour la PWA FitChallenge.
 * Dessin : éclair blanc centré sur fond dégradé vert→teal, coins arrondis.
 * Usage : npm run icons
 */
import { Jimp } from 'jimp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');

// Couleurs du dégradé (identiques à l'app)
const C1 = { r: 22,  g: 163, b: 74  }; // #16a34a green-600
const C2 = { r: 13,  g: 148, b: 136 }; // #0d9488 teal-600

// Polygone de l'éclair — 6 sommets normalisés [0..1]
const BOLT = [
  [0.62, 0.06],
  [0.25, 0.54],
  [0.46, 0.54],
  [0.39, 0.94],
  [0.75, 0.46],
  [0.54, 0.46],
];

function inPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
}

async function generateIcon(size) {
  const img = new Jimp({ width: size, height: size, color: 0x00000000 });
  const r = 0.22; // rayon des coins arrondis relatif

  img.scan((x, y, idx) => {
    const nx = x / size;
    const ny = y / size;

    // Clip coins arrondis
    const inTL = nx < r && ny < r;
    const inTR = nx > 1 - r && ny < r;
    const inBL = nx < r && ny > 1 - r;
    const inBR = nx > 1 - r && ny > 1 - r;
    if (inTL && (nx - r) ** 2 + (ny - r) ** 2 > r * r) return;
    if (inTR && (nx - (1 - r)) ** 2 + (ny - r) ** 2 > r * r) return;
    if (inBL && (nx - r) ** 2 + (ny - (1 - r)) ** 2 > r * r) return;
    if (inBR && (nx - (1 - r)) ** 2 + (ny - (1 - r)) ** 2 > r * r) return;

    // Dégradé diagonal
    const t = (nx + ny) / 2;

    if (inPoly(nx, ny, BOLT)) {
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

