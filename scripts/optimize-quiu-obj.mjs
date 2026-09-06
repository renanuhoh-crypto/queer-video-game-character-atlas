import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { MeshoptSimplifier } from "meshoptimizer";

const [, , inputArg, outputArg, targetArg = "60000"] = process.argv;

if (!inputArg || !outputArg) {
  console.error(
    "Usage: node scripts/optimize-quiu-obj.mjs <input.obj> <output.glb> [targetTriangles]",
  );
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg);
const targetTriangles = Math.max(1000, Number.parseInt(targetArg, 10) || 60000);

function resolveObjIndex(value, length) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed === 0) return -1;
  return parsed > 0 ? parsed - 1 : length + parsed;
}

async function parseObj(filePath) {
  const sourcePositions = [];
  const sourceNormals = [];
  const sourceUvs = [];
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const vertices = new Map();

  const lines = readline.createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });

  const vertexIndex = (token) => {
    const cached = vertices.get(token);
    if (cached !== undefined) return cached;

    const [positionToken, uvToken, normalToken] = token.split("/");
    const positionIndex = resolveObjIndex(positionToken, sourcePositions.length / 3);
    const uvIndex = resolveObjIndex(uvToken, sourceUvs.length / 2);
    const normalIndex = resolveObjIndex(normalToken, sourceNormals.length / 3);

    if (positionIndex < 0) throw new Error(`Invalid OBJ position index: ${token}`);

    const next = positions.length / 3;
    positions.push(
      sourcePositions[positionIndex * 3],
      sourcePositions[positionIndex * 3 + 1],
      sourcePositions[positionIndex * 3 + 2],
    );
    uvs.push(
      uvIndex >= 0 ? sourceUvs[uvIndex * 2] : 0,
      uvIndex >= 0 ? 1 - sourceUvs[uvIndex * 2 + 1] : 0,
    );
    normals.push(
      normalIndex >= 0 ? sourceNormals[normalIndex * 3] : 0,
      normalIndex >= 0 ? sourceNormals[normalIndex * 3 + 1] : 0,
      normalIndex >= 0 ? sourceNormals[normalIndex * 3 + 2] : 1,
    );
    vertices.set(token, next);
    return next;
  };

  for await (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("v ")) {
      const values = line.slice(2).trim().split(/\s+/).map(Number);
      sourcePositions.push(values[0], values[1], values[2]);
    } else if (line.startsWith("vn ")) {
      const values = line.slice(3).trim().split(/\s+/).map(Number);
      sourceNormals.push(values[0], values[1], values[2]);
    } else if (line.startsWith("vt ")) {
      const values = line.slice(3).trim().split(/\s+/).map(Number);
      sourceUvs.push(values[0], values[1]);
    } else if (line.startsWith("f ")) {
      const face = line.slice(2).trim().split(/\s+/);
      const first = vertexIndex(face[0]);
      for (let index = 1; index < face.length - 1; index += 1) {
        indices.push(first, vertexIndex(face[index]), vertexIndex(face[index + 1]));
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(indices),
  };
}

function compactAttributes(indices, positions, normals, uvs) {
  const [remap, vertexCount] = MeshoptSimplifier.compactMesh(indices);
  const compactPositions = new Float32Array(vertexCount * 3);
  const compactNormals = new Float32Array(vertexCount * 3);
  const compactUvs = new Float32Array(vertexCount * 2);

  for (let oldIndex = 0; oldIndex < remap.length; oldIndex += 1) {
    const newIndex = remap[oldIndex];
    if (newIndex === 0xffffffff) continue;
    compactPositions.set(positions.subarray(oldIndex * 3, oldIndex * 3 + 3), newIndex * 3);
    compactNormals.set(normals.subarray(oldIndex * 3, oldIndex * 3 + 3), newIndex * 3);
    compactUvs.set(uvs.subarray(oldIndex * 2, oldIndex * 2 + 2), newIndex * 2);
  }

  return { positions: compactPositions, normals: compactNormals, uvs: compactUvs };
}

function bounds(values, stride) {
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

function createGlb({ positions, normals, uvs, indices }) {
  const chunks = [];
  let byteOffset = 0;
  const bufferViews = [];

  const append = (typedArray, target) => {
    const padding = (4 - (byteOffset % 4)) % 4;
    if (padding) {
      chunks.push(Buffer.alloc(padding));
      byteOffset += padding;
    }
    const buffer = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    const view = { buffer: 0, byteOffset, byteLength: buffer.length, target };
    bufferViews.push(view);
    chunks.push(buffer);
    byteOffset += buffer.length;
    return bufferViews.length - 1;
  };

  const positionView = append(positions, 34962);
  const normalView = append(normals, 34962);
  const uvView = append(uvs, 34962);
  const indexView = append(indices, 34963);
  const positionBounds = bounds(positions, 3);

  const gltf = {
    asset: { version: "2.0", generator: "Press Q meshoptimizer pipeline" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: "Quiu", mesh: 0 }],
    meshes: [{
      name: "Quiu web mesh",
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 },
        indices: 3,
        material: 0,
      }],
    }],
    materials: [{
      name: "Quiu PBR",
      pbrMetallicRoughness: {
        baseColorTexture: { index: 0 },
        metallicRoughnessTexture: { index: 1 },
        metallicFactor: 1,
        roughnessFactor: 1,
      },
      normalTexture: { index: 2, scale: 1 },
      occlusionTexture: { index: 1, strength: 1 },
    }],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
    textures: [
      { sampler: 0, source: 0 },
      { sampler: 0, source: 1 },
      { sampler: 0, source: 2 },
    ],
    images: [
      { uri: "quiu-base.png" },
      { uri: "quiu-pbr.png" },
      { uri: "quiu-normal.png" },
    ],
    buffers: [{ byteLength: byteOffset }],
    bufferViews,
    accessors: [
      {
        bufferView: positionView,
        componentType: 5126,
        count: positions.length / 3,
        type: "VEC3",
        min: positionBounds.min,
        max: positionBounds.max,
      },
      {
        bufferView: normalView,
        componentType: 5126,
        count: normals.length / 3,
        type: "VEC3",
      },
      {
        bufferView: uvView,
        componentType: 5126,
        count: uvs.length / 2,
        type: "VEC2",
      },
      {
        bufferView: indexView,
        componentType: 5125,
        count: indices.length,
        type: "SCALAR",
        min: [0],
        max: [positions.length / 3 - 1],
      },
    ],
  };

  const binary = Buffer.concat(chunks);
  const binaryPadding = (4 - (binary.length % 4)) % 4;
  const paddedBinary = binaryPadding ? Buffer.concat([binary, Buffer.alloc(binaryPadding)]) : binary;
  const json = Buffer.from(JSON.stringify(gltf), "utf8");
  const jsonPadding = (4 - (json.length % 4)) % 4;
  const paddedJson = jsonPadding ? Buffer.concat([json, Buffer.alloc(jsonPadding, 0x20)]) : json;
  const totalLength = 12 + 8 + paddedJson.length + 8 + paddedBinary.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(paddedJson.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(paddedBinary.length, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, paddedBinary]);
}

await MeshoptSimplifier.ready;
console.log(`Parsing ${inputPath}`);
const parsed = await parseObj(inputPath);
console.log(
  `Source: ${parsed.positions.length / 3} render vertices, ${parsed.indices.length / 3} triangles`,
);

const targetIndexCount = Math.min(
  parsed.indices.length,
  Math.floor((targetTriangles * 3) / 3) * 3,
);
const [simplifiedIndices, error] = MeshoptSimplifier.simplify(
  parsed.indices,
  parsed.positions,
  3,
  targetIndexCount,
  0.02,
  ["Prune"],
);
const compacted = compactAttributes(
  simplifiedIndices,
  parsed.positions,
  parsed.normals,
  parsed.uvs,
);
const glb = createGlb({ ...compacted, indices: simplifiedIndices });

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, glb);
console.log(
  `Output: ${compacted.positions.length / 3} vertices, ${simplifiedIndices.length / 3} triangles, ` +
  `${(glb.length / 1024 / 1024).toFixed(2)} MiB, simplification error ${error}`,
);
