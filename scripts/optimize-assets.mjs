import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const assetDir = path.join(rootDir, "assets");

const webpOptions = {
  quality: 95,
  alphaQuality: 100,
  effort: 5,
  smartSubsample: true,
};

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const entries = await fs.readdir(assetDir, { withFileTypes: true });
const pngFiles = entries
  .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

let sourceTotal = 0;
let webpTotal = 0;

for (const filename of pngFiles) {
  const input = path.join(assetDir, filename);
  const output = path.join(assetDir, filename.replace(/\.png$/i, ".webp"));
  const sourceSize = (await fs.stat(input)).size;

  await sharp(input).webp(webpOptions).toFile(output);

  const webpSize = (await fs.stat(output)).size;
  sourceTotal += sourceSize;
  webpTotal += webpSize;

  const ratio = Math.round((1 - webpSize / sourceSize) * 100);
  console.log(`${filename} -> ${path.basename(output)}: ${formatBytes(sourceSize)} -> ${formatBytes(webpSize)} (${ratio}% smaller)`);
}

console.log(`Optimized ${pngFiles.length} assets: ${formatBytes(sourceTotal)} -> ${formatBytes(webpTotal)}`);
