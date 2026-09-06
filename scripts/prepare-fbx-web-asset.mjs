import { promises as fs } from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const [, , inputArg, outputArg, profile = "generic"] = process.argv;

if (!inputArg || !outputArg) {
  console.error("Usage: node scripts/prepare-fbx-web-asset.mjs <input.fbx> <output.glb> [spaceway|button|laptop|generic]");
  process.exit(1);
}

class NodeFileReader {
  result = null;
  error = null;
  onload = null;
  onloadend = null;
  onerror = null;

  async readAsArrayBuffer(blob) {
    try {
      this.result = await blob.arrayBuffer();
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    } catch (error) {
      this.error = error;
      this.onerror?.({ target: this });
      this.onloadend?.({ target: this });
    }
  }

  async readAsDataURL(blob) {
    try {
      const buffer = Buffer.from(await blob.arrayBuffer());
      this.result = `data:${blob.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    } catch (error) {
      this.error = error;
      this.onerror?.({ target: this });
      this.onloadend?.({ target: this });
    }
  }
}

globalThis.FileReader = NodeFileReader;
globalThis.window = {
  URL: {
    createObjectURL: () => "blob:source-texture-omitted",
    revokeObjectURL: () => undefined,
  },
};

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg);
const file = await fs.readFile(inputPath);
const arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);

const originalTextureLoad = THREE.TextureLoader.prototype.load;
THREE.TextureLoader.prototype.load = function loadPlaceholder(_url, onLoad) {
  const texture = new THREE.Texture();
  texture.name = "Source texture omitted for the optimized web asset";
  queueMicrotask(() => onLoad?.(texture));
  return texture;
};

let source;
try {
  source = new FBXLoader().parse(arrayBuffer, `${path.dirname(inputPath)}${path.sep}`);
} finally {
  THREE.TextureLoader.prototype.load = originalTextureLoad;
}

source.updateWorldMatrix(true, true);

const selectionRoot = profile === "spaceway"
  ? source.getObjectByName("Race_SpaceRoad") || source
  : source;

function isSelected(mesh) {
  if (profile !== "spaceway" || selectionRoot === source) return true;
  let current = mesh;
  while (current) {
    if (current === selectionRoot) return true;
    current = current.parent;
  }
  return /spaceroad|boost|checkpoint|coin|startframe/i.test(mesh.name);
}

function categoryFor(name) {
  const value = name.toLowerCase();
  if (/boost|highlight|lightning|glow/.test(value)) return "boost";
  if (/edge|rail|frame|sign|clamp|housing|keys/.test(value)) return "edge";
  if (/screen|display|button_top|portal_button_top/.test(value)) return "screen";
  if (/glass|canopy/.test(value)) return "glass";
  return "base";
}

const geometries = new Map();
let sourceMeshCount = 0;
let sourceTriangles = 0;

source.traverse((object) => {
  if (!(object instanceof THREE.Mesh) || !isSelected(object)) return;
  sourceMeshCount += 1;
  const geometry = object.geometry.clone();
  geometry.applyMatrix4(object.matrixWorld);
  const position = geometry.getAttribute("position");
  if (!position) return;
  sourceTriangles += geometry.index ? geometry.index.count / 3 : position.count / 3;
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  for (const attribute of Object.keys(geometry.attributes)) {
    if (attribute !== "position" && attribute !== "normal" && attribute !== "uv") {
      geometry.deleteAttribute(attribute);
    }
  }
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
  if (nonIndexed !== geometry) geometry.dispose();
  const category = categoryFor(object.name);
  const list = geometries.get(category) || [];
  list.push(nonIndexed);
  geometries.set(category, list);
});

if (sourceMeshCount === 0) throw new Error(`No meshes selected from ${inputPath}`);

const palette = {
  spaceway: {
    base: [0x201058, 0x4b178a],
    edge: [0x162b5e, 0x20bde0],
    boost: [0xff3d9f, 0xff168e],
    screen: [0x11224f, 0x55ecff],
    glass: [0x55ecff, 0x1262a2],
  },
  button: {
    base: [0x151c42, 0x2c4cb0],
    edge: [0x17112e, 0xff3d9f],
    boost: [0xff3d9f, 0xff168e],
    screen: [0xff57c8, 0xff168e],
    glass: [0x55ecff, 0x1262a2],
  },
  laptop: {
    base: [0x12142b, 0x2a1858],
    edge: [0x080913, 0x6f35c9],
    boost: [0xff3d9f, 0xff168e],
    screen: [0x10265b, 0x55ecff],
    glass: [0x55ecff, 0x1262a2],
  },
  generic: {
    base: [0x17112e, 0x39176d],
    edge: [0x101a3f, 0x4eeaff],
    boost: [0xff3d9f, 0xff168e],
    screen: [0x10265b, 0x55ecff],
    glass: [0x55ecff, 0x1262a2],
  },
};

const output = new THREE.Group();
output.name = `${profile}-optimized`;
const colors = palette[profile] || palette.generic;

for (const [category, parts] of geometries) {
  const merged = mergeGeometries(parts, false);
  parts.forEach((geometry) => geometry.dispose());
  if (!merged) throw new Error(`Could not merge ${category} geometry`);
  const [color, emissive] = colors[category] || colors.base;
  const material = category === "glass"
    ? new THREE.MeshPhysicalMaterial({
        color,
        emissive,
        emissiveIntensity: 0.65,
        transparent: true,
        opacity: 0.58,
        roughness: 0.12,
        metalness: 0.18,
      })
    : new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: category === "boost" || category === "screen" ? 2.2 : 0.48,
        roughness: category === "edge" ? 0.24 : 0.42,
        metalness: category === "base" ? 0.58 : 0.4,
      });
  const mesh = new THREE.Mesh(merged, material);
  mesh.name = category;
  output.add(mesh);
}

const bounds = new THREE.Box3().setFromObject(output);
const size = bounds.getSize(new THREE.Vector3());
const center = bounds.getCenter(new THREE.Vector3());
const targetSpan = profile === "spaceway" ? 190 : profile === "laptop" ? 4.4 : 3.2;
const sourceSpan = profile === "spaceway" ? Math.max(size.x, size.z) : Math.max(size.x, size.y, size.z);
const scale = sourceSpan > 0 ? targetSpan / sourceSpan : 1;
output.scale.setScalar(scale);
output.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
output.updateWorldMatrix(true, true);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
const exporter = new GLTFExporter();
const glb = await exporter.parseAsync(output, {
  binary: true,
  onlyVisible: true,
  trs: true,
});
await fs.writeFile(outputPath, Buffer.from(glb));

console.log(`Input: ${inputPath}`);
console.log(`Profile: ${profile}`);
console.log(`Selected meshes: ${sourceMeshCount}; source triangles: ${Math.round(sourceTriangles)}`);
console.log(`Merged meshes: ${output.children.length}; normalized span: ${targetSpan}`);
console.log(`Output: ${outputPath} (${(await fs.stat(outputPath)).size} bytes)`);
