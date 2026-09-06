import {
  Color,
  MeshStandardMaterial,
  type ColorRepresentation,
  type IUniform,
} from "three";

export type QuiuFaceExpression = "neutral" | "happy" | "surprise" | "magic";

export interface QuiuFaceMaterialOptions {
  autoBlink?: boolean;
  blinkInterval?: readonly [minimumSeconds: number, maximumSeconds: number];
  doubleBlinkChance?: number;
  expressionResponse?: number;
  reducedMotion?: boolean;
  random?: () => number;
  eyeColor?: ColorRepresentation;
  mouthColor?: ColorRepresentation;
  magicColor?: ColorRepresentation;
  visorColor?: ColorRepresentation;
}

export interface QuiuFaceUniforms {
  readonly blink: IUniform<number>;
  readonly happy: IUniform<number>;
  readonly surprise: IUniform<number>;
  readonly magic: IUniform<number>;
  readonly time: IUniform<number>;
  readonly eyeColor: IUniform<Color>;
  readonly mouthColor: IUniform<Color>;
  readonly magicColor: IUniform<Color>;
  readonly visorColor: IUniform<Color>;
}

export interface QuiuFaceMaterialController {
  readonly material: MeshStandardMaterial;
  readonly uniforms: QuiuFaceUniforms;
  readonly expression: QuiuFaceExpression;
  setExpression(expression: QuiuFaceExpression, intensity?: number): void;
  setAutoBlink(enabled: boolean): void;
  setReducedMotion(enabled: boolean): void;
  triggerBlink(options?: { double?: boolean }): void;
  update(deltaSeconds: number): void;
  dispose(): void;
}

type BlinkPhase = "idle" | "closing" | "holding" | "opening" | "gap";

const FACE_SHADER_CACHE_KEY = "quiu-face-atlas-v1";
const VERTEX_COMMON_CHUNK = "#include <common>";
const BEGIN_VERTEX_CHUNK = "#include <begin_vertex>";
const FRAGMENT_COMMON_CHUNK = "#include <common>";
const MAP_FRAGMENT_CHUNK = "#include <map_fragment>";
const EMISSIVE_FRAGMENT_CHUNK = "#include <emissivemap_fragment>";

const VERTEX_DECLARATIONS = /* glsl */ `
varying vec3 vQuiuFacePosition;
`;

const VERTEX_ASSIGNMENT = /* glsl */ `
vQuiuFacePosition = position;
`;

const FRAGMENT_DECLARATIONS = /* glsl */ `
uniform float uQuiuBlink;
uniform float uQuiuHappy;
uniform float uQuiuSurprise;
uniform float uQuiuMagic;
uniform float uQuiuFaceTime;
uniform vec3 uQuiuEyeColor;
uniform vec3 uQuiuMouthColor;
uniform vec3 uQuiuMagicColor;
uniform vec3 uQuiuVisorColor;

varying vec3 vQuiuFacePosition;

float quiuRangeMask(float value, float minimum, float maximum, float feather) {
  return smoothstep(minimum, minimum + feather, value)
    * (1.0 - smoothstep(maximum - feather, maximum, value));
}

float quiuUvBoxMask(vec2 uv, vec4 bounds) {
  vec2 feather = max(fwidth(uv) * 1.5, vec2(0.00075));
  vec2 lower = smoothstep(bounds.xy - feather, bounds.xy + feather, uv);
  vec2 upper = 1.0 - smoothstep(bounds.zw - feather, bounds.zw + feather, uv);
  return lower.x * lower.y * upper.x * upper.y;
}

vec2 quiuUvBoxPoint(vec2 uv, vec4 bounds) {
  return ((uv - bounds.xy) / (bounds.zw - bounds.xy)) * 2.0 - 1.0;
}

float quiuEllipse(vec2 point, vec2 radius) {
  float distanceFromEdge = length(point / radius);
  return 1.0 - smoothstep(0.91, 1.09, distanceFromEdge);
}

float quiuLine(float distanceFromLine, float thickness) {
  return 1.0 - smoothstep(thickness, thickness + 0.055, abs(distanceFromLine));
}
`;

const FACE_COLOR_FRAGMENT = /* glsl */ `
// These rectangles address the three disconnected face islands in quiu-base.png.
const vec4 quiuLeftEyeBounds = vec4(0.738, 0.254, 0.805, 0.345);
const vec4 quiuRightEyeBounds = vec4(0.734, 0.736, 0.809, 0.813);
const vec4 quiuMouthBounds = vec4(0.638, 0.722, 0.703, 0.787);

float quiuFaceFront = quiuRangeMask(vQuiuFacePosition.z, 0.275, 0.39, 0.025);
float quiuEyeHeight = quiuRangeMask(vQuiuFacePosition.y, 1.105, 1.46, 0.035);
float quiuLeftEyePosition = quiuRangeMask(vQuiuFacePosition.x, -0.36, -0.105, 0.025);
float quiuRightEyePosition = quiuRangeMask(vQuiuFacePosition.x, 0.105, 0.36, 0.025);
float quiuMouthPosition = quiuRangeMask(vQuiuFacePosition.x, -0.155, 0.145, 0.025)
  * quiuRangeMask(vQuiuFacePosition.y, 0.955, 1.235, 0.03)
  * quiuRangeMask(vQuiuFacePosition.z, 0.315, 0.39, 0.015);

float quiuLeftEyeRegion = quiuUvBoxMask(vMapUv, quiuLeftEyeBounds)
  * quiuFaceFront * quiuEyeHeight * quiuLeftEyePosition;
float quiuRightEyeRegion = quiuUvBoxMask(vMapUv, quiuRightEyeBounds)
  * quiuFaceFront * quiuEyeHeight * quiuRightEyePosition;
float quiuMouthRegion = quiuUvBoxMask(vMapUv, quiuMouthBounds) * quiuMouthPosition;

vec2 quiuLeftEyePoint = quiuUvBoxPoint(vMapUv, quiuLeftEyeBounds);
vec2 quiuRightEyePoint = quiuUvBoxPoint(vMapUv, quiuRightEyeBounds);
vec2 quiuMouthPoint = quiuUvBoxPoint(vMapUv, quiuMouthBounds);

float quiuBlink = clamp(uQuiuBlink, 0.0, 1.0);
float quiuHappy = clamp(uQuiuHappy, 0.0, 1.0);
float quiuSurprise = clamp(uQuiuSurprise, 0.0, 1.0);
float quiuMagic = clamp(uQuiuMagic, 0.0, 1.0);
quiuBlink *= 1.0 - clamp(max(quiuSurprise, quiuMagic), 0.0, 1.0);
float quiuMagicPulse = 0.72 + 0.28 * sin(uQuiuFaceTime * 8.0);

float quiuEyeClose = max(quiuBlink, quiuHappy * (1.0 - quiuSurprise));
vec2 quiuOpenEyeRadius = mix(vec2(0.43, 0.7), vec2(0.58, 0.9), quiuSurprise);
float quiuLeftOpenEye = quiuEllipse(quiuLeftEyePoint, quiuOpenEyeRadius);
float quiuRightOpenEye = quiuEllipse(quiuRightEyePoint, quiuOpenEyeRadius);

float quiuLeftBlinkLine = quiuLine(quiuLeftEyePoint.y, 0.045)
  * quiuRangeMask(quiuLeftEyePoint.x, -0.62, 0.62, 0.16);
float quiuRightBlinkLine = quiuLine(quiuRightEyePoint.y, 0.045)
  * quiuRangeMask(quiuRightEyePoint.x, -0.62, 0.62, 0.16);
float quiuLeftHappyLine = quiuLine(
  quiuLeftEyePoint.y - (0.13 - 0.22 * quiuLeftEyePoint.x * quiuLeftEyePoint.x),
  0.055
) * quiuRangeMask(quiuLeftEyePoint.x, -0.72, 0.72, 0.18);
float quiuRightHappyLine = quiuLine(
  quiuRightEyePoint.y - (0.13 - 0.22 * quiuRightEyePoint.x * quiuRightEyePoint.x),
  0.055
) * quiuRangeMask(quiuRightEyePoint.x, -0.72, 0.72, 0.18);
float quiuLeftClosedEye = mix(quiuLeftBlinkLine, quiuLeftHappyLine, quiuHappy);
float quiuRightClosedEye = mix(quiuRightBlinkLine, quiuRightHappyLine, quiuHappy);
float quiuLeftEyeShape = mix(quiuLeftOpenEye, quiuLeftClosedEye, quiuEyeClose);
float quiuRightEyeShape = mix(quiuRightOpenEye, quiuRightClosedEye, quiuEyeClose);

float quiuEyeActivity = max(max(quiuBlink, quiuHappy), max(quiuSurprise, quiuMagic));
float quiuEyeRegion = max(quiuLeftEyeRegion, quiuRightEyeRegion);
float quiuSourceWhite = smoothstep(
  0.58,
  0.9,
  min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b))
);
diffuseColor.rgb = mix(
  diffuseColor.rgb,
  uQuiuVisorColor,
  quiuEyeRegion * quiuSourceWhite * quiuEyeActivity
);

float quiuLeftEyeInk = quiuLeftEyeRegion * quiuLeftEyeShape;
float quiuRightEyeInk = quiuRightEyeRegion * quiuRightEyeShape;
float quiuEyeInk = max(quiuLeftEyeInk, quiuRightEyeInk) * quiuEyeActivity;
vec3 quiuAnimatedEyeColor = mix(
  uQuiuEyeColor,
  uQuiuMagicColor * (0.85 + 0.25 * quiuMagicPulse),
  quiuMagic
);
diffuseColor.rgb = mix(diffuseColor.rgb, quiuAnimatedEyeColor, quiuEyeInk);

float quiuMouthActivity = max(max(quiuHappy, quiuSurprise), quiuMagic);
float quiuSourcePurple = smoothstep(
  0.075,
  0.32,
  max(diffuseColor.r, diffuseColor.b) - diffuseColor.g * 0.7
);
diffuseColor.rgb = mix(
  diffuseColor.rgb,
  uQuiuVisorColor,
  quiuMouthRegion * quiuSourcePurple * quiuMouthActivity
);

float quiuNeutralSmile = quiuLine(
  quiuMouthPoint.y - (0.12 - 0.29 * quiuMouthPoint.x * quiuMouthPoint.x),
  0.075
) * quiuRangeMask(quiuMouthPoint.x, -0.7, 0.7, 0.18);
float quiuHappySmile = quiuLine(
  quiuMouthPoint.y - (0.24 - 0.47 * quiuMouthPoint.x * quiuMouthPoint.x),
  0.1
) * quiuRangeMask(quiuMouthPoint.x, -0.9, 0.9, 0.2);
float quiuSurpriseMouth = 1.0 - smoothstep(
  0.075,
  0.16,
  abs(length(quiuMouthPoint / vec2(0.43, 0.72)) - 0.76)
);
float quiuMouthShape = mix(quiuNeutralSmile, quiuHappySmile, quiuHappy);
quiuMouthShape = mix(quiuMouthShape, quiuSurpriseMouth, quiuSurprise);
float quiuMouthInk = quiuMouthRegion * quiuMouthShape * quiuMouthActivity;
vec3 quiuAnimatedMouthColor = mix(
  uQuiuMouthColor,
  uQuiuMagicColor * (0.8 + 0.3 * quiuMagicPulse),
  quiuMagic
);
diffuseColor.rgb = mix(diffuseColor.rgb, quiuAnimatedMouthColor, quiuMouthInk);

float quiuFaceMagicMask = (quiuEyeInk + quiuMouthInk) * quiuMagic;
`;

const FACE_EMISSIVE_FRAGMENT = /* glsl */ `
totalEmissiveRadiance += uQuiuMagicColor
  * quiuFaceMagicMask
  * (0.45 + 0.45 * quiuMagicPulse);
`;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const smoothStep = (value: number) => {
  const normalized = clamp01(value);
  return normalized * normalized * (3 - 2 * normalized);
};

function injectAfter(source: string, chunk: string, addition: string) {
  if (!source.includes(chunk)) {
    throw new Error(`Quiu face shader could not find Three.js chunk: ${chunk}`);
  }
  return source.replace(chunk, `${chunk}\n${addition}`);
}

/**
 * Clones Quiu's atlas-backed PBR material and adds facial expressions in the
 * existing draw call. The source material and its shared textures are untouched.
 */
export function createQuiuFaceMaterial(
  source: MeshStandardMaterial,
  options: QuiuFaceMaterialOptions = {},
): QuiuFaceMaterialController {
  if (!source.map) {
    throw new Error("Quiu facial animation requires the model's base-color atlas.");
  }

  const material = source.clone();
  material.name = `${source.name || "Quiu PBR"} · animated face`;

  const uniforms: QuiuFaceUniforms = {
    blink: { value: 0 },
    happy: { value: 0 },
    surprise: { value: 0 },
    magic: { value: 0 },
    time: { value: 0 },
    eyeColor: { value: new Color(options.eyeColor ?? 0xf8fbff) },
    mouthColor: { value: new Color(options.mouthColor ?? 0xc63cff) },
    magicColor: { value: new Color(options.magicColor ?? 0x73ffe8) },
    visorColor: { value: new Color(options.visorColor ?? 0x070513) },
  };

  const sourceOnBeforeCompile = source.onBeforeCompile;
  const sourceProgramCacheKey = source.customProgramCacheKey.bind(source);

  material.onBeforeCompile = function onBeforeCompile(shader, renderer) {
    sourceOnBeforeCompile.call(this, shader, renderer);

    shader.uniforms.uQuiuBlink = uniforms.blink;
    shader.uniforms.uQuiuHappy = uniforms.happy;
    shader.uniforms.uQuiuSurprise = uniforms.surprise;
    shader.uniforms.uQuiuMagic = uniforms.magic;
    shader.uniforms.uQuiuFaceTime = uniforms.time;
    shader.uniforms.uQuiuEyeColor = uniforms.eyeColor;
    shader.uniforms.uQuiuMouthColor = uniforms.mouthColor;
    shader.uniforms.uQuiuMagicColor = uniforms.magicColor;
    shader.uniforms.uQuiuVisorColor = uniforms.visorColor;

    shader.vertexShader = injectAfter(
      shader.vertexShader,
      VERTEX_COMMON_CHUNK,
      VERTEX_DECLARATIONS,
    );
    shader.vertexShader = injectAfter(
      shader.vertexShader,
      BEGIN_VERTEX_CHUNK,
      VERTEX_ASSIGNMENT,
    );
    shader.fragmentShader = injectAfter(
      shader.fragmentShader,
      FRAGMENT_COMMON_CHUNK,
      FRAGMENT_DECLARATIONS,
    );
    shader.fragmentShader = injectAfter(
      shader.fragmentShader,
      MAP_FRAGMENT_CHUNK,
      FACE_COLOR_FRAGMENT,
    );
    shader.fragmentShader = injectAfter(
      shader.fragmentShader,
      EMISSIVE_FRAGMENT_CHUNK,
      FACE_EMISSIVE_FRAGMENT,
    );
  };
  material.customProgramCacheKey = () =>
    `${sourceProgramCacheKey()}|${FACE_SHADER_CACHE_KEY}`;
  material.needsUpdate = true;

  const random = options.random ?? Math.random;
  const blinkIntervalMinimum = Math.max(0.5, options.blinkInterval?.[0] ?? 2.6);
  const blinkIntervalMaximum = Math.max(
    blinkIntervalMinimum,
    options.blinkInterval?.[1] ?? 5.4,
  );
  const doubleBlinkChance = clamp01(options.doubleBlinkChance ?? 0.18);
  const expressionResponse = Math.max(0.01, options.expressionResponse ?? 11);
  const expressionTargets = { happy: 0, surprise: 0, magic: 0 };

  let currentExpression: QuiuFaceExpression = "neutral";
  let autoBlink = options.autoBlink ?? true;
  let reducedMotion = options.reducedMotion ?? false;
  let blinkPhase: BlinkPhase = "idle";
  let blinkPhaseElapsed = 0;
  let queuedBlinks = 0;

  const randomUnit = () => clamp01(random());
  const randomBlinkInterval = () =>
    blinkIntervalMinimum
      + (blinkIntervalMaximum - blinkIntervalMinimum) * randomUnit();
  let nextBlinkIn = randomBlinkInterval();

  const beginBlink = (count: number) => {
    blinkPhase = "closing";
    blinkPhaseElapsed = 0;
    queuedBlinks = Math.max(0, count - 1);
  };

  const transitionBlinkPhase = () => {
    blinkPhaseElapsed = 0;
    if (blinkPhase === "closing") {
      blinkPhase = "holding";
    } else if (blinkPhase === "holding") {
      blinkPhase = "opening";
    } else if (blinkPhase === "opening" && queuedBlinks > 0) {
      queuedBlinks -= 1;
      blinkPhase = "gap";
    } else if (blinkPhase === "gap") {
      blinkPhase = "closing";
    } else {
      blinkPhase = "idle";
      nextBlinkIn = randomBlinkInterval();
      uniforms.blink.value = 0;
    }
  };

  const phaseDuration = () => {
    if (blinkPhase === "closing") return 0.045;
    if (blinkPhase === "holding") return 0.018;
    if (blinkPhase === "opening") return 0.075;
    if (blinkPhase === "gap") return 0.095;
    return Number.POSITIVE_INFINITY;
  };

  const updateBlinkValue = () => {
    const progress = blinkPhaseElapsed / phaseDuration();
    if (blinkPhase === "closing") {
      uniforms.blink.value = smoothStep(progress);
    } else if (blinkPhase === "holding") {
      uniforms.blink.value = 1;
    } else if (blinkPhase === "opening") {
      uniforms.blink.value = 1 - smoothStep(progress);
    } else {
      uniforms.blink.value = 0;
    }
  };

  const updateBlink = (deltaSeconds: number) => {
    if (blinkPhase === "idle") {
      uniforms.blink.value = 0;
      if (!autoBlink) return;
      nextBlinkIn -= deltaSeconds;
      if (nextBlinkIn > 0) return;
      beginBlink(randomUnit() < doubleBlinkChance ? 2 : 1);
    }

    let remaining = deltaSeconds;
    let transitions = 0;
    while (remaining > 0 && blinkPhase !== "idle" && transitions < 8) {
      const duration = phaseDuration();
      const available = duration - blinkPhaseElapsed;
      const consumed = Math.min(remaining, available);
      blinkPhaseElapsed += consumed;
      remaining -= consumed;
      if (blinkPhaseElapsed + Number.EPSILON >= duration) {
        transitionBlinkPhase();
        transitions += 1;
      }
    }
    updateBlinkValue();
  };

  const controller: QuiuFaceMaterialController = {
    material,
    uniforms,
    get expression() {
      return currentExpression;
    },
    setExpression(expression, intensity = 1) {
      const amount = clamp01(intensity);
      currentExpression = expression;
      expressionTargets.happy = expression === "happy" ? amount : 0;
      expressionTargets.surprise = expression === "surprise" ? amount : 0;
      expressionTargets.magic = expression === "magic" ? amount : 0;
    },
    setAutoBlink(enabled) {
      autoBlink = enabled;
      if (enabled && blinkPhase === "idle") nextBlinkIn = randomBlinkInterval();
    },
    setReducedMotion(enabled) {
      reducedMotion = enabled;
      if (enabled) uniforms.time.value = 0;
    },
    triggerBlink(blinkOptions = {}) {
      beginBlink(blinkOptions.double ? 2 : 1);
    },
    update(deltaSeconds) {
      if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
      const delta = Math.min(deltaSeconds, 0.25);
      updateBlink(delta);

      const response = reducedMotion
        ? 1
        : 1 - Math.exp(-expressionResponse * delta);
      uniforms.happy.value +=
        (expressionTargets.happy - uniforms.happy.value) * response;
      uniforms.surprise.value +=
        (expressionTargets.surprise - uniforms.surprise.value) * response;
      uniforms.magic.value +=
        (expressionTargets.magic - uniforms.magic.value) * response;

      if (!reducedMotion) {
        uniforms.time.value = (uniforms.time.value + delta) % 4096;
      }
    },
    dispose() {
      material.dispose();
    },
  };

  return controller;
}

export function isQuiuFaceCompatibleMaterial(
  material: unknown,
): material is MeshStandardMaterial {
  return material instanceof MeshStandardMaterial && material.map !== null;
}
