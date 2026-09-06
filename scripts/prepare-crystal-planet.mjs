import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";
import sharp from "sharp";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MeshoptEncoder } from "meshoptimizer/encoder";

const [, , inputArg, outputArg] = process.argv;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");

if (!inputArg) {
  console.error(
    "Usage: node scripts/prepare-crystal-planet.mjs <crystal-planet.zip> [public/models/crystal-planet/crystal-planet.glb]",
  );
  process.exit(1);
}

const archivePath = path.resolve(inputArg);
const outputPath = outputArg
  ? path.resolve(repositoryRoot, outputArg)
  : path.join(repositoryRoot, "public", "models", "crystal-planet", "crystal-planet.glb");
const statsPath = outputPath.replace(/\.glb$/i, ".stats.json");
const sourceNotePath = path.join(path.dirname(outputPath), "SOURCE.md");
const SOURCE_FBX = "source/Crystals.fbx";
const TEXTURE_SIZE = 1024;

const materialDefinitions = {
  crystals: { textureStem: "crystals", metallicFactor: 0.04, roughnessFactor: 0.38 },
  main_planet: { textureStem: "main_planet", metallicFactor: 0, roughnessFactor: 0.82 },
  main_crystal: { textureStem: "main_crystal", metallicFactor: 0.04, roughnessFactor: 0.34 },
  saturn: { textureStem: "saturn", metallicFactor: 1, roughnessFactor: 1 },
  ring_saturn: { textureStem: "ring_saturn", metallicFactor: 0.02, roughnessFactor: 0.72, doubleSided: true },
  small_crystal_planet: { textureStem: "small_crystal_planet", metallicFactor: 1, roughnessFactor: 1 },
  tree_planet: { textureStem: "tree_planet", metallicFactor: 0, roughnessFactor: 0.86 },
  small_rocks: { textureStem: "small_rocks", metallicFactor: 0, roughnessFactor: 0.9 },
  tree_bark: { textureStem: "tree_bark", metallicFactor: 0, roughnessFactor: 0.92 },
  leaves: { textureStem: "leaves", metallicFactor: 0, roughnessFactor: 0.78, doubleSided: true },
};

const sourceMaterialToKey = new Map([
  ["material.001", "crystals"],
  ["main planet", "main_planet"],
  ["main crystal", "main_crystal"],
  ["saturn", "saturn"],
  ["ring saturn", "ring_saturn"],
  ["small crystal planet", "small_crystal_planet"],
  ["tree planet", "tree_planet"],
  ["small rocks", "small_rocks"],
  ["tree bark", "tree_bark"],
  ["twig", "tree_bark"],
  ["leaves", "leaves"],
]);

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function findEndOfCentralDirectory(buffer) {
  const minimum = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  throw new Error("Invalid ZIP: end-of-central-directory record was not found");
}

function readZip(buffer) {
  const endOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(endOffset + 10);
  let centralOffset = buffer.readUInt32LE(endOffset + 16);
  const entries = new Map();

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(centralOffset) !== 0x02014b50) {
      throw new Error(`Invalid ZIP central-directory entry at byte ${centralOffset}`);
    }
    const flags = buffer.readUInt16LE(centralOffset + 8);
    const method = buffer.readUInt16LE(centralOffset + 10);
    const compressedSize = buffer.readUInt32LE(centralOffset + 20);
    const uncompressedSize = buffer.readUInt32LE(centralOffset + 24);
    const nameLength = buffer.readUInt16LE(centralOffset + 28);
    const extraLength = buffer.readUInt16LE(centralOffset + 30);
    const commentLength = buffer.readUInt16LE(centralOffset + 32);
    const localOffset = buffer.readUInt32LE(centralOffset + 42);
    const name = buffer
      .subarray(centralOffset + 46, centralOffset + 46 + nameLength)
      .toString("utf8")
      .replaceAll("\\", "/");
    if ((flags & 1) !== 0) throw new Error(`Encrypted ZIP entry is unsupported: ${name}`);
    if (buffer.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error(`Invalid ZIP local header for ${name}`);
    }
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    let data;
    if (method === 0) data = Buffer.from(compressed);
    else if (method === 8) data = inflateRawSync(compressed);
    else throw new Error(`Unsupported ZIP compression method ${method}: ${name}`);
    if (data.length !== uncompressedSize) throw new Error(`ZIP size mismatch for ${name}`);
    entries.set(name.toLowerCase(), { name, data });
    centralOffset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function requiredEntry(entries, name) {
  const entry = entries.get(name.toLowerCase());
  if (!entry) throw new Error(`Archive is missing required entry: ${name}`);
  return entry;
}

function optionalEntry(entries, name) {
  return entries.get(name.toLowerCase()) ?? null;
}

function parseFbx(buffer) {
  const originalTextureLoad = THREE.TextureLoader.prototype.load;
  THREE.TextureLoader.prototype.load = function loadPlaceholder(url, onLoad) {
    const texture = new THREE.Texture();
    texture.name = String(url);
    texture.userData.sourceUrl = String(url);
    queueMicrotask(() => onLoad?.(texture));
    return texture;
  };
  try {
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    return new FBXLoader().parse(arrayBuffer, "");
  } finally {
    THREE.TextureLoader.prototype.load = originalTextureLoad;
  }
}

function range(values, stride) {
  const min = Array(stride).fill(Number.POSITIVE_INFINITY);
  const max = Array(stride).fill(Number.NEGATIVE_INFINITY);
  for (let offset = 0; offset < values.length; offset += stride) {
    for (let component = 0; component < stride; component += 1) {
      min[component] = Math.min(min[component], values[offset + component]);
      max[component] = Math.max(max[component], values[offset + component]);
    }
  }
  return { min, max };
}

function remapAttribute(attribute, remap, uniqueCount, transform) {
  const output = new Float32Array(uniqueCount * attribute.itemSize);
  for (let oldIndex = 0; oldIndex < remap.length; oldIndex += 1) {
    const newIndex = remap[oldIndex];
    if (newIndex === 0xffffffff) continue;
    for (let component = 0; component < attribute.itemSize; component += 1) {
      const value = attribute.array[oldIndex * attribute.itemSize + component];
      output[newIndex * attribute.itemSize + component] = transform
        ? transform(value, component)
        : value;
    }
  }
  return output;
}

function optimizeGeometry(sourceGeometry) {
  let geometry = sourceGeometry.clone();
  for (const attributeName of Object.keys(geometry.attributes)) {
    if (!["position", "normal", "uv"].includes(attributeName)) geometry.deleteAttribute(attributeName);
  }
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  if (!geometry.getAttribute("uv")) throw new Error("A Crystal Planet mesh has no UV coordinates");
  const indexed = mergeVertices(geometry, 1e-6);
  geometry.dispose();
  geometry = indexed;
  const indexArray = Uint32Array.from(geometry.index.array);
  const [remap, uniqueCount] = MeshoptEncoder.reorderMesh(indexArray, true, true);
  const positions = remapAttribute(geometry.getAttribute("position"), remap, uniqueCount);
  const normals = remapAttribute(geometry.getAttribute("normal"), remap, uniqueCount);
  const uvs = remapAttribute(
    geometry.getAttribute("uv"),
    remap,
    uniqueCount,
    (value, component) => (component === 1 ? 1 - value : value),
  );
  geometry.dispose();
  return {
    positions,
    normals,
    uvs,
    indices: uniqueCount <= 65_535 ? Uint16Array.from(indexArray) : Uint32Array.from(indexArray),
  };
}

function geometryHash(geometry) {
  const hash = createHash("sha256");
  for (const value of [geometry.positions, geometry.normals, geometry.uvs, geometry.indices]) {
    hash.update(Buffer.from(value.buffer, value.byteOffset, value.byteLength));
  }
  return hash.digest("hex");
}

class BinaryBuilder {
  constructor() {
    this.chunks = [];
    this.byteLength = 0;
    this.bufferViews = [];
  }

  append(data, options = {}) {
    const buffer = Buffer.isBuffer(data)
      ? data
      : Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    const padding = (4 - (this.byteLength % 4)) % 4;
    if (padding) {
      this.chunks.push(Buffer.alloc(padding));
      this.byteLength += padding;
    }
    this.bufferViews.push({
      buffer: 0,
      byteOffset: this.byteLength,
      byteLength: buffer.length,
      ...(options.target ? { target: options.target } : {}),
      ...(options.name ? { name: options.name } : {}),
    });
    this.chunks.push(buffer);
    this.byteLength += buffer.length;
    return this.bufferViews.length - 1;
  }

  finish() {
    const padding = (4 - (this.byteLength % 4)) % 4;
    if (padding) {
      this.chunks.push(Buffer.alloc(padding));
      this.byteLength += padding;
    }
    return Buffer.concat(this.chunks);
  }
}

function createGlb(gltf, binary) {
  const json = Buffer.from(JSON.stringify(gltf), "utf8");
  const jsonPadding = (4 - (json.length % 4)) % 4;
  const paddedJson = jsonPadding ? Buffer.concat([json, Buffer.alloc(jsonPadding, 0x20)]) : json;
  const totalLength = 12 + 8 + paddedJson.length + 8 + binary.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(paddedJson.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(binary.length, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, binary]);
}

async function resizeWebp(entry, kind) {
  const options = kind === "normal"
    ? { quality: 92, nearLossless: true, effort: 6 }
    : { quality: 86, smartSubsample: true, effort: 6 };
  const { data, info } = await sharp(entry.data, { limitInputPixels: false })
    .resize({
      width: TEXTURE_SIZE,
      height: TEXTURE_SIZE,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .webp(options)
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

async function resizeGray(entry) {
  if (!entry) return null;
  const { data, info } = await sharp(entry.data, { limitInputPixels: false })
    .resize({ width: TEXTURE_SIZE, height: TEXTURE_SIZE, fit: "inside", withoutEnlargement: true })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

async function packMetallicRoughness(roughnessEntry, metallicEntry) {
  if (!roughnessEntry && !metallicEntry) return null;
  const roughness = await resizeGray(roughnessEntry);
  const metallic = await resizeGray(metallicEntry);
  const reference = roughness ?? metallic;
  if (roughness && metallic && (roughness.width !== metallic.width || roughness.height !== metallic.height)) {
    throw new Error("Metallic and roughness texture sizes do not match after processing");
  }
  const pixels = reference.width * reference.height;
  const rgba = Buffer.allocUnsafe(pixels * 4);
  for (let index = 0; index < pixels; index += 1) {
    rgba[index * 4] = 255;
    rgba[index * 4 + 1] = roughness ? roughness.data[index] : 255;
    rgba[index * 4 + 2] = metallic ? metallic.data[index] : 0;
    rgba[index * 4 + 3] = 255;
  }
  const buffer = await sharp(rgba, {
    raw: { width: reference.width, height: reference.height, channels: 4 },
  }).webp({ lossless: true, effort: 6 }).toBuffer();
  return { buffer, width: reference.width, height: reference.height };
}

function stableNodeName(object, counters) {
  const sourceName = object.name.toLowerCase();
  const materialName = (Array.isArray(object.material) ? object.material[0] : object.material)?.name?.toLowerCase() ?? "";
  const fixed = {
    "main planet": "MainPlanet",
    "main crystal": "MainCrystal",
    "small crystal planet": "SmallCrystalPlanet",
    "tree planet": "TreePlanet",
    "small rocks": "SmallRocks",
    "tree bark": "TreeBark",
    twig: "TreeTwigs",
    leaves: "TreeLeaves",
    "ring saturn": "SaturnRing",
    saturn: "SaturnBody",
  }[materialName];
  if (fixed) return fixed;
  if (sourceName.startsWith("cube")) {
    const name = `Crystal_${String(counters.crystal).padStart(3, "0")}`;
    counters.crystal += 1;
    return name;
  }
  const name = `Part_${String(counters.part).padStart(3, "0")}`;
  counters.part += 1;
  return name;
}

function normalizeBox(box, sourceBounds, sourceCenter) {
  return {
    min: [box.min.x - sourceCenter.x, box.min.y - sourceBounds.min.y, box.min.z - sourceCenter.z],
    max: [box.max.x - sourceCenter.x, box.max.y - sourceBounds.min.y, box.max.z - sourceCenter.z],
  };
}

function colliderFromBounds(name, nodeName, bounds, shape) {
  const min = bounds.min;
  const max = bounds.max;
  const center = min.map((value, index) => (value + max[index]) / 2);
  const size = min.map((value, index) => max[index] - value);
  return {
    name,
    node: nodeName,
    shape,
    center,
    size,
    topY: max[1],
    ...(shape === "ellipsoid" ? { radii: size.map((value) => value / 2) } : {}),
  };
}

function validateGlb(glb) {
  const errors = [];
  if (glb.readUInt32LE(0) !== 0x46546c67) errors.push("invalid GLB magic");
  if (glb.readUInt32LE(4) !== 2) errors.push("GLB version is not 2");
  if (glb.readUInt32LE(8) !== glb.length) errors.push("GLB header length mismatch");
  const jsonLength = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString("utf8").trim());
  const binaryHeaderOffset = 20 + jsonLength;
  const binaryLength = glb.readUInt32LE(binaryHeaderOffset);
  const binaryOffset = binaryHeaderOffset + 8;
  if (glb.readUInt32LE(16) !== 0x4e4f534a) errors.push("missing JSON chunk");
  if (glb.readUInt32LE(binaryHeaderOffset + 4) !== 0x004e4942) errors.push("missing BIN chunk");
  if (binaryOffset + binaryLength !== glb.length) errors.push("BIN chunk length mismatch");
  if (json.buffers?.[0]?.uri) errors.push("embedded GLB buffer unexpectedly has a URI");
  for (const [index, view] of (json.bufferViews ?? []).entries()) {
    const start = view.byteOffset ?? 0;
    if (start % 4 !== 0) errors.push(`bufferView ${index} is not 4-byte aligned`);
    if (start + view.byteLength > binaryLength) errors.push(`bufferView ${index} exceeds BIN chunk`);
  }
  for (const [index, image] of (json.images ?? []).entries()) {
    if (image.uri) errors.push(`image ${index} is external`);
    if (image.mimeType !== "image/webp") errors.push(`image ${index} is not WebP`);
    const view = json.bufferViews?.[image.bufferView];
    const bytes = view
      ? glb.subarray(binaryOffset + (view.byteOffset ?? 0), binaryOffset + (view.byteOffset ?? 0) + 12)
      : Buffer.alloc(0);
    if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") {
      errors.push(`image ${index} has an invalid WebP signature`);
    }
  }
  for (const [index, accessor] of (json.accessors ?? []).entries()) {
    if (!json.bufferViews?.[accessor.bufferView]) errors.push(`accessor ${index} has no bufferView`);
    if (!(accessor.count > 0)) errors.push(`accessor ${index} has an invalid count`);
  }
  if ((json.animations ?? []).length !== 0) errors.push("unexpected animation data");
  if (!json.extensionsRequired?.includes("EXT_texture_webp")) errors.push("EXT_texture_webp is not required");
  if (errors.length) throw new Error(`GLB validation failed:\n- ${errors.join("\n- ")}`);
  return {
    valid: true,
    version: json.asset.version,
    scenes: json.scenes.length,
    nodes: json.nodes.length,
    meshes: json.meshes.length,
    materials: json.materials.length,
    embeddedImages: json.images.length,
    externalUris: 0,
    extensionsRequired: json.extensionsRequired,
  };
}

const archive = await fs.readFile(archivePath);
const entries = readZip(archive);
const fbxEntry = requiredEntry(entries, SOURCE_FBX);
const licenseEntries = [...entries.values()]
  .map((entry) => entry.name)
  .filter((name) => /(^|\/)(license|licence|copying|credits?|attribution|readme)([._-]|$)/i.test(name));
const source = parseFbx(fbxEntry.data);
source.updateWorldMatrix(true, true);
await MeshoptEncoder.ready;

const sourceBounds = new THREE.Box3().setFromObject(source);
const sourceCenter = sourceBounds.getCenter(new THREE.Vector3());
const sourceSize = sourceBounds.getSize(new THREE.Vector3());
const recenterMatrix = new THREE.Matrix4().makeTranslation(-sourceCenter.x, -sourceBounds.min.y, -sourceCenter.z);
const sourceMeshes = [];
source.traverse((object) => {
  if (object instanceof THREE.Mesh) sourceMeshes.push(object);
});
if (sourceMeshes.length !== 104) throw new Error(`Expected 104 source meshes, found ${sourceMeshes.length}`);

const textureRecords = [];
for (const [materialKey, definition] of Object.entries(materialDefinitions)) {
  const prefix = `textures/space_scene_${definition.textureStem}`;
  const sources = {
    baseColor: optionalEntry(entries, `${prefix}_BaseColor.png`),
    emissive: optionalEntry(entries, `${prefix}_Emissive.png`),
    normal: optionalEntry(entries, `${prefix}_Normal.png`),
    roughness: optionalEntry(entries, `${prefix}_Roughness.png`),
    metallic: optionalEntry(entries, `${prefix}_Metallic.png`),
  };
  if (!sources.baseColor) throw new Error(`Missing base color texture for ${materialKey}`);
  for (const kind of ["baseColor", "emissive", "normal"]) {
    if (!sources[kind]) continue;
    const processed = await resizeWebp(sources[kind], kind);
    textureRecords.push({ materialKey, kind, source: sources[kind], ...processed });
  }
  const packed = await packMetallicRoughness(sources.roughness, sources.metallic);
  if (packed) textureRecords.push({
    materialKey,
    kind: "metallicRoughness",
    source: sources.roughness,
    additionalSource: sources.metallic,
    ...packed,
  });
}

const builder = new BinaryBuilder();
const images = [];
const textures = [];
for (const record of textureRecords) {
  const imageIndex = images.push({
    name: `${record.materialKey}_${record.kind}`,
    bufferView: builder.append(record.buffer, { name: `image_${record.materialKey}_${record.kind}` }),
    mimeType: "image/webp",
  }) - 1;
  record.textureIndex = textures.push({
    name: `${record.materialKey}_${record.kind}`,
    sampler: 0,
    extensions: { EXT_texture_webp: { source: imageIndex } },
  }) - 1;
}

const textureFor = (materialKey, kind) => textureRecords.find(
  (record) => record.materialKey === materialKey && record.kind === kind,
);
const materials = Object.entries(materialDefinitions).map(([materialKey, definition]) => {
  const baseColor = textureFor(materialKey, "baseColor");
  const emissive = textureFor(materialKey, "emissive");
  const normal = textureFor(materialKey, "normal");
  const metallicRoughness = textureFor(materialKey, "metallicRoughness");
  return {
    name: `CrystalPlanet_${materialKey}`,
    pbrMetallicRoughness: {
      baseColorFactor: [1, 1, 1, 1],
      baseColorTexture: { index: baseColor.textureIndex },
      metallicFactor: definition.metallicFactor,
      roughnessFactor: definition.roughnessFactor,
      ...(metallicRoughness ? { metallicRoughnessTexture: { index: metallicRoughness.textureIndex } } : {}),
    },
    ...(normal ? { normalTexture: { index: normal.textureIndex, scale: 1 } } : {}),
    ...(emissive ? { emissiveFactor: [1, 1, 1], emissiveTexture: { index: emissive.textureIndex } } : {}),
    ...(definition.doubleSided ? { doubleSided: true } : {}),
    extras: { materialRole: materialKey, sourceTextureStem: definition.textureStem },
  };
});
const materialIndexByKey = new Map(Object.keys(materialDefinitions).map((key, index) => [key, index]));

const accessors = [];
const gltfMeshes = [];
const nodes = [{
  name: "CrystalPlanet",
  children: sourceMeshes.map((_, index) => index + 1),
  extras: {
    sourceArchive: path.basename(archivePath),
    sourceFile: fbxEntry.name,
    sourceUpAxis: "+Y",
    sourceFrontAxis: "+Z",
    normalizedOrigin: "XZ centered; lowest source point at Y=0",
    recommendedWorldScale: 0.02,
  },
}];
const geometryCache = new Map();
const meshRecords = [];
const counters = { crystal: 0, part: 0 };

for (const object of sourceMeshes) {
  const sourceMaterials = (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean);
  if (sourceMaterials.length !== 1) throw new Error(`${object.name} has ${sourceMaterials.length} materials; expected one`);
  const sourceMaterialName = sourceMaterials[0].name.toLowerCase();
  const materialKey = sourceMaterialToKey.get(sourceMaterialName);
  if (!materialKey) throw new Error(`Unmapped source material: ${sourceMaterials[0].name}`);
  const optimized = optimizeGeometry(object.geometry);
  const cacheKey = `${geometryHash(optimized)}:${materialKey}`;
  let meshIndex = geometryCache.get(cacheKey);
  if (meshIndex === undefined) {
    const roleName = `Geometry_${String(gltfMeshes.length).padStart(3, "0")}`;
    const positionView = builder.append(optimized.positions, { target: 34962, name: `${roleName}_POSITION` });
    const normalView = builder.append(optimized.normals, { target: 34962, name: `${roleName}_NORMAL` });
    const uvView = builder.append(optimized.uvs, { target: 34962, name: `${roleName}_TEXCOORD_0` });
    const indexView = builder.append(optimized.indices, { target: 34963, name: `${roleName}_INDICES` });
    const positionBounds = range(optimized.positions, 3);
    const positionAccessor = accessors.push({
      name: `${roleName}_POSITION`, bufferView: positionView, componentType: 5126,
      count: optimized.positions.length / 3, type: "VEC3", min: positionBounds.min, max: positionBounds.max,
    }) - 1;
    const normalAccessor = accessors.push({
      name: `${roleName}_NORMAL`, bufferView: normalView, componentType: 5126,
      count: optimized.normals.length / 3, type: "VEC3",
    }) - 1;
    const uvAccessor = accessors.push({
      name: `${roleName}_TEXCOORD_0`, bufferView: uvView, componentType: 5126,
      count: optimized.uvs.length / 2, type: "VEC2",
    }) - 1;
    const indexAccessor = accessors.push({
      name: `${roleName}_INDICES`, bufferView: indexView,
      componentType: optimized.indices instanceof Uint16Array ? 5123 : 5125,
      count: optimized.indices.length, type: "SCALAR", min: [0], max: [optimized.positions.length / 3 - 1],
    }) - 1;
    meshIndex = gltfMeshes.push({
      name: roleName,
      primitives: [{
        attributes: { POSITION: positionAccessor, NORMAL: normalAccessor, TEXCOORD_0: uvAccessor },
        indices: indexAccessor,
        material: materialIndexByKey.get(materialKey),
        mode: 4,
      }],
      extras: { materialRole: materialKey, geometryOptimization: "lossless deduplication and cache/size reordering" },
    }) - 1;
    geometryCache.set(cacheKey, meshIndex);
  }
  const nodeName = stableNodeName(object, counters);
  const nodeMatrix = recenterMatrix.clone().multiply(object.matrixWorld);
  const normalizedBounds = normalizeBox(new THREE.Box3().setFromObject(object), sourceBounds, sourceCenter);
  const descriptor = {
    name: nodeName,
    mesh: meshIndex,
    matrix: nodeMatrix.toArray(),
    extras: {
      sourceName: object.name,
      sourceMaterialName: sourceMaterials[0].name,
      materialRole: materialKey,
      normalizedBounds,
      collisionRole: ["MainPlanet", "SmallCrystalPlanet", "TreePlanet", "SaturnBody", "SmallRocks"].includes(nodeName)
        ? "platform-candidate"
        : "decoration",
    },
  };
  nodes.push(descriptor);
  const position = object.geometry.getAttribute("position");
  meshRecords.push({
    nodeName,
    sourceName: object.name,
    materialRole: materialKey,
    meshIndex,
    sourceVertices: position.count,
    sourceTriangles: object.geometry.index ? object.geometry.index.count / 3 : position.count / 3,
    normalizedBounds,
  });
}

const recordsByName = new Map(meshRecords.map((record) => [record.nodeName, record]));
const collisionProxies = [
  colliderFromBounds("MainPlanetSurface", "MainPlanet", recordsByName.get("MainPlanet").normalizedBounds, "ellipsoid"),
  colliderFromBounds("SmallCrystalPlanetSurface", "SmallCrystalPlanet", recordsByName.get("SmallCrystalPlanet").normalizedBounds, "ellipsoid"),
  colliderFromBounds("TreePlanetSurface", "TreePlanet", recordsByName.get("TreePlanet").normalizedBounds, "ellipsoid"),
  colliderFromBounds("SaturnSurface", "SaturnBody", recordsByName.get("SaturnBody").normalizedBounds, "ellipsoid"),
  colliderFromBounds("SmallRocksSurface", "SmallRocks", recordsByName.get("SmallRocks").normalizedBounds, "box"),
];

const binary = builder.finish();
const gltf = {
  asset: {
    version: "2.0",
    generator: "Press Q Crystal Planet deterministic web pipeline",
    extras: {
      sourceArchiveSha256: sha256(archive),
      sourceFbxSha256: sha256(fbxEntry.data),
      licenseStatus: licenseEntries.length ? "supplied in archive" : "not supplied in archive",
    },
  },
  extensionsUsed: ["EXT_texture_webp"],
  extensionsRequired: ["EXT_texture_webp"],
  scene: 0,
  scenes: [{ name: "CrystalPlanetScene", nodes: [0] }],
  nodes,
  meshes: gltfMeshes,
  materials,
  samplers: [{ name: "LinearMipmapRepeat", magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
  textures,
  images,
  accessors,
  bufferViews: builder.bufferViews,
  buffers: [{ byteLength: binary.length }],
};

const glb = createGlb(gltf, binary);
const validation = validateGlb(glb);
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, glb);

const totalSourceTriangles = meshRecords.reduce((sum, mesh) => sum + mesh.sourceTriangles, 0);
const report = {
  source: {
    archive: path.basename(archivePath),
    archiveBytes: archive.length,
    archiveSha256: sha256(archive),
    fbx: fbxEntry.name,
    fbxBytes: fbxEntry.data.length,
    fbxSha256: sha256(fbxEntry.data),
    format: "Autodesk FBX 7.5 binary",
    orientation: { up: "+Y", front: "+Z" },
    unitScaleFactor: 1,
    bounds: { min: sourceBounds.min.toArray(), max: sourceBounds.max.toArray(), size: sourceSize.toArray() },
    meshes: sourceMeshes.length,
    triangles: totalSourceTriangles,
    animations: source.animations.map((clip) => ({ name: clip.name, duration: clip.duration, tracks: clip.tracks.length })),
    license: {
      status: licenseEntries.length ? "provided" : "not-provided",
      files: licenseEntries,
      publicationNote: licenseEntries.length
        ? "Review the supplied license before publishing."
        : "The archive contains no license or attribution document; confirm publication rights with the asset source.",
    },
  },
  output: {
    file: path.basename(outputPath),
    bytes: glb.length,
    sha256: sha256(glb),
    orientation: { up: "+Y", front: "+Z" },
    origin: "centered in X/Z with the lowest source point at Y=0",
    geometry: "exact source topology; repeated geometry instanced; lossless vertex deduplication and meshoptimizer reordering",
    sourceMeshInstances: sourceMeshes.length,
    uniqueMeshes: gltfMeshes.length,
    triangles: totalSourceTriangles,
    animations: 0,
    textures: { format: "WebP", maximumSize: TEXTURE_SIZE, embedded: textureRecords.length },
  },
  integration: {
    recommendedWorldScale: 0.02,
    scaledSize: sourceSize.toArray().map((value) => value * 0.02),
    placement: "Place near a stage corner/boundary, inset by at least half scaled X/Z footprint plus 1 world unit.",
    recommendedFormula: "x = stageBounds.max.x - scaledSize.x / 2 - 1; z = stageBounds.max.z - scaledSize.z / 2 - 1",
    platformMeshNames: collisionProxies.map((proxy) => proxy.node),
    collisionProxies,
    note: "Proxy coordinates and sizes are in model space after recentering; multiply by the root world scale and add root position.",
  },
  meshes: meshRecords,
  images: textureRecords.map((record) => ({
    materialRole: record.materialKey,
    kind: record.kind,
    source: record.source?.name ?? null,
    additionalSource: record.additionalSource?.name ?? null,
    outputSize: [record.width, record.height],
    bytes: record.buffer.length,
    embedded: true,
  })),
  validation,
};
await fs.writeFile(statsPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(
  sourceNotePath,
  `# Crystal Planet asset source\n\n` +
    `Input archive: \`${path.basename(archivePath)}\`  \n` +
    `Archive SHA-256: \`${report.source.archiveSha256}\`  \n` +
    `Source model: \`${fbxEntry.name}\`  \n` +
    `Source FBX SHA-256: \`${report.source.fbxSha256}\`\n\n` +
    `No license, attribution, README, or provenance document was included in the supplied archive. ` +
    `Confirm the right to publish and redistribute this asset before a public release.\n\n` +
    `The generated GLB preserves source topology, instances repeated geometry, recenters the model, ` +
    `and embeds 1024 px WebP textures. Rebuild with:\n\n` +
    `\`\`\`powershell\nnode scripts/prepare-crystal-planet.mjs C:\\path\\to\\crystal-planet.zip\n\`\`\`\n`,
  "utf8",
);

console.log(`Source: ${archivePath}`);
console.log(`FBX: ${sourceMeshes.length} mesh instances; ${totalSourceTriangles} triangles; no animations`);
console.log(`Bounds: ${sourceSize.toArray().map((value) => value.toFixed(4)).join(" x ")} (+Y up)`);
console.log(`Geometry: ${sourceMeshes.length} instances -> ${gltfMeshes.length} unique GLTF meshes`);
console.log(`Output: ${outputPath} (${glb.length} bytes)`);
console.log(`SHA-256: ${report.output.sha256}`);
console.log(`Validation: valid GLB 2.0; ${validation.embeddedImages} embedded WebP textures; no external URIs`);
if (!licenseEntries.length) console.warn("License: no license or attribution file was included in the source archive.");
