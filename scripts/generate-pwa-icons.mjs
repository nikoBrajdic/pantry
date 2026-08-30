import sharp from "sharp";
import fs from "fs";
import path from "path";

const out = path.join("public", "icons");
fs.mkdirSync(out, { recursive: true });

function svgFor(size) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#4a7c59"/>
  <g fill="none" stroke="#f7f3ea" stroke-width="28" stroke-linecap="round" stroke-linejoin="round">
    <path d="M140 250 h232 a20 20 0 0 1 20 20 v70 a90 90 0 0 1 -90 90 h-92 a90 90 0 0 1 -90 -90 v-70 a20 20 0 0 1 20 -20 z"/>
    <path d="M180 250 v-40 a76 40 0 0 1 152 0 v40"/>
    <path d="M256 120 v50"/>
    <path d="M220 140 h72"/>
  </g>
</svg>`);
}

for (const [size, file] of [
  [192, "icon-192.png"],
  [512, "icon-512.png"],
  [180, "apple-touch-icon.png"],
]) {
  await sharp(svgFor(size)).png().toFile(path.join(out, file));
  console.log("wrote", file);
}
