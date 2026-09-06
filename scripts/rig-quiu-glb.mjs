import { promises as fs } from "node:fs";
import path from "node:path";

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

const COMPONENT_TYPES = {
  5120: { bytes: 1, read: "getInt8" },
  5121: { bytes: 1, read: "getUint8" },
  5122: { bytes: 2, read: "getInt16" },
  5123: { bytes: 2, read: "getUint16" },
  5125: { bytes: 4, read: "getUint32" },
  5126: { bytes: 4, read: "getFloat32" },
};

const TYPE_COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT4: 16,
};

const [
  ,
  ,
  inputArgument = "public/models/quiu/quiu-web.glb",
  outputArgument = "public/models/quiu/quiu-rigged.glb",
  requestedMode = "auto",
] = process.argv;
const inputPath = path.resolve(inputArgument);
const outputPath = path.resolve(outputArgument);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function parseGlb(file) {
  invariant(file.length >= 20, "GLB is too short");
  invariant(file.readUInt32LE(0) === GLB_MAGIC, "Invalid GLB magic");
  invariant(file.readUInt32LE(4) === 2, "Only GLB version 2 is supported");
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
    if (type === JSON_CHUNK) {
      json = JSON.parse(file.subarray(start, end).toString("utf8").replace(/[\u0000\u0020]+$/u, ""));
    } else if (type === BIN_CHUNK) {
      binary = file.subarray(start, end);
    }
    offset = end;
  }

  invariant(json, "GLB JSON chunk is missing");
  invariant(binary, "GLB BIN chunk is missing");
  invariant(json.buffers?.length === 1, "This rigging script expects one GLB buffer");
  invariant(!json.buffers[0].uri, "The GLB buffer must be embedded");
  invariant(json.buffers[0].byteLength <= binary.length, "GLB BIN chunk is shorter than its buffer declaration");
  return { json, binary };
}

function accessorValues(gltf, binary, accessorIndex) {
  const accessor = gltf.accessors?.[accessorIndex];
  invariant(accessor, `Accessor ${accessorIndex} does not exist`);
  invariant(accessor.bufferView !== undefined, `Sparse/accessor-only data is not supported (${accessorIndex})`);
  invariant(!accessor.sparse, `Sparse accessors are not supported (${accessorIndex})`);
  const view = gltf.bufferViews?.[accessor.bufferView];
  invariant(view?.buffer === 0, `Accessor ${accessorIndex} does not use buffer 0`);
  const typeInfo = COMPONENT_TYPES[accessor.componentType];
  const componentCount = TYPE_COMPONENTS[accessor.type];
  invariant(typeInfo && componentCount, `Unsupported accessor layout at ${accessorIndex}`);
  const packedSize = typeInfo.bytes * componentCount;
  const stride = view.byteStride ?? packedSize;
  invariant(stride >= packedSize, `Accessor ${accessorIndex} has an invalid byte stride`);
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const end = start + Math.max(0, accessor.count - 1) * stride + packedSize;
  invariant(end <= binary.length, `Accessor ${accessorIndex} exceeds the BIN chunk`);

  const result = new Array(accessor.count * componentCount);
  const data = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
  for (let element = 0; element < accessor.count; element += 1) {
    const elementOffset = start + element * stride;
    for (let component = 0; component < componentCount; component += 1) {
      result[element * componentCount + component] = data[typeInfo.read](
        elementOffset + component * typeInfo.bytes,
        true,
      );
    }
  }
  return { accessor, values: result, componentCount };
}

class DisjointSet {
  constructor(size) {
    this.parent = new Uint32Array(size);
    this.rank = new Uint8Array(size);
    for (let index = 0; index < size; index += 1) this.parent[index] = index;
  }

  find(value) {
    let root = value;
    while (this.parent[root] !== root) root = this.parent[root];
    let cursor = value;
    while (this.parent[cursor] !== cursor) {
      const next = this.parent[cursor];
      this.parent[cursor] = root;
      cursor = next;
    }
    return root;
  }

  union(left, right) {
    let leftRoot = this.find(left);
    let rightRoot = this.find(right);
    if (leftRoot === rightRoot) return;
    if (this.rank[leftRoot] < this.rank[rightRoot]) [leftRoot, rightRoot] = [rightRoot, leftRoot];
    this.parent[rightRoot] = leftRoot;
    if (this.rank[leftRoot] === this.rank[rightRoot]) this.rank[leftRoot] += 1;
  }
}

function positionBounds(positions) {
  const min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (let index = 0; index < positions.length; index += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], positions[index + axis]);
      max[axis] = Math.max(max[axis], positions[index + axis]);
    }
  }
  return { min, max };
}

function discoverComponents(positions, indices) {
  const vertexCount = positions.length / 3;
  const bounds = positionBounds(positions);
  const diagonal = Math.hypot(
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2],
  );
  const weldTolerance = Math.max(diagonal * 1e-6, 1e-7);
  const weldedByKey = new Map();
  const vertexToWelded = new Uint32Array(vertexCount);
  let weldedCount = 0;

  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const offset = vertex * 3;
    const key = `${Math.round(positions[offset] / weldTolerance)},${Math.round(positions[offset + 1] / weldTolerance)},${Math.round(positions[offset + 2] / weldTolerance)}`;
    let welded = weldedByKey.get(key);
    if (welded === undefined) {
      welded = weldedCount;
      weldedByKey.set(key, welded);
      weldedCount += 1;
    }
    vertexToWelded[vertex] = welded;
  }

  const sets = new DisjointSet(weldedCount);
  for (let index = 0; index < indices.length; index += 3) {
    const a = vertexToWelded[indices[index]];
    const b = vertexToWelded[indices[index + 1]];
    const c = vertexToWelded[indices[index + 2]];
    sets.union(a, b);
    sets.union(a, c);
  }

  const statsByRoot = new Map();
  const componentForVertex = new Uint32Array(vertexCount);
  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const root = sets.find(vertexToWelded[vertex]);
    let stats = statsByRoot.get(root);
    if (!stats) {
      stats = {
        root,
        vertexCount: 0,
        triangleCount: 0,
        min: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
        max: [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
      };
      statsByRoot.set(root, stats);
    }
    stats.vertexCount += 1;
    const offset = vertex * 3;
    for (let axis = 0; axis < 3; axis += 1) {
      stats.min[axis] = Math.min(stats.min[axis], positions[offset + axis]);
      stats.max[axis] = Math.max(stats.max[axis], positions[offset + axis]);
    }
  }

  for (let index = 0; index < indices.length; index += 3) {
    const root = sets.find(vertexToWelded[indices[index]]);
    const stats = statsByRoot.get(root);
    const otherRootA = sets.find(vertexToWelded[indices[index + 1]]);
    const otherRootB = sets.find(vertexToWelded[indices[index + 2]]);
    invariant(root === otherRootA && root === otherRootB, "A triangle spans multiple welded components");
    stats.triangleCount += 1;
  }

  const components = [...statsByRoot.values()]
    .sort((left, right) => right.vertexCount - left.vertexCount)
    .map((component, index) => ({
      ...component,
      id: index,
      center: component.min.map((value, axis) => (value + component.max[axis]) / 2),
      extent: component.min.map((value, axis) => component.max[axis] - value),
    }));
  const idByRoot = new Map(components.map((component) => [component.root, component.id]));
  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    componentForVertex[vertex] = idByRoot.get(sets.find(vertexToWelded[vertex]));
  }

  return { bounds, components, componentForVertex, weldedCount, weldTolerance };
}

function classifyComponents(components) {
  invariant(
    components.length === 9,
    `Expected nine welded visual components, found ${components.length}. Refusing to guess skin weights.`,
  );

  const shell = components[0];
  const details = components.slice(1);
  const eyes = details.toSorted((left, right) => right.center[1] - left.center[1]).slice(0, 2);
  const eyeIds = new Set(eyes.map((component) => component.id));
  const lowerDetails = details.filter((component) => !eyeIds.has(component.id));
  const mouth = lowerDetails.toSorted(
    (left, right) => Math.abs(left.center[0]) - Math.abs(right.center[0]),
  )[0];
  const withoutMouth = lowerDetails.filter((component) => component.id !== mouth.id);
  const dpad = withoutMouth.toSorted((left, right) => left.center[0] - right.center[0])[0];
  const buttons = withoutMouth.filter((component) => component.id !== dpad.id);
  invariant(buttons.length === 4, `Expected four button components, found ${buttons.length}`);

  const sortedEyes = eyes.toSorted((left, right) => left.center[0] - right.center[0]);
  const buttonByHeight = buttons.toSorted((left, right) => right.center[1] - left.center[1]);
  const upperButton = buttonByHeight[0];
  const lowerButton = buttonByHeight.at(-1);
  const sideButtons = buttonByHeight
    .slice(1, -1)
    .toSorted((left, right) => left.center[0] - right.center[0]);

  const assignments = [
    ["Shell", shell],
    ["DPad", dpad],
    ["Eye_Left", sortedEyes[0]],
    ["Eye_Right", sortedEyes[1]],
    ["Mouth", mouth],
    ["Button_Upper", upperButton],
    ["Button_Left", sideButtons[0]],
    ["Button_Right", sideButtons[1]],
    ["Button_Lower", lowerButton],
  ];

  const byComponent = new Map(assignments.map(([name, component]) => [component.id, name]));
  invariant(byComponent.size === 9, "Component classification assigned a component more than once");
  return assignments.map(([name, component]) => ({ ...component, name }));
}

class BinaryBuilder {
  constructor(source) {
    this.parts = [Buffer.from(source)];
    this.length = source.length;
  }

  append(typedArray) {
    const padding = (4 - (this.length % 4)) % 4;
    if (padding) {
      this.parts.push(Buffer.alloc(padding));
      this.length += padding;
    }
    const byteOffset = this.length;
    const bytes = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    this.parts.push(bytes);
    this.length += bytes.length;
    return { byteOffset, byteLength: bytes.length };
  }

  finish() {
    return Buffer.concat(this.parts, this.length);
  }
}

function appendAccessor(gltf, builder, typedArray, options) {
  const viewData = builder.append(typedArray);
  const view = { buffer: 0, ...viewData };
  if (options.target !== undefined) view.target = options.target;
  gltf.bufferViews ??= [];
  gltf.bufferViews.push(view);
  const accessor = {
    bufferView: gltf.bufferViews.length - 1,
    componentType: options.componentType,
    count: typedArray.length / TYPE_COMPONENTS[options.type],
    type: options.type,
  };
  if (options.min) accessor.min = options.min;
  if (options.max) accessor.max = options.max;
  gltf.accessors ??= [];
  gltf.accessors.push(accessor);
  return gltf.accessors.length - 1;
}

function inverseTranslation(center) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    -center[0], -center[1], -center[2], 1,
  ];
}

function quaternionAroundZ(radians) {
  return [0, 0, Math.sin(radians / 2), Math.cos(radians / 2)];
}

function quaternionAroundX(radians) {
  return [Math.sin(radians / 2), 0, 0, Math.cos(radians / 2)];
}

function quaternionFromEulerXYZ(xRadians, yRadians, zRadians) {
  const halfX = xRadians / 2;
  const halfY = yRadians / 2;
  const halfZ = zRadians / 2;
  const sinX = Math.sin(halfX);
  const cosX = Math.cos(halfX);
  const sinY = Math.sin(halfY);
  const cosY = Math.cos(halfY);
  const sinZ = Math.sin(halfZ);
  const cosZ = Math.cos(halfZ);

  return [
    sinX * cosY * cosZ + cosX * sinY * sinZ,
    cosX * sinY * cosZ - sinX * cosY * sinZ,
    cosX * cosY * sinZ + sinX * sinY * cosZ,
    cosX * cosY * cosZ - sinX * sinY * sinZ,
  ];
}

function smoothstep(minimum, maximum, value) {
  const amount = Math.max(0, Math.min(1, (value - minimum) / (maximum - minimum)));
  return amount * amount * (3 - 2 * amount);
}

function createRig(gltf, binary, primitive, discovery, classified) {
  const builder = new BinaryBuilder(binary.subarray(0, gltf.buffers[0].byteLength));
  const vertexCount = discovery.componentForVertex.length;
  const joints = new Uint8Array(vertexCount * 4);
  const weights = new Float32Array(vertexCount * 4);
  const jointForComponent = new Map(classified.map((component, index) => [component.id, index + 1]));

  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const joint = jointForComponent.get(discovery.componentForVertex[vertex]);
    invariant(joint !== undefined, `No joint was assigned to vertex ${vertex}`);
    joints[vertex * 4] = joint;
    weights[vertex * 4] = 1;
  }

  const jointsAccessor = appendAccessor(gltf, builder, joints, {
    componentType: 5121,
    type: "VEC4",
    target: 34962,
  });
  const weightsAccessor = appendAccessor(gltf, builder, weights, {
    componentType: 5126,
    type: "VEC4",
    target: 34962,
  });
  primitive.attributes.JOINTS_0 = jointsAccessor;
  primitive.attributes.WEIGHTS_0 = weightsAccessor;

  const inverseBindMatrices = new Float32Array((classified.length + 1) * 16);
  inverseBindMatrices.set(inverseTranslation([0, 0, 0]), 0);
  for (let index = 0; index < classified.length; index += 1) {
    inverseBindMatrices.set(inverseTranslation(classified[index].center), (index + 1) * 16);
  }
  const inverseBindAccessor = appendAccessor(gltf, builder, inverseBindMatrices, {
    componentType: 5126,
    type: "MAT4",
  });

  const sourceMeshNode = gltf.nodes?.find((node) => node.mesh !== undefined) ?? {};
  const featureNodeStart = 2;
  const meshNodeIndex = featureNodeStart + classified.length;
  const featureNodes = classified.map((component) => ({
    name: component.name,
    translation: component.center.map((value) => Number(value.toFixed(7))),
  }));
  gltf.nodes = [
    { name: "RigRoot", children: [1, meshNodeIndex] },
    {
      name: "Body",
      children: featureNodes.map((_, index) => featureNodeStart + index),
    },
    ...featureNodes,
    {
      ...sourceMeshNode,
      name: "QuiuMesh",
      mesh: 0,
      skin: 0,
      children: undefined,
    },
  ].map((node) => {
    const cleaned = { ...node };
    if (cleaned.children === undefined) delete cleaned.children;
    return cleaned;
  });
  gltf.scenes = [{ ...(gltf.scenes?.[gltf.scene ?? 0] ?? {}), nodes: [0] }];
  gltf.scene = 0;
  gltf.skins = [{
    name: "Quiu_Rig",
    inverseBindMatrices: inverseBindAccessor,
    skeleton: 1,
    joints: Array.from({ length: classified.length + 1 }, (_, index) => index + 1),
  }];

  const idleTimes = new Float32Array([0, 1.5, 3, 4.5, 6]);
  const idleTranslations = new Float32Array([
    0, 0, 0,
    0, 0.008, 0,
    0, 0, 0,
    0, -0.006, 0,
    0, 0, 0,
  ]);
  const idleRotations = new Float32Array([
    ...quaternionAroundZ(0),
    ...quaternionAroundZ(0.006),
    ...quaternionAroundZ(0),
    ...quaternionAroundZ(-0.005),
    ...quaternionAroundZ(0),
  ]);
  const idleTimeAccessor = appendAccessor(gltf, builder, idleTimes, {
    componentType: 5126,
    type: "SCALAR",
    min: [0],
    max: [6],
  });
  const idleTranslationAccessor = appendAccessor(gltf, builder, idleTranslations, {
    componentType: 5126,
    type: "VEC3",
  });
  const idleRotationAccessor = appendAccessor(gltf, builder, idleRotations, {
    componentType: 5126,
    type: "VEC4",
  });

  const blinkTimes = new Float32Array([
    0,
    2.68, 2.74, 2.82,
    5.9, 5.96, 6.04,
    6.17, 6.23, 6.3,
    8,
  ]);
  const blinkScales = new Float32Array(blinkTimes.length * 3);
  const closedIndices = new Set([2, 5, 8]);
  for (let index = 0; index < blinkTimes.length; index += 1) {
    blinkScales.set([1, closedIndices.has(index) ? 0.035 : 1, 1], index * 3);
  }
  const blinkTimeAccessor = appendAccessor(gltf, builder, blinkTimes, {
    componentType: 5126,
    type: "SCALAR",
    min: [0],
    max: [8],
  });
  const blinkScaleAccessor = appendAccessor(gltf, builder, blinkScales, {
    componentType: 5126,
    type: "VEC3",
  });

  const nameToNode = new Map(classified.map((component, index) => [component.name, featureNodeStart + index]));
  gltf.animations = [
    {
      name: "Quiu_Idle",
      samplers: [
        { input: idleTimeAccessor, output: idleTranslationAccessor, interpolation: "LINEAR" },
        { input: idleTimeAccessor, output: idleRotationAccessor, interpolation: "LINEAR" },
      ],
      channels: [
        { sampler: 0, target: { node: 1, path: "translation" } },
        { sampler: 1, target: { node: 1, path: "rotation" } },
      ],
      extras: { loop: "repeat", description: "Subtle six-second breathing hover" },
    },
    {
      name: "Quiu_Blink",
      samplers: [
        { input: blinkTimeAccessor, output: blinkScaleAccessor, interpolation: "LINEAR" },
      ],
      channels: [
        { sampler: 0, target: { node: nameToNode.get("Eye_Left"), path: "scale" } },
        { sampler: 0, target: { node: nameToNode.get("Eye_Right"), path: "scale" } },
      ],
      extras: { loop: "repeat", description: "Natural single blink followed by an occasional double blink" },
    },
  ];

  gltf.asset = {
    ...gltf.asset,
    generator: `${gltf.asset?.generator ?? "Press Q"}; conservative rigid-island rig`,
  };
  gltf.extras = {
    ...(gltf.extras ?? {}),
    pressQRig: {
      version: 1,
      method: "position-welded connected components with rigid skin weights",
      source: path.basename(inputPath),
      components: classified.map(({ name, center, vertexCount: count, triangleCount }) => ({
        name,
        center: center.map((value) => Number(value.toFixed(7))),
        vertices: count,
        triangles: triangleCount,
      })),
    },
  };

  const completeBinary = builder.finish();
  gltf.buffers[0].byteLength = completeBinary.length;
  return { binary: completeBinary, jointCount: classified.length + 1 };
}

function createWorldRig(gltf, binary, primitive, positions, discovery) {
  const builder = new BinaryBuilder(binary.subarray(0, gltf.buffers[0].byteLength));
  const vertexCount = positions.length / 3;
  const joints = new Uint8Array(vertexCount * 4);
  const weights = new Float32Array(vertexCount * 4);
  const { min, max } = discovery.bounds;
  const width = max[0] - min[0];
  const height = max[1] - min[1];
  const center = min.map((value, axis) => (value + max[axis]) / 2);
  const leftArmPivot = [center[0] - width * 0.31, min[1] + height * 0.47, center[2]];
  const rightArmPivot = [center[0] + width * 0.31, min[1] + height * 0.47, center[2]];
  const leftLegPivot = [center[0] - width * 0.105, min[1] + height * 0.27, center[2]];
  const rightLegPivot = [center[0] + width * 0.105, min[1] + height * 0.27, center[2]];
  let leftArmWeightedVertices = 0;
  let rightArmWeightedVertices = 0;
  let leftLegWeightedVertices = 0;
  let rightLegWeightedVertices = 0;

  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const positionOffset = vertex * 3;
    const outputOffset = vertex * 4;
    const x = positions[positionOffset];
    const y = positions[positionOffset + 1];
    const normalizedY = (y - min[1]) / height;
    const normalizedX = (x - center[0]) / width;
    const absoluteX = Math.abs(normalizedX);
    const armVerticalBand = smoothstep(0.18, 0.32, normalizedY)
      * (1 - smoothstep(0.55, 0.72, normalizedY));
    const armReach = smoothstep(0.18, 0.45, absoluteX);
    const legVerticalBand = 1 - smoothstep(0.2, 0.4, normalizedY);
    const legCenterMask = 1 - smoothstep(0.2, 0.36, absoluteX);
    const legSideReach = smoothstep(0.012, 0.1, absoluteX);
    let armWeight = Math.min(0.84, armReach * armVerticalBand * 0.84);
    let legWeight = Math.min(0.88, legCenterMask * legSideReach * legVerticalBand * 0.88);
    const regionalWeight = armWeight + legWeight;
    if (regionalWeight > 0.92) {
      const normalization = 0.92 / regionalWeight;
      armWeight *= normalization;
      legWeight *= normalization;
    }
    const bodyWeight = 1 - armWeight - legWeight;
    const isLeft = normalizedX < 0;

    joints.set(isLeft ? [0, 1, 3, 0] : [0, 2, 4, 0], outputOffset);
    weights.set([bodyWeight, armWeight, legWeight, 0], outputOffset);
    if (armWeight > 0.01) {
      if (isLeft) leftArmWeightedVertices += 1;
      else rightArmWeightedVertices += 1;
    }
    if (legWeight > 0.01) {
      if (isLeft) leftLegWeightedVertices += 1;
      else rightLegWeightedVertices += 1;
    }
  }

  invariant(
    leftArmWeightedVertices > 0 && rightArmWeightedVertices > 0
      && leftLegWeightedVertices > 0 && rightLegWeightedVertices > 0,
    "World rig did not find all four limb regions",
  );

  primitive.attributes.JOINTS_0 = appendAccessor(gltf, builder, joints, {
    componentType: 5121,
    type: "VEC4",
    target: 34962,
  });
  primitive.attributes.WEIGHTS_0 = appendAccessor(gltf, builder, weights, {
    componentType: 5126,
    type: "VEC4",
    target: 34962,
  });

  const inverseBindMatrices = new Float32Array(5 * 16);
  inverseBindMatrices.set(inverseTranslation([0, 0, 0]), 0);
  inverseBindMatrices.set(inverseTranslation(leftArmPivot), 16);
  inverseBindMatrices.set(inverseTranslation(rightArmPivot), 32);
  inverseBindMatrices.set(inverseTranslation(leftLegPivot), 48);
  inverseBindMatrices.set(inverseTranslation(rightLegPivot), 64);
  const inverseBindAccessor = appendAccessor(gltf, builder, inverseBindMatrices, {
    componentType: 5126,
    type: "MAT4",
  });

  const sourceMeshNode = gltf.nodes?.find((node) => node.mesh !== undefined) ?? {};
  gltf.nodes = [
    { name: "RigRoot", children: [1, 6] },
    { name: "Body", children: [2, 3, 4, 5] },
    { name: "Arm_Left", translation: leftArmPivot.map((value) => Number(value.toFixed(7))) },
    { name: "Arm_Right", translation: rightArmPivot.map((value) => Number(value.toFixed(7))) },
    { name: "Leg_Left", translation: leftLegPivot.map((value) => Number(value.toFixed(7))) },
    { name: "Leg_Right", translation: rightLegPivot.map((value) => Number(value.toFixed(7))) },
    {
      ...sourceMeshNode,
      name: "QuiuWorldMesh",
      mesh: 0,
      skin: 0,
      children: undefined,
    },
  ].map((node) => {
    const cleaned = { ...node };
    if (cleaned.children === undefined) delete cleaned.children;
    return cleaned;
  });
  gltf.scenes = [{ ...(gltf.scenes?.[gltf.scene ?? 0] ?? {}), nodes: [0] }];
  gltf.scene = 0;
  gltf.skins = [{
    name: "Quiu_World_Rig",
    inverseBindMatrices: inverseBindAccessor,
    skeleton: 1,
    joints: [1, 2, 3, 4, 5],
  }];

  const idleTimes = new Float32Array([0, 1.5, 3, 4.5, 6]);
  const idleTranslations = new Float32Array([
    0, 0, 0,
    0, 0.012, 0,
    0, 0, 0,
    0, -0.009, 0,
    0, 0, 0,
  ]);
  const idleRotations = new Float32Array([
    ...quaternionAroundZ(0),
    ...quaternionAroundZ(0.008),
    ...quaternionAroundZ(0),
    ...quaternionAroundZ(-0.007),
    ...quaternionAroundZ(0),
  ]);
  const leftArmRotations = new Float32Array([
    ...quaternionAroundZ(0),
    ...quaternionAroundZ(-0.045),
    ...quaternionAroundZ(0),
    ...quaternionAroundZ(0.035),
    ...quaternionAroundZ(0),
  ]);
  const rightArmRotations = new Float32Array([
    ...quaternionAroundZ(0),
    ...quaternionAroundZ(0.045),
    ...quaternionAroundZ(0),
    ...quaternionAroundZ(-0.035),
    ...quaternionAroundZ(0),
  ]);
  const idleTimeAccessor = appendAccessor(gltf, builder, idleTimes, {
    componentType: 5126,
    type: "SCALAR",
    min: [0],
    max: [6],
  });
  const idleTranslationAccessor = appendAccessor(gltf, builder, idleTranslations, {
    componentType: 5126,
    type: "VEC3",
  });
  const idleRotationAccessor = appendAccessor(gltf, builder, idleRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const leftArmRotationAccessor = appendAccessor(gltf, builder, leftArmRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const rightArmRotationAccessor = appendAccessor(gltf, builder, rightArmRotations, {
    componentType: 5126,
    type: "VEC4",
  });

  const runTimes = new Float32Array([0, 0.16, 0.32, 0.48, 0.64]);
  const runBodyTranslations = new Float32Array([
    0, 0, 0,
    0, 0.026, 0,
    0, 0, 0,
    0, 0.026, 0,
    0, 0, 0,
  ]);
  const runBodyRotations = new Float32Array([
    ...quaternionAroundZ(0),
    ...quaternionAroundZ(-0.028),
    ...quaternionAroundZ(0),
    ...quaternionAroundZ(0.028),
    ...quaternionAroundZ(0),
  ]);
  const runLeftArmRotations = new Float32Array([
    ...quaternionAroundX(0.52),
    ...quaternionAroundX(0),
    ...quaternionAroundX(-0.52),
    ...quaternionAroundX(0),
    ...quaternionAroundX(0.52),
  ]);
  const runRightArmRotations = new Float32Array([
    ...quaternionAroundX(-0.52),
    ...quaternionAroundX(0),
    ...quaternionAroundX(0.52),
    ...quaternionAroundX(0),
    ...quaternionAroundX(-0.52),
  ]);
  const runLeftLegRotations = new Float32Array([
    ...quaternionAroundX(-0.48),
    ...quaternionAroundX(0),
    ...quaternionAroundX(0.48),
    ...quaternionAroundX(0),
    ...quaternionAroundX(-0.48),
  ]);
  const runRightLegRotations = new Float32Array([
    ...quaternionAroundX(0.48),
    ...quaternionAroundX(0),
    ...quaternionAroundX(-0.48),
    ...quaternionAroundX(0),
    ...quaternionAroundX(0.48),
  ]);
  const runTimeAccessor = appendAccessor(gltf, builder, runTimes, {
    componentType: 5126,
    type: "SCALAR",
    min: [0],
    max: [0.64],
  });
  const runBodyTranslationAccessor = appendAccessor(gltf, builder, runBodyTranslations, {
    componentType: 5126,
    type: "VEC3",
  });
  const runBodyRotationAccessor = appendAccessor(gltf, builder, runBodyRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const runLeftArmAccessor = appendAccessor(gltf, builder, runLeftArmRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const runRightArmAccessor = appendAccessor(gltf, builder, runRightArmRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const runLeftLegAccessor = appendAccessor(gltf, builder, runLeftLegRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const runRightLegAccessor = appendAccessor(gltf, builder, runRightLegRotations, {
    componentType: 5126,
    type: "VEC4",
  });

  const boostRunTimes = new Float32Array([0, 0.09, 0.18, 0.27, 0.36]);
  const boostRunBodyTranslations = new Float32Array([
    0, 0, 0,
    0, 0.042, 0,
    0, 0, 0,
    0, 0.042, 0,
    0, 0, 0,
  ]);
  const boostRunBodyRotations = new Float32Array([
    ...quaternionAroundX(-0.1),
    ...quaternionAroundX(-0.13),
    ...quaternionAroundX(-0.1),
    ...quaternionAroundX(-0.13),
    ...quaternionAroundX(-0.1),
  ]);
  const boostRunLeftArmRotations = new Float32Array([
    ...quaternionAroundX(0.72),
    ...quaternionAroundX(0),
    ...quaternionAroundX(-0.72),
    ...quaternionAroundX(0),
    ...quaternionAroundX(0.72),
  ]);
  const boostRunRightArmRotations = new Float32Array([
    ...quaternionAroundX(-0.72),
    ...quaternionAroundX(0),
    ...quaternionAroundX(0.72),
    ...quaternionAroundX(0),
    ...quaternionAroundX(-0.72),
  ]);
  const boostRunLeftLegRotations = new Float32Array([
    ...quaternionAroundX(-0.68),
    ...quaternionAroundX(0),
    ...quaternionAroundX(0.68),
    ...quaternionAroundX(0),
    ...quaternionAroundX(-0.68),
  ]);
  const boostRunRightLegRotations = new Float32Array([
    ...quaternionAroundX(0.68),
    ...quaternionAroundX(0),
    ...quaternionAroundX(-0.68),
    ...quaternionAroundX(0),
    ...quaternionAroundX(0.68),
  ]);
  const boostRunTimeAccessor = appendAccessor(gltf, builder, boostRunTimes, {
    componentType: 5126,
    type: "SCALAR",
    min: [0],
    max: [0.36],
  });
  const boostRunBodyTranslationAccessor = appendAccessor(gltf, builder, boostRunBodyTranslations, {
    componentType: 5126,
    type: "VEC3",
  });
  const boostRunBodyRotationAccessor = appendAccessor(gltf, builder, boostRunBodyRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const boostRunLeftArmAccessor = appendAccessor(gltf, builder, boostRunLeftArmRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const boostRunRightArmAccessor = appendAccessor(gltf, builder, boostRunRightArmRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const boostRunLeftLegAccessor = appendAccessor(gltf, builder, boostRunLeftLegRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const boostRunRightLegAccessor = appendAccessor(gltf, builder, boostRunRightLegRotations, {
    componentType: 5126,
    type: "VEC4",
  });

  // The apex pose is based on the supplied static jumping reference: both
  // arms lift high while the legs tuck and open visibly in silhouette.
  const jumpTimes = new Float32Array([0, 0.11, 0.41, 0.64, 0.82]);
  const jumpBodyRotations = new Float32Array([
    ...quaternionAroundX(-0.08),
    ...quaternionAroundX(-0.1),
    ...quaternionAroundX(0.04),
    ...quaternionAroundX(0.09),
    ...quaternionAroundX(0),
  ]);
  const jumpLeftArmRotations = new Float32Array([
    ...quaternionFromEulerXYZ(0.04, 0, -0.18),
    ...quaternionFromEulerXYZ(0.08, 0, -0.46),
    ...quaternionFromEulerXYZ(0.15, 0, -0.78),
    ...quaternionFromEulerXYZ(0.07, 0, -0.5),
    ...quaternionFromEulerXYZ(0, 0, 0),
  ]);
  const jumpRightArmRotations = new Float32Array([
    ...quaternionFromEulerXYZ(0.04, 0, 0.18),
    ...quaternionFromEulerXYZ(0.08, 0, 0.46),
    ...quaternionFromEulerXYZ(0.15, 0, 0.78),
    ...quaternionFromEulerXYZ(0.07, 0, 0.5),
    ...quaternionFromEulerXYZ(0, 0, 0),
  ]);
  const jumpLeftLegRotations = new Float32Array([
    ...quaternionFromEulerXYZ(0.12, 0, -0.08),
    ...quaternionFromEulerXYZ(0.22, 0, -0.14),
    ...quaternionFromEulerXYZ(0.42, 0, -0.32),
    ...quaternionFromEulerXYZ(0.16, 0, -0.18),
    ...quaternionFromEulerXYZ(0, 0, 0),
  ]);
  const jumpRightLegRotations = new Float32Array([
    ...quaternionFromEulerXYZ(0.12, 0, 0.08),
    ...quaternionFromEulerXYZ(0.22, 0, 0.14),
    ...quaternionFromEulerXYZ(0.42, 0, 0.32),
    ...quaternionFromEulerXYZ(0.16, 0, 0.18),
    ...quaternionFromEulerXYZ(0, 0, 0),
  ]);
  const jumpTimeAccessor = appendAccessor(gltf, builder, jumpTimes, {
    componentType: 5126,
    type: "SCALAR",
    min: [0],
    max: [0.82],
  });
  const jumpBodyAccessor = appendAccessor(gltf, builder, jumpBodyRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const jumpLeftArmAccessor = appendAccessor(gltf, builder, jumpLeftArmRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const jumpRightArmAccessor = appendAccessor(gltf, builder, jumpRightArmRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const jumpLeftLegAccessor = appendAccessor(gltf, builder, jumpLeftLegRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const jumpRightLegAccessor = appendAccessor(gltf, builder, jumpRightLegRotations, {
    componentType: 5126,
    type: "VEC4",
  });

  const boostTimes = new Float32Array([0, 0.13, 0.34]);
  const boostScales = new Float32Array([
    1, 1, 1,
    0.94, 1.075, 0.94,
    1, 1, 1,
  ]);
  const boostTimeAccessor = appendAccessor(gltf, builder, boostTimes, {
    componentType: 5126,
    type: "SCALAR",
    min: [0],
    max: [0.34],
  });
  const boostScaleAccessor = appendAccessor(gltf, builder, boostScales, {
    componentType: 5126,
    type: "VEC3",
  });

  const celebrateTimes = new Float32Array([0, 0.3, 0.62, 0.95, 1.25]);
  const celebrateBodyRotations = new Float32Array([
    ...quaternionAroundZ(0),
    ...quaternionAroundZ(-0.1),
    ...quaternionAroundZ(0.1),
    ...quaternionAroundZ(-0.05),
    ...quaternionAroundZ(0),
  ]);
  const celebrateLeftRotations = new Float32Array([
    ...quaternionAroundZ(0),
    ...quaternionAroundZ(-0.22),
    ...quaternionAroundZ(-0.12),
    ...quaternionAroundZ(-0.2),
    ...quaternionAroundZ(0),
  ]);
  const celebrateRightRotations = new Float32Array([
    ...quaternionAroundZ(0),
    ...quaternionAroundZ(0.22),
    ...quaternionAroundZ(0.12),
    ...quaternionAroundZ(0.2),
    ...quaternionAroundZ(0),
  ]);
  const celebrateTimeAccessor = appendAccessor(gltf, builder, celebrateTimes, {
    componentType: 5126,
    type: "SCALAR",
    min: [0],
    max: [1.25],
  });
  const celebrateBodyAccessor = appendAccessor(gltf, builder, celebrateBodyRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const celebrateLeftAccessor = appendAccessor(gltf, builder, celebrateLeftRotations, {
    componentType: 5126,
    type: "VEC4",
  });
  const celebrateRightAccessor = appendAccessor(gltf, builder, celebrateRightRotations, {
    componentType: 5126,
    type: "VEC4",
  });

  gltf.animations = [
    {
      name: "Quiu_Idle",
      samplers: [
        { input: idleTimeAccessor, output: idleTranslationAccessor, interpolation: "LINEAR" },
        { input: idleTimeAccessor, output: idleRotationAccessor, interpolation: "LINEAR" },
        { input: idleTimeAccessor, output: leftArmRotationAccessor, interpolation: "LINEAR" },
        { input: idleTimeAccessor, output: rightArmRotationAccessor, interpolation: "LINEAR" },
      ],
      channels: [
        { sampler: 0, target: { node: 1, path: "translation" } },
        { sampler: 1, target: { node: 1, path: "rotation" } },
        { sampler: 2, target: { node: 2, path: "rotation" } },
        { sampler: 3, target: { node: 3, path: "rotation" } },
      ],
      extras: { loop: "repeat", description: "Subtle hover and arm drift" },
    },
    {
      name: "Quiu_Run",
      samplers: [
        { input: runTimeAccessor, output: runBodyTranslationAccessor, interpolation: "LINEAR" },
        { input: runTimeAccessor, output: runBodyRotationAccessor, interpolation: "LINEAR" },
        { input: runTimeAccessor, output: runLeftArmAccessor, interpolation: "LINEAR" },
        { input: runTimeAccessor, output: runRightArmAccessor, interpolation: "LINEAR" },
        { input: runTimeAccessor, output: runLeftLegAccessor, interpolation: "LINEAR" },
        { input: runTimeAccessor, output: runRightLegAccessor, interpolation: "LINEAR" },
      ],
      channels: [
        { sampler: 0, target: { node: 1, path: "translation" } },
        { sampler: 1, target: { node: 1, path: "rotation" } },
        { sampler: 2, target: { node: 2, path: "rotation" } },
        { sampler: 3, target: { node: 3, path: "rotation" } },
        { sampler: 4, target: { node: 4, path: "rotation" } },
        { sampler: 5, target: { node: 5, path: "rotation" } },
      ],
      extras: { loop: "repeat", description: "Alternating arm and leg run cycle" },
    },
    {
      name: "Quiu_BoostRun",
      samplers: [
        { input: boostRunTimeAccessor, output: boostRunBodyTranslationAccessor, interpolation: "LINEAR" },
        { input: boostRunTimeAccessor, output: boostRunBodyRotationAccessor, interpolation: "LINEAR" },
        { input: boostRunTimeAccessor, output: boostRunLeftArmAccessor, interpolation: "LINEAR" },
        { input: boostRunTimeAccessor, output: boostRunRightArmAccessor, interpolation: "LINEAR" },
        { input: boostRunTimeAccessor, output: boostRunLeftLegAccessor, interpolation: "LINEAR" },
        { input: boostRunTimeAccessor, output: boostRunRightLegAccessor, interpolation: "LINEAR" },
      ],
      channels: [
        { sampler: 0, target: { node: 1, path: "translation" } },
        { sampler: 1, target: { node: 1, path: "rotation" } },
        { sampler: 2, target: { node: 2, path: "rotation" } },
        { sampler: 3, target: { node: 3, path: "rotation" } },
        { sampler: 4, target: { node: 4, path: "rotation" } },
        { sampler: 5, target: { node: 5, path: "rotation" } },
      ],
      extras: { loop: "repeat", description: "Fast forward-leaning boost sprint" },
    },
    {
      name: "Quiu_Jump",
      samplers: [
        { input: jumpTimeAccessor, output: jumpBodyAccessor, interpolation: "LINEAR" },
        { input: jumpTimeAccessor, output: jumpLeftArmAccessor, interpolation: "LINEAR" },
        { input: jumpTimeAccessor, output: jumpRightArmAccessor, interpolation: "LINEAR" },
        { input: jumpTimeAccessor, output: jumpLeftLegAccessor, interpolation: "LINEAR" },
        { input: jumpTimeAccessor, output: jumpRightLegAccessor, interpolation: "LINEAR" },
      ],
      channels: [
        { sampler: 0, target: { node: 1, path: "rotation" } },
        { sampler: 1, target: { node: 2, path: "rotation" } },
        { sampler: 2, target: { node: 3, path: "rotation" } },
        { sampler: 3, target: { node: 4, path: "rotation" } },
        { sampler: 4, target: { node: 5, path: "rotation" } },
      ],
      extras: { loop: "once", description: "Takeoff, airborne tuck and landing recovery" },
    },
    {
      name: "Quiu_Boost",
      samplers: [
        { input: boostTimeAccessor, output: boostScaleAccessor, interpolation: "LINEAR" },
      ],
      channels: [{ sampler: 0, target: { node: 1, path: "scale" } }],
      extras: { loop: "once", description: "Short propulsion anticipation" },
    },
    {
      name: "Quiu_Celebrate",
      samplers: [
        { input: celebrateTimeAccessor, output: celebrateBodyAccessor, interpolation: "LINEAR" },
        { input: celebrateTimeAccessor, output: celebrateLeftAccessor, interpolation: "LINEAR" },
        { input: celebrateTimeAccessor, output: celebrateRightAccessor, interpolation: "LINEAR" },
      ],
      channels: [
        { sampler: 0, target: { node: 1, path: "rotation" } },
        { sampler: 1, target: { node: 2, path: "rotation" } },
        { sampler: 2, target: { node: 3, path: "rotation" } },
      ],
      extras: { loop: "once", description: "Completion celebration" },
    },
  ];

  gltf.asset = {
    ...gltf.asset,
    generator: `${gltf.asset?.generator ?? "Press Q"}; Quiu World soft-region rig`,
  };
  gltf.extras = {
    ...(gltf.extras ?? {}),
    pressQRig: {
      version: 2,
      method: "continuous mesh with conservative soft arm and leg region weights",
      source: path.basename(inputPath),
      joints: ["Body", "Arm_Left", "Arm_Right", "Leg_Left", "Leg_Right"],
      weightedVertices: {
        leftArm: leftArmWeightedVertices,
        rightArm: rightArmWeightedVertices,
        leftLeg: leftLegWeightedVertices,
        rightLeg: rightLegWeightedVertices,
      },
    },
  };

  const completeBinary = builder.finish();
  gltf.buffers[0].byteLength = completeBinary.length;
  return {
    binary: completeBinary,
    jointCount: 5,
    weightedVertices: {
      leftArm: leftArmWeightedVertices,
      rightArm: rightArmWeightedVertices,
      leftLeg: leftLegWeightedVertices,
      rightLeg: rightLegWeightedVertices,
    },
  };
}

function encodeGlb(gltf, binary) {
  const json = Buffer.from(JSON.stringify(gltf), "utf8");
  const paddedJson = json.length % 4 === 0
    ? json
    : Buffer.concat([json, Buffer.alloc(4 - (json.length % 4), 0x20)]);
  const paddedBinary = binary.length % 4 === 0
    ? binary
    : Buffer.concat([binary, Buffer.alloc(4 - (binary.length % 4))]);
  const totalLength = 12 + 8 + paddedJson.length + 8 + paddedBinary.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(GLB_MAGIC, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(paddedJson.length, 0);
  jsonHeader.writeUInt32LE(JSON_CHUNK, 4);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(paddedBinary.length, 0);
  binaryHeader.writeUInt32LE(BIN_CHUNK, 4);
  return Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, paddedBinary]);
}

function validateRig(file, preserved, sourceBinary) {
  const { json: gltf, binary } = parseGlb(file);
  invariant(JSON.stringify(gltf.materials) === preserved.materials, "Materials changed during rigging");
  invariant(JSON.stringify(gltf.textures) === preserved.textures, "Textures changed during rigging");
  invariant(JSON.stringify(gltf.images) === preserved.images, "Images changed during rigging");
  invariant(JSON.stringify(gltf.samplers) === preserved.samplers, "Texture samplers changed during rigging");
  invariant(binary.subarray(0, sourceBinary.length).equals(sourceBinary), "Original binary payload was not preserved");
  invariant(gltf.nodes?.[0]?.name === "RigRoot", "RigRoot is missing");
  invariant(gltf.nodes?.[1]?.name === "Body", "Body joint is missing");
  invariant(gltf.skins?.length === 1 && gltf.skins[0].joints.length === 10, "Skin must contain ten joints");
  invariant(gltf.animations?.map((animation) => animation.name).join(",") === "Quiu_Idle,Quiu_Blink", "Animation clips are missing");

  for (let index = 0; index < gltf.accessors.length; index += 1) {
    accessorValues(gltf, binary, index);
  }

  const primitive = gltf.meshes[0].primitives[0];
  const positions = accessorValues(gltf, binary, primitive.attributes.POSITION);
  const jointData = accessorValues(gltf, binary, primitive.attributes.JOINTS_0);
  const weightData = accessorValues(gltf, binary, primitive.attributes.WEIGHTS_0);
  invariant(jointData.accessor.count === positions.accessor.count, "JOINTS_0 count differs from POSITION count");
  invariant(weightData.accessor.count === positions.accessor.count, "WEIGHTS_0 count differs from POSITION count");
  for (let vertex = 0; vertex < positions.accessor.count; vertex += 1) {
    const offset = vertex * 4;
    const sum = weightData.values[offset] + weightData.values[offset + 1]
      + weightData.values[offset + 2] + weightData.values[offset + 3];
    invariant(Math.abs(sum - 1) < 1e-6, `Skin weights do not sum to one at vertex ${vertex}`);
    invariant(jointData.values[offset] >= 1 && jointData.values[offset] <= 9, `Invalid rigid joint at vertex ${vertex}`);
    invariant(weightData.values[offset] === 1, `Vertex ${vertex} is not rigidly weighted`);
  }
  return { gltf, binary };
}

function validateWorldRig(file, preserved, sourceBinary) {
  const { json: gltf, binary } = parseGlb(file);
  invariant(JSON.stringify(gltf.materials) === preserved.materials, "Materials changed during rigging");
  invariant(JSON.stringify(gltf.textures) === preserved.textures, "Textures changed during rigging");
  invariant(JSON.stringify(gltf.images) === preserved.images, "Images changed during rigging");
  invariant(JSON.stringify(gltf.samplers) === preserved.samplers, "Texture samplers changed during rigging");
  invariant(binary.subarray(0, sourceBinary.length).equals(sourceBinary), "Original binary payload was not preserved");
  invariant(gltf.nodes?.[0]?.name === "RigRoot", "RigRoot is missing");
  invariant(gltf.nodes?.[1]?.name === "Body", "Body joint is missing");
  invariant(gltf.skins?.length === 1 && gltf.skins[0].joints.length === 5, "World skin must contain five joints");
  invariant(
    gltf.animations?.map((animation) => animation.name).join(",") === "Quiu_Idle,Quiu_Run,Quiu_BoostRun,Quiu_Jump,Quiu_Boost,Quiu_Celebrate",
    "World animation clips are missing",
  );

  for (let index = 0; index < gltf.accessors.length; index += 1) {
    accessorValues(gltf, binary, index);
  }

  const primitive = gltf.meshes[0].primitives[0];
  const positions = accessorValues(gltf, binary, primitive.attributes.POSITION);
  const jointData = accessorValues(gltf, binary, primitive.attributes.JOINTS_0);
  const weightData = accessorValues(gltf, binary, primitive.attributes.WEIGHTS_0);
  invariant(jointData.accessor.count === positions.accessor.count, "JOINTS_0 count differs from POSITION count");
  invariant(weightData.accessor.count === positions.accessor.count, "WEIGHTS_0 count differs from POSITION count");
  const weightedByJoint = new Array(5).fill(0);
  for (let vertex = 0; vertex < positions.accessor.count; vertex += 1) {
    const offset = vertex * 4;
    const sum = weightData.values[offset] + weightData.values[offset + 1]
      + weightData.values[offset + 2] + weightData.values[offset + 3];
    invariant(Math.abs(sum - 1) < 1e-5, `Skin weights do not sum to one at vertex ${vertex}`);
    for (let component = 0; component < 4; component += 1) {
      invariant(jointData.values[offset + component] >= 0 && jointData.values[offset + component] <= 4, `Invalid world joint at vertex ${vertex}`);
      invariant(weightData.values[offset + component] >= 0, `Negative skin weight at vertex ${vertex}`);
      if (weightData.values[offset + component] > 0.01) {
        weightedByJoint[jointData.values[offset + component]] += 1;
      }
    }
  }
  invariant(weightedByJoint.slice(1).every((count) => count > 0), "World rig limb weights are empty");
  return {
    gltf,
    binary,
    weightedVertices: {
      leftArm: weightedByJoint[1],
      rightArm: weightedByJoint[2],
      leftLeg: weightedByJoint[3],
      rightLeg: weightedByJoint[4],
    },
  };
}

const inputFile = await fs.readFile(inputPath);
const { json: gltf, binary: paddedSourceBinary } = parseGlb(inputFile);
const sourceBinary = Buffer.from(paddedSourceBinary.subarray(0, gltf.buffers[0].byteLength));
const preserved = {
  materials: JSON.stringify(gltf.materials),
  textures: JSON.stringify(gltf.textures),
  images: JSON.stringify(gltf.images),
  samplers: JSON.stringify(gltf.samplers),
};
invariant(gltf.meshes?.length === 1, `Expected one mesh, found ${gltf.meshes?.length ?? 0}`);
invariant(gltf.meshes[0].primitives?.length === 1, "Expected one mesh primitive");
const primitive = gltf.meshes[0].primitives[0];
invariant(primitive.mode === undefined || primitive.mode === 4, "Only triangle primitives can be rigged");
invariant(primitive.indices !== undefined, "Indexed geometry is required");
const positions = accessorValues(gltf, sourceBinary, primitive.attributes.POSITION).values;
const indices = accessorValues(gltf, sourceBinary, primitive.indices).values;
const discovery = discoverComponents(positions, indices);
const mode = requestedMode === "auto"
  ? discovery.components.length === 1 ? "world" : "mascot"
  : requestedMode;
invariant(mode === "mascot" || mode === "world", `Unknown rig mode: ${requestedMode}`);
const classified = mode === "mascot" ? classifyComponents(discovery.components) : null;

console.log(`Input: ${path.relative(process.cwd(), inputPath)}`);
console.log(`Mesh: ${positions.length / 3} vertices, ${indices.length / 3} triangles`);
console.log(
  `Welding: ${discovery.weldedCount} positions at tolerance ${discovery.weldTolerance.toExponential(3)} -> ${discovery.components.length} components`,
);
if (classified) {
  for (const component of classified) {
    console.log(
      `${component.name.padEnd(13)} component=${component.id} vertices=${String(component.vertexCount).padStart(6)} triangles=${String(component.triangleCount).padStart(6)} center=[${component.center.map((value) => value.toFixed(4)).join(", ")}] extent=[${component.extent.map((value) => value.toFixed(4)).join(", ")}]`,
    );
  }
} else {
  console.log(
    `Continuous mesh bounds: min=[${discovery.bounds.min.map((value) => value.toFixed(4)).join(", ")}] max=[${discovery.bounds.max.map((value) => value.toFixed(4)).join(", ")}]`,
  );
}

const rigResult = mode === "mascot"
  ? createRig(gltf, sourceBinary, primitive, discovery, classified)
  : createWorldRig(gltf, sourceBinary, primitive, positions, discovery);
const { binary: riggedBinary, jointCount } = rigResult;
const outputFile = encodeGlb(gltf, riggedBinary);
const validated = mode === "mascot"
  ? validateRig(outputFile, preserved, sourceBinary)
  : validateWorldRig(outputFile, preserved, sourceBinary);
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, outputFile);

console.log(`Output: ${path.relative(process.cwd(), outputPath)} (${outputFile.length.toLocaleString()} bytes)`);
if (mode === "mascot") {
  console.log(`Rig: ${jointCount} joints, ${validated.gltf.skins.length} skin, rigid VEC4 weights (one active influence)`);
  console.log("Clips: Quiu_Idle (6.0 s), Quiu_Blink (8.0 s; single + double blink)");
} else {
  console.log(
    `Rig: ${jointCount} joints, ${validated.gltf.skins.length} skin, soft VEC4 weights (arms ${validated.weightedVertices.leftArm}/${validated.weightedVertices.rightArm}; legs ${validated.weightedVertices.leftLeg}/${validated.weightedVertices.rightLeg})`,
  );
  console.log("Clips: Quiu_Idle (6.0 s), Quiu_Run (0.64 s), Quiu_BoostRun (0.36 s), Quiu_Jump (0.82 s), Quiu_Boost (0.34 s), Quiu_Celebrate (1.25 s)");
}
console.log("Validation: GLB structure, accessors, skin weights, hierarchy, clips, materials, textures and original BIN payload passed");
