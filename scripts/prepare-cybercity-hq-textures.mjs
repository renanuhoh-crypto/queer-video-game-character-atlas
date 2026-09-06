import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const [inputDirectoryArgument, outputDirectoryArgument] = process.argv.slice(2);

if (!inputDirectoryArgument || !outputDirectoryArgument) {
  console.error(
    "Usage: node scripts/prepare-cybercity-hq-textures.mjs <input-directory> <output-directory>",
  );
  process.exit(1);
}

const inputDirectory = path.resolve(inputDirectoryArgument);
const outputDirectory = path.resolve(outputDirectoryArgument);
const priorityTexturePattern = /^(Bridge_base|Streets_2|Buildings_adds)\.png$/i;

await mkdir(outputDirectory, { recursive: true });

const files = (await readdir(inputDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\.png$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right));

let inputBytes = 0;
let outputBytes = 0;
let priorityCount = 0;

for (const fileName of files) {
  const inputPath = path.join(inputDirectory, fileName);
  const outputPath = path.join(outputDirectory, fileName);
  const source = sharp(inputPath, { failOn: "none" });
  const metadata = await source.metadata();
  const maximumDimension = priorityTexturePattern.test(fileName) ? 2048 : 1024;
  const shouldResize =
    (metadata.width ?? 0) > maximumDimension ||
    (metadata.height ?? 0) > maximumDimension;

  if (maximumDimension === 2048) priorityCount += 1;

  let pipeline = source;
  if (shouldResize) {
    pipeline = pipeline.resize({
      width: maximumDimension,
      height: maximumDimension,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
  }

  await pipeline
    .png({
      compressionLevel: 9,
      palette: false,
      adaptiveFiltering: true,
    })
    .toFile(outputPath);

  inputBytes += (await stat(inputPath)).size;
  outputBytes += (await stat(outputPath)).size;
}

for (const missingTextureName of ["Buildings_2_top.png", "Terrain.png"]) {
  if (files.some((fileName) => fileName.toLowerCase() === missingTextureName.toLowerCase())) {
    continue;
  }

  const outputPath = path.join(outputDirectory, missingTextureName);
  await sharp({
    create: {
      width: 8,
      height: 8,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
  outputBytes += (await stat(outputPath)).size;
}

console.log(
  JSON.stringify(
    {
      textures: files.length,
      priorityTextures: priorityCount,
      inputMiB: Number((inputBytes / 1024 / 1024).toFixed(2)),
      outputMiB: Number((outputBytes / 1024 / 1024).toFixed(2)),
      maximumDimension: {
        priority: 2048,
        other: 1024,
      },
      outputDirectory,
    },
    null,
    2,
  ),
);
