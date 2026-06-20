import { Jimp } from 'jimp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');

for (const taille of [192, 512]) {
  const img = new Jimp({ width: taille, height: taille, color: 0x22c55eff });
  await img.write(join(outDir, `icon-${taille}.png`));
  console.log(`✅ icon-${taille}.png créé (${taille}x${taille})`);
}
