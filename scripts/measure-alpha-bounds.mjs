import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const files = process.argv.slice(2);
const alphaThreshold = Number(process.env.ALPHA_THRESHOLD || 20);

if (files.length === 0) {
  console.error('Usage: node scripts/measure-alpha-bounds.mjs <image.png> [...more.png]');
  process.exit(1);
}

const pct = (value) => `${Number(value.toFixed(2))}%`;

for (const file of files) {
  const image = sharp(file).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let opaquePixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * channels + 3];
      if (alpha > alphaThreshold) {
        opaquePixels += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const displayName = path.relative(process.cwd(), file);
  if (opaquePixels === 0) {
    console.log(`${displayName}: no pixels above alpha>${alphaThreshold}`);
    continue;
  }

  const boundsWidth = maxX - minX + 1;
  const boundsHeight = maxY - minY + 1;

  console.log(displayName);
  console.log(`  size: ${width}x${height}`);
  console.log(`  pixels: ${minX},${minY} - ${maxX},${maxY}`);
  console.log(`  opaque: ${opaquePixels}`);
  console.log(`  css: left ${pct((minX / width) * 100)}; top ${pct((minY / height) * 100)}; width ${pct((boundsWidth / width) * 100)}; height ${pct((boundsHeight / height) * 100)};`);
}
