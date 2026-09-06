import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const [alienInputArgument, rainbowInputArgument, outputRootArgument] = process.argv.slice(2);

if (!alienInputArgument || !rainbowInputArgument || !outputRootArgument) {
  console.error(
    "Usage: node scripts/prepare-quiu-explorer-assets.mjs <alien-textures> <rainbow-source> <public-models-root>",
  );
  process.exit(1);
}

const alienInput = path.resolve(alienInputArgument);
const rainbowInput = path.resolve(rainbowInputArgument);
const outputRoot = path.resolve(outputRootArgument);
const alienOutput = path.join(outputRoot, "alien-world", "textures");
const rainbowOutput = path.join(outputRoot, "rainbow-road-wii", "textures");

const scalarTexturePattern = /(?:_AO|_Roughness|_Metallic)\.png$/i;
const omittedAlienPattern = /(?:_SSS|_Height)\.png$/i;

async function prepareAlienProfile(profile, maximumColorSize, maximumScalarSize) {
  const destination = path.join(alienOutput, profile);
  await mkdir(destination, { recursive: true });
  const files = (await readdir(alienInput, { withFileTypes: true }))
    .filter(
      (entry) =>
        entry.isFile() &&
        /\.png$/i.test(entry.name) &&
        !omittedAlienPattern.test(entry.name),
    )
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  let outputBytes = 0;
  for (const fileName of files) {
    const maximumSize = scalarTexturePattern.test(fileName)
      ? maximumScalarSize
      : maximumColorSize;
    const inputPath = path.join(alienInput, fileName);
    const outputPath = path.join(destination, fileName);
    await sharp(inputPath, { failOn: "none" })
      .resize({
        width: maximumSize,
        height: maximumSize,
        fit: "inside",
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
      .toFile(outputPath);
    outputBytes += (await stat(outputPath)).size;
  }

  return { profile, textures: files.length, outputMiB: outputBytes / 1024 / 1024 };
}

async function prepareRainbowTextures() {
  await mkdir(rainbowOutput, { recursive: true });
  const files = (await readdir(rainbowInput, { withFileTypes: true }))
    .filter(
      (entry) =>
        entry.isFile() &&
        /\.(?:png|jpe?g)$/i.test(entry.name) &&
        !/^schvfgwp_8K_/i.test(entry.name),
    )
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  let outputBytes = 0;
  for (const fileName of files) {
    const inputPath = path.join(rainbowInput, fileName);
    const outputPath = path.join(rainbowOutput, fileName);
    await copyFile(inputPath, outputPath);
    outputBytes += (await stat(outputPath)).size;
  }

  return { textures: files.length, outputMiB: outputBytes / 1024 / 1024 };
}

const desktop = await prepareAlienProfile("desktop", 1024, 512);
const mobile = await prepareAlienProfile("mobile", 512, 256);
const rainbow = await prepareRainbowTextures();

console.log(
  JSON.stringify(
    {
      alien: [desktop, mobile].map((item) => ({
        ...item,
        outputMiB: Number(item.outputMiB.toFixed(2)),
      })),
      rainbow: {
        ...rainbow,
        outputMiB: Number(rainbow.outputMiB.toFixed(2)),
      },
      outputRoot,
    },
    null,
    2,
  ),
);
