import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

const GLB_MAGIC = 0x46546c67;
const GLB_JSON_CHUNK = 0x4e4f534a;
const GLB_BIN_CHUNK = 0x004e4942;
const ARRAY_BUFFER = 34962;
const ELEMENT_ARRAY_BUFFER = 34963;

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const sourceDir = path.resolve(
  repoRoot,
  process.argv[2] || ".tmp-quiu-interactives/elf-source",
);
const outputDir = path.resolve(
  repoRoot,
  process.argv[3] || "public/models/fantasy-elf",
);
const profileName = (process.argv[4] || "desktop").toLowerCase();
if (profileName !== "desktop" && profileName !== "mobile") {
  throw new Error(`Unknown profile "${profileName}". Expected desktop or mobile.`);
}
const outputStem = profileName === "mobile"
  ? "fantasy-elf-scene-mobile"
  : "fantasy-elf-scene";
const outputPath = path.join(outputDir, `${outputStem}.glb`);
const statsPath = path.join(outputDir, `${outputStem}.stats.json`);
const attributionPath = path.join(outputDir, "ATTRIBUTION.md");

const SOURCE = {
  title: "Fantasy Elf Scene",
  creator: "Sharon Kunne (@sharonkunne)",
  url: "https://sketchfab.com/3d-models/fantasy-elf-scene-329c4b91a8e4413e8896dbb1118fadc7",
  license: "Creative Commons Attribution (confirm the exact version at the source URL)",
  note: "The current Sketchfab listing is marked NoAI.",
};

// Ratios favor the interactive character and thin swing/foliage pieces. Tiny meshes
// are left intact because simplifying them saves little and can damage silhouettes.
const DESKTOP_PROFILES = {
  0: { ratio: 0.35, error: 0.012, texture: 1024, ao: 512 },
  1: { ratio: 1.0, error: 0.0, texture: 256, ao: 256 },
  2: { ratio: 0.75, error: 0.005, texture: 512, ao: 256 },
  3: { ratio: 1.0, error: 0.0, texture: 256, ao: 256 },
  4: { ratio: 0.7, error: 0.006, texture: 1024, ao: 512 },
  5: { ratio: 0.65, error: 0.008, texture: 512, ao: 256 },
  6: { ratio: 0.65, error: 0.008, texture: 512, ao: 256 },
  7: { ratio: 0.65, error: 0.008, texture: 512, ao: 256 },
  8: { ratio: 0.8, error: 0.006, texture: 512, ao: 256 },
  9: { ratio: 1.0, error: 0.0, texture: 512, ao: 256 },
  10: { ratio: 1.0, error: 0.0, texture: 512, ao: 256 },
  11: { ratio: 0.55, error: 0.006, texture: 1024, ao: 512 },
  12: { ratio: 0.75, error: 0.004, texture: 512, ao: 256 },
  13: { ratio: 0.75, error: 0.004, texture: 512, ao: 256 },
  14: { ratio: 0.8, error: 0.005, texture: 512, ao: 256 },
  15: { ratio: 1.0, error: 0.0, texture: 1024, ao: 512 },
  16: { ratio: 1.0, error: 0.0, texture: 512, ao: 256 },
  17: { ratio: 0.65, error: 0.004, texture: 1024, ao: 512 },
};

// Approximately 83k requested triangles before topology constraints. Textures are
// capped at 512px except the interactive Elf, retained at 768px for facial detail.
const MOBILE_PROFILES = {
  0: { ratio: 0.15, error: 0.025, texture: 512, ao: 256 },
  1: { ratio: 0.3, error: 0.012, texture: 256, ao: 256 },
  2: { ratio: 0.25, error: 0.012, texture: 256, ao: 256 },
  3: { ratio: 0.4, error: 0.01, texture: 256, ao: 256 },
  4: { ratio: 0.28, error: 0.012, texture: 512, ao: 256 },
  5: { ratio: 0.2, error: 0.016, texture: 256, ao: 256 },
  6: { ratio: 0.22, error: 0.016, texture: 256, ao: 256 },
  7: { ratio: 0.22, error: 0.016, texture: 256, ao: 256 },
  8: { ratio: 0.28, error: 0.014, texture: 256, ao: 256 },
  9: { ratio: 0.4, error: 0.012, texture: 256, ao: 256 },
  10: { ratio: 0.4, error: 0.012, texture: 256, ao: 256 },
  11: { ratio: 0.26, error: 0.012, texture: 512, ao: 256 },
  12: { ratio: 0.21, error: 0.01, texture: 256, ao: 256 },
  13: { ratio: 0.22, error: 0.01, texture: 256, ao: 256 },
  14: { ratio: 0.25, error: 0.012, texture: 256, ao: 256 },
  15: { ratio: 0.7, error: 0.01, texture: 512, ao: 256 },
  16: { ratio: 0.55, error: 0.01, texture: 256, ao: 256 },
  17: { ratio: 0.28, error: 0.008, texture: 768, ao: 256 },
};

const PROFILES = profileName === "mobile" ? MOBILE_PROFILES : DESKTOP_PROFILES;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveObjIndex(value, count) {
  if (value === undefined || value === "") return -1;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed === 0) return -1;
  return parsed > 0 ? parsed - 1 : count + parsed;
}

function numericSubToolIndex(fileName) {
  const match = /^SubTool-(\d+)-.+\.OBJ$/i.exec(fileName);
  return match ? Number.parseInt(match[1], 10) : Number.NaN;
}

function baseNameWithoutExtension(fileName) {
  return fileName.replace(/\.OBJ$/i, "");
}

function semanticName(index) {
  return index === 17 ? "Elf" : `ScenePart_${String(index).padStart(2, "0")}`;
}

function bounds(values, stride = 3) {
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

function includeBounds(target, next) {
  for (let component = 0; component < 3; component += 1) {
    target.min[component] = Math.min(target.min[component], next.min[component]);
    target.max[component] = Math.max(target.max[component], next.max[component]);
  }
}

function sourcePosition(positions, index) {
  const offset = index * 3;
  return [positions[offset], positions[offset + 1], positions[offset + 2]];
}

function addTriangleNormal(accumulator, positionIndices, positions, a, b, c) {
  const p0 = sourcePosition(positions, a);
  const p1 = sourcePosition(positions, b);
  const p2 = sourcePosition(positions, c);
  const abx = p1[0] - p0[0];
  const aby = p1[1] - p0[1];
  const abz = p1[2] - p0[2];
  const acx = p2[0] - p0[0];
  const acy = p2[1] - p0[1];
  const acz = p2[2] - p0[2];
  const nx = aby * acz - abz * acy;
  const ny = abz * acx - abx * acz;
  const nz = abx * acy - aby * acx;

  for (const sourceIndex of positionIndices) {
    const offset = sourceIndex * 3;
    accumulator[offset] += nx;
    accumulator[offset + 1] += ny;
    accumulator[offset + 2] += nz;
  }
}

function normalsForRenderVertices(sourceNormalSums, renderSourcePositions) {
  const normals = new Float32Array(renderSourcePositions.length * 3);
  for (let vertex = 0; vertex < renderSourcePositions.length; vertex += 1) {
    const sourceOffset = renderSourcePositions[vertex] * 3;
    const outputOffset = vertex * 3;
    const x = sourceNormalSums[sourceOffset];
    const y = sourceNormalSums[sourceOffset + 1];
    const z = sourceNormalSums[sourceOffset + 2];
    const length = Math.hypot(x, y, z);
    if (length > 1e-20) {
      normals[outputOffset] = x / length;
      normals[outputOffset + 1] = y / length;
      normals[outputOffset + 2] = z / length;
    } else {
      normals[outputOffset + 1] = 1;
    }
  }
  return normals;
}

function recalculateNormals(indices, positions, renderSourcePositions, sourcePositionCount) {
  const sums = new Float64Array(sourcePositionCount * 3);
  for (let offset = 0; offset < indices.length; offset += 3) {
    const ra = indices[offset];
    const rb = indices[offset + 1];
    const rc = indices[offset + 2];
    const a = renderSourcePositions[ra];
    const b = renderSourcePositions[rb];
    const c = renderSourcePositions[rc];
    const pa = ra * 3;
    const pb = rb * 3;
    const pc = rc * 3;
    const abx = positions[pb] - positions[pa];
    const aby = positions[pb + 1] - positions[pa + 1];
    const abz = positions[pb + 2] - positions[pa + 2];
    const acx = positions[pc] - positions[pa];
    const acy = positions[pc + 1] - positions[pa + 1];
    const acz = positions[pc + 2] - positions[pa + 2];
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;
    for (const sourceIndex of [a, b, c]) {
      const normalOffset = sourceIndex * 3;
      sums[normalOffset] += nx;
      sums[normalOffset + 1] += ny;
      sums[normalOffset + 2] += nz;
    }
  }
  return normalsForRenderVertices(sums, renderSourcePositions);
}

async function parseObj(filePath) {
  const source = (await fs.readFile(filePath, "utf8")).replaceAll("\0", "");
  const lines = source.split(/\r?\n/);
  const sourcePositions = [];
  const sourceUvs = [];
  const faceLines = [];
  let sourceGroup = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("v ")) {
      const values = line.slice(2).trim().split(/\s+/).map(Number);
      invariant(values.length >= 3 && values.slice(0, 3).every(Number.isFinite), `Invalid vertex in ${filePath}`);
      sourcePositions.push(values[0], values[1], values[2]);
    } else if (line.startsWith("vt ")) {
      const values = line.slice(3).trim().split(/\s+/).map(Number);
      invariant(values.length >= 2 && values.slice(0, 2).every(Number.isFinite), `Invalid UV in ${filePath}`);
      sourceUvs.push(values[0], values[1]);
    } else if (line.startsWith("f ")) {
      faceLines.push(line.slice(2).trim());
    } else if (line.startsWith("g ") && !sourceGroup) {
      sourceGroup = line.slice(2).trim();
    }
  }

  const sourcePositionCount = sourcePositions.length / 3;
  const sourceUvCount = sourceUvs.length / 2;
  const sourceNormalSums = new Float64Array(sourcePositions.length);
  const renderPositions = [];
  const renderUvs = [];
  const renderSourcePositions = [];
  const renderVertexMap = new Map();
  const indices = [];

  const renderVertex = (token) => {
    const [positionToken, uvToken] = token.split("/");
    const positionIndex = resolveObjIndex(positionToken, sourcePositionCount);
    const uvIndex = resolveObjIndex(uvToken, sourceUvCount);
    invariant(positionIndex >= 0 && positionIndex < sourcePositionCount, `Invalid position index ${token} in ${filePath}`);
    invariant(uvIndex < sourceUvCount, `Invalid UV index ${token} in ${filePath}`);
    const key = `${positionIndex}/${uvIndex}`;
    const cached = renderVertexMap.get(key);
    if (cached !== undefined) return cached;

    const next = renderPositions.length / 3;
    renderPositions.push(
      sourcePositions[positionIndex * 3],
      sourcePositions[positionIndex * 3 + 1],
      sourcePositions[positionIndex * 3 + 2],
    );
    renderUvs.push(
      uvIndex >= 0 ? sourceUvs[uvIndex * 2] : 0,
      uvIndex >= 0 ? 1 - sourceUvs[uvIndex * 2 + 1] : 0,
    );
    renderSourcePositions.push(positionIndex);
    renderVertexMap.set(key, next);
    return next;
  };

  for (const faceLine of faceLines) {
    const tokens = faceLine.split(/\s+/);
    invariant(tokens.length >= 3, `Face with fewer than three vertices in ${filePath}`);
    const firstRender = renderVertex(tokens[0]);
    const firstSource = resolveObjIndex(tokens[0].split("/")[0], sourcePositionCount);
    for (let corner = 1; corner < tokens.length - 1; corner += 1) {
      const bRender = renderVertex(tokens[corner]);
      const cRender = renderVertex(tokens[corner + 1]);
      const bSource = resolveObjIndex(tokens[corner].split("/")[0], sourcePositionCount);
      const cSource = resolveObjIndex(tokens[corner + 1].split("/")[0], sourcePositionCount);
      indices.push(firstRender, bRender, cRender);
      addTriangleNormal(
        sourceNormalSums,
        [firstSource, bSource, cSource],
        sourcePositions,
        firstSource,
        bSource,
        cSource,
      );
    }
  }

  invariant(indices.length > 0, `No triangles found in ${filePath}`);
  const positions = new Float32Array(renderPositions);
  const uvs = new Float32Array(renderUvs);
  const renderSourcePositionArray = new Uint32Array(renderSourcePositions);
  const normals = normalsForRenderVertices(sourceNormalSums, renderSourcePositionArray);
  return {
    positions,
    normals,
    uvs,
    indices: new Uint32Array(indices),
    renderSourcePositions: renderSourcePositionArray,
    sourcePositionCount,
    sourceVertexCount: sourcePositionCount,
    sourceUvCount,
    sourceGroup,
  };
}

function compactAndOptimize(indices, positions, normals, uvs, renderSourcePositions) {
  const optimizedIndices = new Uint32Array(indices);
  const [remap, vertexCount] = MeshoptEncoder.reorderMesh(optimizedIndices, true, false);
  const compactPositions = new Float32Array(vertexCount * 3);
  const compactNormals = new Float32Array(vertexCount * 3);
  const compactUvs = new Float32Array(vertexCount * 2);
  const compactSourcePositions = new Uint32Array(vertexCount);

  for (let oldIndex = 0; oldIndex < remap.length; oldIndex += 1) {
    const newIndex = remap[oldIndex];
    if (newIndex === 0xffffffff || newIndex >= vertexCount) continue;
    compactPositions.set(positions.subarray(oldIndex * 3, oldIndex * 3 + 3), newIndex * 3);
    compactNormals.set(normals.subarray(oldIndex * 3, oldIndex * 3 + 3), newIndex * 3);
    compactUvs.set(uvs.subarray(oldIndex * 2, oldIndex * 2 + 2), newIndex * 2);
    compactSourcePositions[newIndex] = renderSourcePositions[oldIndex];
  }

  return {
    indices: optimizedIndices,
    positions: compactPositions,
    normals: compactNormals,
    uvs: compactUvs,
    renderSourcePositions: compactSourcePositions,
  };
}

function simplifyMesh(parsed, profile) {
  const sourceTriangles = parsed.indices.length / 3;
  const targetTriangles = Math.max(1, Math.floor(sourceTriangles * profile.ratio));
  let simplifiedIndices = new Uint32Array(parsed.indices);
  let simplificationError = 0;

  if (targetTriangles < sourceTriangles) {
    const attributes = new Float32Array((parsed.positions.length / 3) * 5);
    for (let vertex = 0; vertex < parsed.positions.length / 3; vertex += 1) {
      attributes.set(parsed.normals.subarray(vertex * 3, vertex * 3 + 3), vertex * 5);
      attributes.set(parsed.uvs.subarray(vertex * 2, vertex * 2 + 2), vertex * 5 + 3);
    }
    [simplifiedIndices, simplificationError] = MeshoptSimplifier.simplifyWithAttributes(
      parsed.indices,
      parsed.positions,
      3,
      attributes,
      5,
      [0.5, 0.5, 0.5, 0.08, 0.08],
      null,
      targetTriangles * 3,
      profile.error,
    );
  }

  invariant(simplifiedIndices.length > 0 && simplifiedIndices.length % 3 === 0, "Mesh simplification returned invalid indices");
  const recalculatedNormals = recalculateNormals(
    simplifiedIndices,
    parsed.positions,
    parsed.renderSourcePositions,
    parsed.sourcePositionCount,
  );
  const compacted = compactAndOptimize(
    simplifiedIndices,
    parsed.positions,
    recalculatedNormals,
    parsed.uvs,
    parsed.renderSourcePositions,
  );
  const outputBounds = bounds(compacted.positions);
  const uvBounds = bounds(compacted.uvs, 2);
  return {
    ...compacted,
    sourceTriangles,
    targetTriangles,
    outputTriangles: compacted.indices.length / 3,
    sourceRenderVertices: parsed.positions.length / 3,
    outputVertices: compacted.positions.length / 3,
    simplificationError,
    outputBounds,
    uvBounds,
  };
}

function quantizeNormals(normals) {
  const output = new Int16Array(normals.length);
  for (let index = 0; index < normals.length; index += 1) {
    output[index] = Math.round(clamp(normals[index], -1, 1) * 32767);
  }
  return output;
}

function quantizeUvs(uvs) {
  const output = new Uint16Array(uvs.length);
  for (let index = 0; index < uvs.length; index += 1) {
    output[index] = Math.round(clamp(uvs[index], 0, 1) * 65535);
  }
  return output;
}

function smallestIndexArray(indices, vertexCount) {
  if (vertexCount <= 65535) return new Uint16Array(indices);
  return new Uint32Array(indices);
}

async function optimizeTexture(filePath, maxSize, kind) {
  const input = sharp(filePath, { failOn: "none", limitInputPixels: false });
  const sourceMetadata = await input.metadata();
  invariant(sourceMetadata.width && sourceMetadata.height, `Could not read texture dimensions: ${filePath}`);
  let pipeline = input.resize({
    width: maxSize,
    height: maxSize,
    fit: "inside",
    withoutEnlargement: true,
    kernel: sharp.kernel.lanczos3,
  });
  if (kind === "ao") pipeline = pipeline.greyscale();
  const buffer = await pipeline
    .jpeg({
      quality: kind === "ao" ? 70 : 82,
      chromaSubsampling: kind === "ao" ? "4:2:0" : "4:2:0",
      progressive: true,
      mozjpeg: true,
    })
    .toBuffer();
  const metadata = await sharp(buffer).metadata();
  return {
    buffer,
    sourceWidth: sourceMetadata.width,
    sourceHeight: sourceMetadata.height,
    width: metadata.width,
    height: metadata.height,
    channels: metadata.channels,
  };
}

function typedArrayBuffer(value) {
  return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
}

function buildGlb(meshRecords, textureRecords) {
  const gltf = {
    asset: {
      version: "2.0",
      generator: `Press Q fantasy elf meshoptimizer + sharp pipeline (${profileName})`,
      copyright: "Fantasy Elf Scene by Sharon Kunne (@sharonkunne), Creative Commons Attribution",
    },
    scene: 0,
    scenes: [{ name: "Fantasy Elf Scene", nodes: [0] }],
    nodes: [{
      name: "FantasyElfScene",
      children: meshRecords.map((_, index) => index + 1),
      extras: {
        sourceUrl: SOURCE.url,
        license: SOURCE.license,
      },
    }],
    meshes: [],
    materials: [],
    samplers: [{
      name: "Linear mipmapped repeat",
      magFilter: 9729,
      minFilter: 9987,
      wrapS: 10497,
      wrapT: 10497,
    }],
    textures: [],
    images: [],
    accessors: [],
    bufferViews: [],
    buffers: [],
    extras: {
      attribution: SOURCE,
      interactiveNode: "Elf",
      optimizationProfile: profileName,
      sourceCoordinateSystem: "Y-up; original ZBrush coordinates and alignment preserved",
      processing: "Smooth normals recalculated; geometry simplified/reordered with meshoptimizer; JPEG textures resized/recompressed with sharp",
    },
  };

  const binaryParts = [];
  let binaryLength = 0;
  const appendBufferView = (value, options = {}) => {
    const data = Buffer.isBuffer(value) ? value : typedArrayBuffer(value);
    const alignment = options.alignment || 4;
    const padding = (alignment - (binaryLength % alignment)) % alignment;
    if (padding) {
      binaryParts.push(Buffer.alloc(padding));
      binaryLength += padding;
    }
    const view = {
      buffer: 0,
      byteOffset: binaryLength,
      byteLength: data.length,
    };
    if (options.target) view.target = options.target;
    if (options.name) view.name = options.name;
    gltf.bufferViews.push(view);
    binaryParts.push(data);
    binaryLength += data.length;
    return gltf.bufferViews.length - 1;
  };

  const addAccessor = (accessor) => {
    gltf.accessors.push(accessor);
    return gltf.accessors.length - 1;
  };

  for (const record of textureRecords) {
    const bufferView = appendBufferView(record.buffer, {
      name: record.name,
    });
    gltf.images.push({
      name: record.name,
      bufferView,
      mimeType: "image/jpeg",
    });
    gltf.textures.push({
      name: record.name,
      sampler: 0,
      source: gltf.images.length - 1,
    });
    record.textureIndex = gltf.textures.length - 1;
  }

  for (const record of meshRecords) {
    const positionView = appendBufferView(record.positions, {
      name: `${record.name} positions`,
      target: ARRAY_BUFFER,
    });
    const normalValues = quantizeNormals(record.normals);
    const normalView = appendBufferView(normalValues, {
      name: `${record.name} normals`,
      target: ARRAY_BUFFER,
    });
    const uvCanQuantize = record.uvBounds.min.every((value) => value >= 0)
      && record.uvBounds.max.every((value) => value <= 1);
    const uvValues = uvCanQuantize ? quantizeUvs(record.uvs) : record.uvs;
    const uvView = appendBufferView(uvValues, {
      name: `${record.name} UVs`,
      target: ARRAY_BUFFER,
    });
    const indexValues = smallestIndexArray(record.indices, record.outputVertices);
    const indexView = appendBufferView(indexValues, {
      name: `${record.name} indices`,
      target: ELEMENT_ARRAY_BUFFER,
    });

    const positionAccessor = addAccessor({
      name: `${record.name} positions`,
      bufferView: positionView,
      componentType: 5126,
      count: record.outputVertices,
      type: "VEC3",
      min: record.outputBounds.min,
      max: record.outputBounds.max,
    });
    const normalAccessor = addAccessor({
      name: `${record.name} normals`,
      bufferView: normalView,
      componentType: 5122,
      normalized: true,
      count: record.outputVertices,
      type: "VEC3",
    });
    const uvAccessorDefinition = {
      name: `${record.name} UVs`,
      bufferView: uvView,
      componentType: uvCanQuantize ? 5123 : 5126,
      count: record.outputVertices,
      type: "VEC2",
    };
    if (uvCanQuantize) uvAccessorDefinition.normalized = true;
    const uvAccessor = addAccessor(uvAccessorDefinition);
    const indexAccessor = addAccessor({
      name: `${record.name} indices`,
      bufferView: indexView,
      componentType: indexValues.BYTES_PER_ELEMENT === 2 ? 5123 : 5125,
      count: indexValues.length,
      type: "SCALAR",
      min: [0],
      max: [record.outputVertices - 1],
    });

    const diffuse = textureRecords.find((texture) => texture.subTool === record.subTool && texture.kind === "diffuse");
    const ao = textureRecords.find((texture) => texture.subTool === record.subTool && texture.kind === "ao");
    invariant(diffuse, `Missing processed diffuse texture for SubTool ${record.subTool}`);
    const material = {
      name: record.subTool === 17 ? "ElfMaterial" : `ScenePart_${String(record.subTool).padStart(2, "0")}_Material`,
      pbrMetallicRoughness: {
        baseColorFactor: [1, 1, 1, 1],
        baseColorTexture: { index: diffuse.textureIndex, texCoord: 0 },
        metallicFactor: 0,
        roughnessFactor: 0.9,
      },
      doubleSided: false,
      extras: {
        sourceMaterial: "defaultMat",
      },
    };
    if (ao) material.occlusionTexture = { index: ao.textureIndex, texCoord: 0, strength: 1 };
    gltf.materials.push(material);
    const materialIndex = gltf.materials.length - 1;

    gltf.meshes.push({
      name: record.name,
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
        sourceFile: record.sourceFile,
        sourceGroup: record.sourceGroup,
        sourceTriangles: record.sourceTriangles,
        outputTriangles: record.outputTriangles,
      },
    });
    gltf.nodes.push({
      name: record.name,
      mesh: gltf.meshes.length - 1,
      extras: {
        interactive: record.subTool === 17,
        sourceSubTool: record.subTool,
        sourceGroup: record.sourceGroup,
      },
    });
  }

  const binary = Buffer.concat(binaryParts, binaryLength);
  gltf.buffers.push({ byteLength: binary.length });
  const json = Buffer.from(JSON.stringify(gltf), "utf8");
  const jsonPadding = (4 - (json.length % 4)) % 4;
  const binaryPadding = (4 - (binary.length % 4)) % 4;
  const paddedJson = jsonPadding ? Buffer.concat([json, Buffer.alloc(jsonPadding, 0x20)]) : json;
  const paddedBinary = binaryPadding ? Buffer.concat([binary, Buffer.alloc(binaryPadding)]) : binary;
  const totalLength = 12 + 8 + paddedJson.length + 8 + paddedBinary.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(GLB_MAGIC, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(paddedJson.length, 0);
  jsonHeader.writeUInt32LE(GLB_JSON_CHUNK, 4);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(paddedBinary.length, 0);
  binaryHeader.writeUInt32LE(GLB_BIN_CHUNK, 4);
  return Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, paddedBinary]);
}

function parseGlb(file) {
  invariant(file.length >= 28, "GLB is too short");
  invariant(file.readUInt32LE(0) === GLB_MAGIC, "Invalid GLB magic");
  invariant(file.readUInt32LE(4) === 2, "Expected GLB version 2");
  invariant(file.readUInt32LE(8) === file.length, "GLB declared length does not match file length");
  let offset = 12;
  let json;
  let binary;
  while (offset < file.length) {
    invariant(offset + 8 <= file.length, "Truncated GLB chunk header");
    const length = file.readUInt32LE(offset);
    const type = file.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + length;
    invariant(end <= file.length, "Truncated GLB chunk payload");
    if (type === GLB_JSON_CHUNK) json = JSON.parse(file.subarray(start, end).toString("utf8").trimEnd());
    if (type === GLB_BIN_CHUNK) binary = file.subarray(start, end);
    offset = end;
  }
  invariant(json && binary, "GLB must contain JSON and BIN chunks");
  return { json, binary };
}

function validateGlb(file) {
  const { json, binary } = parseGlb(file);
  invariant(json.asset?.version === "2.0", "Invalid glTF asset version");
  invariant(json.buffers?.length === 1, "Expected one embedded glTF buffer");
  invariant(json.buffers[0].byteLength <= binary.length, "BIN chunk is shorter than declared buffer");
  invariant(json.meshes?.length === 18, `Expected 18 meshes, found ${json.meshes?.length}`);
  invariant(json.materials?.length === 18, `Expected 18 materials, found ${json.materials?.length}`);
  invariant(json.images?.length === 28, `Expected 28 embedded images, found ${json.images?.length}`);
  invariant(!json.animations?.length && !json.skins?.length, "The source is static and must not acquire animations or skins");
  const elfNodes = json.nodes.filter((node) => node.name === "Elf");
  invariant(elfNodes.length === 1, `Expected exactly one Elf node, found ${elfNodes.length}`);
  invariant(elfNodes[0].extras?.interactive === true, "Elf node is not marked interactive");

  for (const [index, view] of json.bufferViews.entries()) {
    const start = view.byteOffset || 0;
    invariant(start >= 0 && start + view.byteLength <= json.buffers[0].byteLength, `bufferView ${index} exceeds BIN bounds`);
  }

  const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
  const componentBytes = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
  for (const [index, accessor] of json.accessors.entries()) {
    const view = json.bufferViews[accessor.bufferView];
    invariant(view, `Accessor ${index} references a missing bufferView`);
    const elementBytes = components[accessor.type] * componentBytes[accessor.componentType];
    invariant(Number.isFinite(elementBytes), `Accessor ${index} has unsupported type`);
    const stride = view.byteStride || elementBytes;
    const required = (accessor.byteOffset || 0) + Math.max(0, accessor.count - 1) * stride + elementBytes;
    invariant(required <= view.byteLength, `Accessor ${index} exceeds its bufferView`);
  }

  let triangles = 0;
  let vertices = 0;
  for (const [meshIndex, mesh] of json.meshes.entries()) {
    invariant(mesh.primitives.length === 1, `Mesh ${meshIndex} should contain one primitive`);
    const primitive = mesh.primitives[0];
    invariant(primitive.mode === 4, `Mesh ${meshIndex} is not triangles`);
    invariant(primitive.attributes.POSITION !== undefined, `Mesh ${meshIndex} is missing POSITION`);
    invariant(primitive.attributes.NORMAL !== undefined, `Mesh ${meshIndex} is missing NORMAL`);
    invariant(primitive.attributes.TEXCOORD_0 !== undefined, `Mesh ${meshIndex} is missing TEXCOORD_0`);
    const indexAccessor = json.accessors[primitive.indices];
    invariant(indexAccessor.count % 3 === 0, `Mesh ${meshIndex} index count is not divisible by three`);
    triangles += indexAccessor.count / 3;
    vertices += json.accessors[primitive.attributes.POSITION].count;
  }
  for (const [index, image] of json.images.entries()) {
    invariant(image.mimeType === "image/jpeg", `Image ${index} is not embedded JPEG`);
    invariant(json.bufferViews[image.bufferView], `Image ${index} references a missing bufferView`);
  }
  return {
    meshes: json.meshes.length,
    materials: json.materials.length,
    images: json.images.length,
    triangles,
    vertices,
    elfNode: "Elf",
    staticAsset: true,
    bufferViewsInBounds: true,
    accessorsInBounds: true,
  };
}

async function main() {
  const sourceEntries = await fs.readdir(sourceDir, { withFileTypes: true });
  const objFiles = sourceEntries
    .filter((entry) => entry.isFile() && /^SubTool-\d+-.+\.OBJ$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => numericSubToolIndex(a) - numericSubToolIndex(b));
  invariant(objFiles.length === 18, `Expected 18 OBJ files in ${sourceDir}, found ${objFiles.length}`);
  invariant(objFiles.every((fileName, index) => numericSubToolIndex(fileName) === index), "Expected SubTools 0 through 17 exactly once");

  await Promise.all([MeshoptEncoder.ready, MeshoptSimplifier.ready]);
  const meshRecords = [];
  const textureRecords = [];
  const sceneBounds = {
    min: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
    max: [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
  };

  for (const sourceFile of objFiles) {
    const subTool = numericSubToolIndex(sourceFile);
    const profile = PROFILES[subTool];
    invariant(profile, `Missing optimization profile for SubTool ${subTool}`);
    const sourcePath = path.join(sourceDir, sourceFile);
    const baseName = baseNameWithoutExtension(sourceFile);
    console.log(`Parsing and optimizing ${sourceFile}${subTool === 17 ? " as Elf" : ""}...`);
    const parsed = await parseObj(sourcePath);
    const optimized = simplifyMesh(parsed, profile);
    includeBounds(sceneBounds, optimized.outputBounds);
    meshRecords.push({
      ...optimized,
      subTool,
      name: semanticName(subTool),
      sourceFile,
      sourceGroup: parsed.sourceGroup,
      sourceVertexCount: parsed.sourceVertexCount,
      sourceUvCount: parsed.sourceUvCount,
      profile,
    });

    const diffusePath = path.join(sourceDir, `${baseName}.jpg`);
    const diffuse = await optimizeTexture(diffusePath, profile.texture, "diffuse");
    textureRecords.push({
      ...diffuse,
      name: `${semanticName(subTool)} base color`,
      kind: "diffuse",
      subTool,
      sourceFile: path.basename(diffusePath),
    });
    const aoPath = path.join(sourceDir, `${baseName}-AO.jpg`);
    try {
      await fs.access(aoPath);
      const ao = await optimizeTexture(aoPath, profile.ao, "ao");
      textureRecords.push({
        ...ao,
        name: `${semanticName(subTool)} occlusion`,
        kind: "ao",
        subTool,
        sourceFile: path.basename(aoPath),
      });
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  const glb = buildGlb(meshRecords, textureRecords);
  const verification = validateGlb(glb);
  invariant(
    verification.triangles === meshRecords.reduce((sum, mesh) => sum + mesh.outputTriangles, 0),
    "Validated triangle count does not match pipeline statistics",
  );
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, glb);

  const sourceTriangles = meshRecords.reduce((sum, mesh) => sum + mesh.sourceTriangles, 0);
  const sourceRenderVertices = meshRecords.reduce((sum, mesh) => sum + mesh.sourceRenderVertices, 0);
  const outputTriangles = meshRecords.reduce((sum, mesh) => sum + mesh.outputTriangles, 0);
  const outputVertices = meshRecords.reduce((sum, mesh) => sum + mesh.outputVertices, 0);
  const sourceTexturePixels = textureRecords.reduce(
    (sum, texture) => sum + texture.sourceWidth * texture.sourceHeight,
    0,
  );
  const outputTexturePixels = textureRecords.reduce(
    (sum, texture) => sum + texture.width * texture.height,
    0,
  );
  const sha256 = createHash("sha256").update(glb).digest("hex");
  const stats = {
    generator: "scripts/prepare-fantasy-elf-scene.mjs",
    profile: profileName,
    sourceDirectory: path.relative(repoRoot, sourceDir).replaceAll(path.sep, "/"),
    outputFile: path.relative(repoRoot, outputPath).replaceAll(path.sep, "/"),
    source: SOURCE,
    geometry: {
      meshes: meshRecords.length,
      sourceTriangles,
      outputTriangles,
      triangleReductionPercent: Number(((1 - outputTriangles / sourceTriangles) * 100).toFixed(2)),
      sourceRenderVertices,
      outputVertices,
      bounds: sceneBounds,
      alignment: "Original shared coordinates preserved; no per-mesh or root transforms",
      normals: "Area-weighted smooth normals recalculated after simplification",
    },
    textures: {
      embeddedImages: textureRecords.length,
      diffuseImages: textureRecords.filter((texture) => texture.kind === "diffuse").length,
      occlusionImages: textureRecords.filter((texture) => texture.kind === "ao").length,
      sourcePixels: sourceTexturePixels,
      outputPixels: outputTexturePixels,
      pixelReductionPercent: Number(((1 - outputTexturePixels / sourceTexturePixels) * 100).toFixed(2)),
      format: "Embedded progressive JPEG",
    },
    glb: {
      bytes: glb.length,
      sha256,
      selfContained: true,
    },
    verification,
    meshes: meshRecords.map((mesh) => ({
      subTool: mesh.subTool,
      name: mesh.name,
      sourceFile: mesh.sourceFile,
      sourceGroup: mesh.sourceGroup,
      sourceTriangles: mesh.sourceTriangles,
      targetTriangles: mesh.targetTriangles,
      outputTriangles: mesh.outputTriangles,
      sourceRenderVertices: mesh.sourceRenderVertices,
      outputVertices: mesh.outputVertices,
      simplificationError: mesh.simplificationError,
      bounds: mesh.outputBounds,
      interactive: mesh.subTool === 17,
    })),
    images: textureRecords.map((texture) => ({
      subTool: texture.subTool,
      kind: texture.kind,
      sourceFile: texture.sourceFile,
      sourceSize: [texture.sourceWidth, texture.sourceHeight],
      outputSize: [texture.width, texture.height],
      bytes: texture.buffer.length,
    })),
  };
  await fs.writeFile(statsPath, `${JSON.stringify(stats, null, 2)}\n`, "utf8");
  let attributionExists = true;
  try {
    await fs.access(attributionPath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    attributionExists = false;
  }
  if (profileName === "desktop" || !attributionExists) {
    await fs.writeFile(
      attributionPath,
      `# Fantasy Elf Scene attribution\n\n` +
        `“${SOURCE.title}” by ${SOURCE.creator}.\n\n` +
        `Source: ${SOURCE.url}\n\n` +
        `License: ${SOURCE.license}. The current source listing is also marked NoAI.\n\n` +
        `This copy has been modified for web delivery: geometry was simplified and reordered, ` +
        `smooth normals were recalculated, and textures were resized and recompressed.\n`,
      "utf8",
    );
  }

  console.log("");
  console.log(`Profile: ${profileName}`);
  console.log(`Geometry: ${sourceTriangles.toLocaleString()} -> ${outputTriangles.toLocaleString()} triangles (${stats.geometry.triangleReductionPercent}% reduction)`);
  console.log(`Render vertices: ${sourceRenderVertices.toLocaleString()} -> ${outputVertices.toLocaleString()}`);
  console.log(`Texture pixels: ${sourceTexturePixels.toLocaleString()} -> ${outputTexturePixels.toLocaleString()} (${stats.textures.pixelReductionPercent}% reduction)`);
  console.log(`Output: ${outputPath} (${(glb.length / 1024 / 1024).toFixed(2)} MiB)`);
  console.log(`SHA-256: ${sha256}`);
  console.log(`Validation: ${verification.meshes} meshes, ${verification.materials} materials, ${verification.images} embedded images, Elf node present, accessors/bufferViews in bounds`);
}

await main();
