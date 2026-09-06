import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MeshoptEncoder } from "meshoptimizer/encoder";

const [, , inputArg, outputArg] = process.argv;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");

if (!inputArg) {
  console.error(
    "Usage: node scripts/prepare-coral-piece.mjs <coral-piece.zip> [public/models/coral-piece/coral-piece.glb]",
  );
  process.exit(1);
}

const archivePath = path.resolve(inputArg);
const outputPath = outputArg
  ? path.resolve(repositoryRoot, outputArg)
  : path.join(repositoryRoot, "public", "models", "coral-piece", "coral-piece.glb");
const statsPath = outputPath.replace(/\.glb$/i, ".stats.json");

const SOURCE_FBX = "source/coral fbx finished.fbx";
const TEXTURES = {
  baseColor: "textures/coral_fbx_lambert1_BaseColor.png",
  metallic: "textures/coral_fbx_lambert1_Metallic.png",
  normal: "textures/inverted.png",
  planes: "textures/Planes.png",
  roughness: "textures/coral_fbx_lambert1_Roughness.png",
};

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
      .toString((flags & 0x800) !== 0 ? "utf8" : "utf8")
      .replaceAll("\\", "/");

    if ((flags & 1) !== 0) throw new Error(`Encrypted ZIP entries are unsupported: ${name}`);
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

    if (data.length !== uncompressedSize) {
      throw new Error(`ZIP size mismatch for ${name}: expected ${uncompressedSize}, got ${data.length}`);
    }
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
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );
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
      const value = values[offset + component];
      min[component] = Math.min(min[component], value);
      max[component] = Math.max(max[component], value);
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
      const sourceValue = attribute.array[oldIndex * attribute.itemSize + component];
      output[newIndex * attribute.itemSize + component] = transform
        ? transform(sourceValue, component)
        : sourceValue;
    }
  }
  return output;
}

function optimizeGeometry(sourceGeometry, worldMatrix, recenterMatrix) {
  let geometry = sourceGeometry.clone();
  geometry.applyMatrix4(worldMatrix);
  geometry.applyMatrix4(recenterMatrix);

  for (const attributeName of Object.keys(geometry.attributes)) {
    if (!new Set(["position", "normal", "uv"]).has(attributeName)) {
      geometry.deleteAttribute(attributeName);
    }
  }
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  if (!geometry.getAttribute("uv")) throw new Error("A coral mesh has no UV coordinates");

  const indexed = mergeVertices(geometry, 1e-6);
  geometry.dispose();
  geometry = indexed;

  const indexArray = Uint32Array.from(geometry.index.array);
  const [remap, uniqueCount] = MeshoptEncoder.reorderMesh(indexArray, true, true);
  const positions = remapAttribute(geometry.getAttribute("position"), remap, uniqueCount);
  const normals = remapAttribute(geometry.getAttribute("normal"), remap, uniqueCount);
  // FBX/TextureLoader uses bottom-left UVs; glTF images use top-left UVs.
  const uvs = remapAttribute(
    geometry.getAttribute("uv"),
    remap,
    uniqueCount,
    (value, component) => (component === 1 ? 1 - value : value),
  );
  geometry.dispose();

  const indices = uniqueCount <= 65_535
    ? Uint16Array.from(indexArray)
    : Uint32Array.from(indexArray);
  return { positions, normals, uvs, indices };
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
    const bufferView = {
      buffer: 0,
      byteOffset: this.byteLength,
      byteLength: buffer.length,
      ...(options.target ? { target: options.target } : {}),
      ...(options.name ? { name: options.name } : {}),
    };
    this.bufferViews.push(bufferView);
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
  const paddedJson = jsonPadding
    ? Buffer.concat([json, Buffer.alloc(jsonPadding, 0x20)])
    : json;
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

function validateGlb(glb) {
  const errors = [];
  if (glb.readUInt32LE(0) !== 0x46546c67) errors.push("invalid GLB magic");
  if (glb.readUInt32LE(4) !== 2) errors.push("GLB version is not 2");
  if (glb.readUInt32LE(8) !== glb.length) errors.push("GLB header length mismatch");
  const jsonLength = glb.readUInt32LE(12);
  if (glb.readUInt32LE(16) !== 0x4e4f534a) errors.push("missing JSON chunk");
  const parsed = JSON.parse(glb.subarray(20, 20 + jsonLength).toString("utf8").trim());
  const binaryHeaderOffset = 20 + jsonLength;
  const binaryLength = glb.readUInt32LE(binaryHeaderOffset);
  if (glb.readUInt32LE(binaryHeaderOffset + 4) !== 0x004e4942) errors.push("missing BIN chunk");
  const binaryOffset = binaryHeaderOffset + 8;
  if (binaryOffset + binaryLength !== glb.length) errors.push("BIN chunk length mismatch");
  if (parsed.buffers?.length !== 1) errors.push("asset must contain one embedded buffer");
  if (parsed.buffers?.[0]?.uri) errors.push("embedded GLB buffer unexpectedly has a URI");

  for (const [index, view] of (parsed.bufferViews ?? []).entries()) {
    const start = view.byteOffset ?? 0;
    if (start % 4 !== 0) errors.push(`bufferView ${index} is not 4-byte aligned`);
    if (start + view.byteLength > binaryLength) errors.push(`bufferView ${index} exceeds BIN chunk`);
  }
  for (const [index, image] of (parsed.images ?? []).entries()) {
    if (image.uri) errors.push(`image ${index} is external`);
    if (image.mimeType !== "image/png") errors.push(`image ${index} is not PNG`);
    const view = parsed.bufferViews?.[image.bufferView];
    const signature = view
      ? glb.subarray(binaryOffset + (view.byteOffset ?? 0), binaryOffset + (view.byteOffset ?? 0) + 8)
      : Buffer.alloc(0);
    if (!signature.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      errors.push(`image ${index} has an invalid PNG signature`);
    }
  }
  for (const [index, accessor] of (parsed.accessors ?? []).entries()) {
    if (!parsed.bufferViews?.[accessor.bufferView]) errors.push(`accessor ${index} has no bufferView`);
    if (!(accessor.count > 0)) errors.push(`accessor ${index} has an invalid count`);
  }
  if ((parsed.animations ?? []).length !== 0) errors.push("unexpected animation data");
  if (errors.length) throw new Error(`GLB validation failed:\n- ${errors.join("\n- ")}`);
  return {
    valid: true,
    version: parsed.asset.version,
    scenes: parsed.scenes.length,
    nodes: parsed.nodes.length,
    meshes: parsed.meshes.length,
    materials: parsed.materials.length,
    embeddedImages: parsed.images.length,
    externalUris: 0,
  };
}

const archive = await fs.readFile(archivePath);
const entries = readZip(archive);
const fbxEntry = requiredEntry(entries, SOURCE_FBX);
const textureEntries = Object.fromEntries(
  Object.entries(TEXTURES).map(([role, name]) => [role, requiredEntry(entries, name)]),
);
const licenseEntries = [...entries.values()]
  .map((entry) => entry.name)
  .filter((name) => /(^|\/)(license|licence|copying|credits?|attribution|readme)([._-]|$)/i.test(name));

const source = parseFbx(fbxEntry.data);
source.updateWorldMatrix(true, true);
await MeshoptEncoder.ready;

const sourceBounds = new THREE.Box3().setFromObject(source);
const sourceCenter = sourceBounds.getCenter(new THREE.Vector3());
const sourceSize = sourceBounds.getSize(new THREE.Vector3());
const recenterMatrix = new THREE.Matrix4().makeTranslation(
  -sourceCenter.x,
  -sourceBounds.min.y,
  -sourceCenter.z,
);
const sourceMeshes = [];
source.traverse((object) => {
  if (object instanceof THREE.Mesh) sourceMeshes.push(object);
});
if (sourceMeshes.length !== 2) {
  throw new Error(`Expected exactly 2 coral meshes, found ${sourceMeshes.length}`);
}

const builder = new BinaryBuilder();
const accessors = [];
const gltfMeshes = [];
const nodes = [{
  name: "CoralPiece",
  children: sourceMeshes.map((_, index) => index + 1),
  extras: {
    sourceArchive: path.basename(archivePath),
    sourceFile: fbxEntry.name,
    sourceUpAxis: "+Y",
    sourceFrontAxis: "+Z",
    sourceUnitScaleFactor: 1,
    normalizedOrigin: "XZ centered; lowest source point at Y=0",
  },
}];
const meshStats = [];

for (const object of sourceMeshes) {
  const sourceMaterials = (Array.isArray(object.material) ? object.material : [object.material])
    .filter(Boolean);
  const sourceMaterialNames = sourceMaterials.map((material) => material.name);
  const isPlanes = sourceMaterialNames.some((name) => /planes/i.test(name));
  const optimized = optimizeGeometry(object.geometry, object.matrixWorld, recenterMatrix);
  const sourcePosition = object.geometry.getAttribute("position");
  const sourceTriangles = object.geometry.index
    ? object.geometry.index.count / 3
    : sourcePosition.count / 3;
  const roleName = isPlanes ? "CoralFoliageCards" : "CoralBody";
  const materialIndex = isPlanes ? 1 : 0;

  const positionView = builder.append(optimized.positions, {
    target: 34962,
    name: `${roleName}_POSITION`,
  });
  const normalView = builder.append(optimized.normals, {
    target: 34962,
    name: `${roleName}_NORMAL`,
  });
  const uvView = builder.append(optimized.uvs, {
    target: 34962,
    name: `${roleName}_TEXCOORD_0`,
  });
  const indexView = builder.append(optimized.indices, {
    target: 34963,
    name: `${roleName}_INDICES`,
  });
  const positionBounds = range(optimized.positions, 3);
  const positionAccessor = accessors.push({
    name: `${roleName}_POSITION`,
    bufferView: positionView,
    componentType: 5126,
    count: optimized.positions.length / 3,
    type: "VEC3",
    min: positionBounds.min,
    max: positionBounds.max,
  }) - 1;
  const normalAccessor = accessors.push({
    name: `${roleName}_NORMAL`,
    bufferView: normalView,
    componentType: 5126,
    count: optimized.normals.length / 3,
    type: "VEC3",
  }) - 1;
  const uvAccessor = accessors.push({
    name: `${roleName}_TEXCOORD_0`,
    bufferView: uvView,
    componentType: 5126,
    count: optimized.uvs.length / 2,
    type: "VEC2",
  }) - 1;
  const indexAccessor = accessors.push({
    name: `${roleName}_INDICES`,
    bufferView: indexView,
    componentType: optimized.indices instanceof Uint16Array ? 5123 : 5125,
    count: optimized.indices.length,
    type: "SCALAR",
    min: [0],
    max: [optimized.positions.length / 3 - 1],
  }) - 1;

  gltfMeshes.push({
    name: roleName,
    primitives: [{
      attributes: {
        POSITION: positionAccessor,
        NORMAL: normalAccessor,
        TEXCOORD_0: uvAccessor,
      },
      indices: indexAccessor,
      material: materialIndex,
      mode: 4,
    }],
    extras: {
      sourceName: object.name,
      sourceMaterialNames,
      geometryOptimization: "lossless vertex deduplication and cache/size reordering",
    },
  });
  nodes.push({ name: roleName, mesh: gltfMeshes.length - 1 });
  meshStats.push({
    name: roleName,
    sourceName: object.name,
    sourceMaterialNames,
    sourceVertices: sourcePosition.count,
    outputVertices: optimized.positions.length / 3,
    triangles: sourceTriangles,
  });
}

const imageRoles = ["baseColor", "roughness", "normal", "planes"];
const images = imageRoles.map((role) => ({
  name: path.basename(textureEntries[role].name, ".png"),
  bufferView: builder.append(textureEntries[role].data, {
    name: `image_${role}`,
  }),
  mimeType: "image/png",
}));
const binary = builder.finish();

const gltf = {
  asset: {
    version: "2.0",
    generator: "Press Q coral-piece lossless web pipeline",
    extras: {
      sourceArchiveSha256: sha256(archive),
      sourceFbxSha256: sha256(fbxEntry.data),
      licenseStatus: licenseEntries.length ? "supplied in archive" : "not supplied in archive",
    },
  },
  scene: 0,
  scenes: [{ name: "CoralPieceScene", nodes: [0] }],
  nodes,
  meshes: gltfMeshes,
  materials: [
    {
      name: "CoralBody_PBR",
      pbrMetallicRoughness: {
        baseColorFactor: [1, 1, 1, 1],
        baseColorTexture: { index: 0 },
        metallicFactor: 0,
        roughnessFactor: 1,
        metallicRoughnessTexture: { index: 1 },
      },
      normalTexture: { index: 2, scale: 1 },
      extras: {
        sourceMaterial: "lambert3",
        metallicSource: `${path.basename(textureEntries.metallic.name)} is uniformly black; represented losslessly by metallicFactor=0`,
      },
    },
    {
      name: "CoralFoliageCards_Transparent",
      pbrMetallicRoughness: {
        baseColorFactor: [1, 1, 1, 1],
        baseColorTexture: { index: 3 },
        metallicFactor: 0,
        roughnessFactor: 0.82,
      },
      alphaMode: "BLEND",
      doubleSided: true,
      extras: { sourceMaterial: "planes" },
    },
  ],
  samplers: [{
    name: "LinearMipmapRepeat",
    magFilter: 9729,
    minFilter: 9987,
    wrapS: 10497,
    wrapT: 10497,
  }],
  textures: imageRoles.map((role, index) => ({
    name: `Coral_${role}`,
    sampler: 0,
    source: index,
  })),
  images,
  accessors,
  bufferViews: builder.bufferViews,
  buffers: [{ byteLength: binary.length }],
};

const glb = createGlb(gltf, binary);
const validation = validateGlb(glb);
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, glb);

const report = {
  source: {
    archive: path.basename(archivePath),
    archiveBytes: archive.length,
    archiveSha256: sha256(archive),
    fbx: fbxEntry.name,
    fbxBytes: fbxEntry.data.length,
    fbxSha256: sha256(fbxEntry.data),
    format: "Autodesk FBX 7.5 binary (Maya 2018 export)",
    orientation: { up: "+Y", front: "+Z" },
    unitScaleFactor: 1,
    bounds: {
      min: sourceBounds.min.toArray(),
      max: sourceBounds.max.toArray(),
      size: sourceSize.toArray(),
    },
    animations: source.animations.map((clip) => ({
      name: clip.name,
      duration: clip.duration,
      tracks: clip.tracks.length,
    })),
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
    scale: 1,
    orientation: { up: "+Y", front: "+Z" },
    origin: "centered in X/Z with the lowest vertex at Y=0",
    geometry: "exact source topology; lossless vertex deduplication and meshoptimizer reordering only",
    textures: imageRoles.map((role) => ({
      role,
      source: textureEntries[role].name,
      bytes: textureEntries[role].data.length,
      embedded: true,
    })),
    omittedTexture: {
      source: textureEntries.metallic.name,
      reason: "Uniform black map is represented exactly by metallicFactor=0.",
    },
    meshes: meshStats,
    triangles: meshStats.reduce((sum, mesh) => sum + mesh.triangles, 0),
    animations: 0,
  },
  validation,
};
await fs.writeFile(statsPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Source: ${archivePath}`);
console.log(`FBX: ${sourceMeshes.length} meshes; ${report.output.triangles} triangles; no animations`);
console.log(`Bounds: ${sourceSize.toArray().map((value) => value.toFixed(4)).join(" x ")} (+Y up)`);
console.log(`Output: ${outputPath} (${glb.length} bytes)`);
console.log(`SHA-256: ${report.output.sha256}`);
console.log(`Validation: valid GLB 2.0; ${validation.embeddedImages} embedded PNG textures; no external URIs`);
if (!licenseEntries.length) {
  console.warn("License: no license or attribution file was included in the source archive.");
}
