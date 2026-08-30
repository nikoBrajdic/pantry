import sharp from "sharp";
import fs from "fs";
import path from "path";

const sage = "#4a7c59";
const cream = "#f7f3ea";

/** Same mark as PantryLogo, on sage tile. */
function markSvg(size, radius = Math.round(size * 0.22)) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${(radius / size) * 64}" fill="${sage}"/>
  <g fill="${cream}">
    <path d="M23.2 12.4c0-1.7 1.3-3.05 2.9-3.05 1 0 1.85.5 2.35 1.25.5-.75 1.35-1.25 2.35-1.25 1.6 0 2.9 1.35 2.9 3.05 0 3.35-5.25 6.7-5.25 6.7S23.2 15.75 23.2 12.4Z"/>
    <path d="M15.4 19.2c0-1.35 1-2.4 2.25-2.4.75 0 1.4.4 1.8 1 .4-.6 1.05-1 1.8-1 1.25 0 2.25 1.05 2.25 2.4 0 2.55-4.05 5.1-4.05 5.1s-4.05-2.55-4.05-5.1Z"/>
    <path d="M9 35c0-1 .7-1.85 1.7-2.05L40.2 28.2c1.35-.25 2.6.8 2.6 2.15V32c0 8.2-6.2 15.1-14.3 16.4C20.5 50 12 45.4 9.8 37.8 9.3 36.9 9 36 9 35Z"/>
    <path d="M41.2 29.4c1.4-.45 9.6-2.5 13.8-1.2 1.2.35 1.95 1.55 1.65 2.75-.35 1.35-1.7 2.15-3.05 1.85-3.5-.75-9.15.55-10.9 1.05-.95.3-1.85-.4-1.65-1.35.15-.95.55-2.35 1.15-3.1Z"/>
  </g>
</svg>`);
}

const publicIcons = path.join("public", "icons");
const appDir = path.join("src", "app");
fs.mkdirSync(publicIcons, { recursive: true });

const svg64 = markSvg(64, 14);
fs.writeFileSync(path.join("public", "favicon.svg"), markSvg(64, 14).toString());
fs.writeFileSync(path.join(appDir, "icon.svg"), markSvg(64, 14).toString());

for (const [size, file, dir] of [
  [32, "favicon-32.png", publicIcons],
  [16, "favicon-16.png", publicIcons],
  [180, "apple-touch-icon.png", publicIcons],
  [192, "icon-192.png", publicIcons],
  [512, "icon-512.png", publicIcons],
  [32, "favicon.ico", appDir],
]) {
  const out = path.join(dir, file);
  if (file.endsWith(".ico")) {
    // Sharp writes PNG bytes; browsers accept PNG-named .ico from Next app/favicon.ico fine as PNG
    await sharp(markSvg(size, Math.round(size * 0.22))).png().toFile(out);
  } else {
    await sharp(markSvg(size, Math.round(size * 0.22))).png().toFile(out);
  }
  console.log("wrote", out);
}

// Proper multi-size favicon.ico via PNG pack into public/
await sharp(markSvg(32, 7)).png().toFile(path.join("public", "favicon.ico"));
console.log("wrote public/favicon.ico");
