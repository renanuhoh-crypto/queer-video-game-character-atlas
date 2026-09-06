"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { Capsule } from "three/examples/jsm/math/Capsule.js";
import { Octree } from "three/examples/jsm/math/Octree.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import {
  createQuiuFaceMaterial,
  isQuiuFaceCompatibleMaterial,
  type QuiuFaceMaterialController,
} from "@/lib/quiuFaceMaterial";
import styles from "./QuiuExplorerGame.module.css";

export type ExplorerStage = "alien" | "rainbow";

type GamePhase = "intro" | "playing" | "transitioning";
type TransitionKind = "portal" | "magic" | null;
type JumpPhase = "grounded" | "rising" | "falling";

type QuiuWorldGameProps = {
  initialStage?: ExplorerStage;
};

type StageConfiguration = {
  eyebrow: string;
  title: string;
  subtitle: string;
  destination: string;
  destinationLabel: string;
  accent: number;
  accentCss: string;
  background: number;
  fog: number;
};

const STAGES: Record<ExplorerStage, StageConfiguration> = {
  alien: {
    eyebrow: "Phase 01 · Alien World",
    title: "Explore the living planet",
    subtitle:
      "Explore the alien garden, jump onto the Crystal Planet at the rim, and let the elf reveal the character gallery.",
    destination: "/rainbowroad?from=quiu-world",
    destinationLabel: "Enter Rainbow Road",
    accent: 0x6fffd2,
    accentCss: "#6fffd2",
    background: 0x070c19,
    fog: 0x10132b,
  },
  rainbow: {
    eyebrow: "Phase 02 · Rainbow Road Wii",
    title: "Run beyond the stars",
    subtitle:
      "Continue the journey with Quiu across the cosmic road. Follow the original track surface and return through the portal whenever you want.",
    destination: "/quiu-world?from=rainbowroad",
    destinationLabel: "Return to Alien World",
    accent: 0xff59cf,
    accentCss: "#ff59cf",
    background: 0x03030d,
    fog: 0x08071c,
  },
};

const QUIU_MODEL_URL = "/models/quiu-world/quiu-world-rigged.glb";
const QUIU_MODEL_SPAN = 1.9;
const ALIEN_MODEL_URL = "/models/alien-world/alien-world.fbx";
const RAINBOW_MODEL_URL = "/models/rainbow-road-wii/rainbow-road-wii.obj";
const FANTASY_ELF_MODEL_URL = "/models/fantasy-elf/fantasy-elf-scene.glb";
const FANTASY_ELF_MOBILE_MODEL_URL = "/models/fantasy-elf/fantasy-elf-scene-mobile.glb";
const SCI_FI_PORTAL_MODEL_URL = "/models/sci-fi-portal/sci-fi-portal.glb";
const CORAL_PIECE_MODEL_URL = "/models/coral-piece/coral-piece.glb";
const CRYSTAL_PLANET_MODEL_URL = "/models/crystal-planet/crystal-planet.glb";
const PLAYER_HOVER = 0.1;
const WORLD_COLLISION_LAYER = 3;
const EMPTY_TEXTURE_URL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const MOBILE_EXPLORER_QUERY = "(pointer: coarse), (max-width: 780px)";

const subscribeToMobileExplorer = (onStoreChange: () => void) => {
  const media = window.matchMedia(MOBILE_EXPLORER_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
};

const getMobileExplorerSnapshot = () => window.matchMedia(MOBILE_EXPLORER_QUERY).matches;
const getMobileExplorerServerSnapshot = () => false;

const ALIEN_MATERIALS: Record<
  string,
  {
    prefix?: string;
    map?: string;
    normal?: string;
    roughness?: string;
    metalness?: string;
    ao?: string;
    emissive?: string;
    alpha?: string;
    glass?: boolean;
    unlit?: boolean;
  }
> = {
  peacockplant: {
    prefix: "PeacockPlant",
    map: "PeacockPlant_BaseColor.png",
    normal: "PeacockPlant_Normal.png",
    roughness: "PeacockPlant_Roughness.png",
    ao: "PeacockPlant_AO.png",
    emissive: "PeacockPlant_Emissive.png",
    alpha: "PeacockPlant_OP.png",
  },
  mushrooms1: {
    prefix: "Mushrooms1",
    map: "Mushrooms1_BaseColor.png",
    normal: "Mushrooms1_Normal.png",
    roughness: "Mushrooms1_Roughness.png",
    ao: "Mushrooms1_AO.png",
    emissive: "Mushrooms1_Emissive.png",
  },
  eyeplants1: {
    prefix: "EyePlants",
    map: "EyePlants_BaseColor.png",
    normal: "EyePlants_Normal.png",
    roughness: "EyePlants_Roughness.png",
    ao: "EyePlants_AO.png",
    emissive: "EyePlants_Emissive.png",
  },
  bigmushrooms: {
    prefix: "BigMushrooms",
    map: "BigMushrooms_BaseColor.png",
    normal: "BigMushrooms_Normal.png",
    roughness: "BigMushrooms_Roughness.png",
    ao: "BigMushrooms_AO.png",
    emissive: "BigMushrooms_Emissive.png",
  },
  rocks: {
    prefix: "Rocks",
    map: "Rocks_BaseColor.png",
    normal: "Rocks_Normal.png",
    roughness: "Rocks_Roughness.png",
    ao: "Rocks_AO.png",
  },
  ground1: {
    prefix: "ground",
    map: "ground_BaseColor2.png",
    normal: "ground_Normal.png",
    roughness: "ground_Roughness.png",
    ao: "ground_AO.png",
    alpha: "ground_OP.png",
  },
  rocks2: {
    prefix: "Rocks2",
    map: "Rocks2_BaseColor.png",
    normal: "Rocks2_Normal.png",
    roughness: "Rocks2_Roughness.png",
    ao: "Rocks2_AO.png",
  },
  grass: {
    prefix: "grass",
    map: "grass_BaseColor.png",
    alpha: "grass_OP.png",
  },
  dronebase: {
    prefix: "main_body",
    map: "main_body_BaseColor.png",
    normal: "main_body_Normal.png",
    roughness: "main_body_Roughness.png",
    metalness: "main_body_Metallic.png",
    ao: "Ambient_Occlusion_Map_from_Mesh_main_body.png",
    emissive: "main_body_Emissive.png",
  },
  mesh1: {
    prefix: "mesh",
    map: "mesh_BaseColor.png",
    roughness: "mesh_Roughness.png",
    metalness: "mesh_Metallic.png",
    ao: "Ambient_Occlusion_Map_from_Mesh_mesh.png",
  },
  "scout_drone:lambert3": {
    prefix: "glass",
    map: "glass_BaseColor.png",
    roughness: "glass_Roughness.png",
    ao: "Ambient_Occlusion_Map_from_Mesh_glass.png",
    alpha: "Glass_OP.png",
    glass: true,
  },
  light: { unlit: true },
  leafplants: {
    prefix: "LeafPlants",
    map: "LeafPlants_BaseColor.png",
    normal: "LeafPlants_Normal.png",
    roughness: "LeafPlants_Roughness.png",
    ao: "LeafPlants_AO.png",
    alpha: "LeafPlants_OP.png",
  },
  black: {},
};

const RAINBOW_TEXTURE_BINDINGS: Array<{
  pattern: RegExp;
  file: string;
  emissive?: number;
  transparent?: boolean;
  additive?: boolean;
  opacity?: number;
}> = [
  {
    pattern: /ef_dushboard/i,
    file: "ef_arrowGradS.png",
    transparent: true,
    additive: true,
    opacity: 0.08,
  },
  {
    pattern: /ef_hpipeboard/i,
    file: "arrowShMrr_fix.png",
    emissive: 0.22,
    transparent: true,
  },
  {
    pattern: /luminous_mat/i,
    file: "luminous.png",
    transparent: true,
    additive: true,
    opacity: 0.11,
  },
  { pattern: /z1_road/i, file: "r_road01.png", emissive: 0.14 },
  { pattern: /a_earth/i, file: "r_earth02.png", emissive: 0.04 },
  { pattern: /tex_set/i, file: "tex_set03.png", emissive: 0.18 },
  { pattern: /logo/i, file: "logo.png", emissive: 0.42, transparent: true },
  { pattern: /ring/i, file: "r_ring01.png", emissive: 0.54, transparent: true },
  { pattern: /arrow/i, file: "r_arrow03.png", emissive: 0.48, transparent: true },
  { pattern: /b_saku/i, file: "r_saku03.png", emissive: 0.24, transparent: true },
  {
    pattern: /saku|starling/i,
    file: "r_starling01g.png",
    transparent: true,
    additive: true,
    opacity: 0.1,
  },
  {
    pattern: /warp_particle/i,
    file: "r_warp_particle.png",
    emissive: 0.62,
    transparent: true,
    additive: true,
    opacity: 0.13,
  },
  {
    pattern: /warpgrad/i,
    file: "r_warpgrad.png",
    emissive: 0.5,
    transparent: true,
    additive: true,
    opacity: 0.035,
  },
  { pattern: /heri/i, file: "nr_heri2.png", emissive: 0.28, transparent: true },
  {
    pattern: /aurora|rainbow/i,
    file: "ef_rainbow.png",
    emissive: 0.58,
    transparent: true,
    additive: true,
    opacity: 0.065,
  },
  {
    pattern: /star/i,
    file: "Galaxy01.png",
    transparent: true,
    additive: true,
    opacity: 0.09,
  },
];

function createStarTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.translate(32, 32);
  context.fillStyle = "#fff";
  context.shadowColor = "#7eefff";
  context.shadowBlur = 12;
  context.beginPath();
  for (let point = 0; point < 16; point += 1) {
    const angle = -Math.PI / 2 + (point / 16) * Math.PI * 2;
    const radius = point % 2 === 0 ? (point % 4 === 0 ? 27 : 14) : 5;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (point === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line)) {
      return;
    }
    if (object.geometry) geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
    objectMaterials.forEach((material) => materials.add(material));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

function normalizedMaterialName(value: string) {
  return value.trim().toLowerCase();
}

function disposeDetachedMaterial(material: THREE.Material) {
  Object.values(material).forEach((value) => {
    if (value instanceof THREE.Texture) value.dispose();
  });
  material.dispose();
}

export default function QuiuWorldGame({ initialStage = "alien" }: QuiuWorldGameProps) {
  const router = useRouter();
  const configuration = STAGES[initialStage];
  const mountRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<(() => void) | null>(null);
  const interactRef = useRef<(() => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const joystickPointerRef = useRef<number | null>(null);
  const joystickKnobRef = useRef<HTMLSpanElement>(null);
  const touchRef = useRef({ x: 0, y: 0, boost: false, brake: false });
  const jumpQueuedRef = useRef(false);

  const [phase, setPhase] = useState<GamePhase>("intro");
  const [ready, setReady] = useState(false);
  const mobileDisabled = useSyncExternalStore(
    subscribeToMobileExplorer,
    getMobileExplorerSnapshot,
    getMobileExplorerServerSnapshot,
  );
  const [error, setError] = useState("");
  const [loadingDetail, setLoadingDetail] = useState("Preparing the environment…");
  const [nearPortal, setNearPortal] = useState(false);
  const [nearElf, setNearElf] = useState(false);
  const [transitionKind, setTransitionKind] = useState<TransitionKind>(null);
  const [speed, setSpeed] = useState(0);
  const [boosting, setBoosting] = useState(false);
  const [arrivalActive, setArrivalActive] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    if (getMobileExplorerSnapshot()) return;

    let disposed = false;
    let animationFrame: number | null = null;
    let transitionTimer: number | null = null;
    let arrivalTimer: number | null = null;
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    let environmentTarget: THREE.WebGLRenderTarget | null = null;
    let phaseValue: GamePhase = "intro";
    let stageReady = false;
    let playerReady = false;
    let lastFrame = performance.now();
    let lastUiUpdate = 0;
    let transitionStartedAt = 0;
    let transitionDuration = 1050;
    let transitionKindValue: TransitionKind = null;
    let nearPortalValue = false;
    let nearElfValue = false;
    let cameraDragPointer: number | null = null;
    let cameraDragX = 0;
    let cameraDragY = 0;
    let cameraYaw = 0;
    let cameraPitch = 0;
    let mouseLookPitch = 0;
    let mouseLookPitchTarget = 0;
    let mouseTurn = 0;
    let mouseTurnTarget = 0;
    let cameraDistanceOffset = 0;
    let heading = 0;
    let groundHeight = 0;
    let targetGroundHeight = 0;
    let jumpHeight = 0;
    let verticalVelocity = 0;
    let jumpPhase: JumpPhase = "grounded";
    let jumpWasPressed = false;
    let wasAirborne = false;
    let wasBoosting = false;
    let boostStarCursor = 0;
    let boostEmission = 0;

    const lowPowerMode =
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 720;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const deviceMemory = Number(
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8,
    );
    const highQualityMode = !lowPowerMode && deviceMemory >= 4;
    const textureProfile = lowPowerMode ? "mobile" : "desktop";

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !lowPowerMode,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      const errorTimer = window.setTimeout(() => {
        if (!disposed) {
          setError("This browser could not start the 3D explorer. Enable hardware acceleration and reload.");
        }
      }, 0);
      return () => {
        disposed = true;
        window.clearTimeout(errorTimer);
      };
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(configuration.background);
    scene.fog = new THREE.FogExp2(configuration.fog, initialStage === "alien" ? 0.016 : 0.0055);

    const camera = new THREE.PerspectiveCamera(52, 1, 0.05, initialStage === "alien" ? 260 : 720);
    camera.position.set(0, 3.4, -7);

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, lowPowerMode ? 1 : highQualityMode ? 1.8 : 1.35),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = initialStage === "alien" ? 0.68 : 0.56;
    renderer.shadowMap.enabled = highQualityMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = styles.canvas;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute(
      "aria-label",
      `${configuration.title}. Move with W A S D or the arrow keys, jump with Space, boost with Shift, and move the mouse to control the camera without clicking.`,
    );
    mount.appendChild(renderer.domElement);

    if (highQualityMode) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(1, 1),
        initialStage === "alien" ? 0.14 : 0.18,
        0.18,
        initialStage === "alien" ? 1.22 : 1.28,
      );
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
    }

    if (!lowPowerMode) {
      const generator = new THREE.PMREMGenerator(renderer);
      environmentTarget = generator.fromScene(new RoomEnvironment(), 0.035);
      scene.environment = environmentTarget.texture;
      generator.dispose();
    }

    const world = new THREE.Group();
    scene.add(world);
    const stageRoot = new THREE.Group();
    stageRoot.name = initialStage === "alien" ? "Alien World" : "Rainbow Road Wii";
    world.add(stageRoot);

    const textureLoader = new THREE.TextureLoader();
    const ownedTextures = new Set<THREE.Texture>();
    const texturePromises = new Map<string, Promise<THREE.Texture>>();
    const maxAnisotropy = Math.min(
      renderer.capabilities.getMaxAnisotropy(),
      highQualityMode ? 12 : lowPowerMode ? 2 : 6,
    );

    const loadTexture = (url: string, colorTexture: boolean) => {
      const key = `${url}:${colorTexture ? "color" : "data"}`;
      const cached = texturePromises.get(key);
      if (cached) return cached;
      const promise = textureLoader.loadAsync(url).then((texture) => {
        texture.colorSpace = colorTexture ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        texture.anisotropy = maxAnisotropy;
        ownedTextures.add(texture);
        return texture;
      });
      texturePromises.set(key, promise);
      return promise;
    };

    const ambientLight = new THREE.HemisphereLight(
      initialStage === "alien" ? 0x9fffe6 : 0xa8c8ff,
      initialStage === "alien" ? 0x190b2d : 0x170526,
      initialStage === "alien" ? 0.5 : 0.34,
    );
    scene.add(ambientLight);
    const keyLight = new THREE.DirectionalLight(
      initialStage === "alien" ? 0xe5fff4 : 0xffd9f6,
      initialStage === "alien"
        ? highQualityMode
          ? 1.15
          : 0.82
        : highQualityMode
          ? 0.58
          : 0.44,
    );
    keyLight.position.set(-18, 28, 16);
    keyLight.castShadow = highQualityMode;
    if (highQualityMode) {
      keyLight.shadow.mapSize.set(2048, 2048);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 90;
      keyLight.shadow.camera.left = -40;
      keyLight.shadow.camera.right = 40;
      keyLight.shadow.camera.top = 40;
      keyLight.shadow.camera.bottom = -40;
      keyLight.shadow.normalBias = 0.035;
    }
    scene.add(keyLight);
    const accentLight = new THREE.PointLight(
      configuration.accent,
      initialStage === "alien"
        ? highQualityMode
          ? 2.4
          : 1.3
        : highQualityMode
          ? 1.1
          : 0.64,
      initialStage === "alien" ? 42 : 70,
      2,
    );
    accentLight.position.set(8, 10, 4);
    scene.add(accentLight);
    const fillLight = new THREE.PointLight(
      initialStage === "alien" ? 0x9b68ff : 0x4de9ff,
      initialStage === "alien"
        ? highQualityMode
          ? 1.7
          : 0.9
        : highQualityMode
          ? 0.82
          : 0.48,
      initialStage === "alien" ? 36 : 62,
      2,
    );
    fillLight.position.set(-10, 8, -9);
    scene.add(fillLight);

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(initialStage === "alien" ? 150 : 340, 32, 20),
      new THREE.ShaderMaterial({
        uniforms: {
          uTop: {
            value: new THREE.Color(initialStage === "alien" ? 0x071e27 : 0x090520),
          },
          uBottom: {
            value: new THREE.Color(initialStage === "alien" ? 0x210a38 : 0x02020a),
          },
          uAccent: { value: new THREE.Color(configuration.accent) },
        },
        vertexShader: `
          varying vec3 vDirection;
          void main() {
            vDirection = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uTop;
          uniform vec3 uBottom;
          uniform vec3 uAccent;
          varying vec3 vDirection;
          void main() {
            float horizon = smoothstep(-0.7, 0.75, vDirection.y);
            float glow = pow(max(0.0, 1.0 - abs(vDirection.y + 0.08)), 7.0);
            vec3 color = mix(uBottom, uTop, horizon) + uAccent * glow * 0.13;
            gl_FragColor = vec4(color, 1.0);
          }
        `,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    );
    scene.add(sky);

    const starCount = lowPowerMode ? 380 : 950;
    const starPositions = new Float32Array(starCount * 3);
    for (let index = 0; index < starCount; index += 1) {
      const radius = (initialStage === "alien" ? 68 : 150) + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
      starPositions[index * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      starPositions[index * 3 + 1] = Math.cos(phi) * radius;
      starPositions[index * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        color: initialStage === "alien" ? 0xc2fff1 : 0xf2e8ff,
        size: lowPowerMode ? 0.24 : 0.36,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
      }),
    );
    scene.add(stars);

    const player = new THREE.Group();
    player.name = "Quiu player";
    scene.add(player);
    const playerVisual = new THREE.Group();
    player.add(playerVisual);
    const playerModelFrame = new THREE.Group();
    playerModelFrame.position.y = QUIU_MODEL_SPAN / 2;
    playerVisual.add(playerModelFrame);

    const fallbackTexture = textureLoader.load("/quiu-flying-idle.png");
    fallbackTexture.colorSpace = THREE.SRGBColorSpace;
    ownedTextures.add(fallbackTexture);
    const fallback = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: fallbackTexture,
        transparent: true,
        alphaTest: 0.08,
        depthWrite: false,
      }),
    );
    fallback.scale.set(1.28, 1.9, 1);
    fallback.position.y = QUIU_MODEL_SPAN / 2;
    playerVisual.add(fallback);

    const playerGlow = new THREE.Mesh(
      new THREE.CircleGeometry(0.74, 32),
      new THREE.MeshBasicMaterial({
        color: configuration.accent,
        transparent: true,
        opacity: 0.07,
        depthWrite: false,
      }),
    );
    playerGlow.rotation.x = -Math.PI / 2;
    playerGlow.position.y = -0.08;
    player.add(playerGlow);
    const playerLight = new THREE.PointLight(
      configuration.accent,
      highQualityMode ? 0.42 : 0.22,
      5,
      2,
    );
    playerLight.position.set(0, 1.8, 0.6);
    player.add(playerLight);

    let playerModel: THREE.Object3D | null = null;
    let playerMixer: THREE.AnimationMixer | null = null;
    let idleAction: THREE.AnimationAction | null = null;
    let runAction: THREE.AnimationAction | null = null;
    let boostRunAction: THREE.AnimationAction | null = null;
    let jumpAction: THREE.AnimationAction | null = null;
    let boostAction: THREE.AnimationAction | null = null;
    let celebrateAction: THREE.AnimationAction | null = null;
    let locomotionAction: THREE.AnimationAction | null = null;
    const faceControllers: QuiuFaceMaterialController[] = [];

    const setLocomotion = (next: THREE.AnimationAction | null, force = false) => {
      if (!next || (!force && next === locomotionAction)) return;
      if (locomotionAction && locomotionAction !== next) locomotionAction.fadeOut(0.12);
      next.reset().setEffectiveWeight(1).fadeIn(0.12).play();
      locomotionAction = next;
    };

    const trailPointCount = lowPowerMode ? 16 : 30;
    const trailPositions = new Float32Array(trailPointCount * 3);
    const trailColors = new Float32Array(trailPointCount * 3);
    const trailHistory = Array.from(
      { length: trailPointCount },
      () => new THREE.Vector3(),
    );
    const trailHeadColor = new THREE.Color(0x9ffcff);
    const trailTailColor = new THREE.Color(0xff45d4);
    const trailColor = new THREE.Color();
    for (let index = 0; index < trailPointCount; index += 1) {
      const progress = index / Math.max(1, trailPointCount - 1);
      trailColor
        .copy(trailHeadColor)
        .lerp(trailTailColor, progress)
        .multiplyScalar((1 - progress) ** 1.55);
      trailColor.toArray(trailColors, index * 3);
    }
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositionAttribute = new THREE.BufferAttribute(trailPositions, 3);
    trailPositionAttribute.setUsage(THREE.DynamicDrawUsage);
    trailGeometry.setAttribute("position", trailPositionAttribute);
    trailGeometry.setAttribute("color", new THREE.BufferAttribute(trailColors, 3));
    const trailMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: true,
    });
    const speedTrail = new THREE.Line(trailGeometry, trailMaterial);
    speedTrail.name = "Quiu fluid movement trail";
    speedTrail.frustumCulled = false;
    speedTrail.visible = !reduceMotion;
    scene.add(speedTrail);
    const trailTarget = new THREE.Vector3();

    const resetSpeedTrail = () => {
      trailTarget.copy(player.position);
      trailTarget.y += QUIU_MODEL_SPAN * 0.48;
      trailHistory.forEach((point) => point.copy(trailTarget));
      for (let index = 0; index < trailPointCount; index += 1) {
        trailTarget.toArray(trailPositions, index * 3);
      }
      trailPositionAttribute.needsUpdate = true;
      trailMaterial.opacity = 0;
    };

    const updateSpeedTrail = (
      delta: number,
      speedRatio: number,
      isBoosting: boolean,
      airborne: boolean,
    ) => {
      if (reduceMotion) return;
      trailTarget.copy(player.position);
      trailTarget.y += QUIU_MODEL_SPAN * (airborne ? 0.42 : 0.48);
      trailHistory[0].lerp(trailTarget, 1 - Math.exp(-34 * delta));
      for (let index = 1; index < trailPointCount; index += 1) {
        const followRate = THREE.MathUtils.lerp(
          17,
          6.5,
          index / Math.max(1, trailPointCount - 1),
        );
        trailHistory[index].lerp(
          trailHistory[index - 1],
          1 - Math.exp(-followRate * delta),
        );
      }
      trailHistory.forEach((point, index) => point.toArray(trailPositions, index * 3));
      trailPositionAttribute.needsUpdate = true;
      const movementVisibility = THREE.MathUtils.smoothstep(speedRatio, 0.08, 0.82);
      const targetOpacity =
        movementVisibility * (isBoosting ? 0.52 : 0.28) * (airborne ? 0.7 : 1);
      trailMaterial.opacity = THREE.MathUtils.lerp(
        trailMaterial.opacity,
        targetOpacity,
        Math.min(1, delta * (targetOpacity > trailMaterial.opacity ? 9 : 5)),
      );
    };

    const boostStarCount = lowPowerMode ? 18 : 38;
    const boostStarPositions = new Float32Array(boostStarCount * 3);
    const boostStarVelocities = new Float32Array(boostStarCount * 3);
    const boostStarLives = new Float32Array(boostStarCount);
    boostStarPositions.fill(10_000);
    const boostStarGeometry = new THREE.BufferGeometry();
    const boostStarPositionAttribute = new THREE.BufferAttribute(boostStarPositions, 3);
    boostStarPositionAttribute.setUsage(THREE.DynamicDrawUsage);
    boostStarGeometry.setAttribute("position", boostStarPositionAttribute);
    const boostStarTexture = createStarTexture();
    if (boostStarTexture) ownedTextures.add(boostStarTexture);
    const boostStars = new THREE.Points(
      boostStarGeometry,
      new THREE.PointsMaterial({
        map: boostStarTexture,
        color: 0xffffff,
        size: lowPowerMode ? 0.36 : 0.5,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    boostStars.visible = false;
    scene.add(boostStars);

    const spawnBoostStar = (radial = false) => {
      if (reduceMotion) return;
      const index = boostStarCursor;
      boostStarCursor = (boostStarCursor + 1) % boostStarCount;
      const offset = index * 3;
      const forwardX = Math.sin(heading);
      const forwardZ = Math.cos(heading);
      const rightX = forwardZ;
      const rightZ = -forwardX;
      const side = THREE.MathUtils.randFloatSpread(radial ? 1.35 : 1.7);
      boostStarPositions[offset] = player.position.x - forwardX * 0.8 + rightX * side;
      boostStarPositions[offset + 1] = player.position.y + THREE.MathUtils.randFloatSpread(1.8);
      boostStarPositions[offset + 2] = player.position.z - forwardZ * 0.8 + rightZ * side;
      if (radial) {
        const angle = Math.random() * Math.PI * 2;
        const force = 1.6 + Math.random() * 2.4;
        boostStarVelocities[offset] = Math.cos(angle) * force;
        boostStarVelocities[offset + 1] = 1.1 + Math.random() * 1.8;
        boostStarVelocities[offset + 2] = Math.sin(angle) * force;
      } else {
        boostStarVelocities[offset] = -forwardX * (2.8 + Math.random() * 3) + rightX * side;
        boostStarVelocities[offset + 1] = THREE.MathUtils.randFloatSpread(1.3);
        boostStarVelocities[offset + 2] = -forwardZ * (2.8 + Math.random() * 3) + rightZ * side;
      }
      boostStarLives[index] = radial ? 0.56 : 0.5;
      boostStars.visible = true;
    };

    const updateBoostStars = (delta: number, isBoosting: boolean) => {
      if (reduceMotion) return;
      if (isBoosting) {
        boostEmission += delta;
        const interval = lowPowerMode ? 0.11 : 0.055;
        while (boostEmission >= interval) {
          boostEmission -= interval;
          spawnBoostStar(false);
        }
      } else {
        boostEmission = 0;
      }
      let active = 0;
      for (let index = 0; index < boostStarCount; index += 1) {
        if (boostStarLives[index] <= 0) continue;
        const offset = index * 3;
        boostStarLives[index] -= delta;
        if (boostStarLives[index] <= 0) {
          boostStarLives[index] = 0;
          boostStarPositions[offset] = 10_000;
          boostStarPositions[offset + 1] = 10_000;
          boostStarPositions[offset + 2] = 10_000;
          continue;
        }
        boostStarPositions[offset] += boostStarVelocities[offset] * delta;
        boostStarPositions[offset + 1] += boostStarVelocities[offset + 1] * delta;
        boostStarPositions[offset + 2] += boostStarVelocities[offset + 2] * delta;
        boostStarVelocities[offset + 1] -= 1.8 * delta;
        active += 1;
      }
      boostStars.visible = active > 0;
      boostStarPositionAttribute.needsUpdate = true;
    };

    const keys = new Set<string>();
    const velocity = new THREE.Vector3();
    const desiredVelocity = new THREE.Vector3();
    const moveDirection = new THREE.Vector3();
    const cameraForward = new THREE.Vector3();
    const cameraRight = new THREE.Vector3();
    const idealCameraPosition = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();
    const portalTarget = new THREE.Vector3();
    const visualScaleTarget = new THREE.Vector3(1, 1, 1);
    const collisionCorrection = new THREE.Vector3();
    const resolvedHorizontal = new THREE.Vector2();
    const down = new THREE.Vector3(0, -1, 0);
    const rayOrigin = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const cameraRaycaster = new THREE.Raycaster();
    const cameraRayDirection = new THREE.Vector3();
    const stageSpawn = new THREE.Vector3();
    const stagePortalPosition = new THREE.Vector3();
    const stageElfPosition = new THREE.Vector3();
    const stageTreeBasePosition = new THREE.Vector3();
    let stageCoralPosition: THREE.Vector3 | null = null;
    const floorMeshes: THREE.Mesh[] = [];
    const terrainMeshes: THREE.Mesh[] = [];
    const cameraCollisionMeshes: THREE.Mesh[] = [];
    const animatedStageObjects: THREE.Object3D[] = [];
    const collisionWorld = new Octree();
    collisionWorld.layers.set(WORLD_COLLISION_LAYER);
    const playerCapsule = new Capsule(new THREE.Vector3(), new THREE.Vector3(), 0.34);
    let collisionReady = false;
    let stageRayHeight = 80;
    let stageBounds = new THREE.Box3();
    let portalGroup: THREE.Group | null = null;
    let portalCore: THREE.Mesh<THREE.CircleGeometry, THREE.ShaderMaterial> | null = null;
    let portalLight: THREE.PointLight | null = null;
    let elfCharacter: THREE.Object3D | null = null;
    let elfAura: THREE.Group | null = null;
    const coralPlatformRings: Array<
      THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>
    > = [];
    const coralPlatformLights: THREE.PointLight[] = [];

    const getSurfaceHeight = (meshes: THREE.Mesh[], x: number, z: number) => {
      if (meshes.length === 0) return null;
      rayOrigin.set(x, stageRayHeight, z);
      raycaster.set(rayOrigin, down);
      const intersections = raycaster.intersectObjects(meshes, true);
      return intersections[0]?.point.y ?? null;
    };

    const getGroundHeight = (x: number, z: number) => getSurfaceHeight(floorMeshes, x, z);
    const getTerrainHeight = (x: number, z: number) =>
      getSurfaceHeight(terrainMeshes, x, z);

    const resolveHorizontalCollision = (x: number, z: number, feetY: number) => {
      if (!collisionReady) return resolvedHorizontal.set(x, z);
      playerCapsule.start.set(x, feetY + playerCapsule.radius + 0.04, z);
      playerCapsule.end.set(x, feetY + QUIU_MODEL_SPAN - playerCapsule.radius, z);
      for (let iteration = 0; iteration < 3; iteration += 1) {
        const collision = collisionWorld.capsuleIntersect(playerCapsule);
        if (!collision) break;
        const horizontalLength = Math.hypot(collision.normal.x, collision.normal.z);
        if (horizontalLength < 0.04) break;
        const correctionScale = collision.depth / horizontalLength;
        collisionCorrection.set(
          collision.normal.x * correctionScale,
          0,
          collision.normal.z * correctionScale,
        );
        playerCapsule.translate(collisionCorrection);
      }
      return resolvedHorizontal.set(playerCapsule.start.x, playerCapsule.start.z);
    };

    const collectSurfaceSamples = (bounds: THREE.Box3, spacing: number) => {
      const samples: THREE.Vector3[] = [];
      const minX = Math.max(bounds.min.x, -70);
      const maxX = Math.min(bounds.max.x, 70);
      const minZ = Math.max(bounds.min.z, -70);
      const maxZ = Math.min(bounds.max.z, 70);
      for (let x = minX + spacing / 2; x <= maxX; x += spacing) {
        for (let z = minZ + spacing / 2; z <= maxZ; z += spacing) {
          const y = getGroundHeight(x, z);
          if (y !== null) samples.push(new THREE.Vector3(x, y, z));
        }
      }
      return samples;
    };

    const placeSpawnAndPortal = (bounds: THREE.Box3, spacing: number) => {
      const samples = collectSurfaceSamples(bounds, spacing);
      if (samples.length === 0) {
        stageSpawn.set(0, 0, 0);
        stagePortalPosition.set(0, 0, 8);
        return;
      }
      let spawn = samples[0];
      for (const sample of samples) {
        if (sample.x * sample.x + sample.z * sample.z < spawn.x * spawn.x + spawn.z * spawn.z) {
          spawn = sample;
        }
      }
      let portal = samples[0];
      let farthestDistance = 0;
      for (const sample of samples) {
        const distance = sample.distanceToSquared(spawn);
        if (distance > farthestDistance) {
          farthestDistance = distance;
          portal = sample;
        }
      }
      stageSpawn.copy(spawn);
      stagePortalPosition.copy(portal);
    };

    const alienTextureUrl = (fileName: string) =>
      `/models/alien-world/textures/${textureProfile}/${encodeURIComponent(fileName)}`;

    const createAlienMaterial = async (materialName: string) => {
      const key = normalizedMaterialName(materialName);
      const details = ALIEN_MATERIALS[key] ?? {};
      if (details.unlit) {
        return new THREE.MeshBasicMaterial({
          color: 0xa7ffe9,
          transparent: true,
          opacity: highQualityMode ? 0.11 : 0.075,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: true,
        });
      }
      const [map, normalMap, roughnessMap, metalnessMap, aoMap, emissiveMap, alphaMap] =
        await Promise.all([
          details.map ? loadTexture(alienTextureUrl(details.map), true) : null,
          details.normal ? loadTexture(alienTextureUrl(details.normal), false) : null,
          details.roughness ? loadTexture(alienTextureUrl(details.roughness), false) : null,
          details.metalness ? loadTexture(alienTextureUrl(details.metalness), false) : null,
          details.ao ? loadTexture(alienTextureUrl(details.ao), false) : null,
          details.emissive ? loadTexture(alienTextureUrl(details.emissive), true) : null,
          details.alpha ? loadTexture(alienTextureUrl(details.alpha), false) : null,
        ]);
      if (aoMap) aoMap.channel = 1;
      if (details.glass) {
        return new THREE.MeshPhysicalMaterial({
          color: 0xb9f7ff,
          map,
          roughnessMap,
          aoMap,
          alphaMap,
          transparent: true,
          opacity: 0.58,
          transmission: highQualityMode ? 0.28 : 0,
          thickness: 0.18,
          roughness: 0.16,
          metalness: 0.05,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
      }
      const hasAlpha = Boolean(alphaMap);
      const hasGlow = Boolean(emissiveMap);
      return new THREE.MeshStandardMaterial({
        color: map ? 0xffffff : key === "black" ? 0x080912 : 0x79718a,
        map,
        normalMap,
        roughnessMap,
        metalnessMap,
        aoMap,
        aoMapIntensity: 0.72,
        emissive: hasGlow ? 0xffffff : 0x000000,
        emissiveMap,
        emissiveIntensity: hasGlow ? (highQualityMode ? 0.42 : 0.28) : 0,
        alphaMap,
        transparent: hasAlpha,
        alphaTest: hasAlpha ? 0.28 : 0,
        side: hasAlpha ? THREE.DoubleSide : THREE.FrontSide,
        roughness: roughnessMap ? 1 : key.includes("rock") ? 0.7 : 0.54,
        metalness: metalnessMap ? 1 : 0.05,
      });
    };

    const loadAlienStage = async () => {
      setLoadingDetail("Growing the Alien World…");
      const manager = new THREE.LoadingManager();
      manager.setURLModifier((url) => {
        if (/^(?:blob:|data:)/i.test(url)) return url;
        const normalized = decodeURIComponent(url.replace(/\\/g, "/"));
        const rawName = normalized.split("/").pop() || normalized;
        if (!/\.(?:png|jpe?g|webp)$/i.test(rawName)) return url;
        return EMPTY_TEXTURE_URL;
      });
      const model = await new FBXLoader(manager).loadAsync(ALIEN_MODEL_URL);
      if (disposed) {
        disposeObject(model);
        return;
      }
      const sourceBounds = new THREE.Box3().setFromObject(model);
      const size = sourceBounds.getSize(new THREE.Vector3());
      const center = sourceBounds.getCenter(new THREE.Vector3());
      const scale = 42 / Math.max(size.x, size.z);
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -sourceBounds.min.y * scale, -center.z * scale);
      model.updateWorldMatrix(true, true);

      const materialNames = new Set<string>();
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => materialNames.add(material.name));
      });
      const materialEntries = await Promise.all(
        [...materialNames].map(async (name) => [name, await createAlienMaterial(name)] as const),
      );
      const materialMap = new Map(materialEntries);

      const detachedMaterials = new Set<THREE.Material>();
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
        sourceMaterials.forEach((material) => detachedMaterials.add(material));
        object.material = Array.isArray(object.material)
          ? sourceMaterials.map((material) => materialMap.get(material.name) ?? material)
          : materialMap.get(sourceMaterials[0].name) ?? sourceMaterials[0];
        const uv = object.geometry.getAttribute("uv");
        if (uv && !object.geometry.getAttribute("uv1")) {
          object.geometry.setAttribute("uv1", uv.clone());
        }
        const descriptor = `${object.name} ${sourceMaterials.map((material) => material.name).join(" ")}`;
        object.castShadow = highQualityMode && !/ground|grass|black/i.test(descriptor);
        object.receiveShadow = /ground|rock|mushroom/i.test(descriptor);
        object.frustumCulled = true;
        const isTerrain = /ground1|groundblack/i.test(descriptor);
        if (isTerrain) {
          floorMeshes.push(object);
          terrainMeshes.push(object);
        }
        const isSolid =
          isTerrain ||
          !/grass|leafplant|peacockplant|eyeplant|light|glass|black|pcylinder34/i.test(
            descriptor,
          );
        if (isSolid) object.layers.enable(WORLD_COLLISION_LAYER);
        if (/pcylinder34/i.test(object.name)) {
          object.castShadow = false;
          object.receiveShadow = false;
          object.userData.baseY = object.position.y;
          const lightSource = new THREE.Vector3(0.853, 1.03, 1.448);
          const lightTarget = new THREE.Object3D();
          lightTarget.name = "Alien searchlight target";
          lightTarget.position.set(6.019, 4.416, 10.42);
          const searchlight = new THREE.SpotLight(
            0xb8fff0,
            highQualityMode ? 0.72 : 0.38,
            28,
            0.23,
            0.68,
            1.7,
          );
          searchlight.name = "Alien searchlight";
          searchlight.position.copy(lightSource);
          searchlight.target = lightTarget;
          searchlight.castShadow = false;
          const sourceGlow = new THREE.PointLight(
            0x7effdf,
            highQualityMode ? 0.42 : 0.22,
            6,
            2,
          );
          sourceGlow.name = "Alien searchlight source glow";
          sourceGlow.position.copy(lightSource);
          object.add(lightTarget, searchlight, sourceGlow);
          animatedStageObjects.push(object);
        }
      });
      detachedMaterials.forEach(disposeDetachedMaterial);
      stageRoot.add(model);
      const bounds = new THREE.Box3().setFromObject(model);
      stageBounds = bounds.clone();
      stageRayHeight = bounds.max.y + 30;
      if (floorMeshes.length === 0) {
        model.traverse((object) => {
          if (object instanceof THREE.Mesh && /ground/i.test(object.name)) {
            floorMeshes.push(object);
            terrainMeshes.push(object);
            object.layers.enable(WORLD_COLLISION_LAYER);
          }
        });
      }
      placeSpawnAndPortal(bounds, 2.4);
    };

    const chooseElfPlacement = () => {
      const samples = collectSurfaceSamples(stageBounds, 3.1);
      let best: THREE.Vector3 | null = null;
      let bestScore = Number.POSITIVE_INFINITY;
      for (const sample of samples) {
        const spawnDistance = Math.hypot(sample.x - stageSpawn.x, sample.z - stageSpawn.z);
        const portalDistance = Math.hypot(
          sample.x - stagePortalPosition.x,
          sample.z - stagePortalPosition.z,
        );
        if (spawnDistance < 7 || spawnDistance > 16 || portalDistance < 7) continue;
        const heightPenalty = Math.abs(sample.y - stageSpawn.y) * 0.4;
        const score = Math.abs(spawnDistance - 10.5) + heightPenalty;
        if (score < bestScore) {
          best = sample;
          bestScore = score;
        }
      }
      if (best) {
        stageElfPosition.copy(best);
        return;
      }
      const towardPortal = stagePortalPosition.clone().sub(stageSpawn).setY(0).normalize();
      stageElfPosition
        .copy(stageSpawn)
        .add(new THREE.Vector3(-towardPortal.z, 0, towardPortal.x).multiplyScalar(8));
      stageElfPosition.y = getGroundHeight(stageElfPosition.x, stageElfPosition.z) ?? stageSpawn.y;
    };

    const loadFantasyElfScene = async () => {
      if (initialStage !== "alien") return;
      setLoadingDetail("Calling a magical guide into the Alien World…");
      chooseElfPlacement();
      const gltf = await new GLTFLoader().loadAsync(
        lowPowerMode || !highQualityMode
          ? FANTASY_ELF_MOBILE_MODEL_URL
          : FANTASY_ELF_MODEL_URL,
      );
      if (disposed) {
        disposeObject(gltf.scene);
        return;
      }

      const model = gltf.scene;
      const sourceBounds = new THREE.Box3().setFromObject(model);
      const sourceSize = sourceBounds.getSize(new THREE.Vector3());
      const sourceCenter = sourceBounds.getCenter(new THREE.Vector3());
      const scale = 6.2 / Math.max(0.001, sourceSize.y);
      model.scale.setScalar(scale);
      model.position.set(
        -sourceCenter.x * scale,
        -sourceBounds.min.y * scale,
        -sourceCenter.z * scale,
      );

      const wrapper = new THREE.Group();
      wrapper.name = "Fantasy Elf encounter";
      wrapper.position.copy(stageElfPosition);
      const faceSpawn = stageSpawn.clone().sub(stageElfPosition);
      wrapper.rotation.y = Math.atan2(faceSpawn.x, faceSpawn.z);
      wrapper.add(model);
      stageRoot.add(wrapper);
      wrapper.updateWorldMatrix(true, true);

      const sceneBase = model.getObjectByName("ScenePart_00");
      const archiveTree = model.getObjectByName("ScenePart_11");
      const magicalGuide = model.getObjectByName("Elf") ?? model.getObjectByName("Group56570");
      const sceneBaseMeshes: THREE.Mesh[] = [];
      const isInside = (
        object: THREE.Object3D,
        ancestor: THREE.Object3D | null | undefined,
      ) => {
        if (!ancestor) return false;
        let current: THREE.Object3D | null = object;
        while (current) {
          if (current === ancestor) return true;
          current = current.parent;
        }
        return false;
      };

      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = highQualityMode;
        object.receiveShadow = highQualityMode;
        const belongsToBase = isInside(object, sceneBase);
        const belongsToTree = isInside(object, archiveTree);
        if (belongsToBase || belongsToTree) object.layers.enable(WORLD_COLLISION_LAYER);
        if (belongsToBase) {
          floorMeshes.push(object);
          sceneBaseMeshes.push(object);
        }
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial) {
            material.envMapIntensity = highQualityMode ? 0.48 : 0.32;
            material.roughness = Math.max(0.55, material.roughness);
          }
        });
      });

      let guideInteractionPosition: THREE.Vector3 | null = null;
      if (magicalGuide) {
        const guideBounds = new THREE.Box3().setFromObject(magicalGuide);
        const guideSize = guideBounds.getSize(new THREE.Vector3());
        const guideCenter = guideBounds.getCenter(new THREE.Vector3());
        guideInteractionPosition = new THREE.Vector3(
          guideCenter.x,
          getSurfaceHeight(sceneBaseMeshes, guideCenter.x, guideCenter.z) ?? guideBounds.min.y,
          guideCenter.z,
        );
        const guideCollider = new THREE.Mesh(
          new THREE.CylinderGeometry(
            Math.max(0.38, Math.min(0.72, Math.max(guideSize.x, guideSize.z) * 0.38)),
            Math.max(0.42, Math.min(0.78, Math.max(guideSize.x, guideSize.z) * 0.42)),
            Math.max(0.8, guideSize.y * 0.82),
            12,
          ),
          new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
            colorWrite: false,
          }),
        );
        guideCollider.name = "Magical guide collider";
        guideCollider.position.set(
          guideCenter.x,
          guideBounds.min.y + Math.max(0.8, guideSize.y * 0.82) * 0.5,
          guideCenter.z,
        );
        guideCollider.layers.enable(WORLD_COLLISION_LAYER);
        stageRoot.add(guideCollider);
      }

      elfCharacter = magicalGuide ?? archiveTree ?? model;
      elfCharacter.userData.interactive = true;
      const treeBounds = new THREE.Box3().setFromObject(archiveTree ?? model);
      treeBounds.getCenter(stageTreeBasePosition);
      const baseBounds = sceneBase ? new THREE.Box3().setFromObject(sceneBase) : null;
      stageTreeBasePosition.y =
        getSurfaceHeight(sceneBaseMeshes, stageTreeBasePosition.x, stageTreeBasePosition.z) ??
        baseBounds?.max.y ??
        treeBounds.min.y;
      stageElfPosition.copy(guideInteractionPosition ?? stageTreeBasePosition);

      const aura = new THREE.Group();
      aura.name = "Elf gallery portal aura";
      aura.position.set(stageElfPosition.x, stageElfPosition.y + 0.07, stageElfPosition.z);
      const auraMaterial = new THREE.MeshBasicMaterial({
        color: 0xd789ff,
        transparent: true,
        opacity: 0.48,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: true,
      });
      for (let index = 0; index < (lowPowerMode ? 1 : 2); index += 1) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(1.25 + index * 0.34, 0.025, 6, 48),
          index === 0 ? auraMaterial : auraMaterial.clone(),
        );
        ring.rotation.x = Math.PI / 2;
        ring.userData.spin = index % 2 === 0 ? 1 : -1;
        aura.add(ring);
      }
      const elfLight = new THREE.PointLight(0xd789ff, highQualityMode ? 0.76 : 0.42, 5, 2);
      elfLight.position.y = 0.55;
      aura.add(elfLight);
      stageRoot.add(aura);
      elfAura = aura;
    };

    const loadCoralPlatform = async () => {
      if (initialStage !== "alien") return;
      setLoadingDetail("Placing a coral landmark across the Alien World…");
      const gltf = await new GLTFLoader().loadAsync(CORAL_PIECE_MODEL_URL);
      if (disposed) {
        disposeObject(gltf.scene);
        return;
      }

      const modelTemplate = gltf.scene;
      const sourceBounds = new THREE.Box3().setFromObject(modelTemplate);
      const sourceSize = sourceBounds.getSize(new THREE.Vector3());
      const sourceCenter = sourceBounds.getCenter(new THREE.Vector3());
      modelTemplate.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = highQualityMode && !lowPowerMode;
        object.receiveShadow = highQualityMode && !lowPowerMode;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial) {
            material.envMapIntensity = highQualityMode ? 0.34 : 0.24;
            material.emissiveIntensity = Math.min(0.18, material.emissiveIntensity);
            material.roughness = Math.max(0.58, material.roughness);
            material.metalness = Math.min(0.08, material.metalness);
            material.toneMapped = true;
          }
        });
      });

      const makeCoralPlatform = (
        center: THREE.Vector3,
        topY: number,
        diameter: number,
        visibleHeight: number,
        index: number,
        addLight = false,
      ) => {
        const wrapper = new THREE.Group();
        wrapper.name = "Coral ground landmark";
        wrapper.position.set(center.x, topY - visibleHeight, center.z);

        const visualFrame = new THREE.Group();
        visualFrame.rotation.y = index * 0.83 + Math.PI * 0.18;
        const visual = modelTemplate.clone(true);
        const horizontalScale = diameter / Math.max(0.001, sourceSize.x, sourceSize.z);
        const verticalScale = visibleHeight / Math.max(0.001, sourceSize.y);
        visual.scale.set(horizontalScale, verticalScale, horizontalScale);
        visual.position.set(
          -sourceCenter.x * horizontalScale,
          -sourceBounds.min.y * verticalScale,
          -sourceCenter.z * horizontalScale,
        );
        visualFrame.add(visual);
        wrapper.add(visualFrame);

        const colliderHeight = 0.16;
        const colliderRadius = diameter * 0.43;
        const collider = new THREE.Mesh(
          new THREE.CylinderGeometry(
            colliderRadius * 0.96,
            colliderRadius,
            colliderHeight,
            lowPowerMode ? 12 : 20,
          ),
          new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
            colorWrite: false,
          }),
        );
        collider.name = `Coral platform ${index + 1} collider`;
        collider.position.y = visibleHeight - colliderHeight * 0.5;
        collider.layers.enable(WORLD_COLLISION_LAYER);
        wrapper.add(collider);
        floorMeshes.push(collider);

        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(colliderRadius * 0.96, 0.018, 5, lowPowerMode ? 28 : 44),
          new THREE.MeshBasicMaterial({
            color: index % 2 === 0 ? 0x72ffe1 : 0xe58cff,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: true,
          }),
        );
        ring.name = `Coral platform ${index + 1} guide ring`;
        ring.position.y = visibleHeight + 0.018;
        ring.rotation.x = Math.PI / 2;
        ring.userData.phase = index * 0.7;
        wrapper.add(ring);
        coralPlatformRings.push(ring);

        if (addLight) {
          const coralLight = new THREE.PointLight(
            index % 2 === 0 ? 0x72ffe1 : 0xe58cff,
            highQualityMode ? 0.34 : 0.18,
            3.4,
            2,
          );
          coralLight.position.y = visibleHeight + 0.24;
          coralLight.userData.phase = index * 0.7;
          wrapper.add(coralLight);
          coralPlatformLights.push(coralLight);
        }

        stageRoot.add(wrapper);
        wrapper.updateWorldMatrix(true, true);
      };

      const coralCandidates = collectSurfaceSamples(stageBounds, 2.8)
        .filter(
          (sample) =>
            Math.hypot(
              sample.x - stageElfPosition.x,
              sample.z - stageElfPosition.z,
            ) >= 10.5 &&
            Math.hypot(sample.x - stageSpawn.x, sample.z - stageSpawn.z) >= 5.5 &&
            Math.hypot(
              sample.x - stagePortalPosition.x,
              sample.z - stagePortalPosition.z,
            ) >= 7,
        )
        .sort(
          (left, right) =>
            Math.hypot(
              right.x - stageElfPosition.x,
              right.z - stageElfPosition.z,
            ) -
            Math.hypot(
              left.x - stageElfPosition.x,
              left.z - stageElfPosition.z,
            ),
        );
      const fallbackDirection = stageSpawn.clone().sub(stageTreeBasePosition).setY(0);
      if (fallbackDirection.lengthSq() < 0.001) fallbackDirection.set(0, 0, 1);
      fallbackDirection.normalize();
      const coralCenter =
        coralCandidates[0]?.clone() ??
        stageTreeBasePosition.clone().addScaledVector(fallbackDirection, 11);
      const terrainHeight =
        getTerrainHeight(coralCenter.x, coralCenter.z) ??
        coralCandidates[0]?.y ??
        stageSpawn.y;
      coralCenter.y = terrainHeight;
      stageCoralPosition = coralCenter.clone();
      makeCoralPlatform(coralCenter, terrainHeight + 0.58, 2.25, 0.58, 0, true);
    };

    const loadCrystalPlanet = async () => {
      if (initialStage !== "alien") return;
      setLoadingDetail("Placing the Crystal Planet at the edge of the world…");
      try {
        const gltf = await new GLTFLoader().loadAsync(CRYSTAL_PLANET_MODEL_URL);
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }

        const model = gltf.scene;
        const crystalScale = 0.03;
        const footprintX = 573.9245 * crystalScale;
        const footprintZ = 528.5503 * crystalScale;
        const edgeInsetX = footprintX * 0.5 + 0.6;
        const edgeInsetZ = footprintZ * 0.5 + 0.6;
        const sampleOffsets = [
          new THREE.Vector2(footprintX * 0.34, footprintZ * 0.34),
          new THREE.Vector2(footprintX * 0.34, -footprintZ * 0.34),
          new THREE.Vector2(-footprintX * 0.34, footprintZ * 0.34),
          new THREE.Vector2(-footprintX * 0.34, -footprintZ * 0.34),
        ];
        const surfaceSamples = collectSurfaceSamples(stageBounds, 2.4);
        const placementCandidates = surfaceSamples
          .filter((sample) => {
            const awayFromSpawn = sample.distanceTo(stageSpawn) >= 11;
            const awayFromPortal = sample.distanceTo(stagePortalPosition) >= 9;
            const awayFromTree = sample.distanceTo(stageTreeBasePosition) >= 9;
            const awayFromCoral =
              stageCoralPosition === null ||
              Math.hypot(
                sample.x - stageCoralPosition.x,
                sample.z - stageCoralPosition.z,
              ) >= 9;
            const insideStageEdge =
              sample.x >= stageBounds.min.x + edgeInsetX &&
              sample.x <= stageBounds.max.x - edgeInsetX &&
              sample.z >= stageBounds.min.z + edgeInsetZ &&
              sample.z <= stageBounds.max.z - edgeInsetZ;
            if (
              !awayFromSpawn ||
              !awayFromPortal ||
              !awayFromTree ||
              !awayFromCoral ||
              !insideStageEdge
            ) {
              return false;
            }
            const heights = sampleOffsets.map((offset) =>
              getTerrainHeight(sample.x + offset.x, sample.z + offset.y),
            );
            if (heights.some((height) => height === null)) return false;
            const numericHeights = heights.filter((height): height is number => height !== null);
            return Math.max(...numericHeights) - Math.min(...numericHeights) < 1.4;
          })
          .sort((left, right) => {
            const leftEdge = Math.min(
              left.x - stageBounds.min.x,
              stageBounds.max.x - left.x,
              left.z - stageBounds.min.z,
              stageBounds.max.z - left.z,
            );
            const rightEdge = Math.min(
              right.x - stageBounds.min.x,
              stageBounds.max.x - right.x,
              right.z - stageBounds.min.z,
              stageBounds.max.z - right.z,
            );
            if (Math.abs(leftEdge - rightEdge) > 0.01) return leftEdge - rightEdge;
            const leftSeparation = Math.min(
              left.distanceTo(stageSpawn),
              left.distanceTo(stagePortalPosition),
              left.distanceTo(stageTreeBasePosition),
            );
            const rightSeparation = Math.min(
              right.distanceTo(stageSpawn),
              right.distanceTo(stagePortalPosition),
              right.distanceTo(stageTreeBasePosition),
            );
            return rightSeparation - leftSeparation;
          });

        const horizontalSeparation = (point: THREE.Vector3, target: THREE.Vector3) =>
          Math.hypot(point.x - target.x, point.z - target.z);
        const fallbackPositions = [
          new THREE.Vector2(
            stageBounds.min.x + footprintX * 0.5 + 0.8,
            stageBounds.min.z + footprintZ * 0.5 + 0.8,
          ),
          new THREE.Vector2(
            stageBounds.min.x + footprintX * 0.5 + 0.8,
            stageBounds.max.z - footprintZ * 0.5 - 0.8,
          ),
          new THREE.Vector2(
            stageBounds.max.x - footprintX * 0.5 - 0.8,
            stageBounds.min.z + footprintZ * 0.5 + 0.8,
          ),
          new THREE.Vector2(
            stageBounds.max.x - footprintX * 0.5 - 0.8,
            stageBounds.max.z - footprintZ * 0.5 - 0.8,
          ),
        ]
          .map(
            (point) =>
              new THREE.Vector3(
                point.x,
                getTerrainHeight(point.x, point.y) ?? stageSpawn.y,
                point.y,
              ),
          )
          .sort((left, right) => {
            const separationScore = (point: THREE.Vector3) =>
              Math.min(
                horizontalSeparation(point, stageSpawn),
                horizontalSeparation(point, stagePortalPosition),
                horizontalSeparation(point, stageElfPosition),
                stageCoralPosition
                  ? horizontalSeparation(point, stageCoralPosition)
                  : Number.POSITIVE_INFINITY,
              );
            return separationScore(right) - separationScore(left);
          });
        const fallbackPosition = fallbackPositions[0];
        const placement = placementCandidates[0]?.clone() ?? fallbackPosition;
        const mainPlanetContactX = placement.x + 154.9477 * crystalScale;
        const mainPlanetContactZ = placement.z + 72.6255 * crystalScale;
        const mainPlanetTerrainHeight =
          getTerrainHeight(mainPlanetContactX, mainPlanetContactZ) ??
          getTerrainHeight(placement.x, placement.z) ??
          placement.y;
        const accessibleCapHeight = 0.72;
        const mainPlanetSink = 130.7259 * crystalScale - accessibleCapHeight;
        placement.y = mainPlanetTerrainHeight - mainPlanetSink;

        model.name = "Crystal Planet edge landmark";
        model.scale.setScalar(crystalScale);
        model.position.copy(placement);
        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.castShadow = false;
          object.receiveShadow = false;
          object.frustumCulled = true;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            material.toneMapped = true;
            if (material instanceof THREE.MeshStandardMaterial) {
              material.envMapIntensity = highQualityMode ? 0.34 : 0.24;
              material.emissiveIntensity = Math.min(0.2, material.emissiveIntensity);
              material.roughness = Math.max(0.46, material.roughness);
            }
          });
        });
        stageRoot.add(model);

        const proxyMaterial = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
          colorWrite: false,
        });
        const addEllipsoidProxy = (
          name: string,
          localCenter: THREE.Vector3,
          localRadii: THREE.Vector3,
          canStandOn = false,
        ) => {
          const proxy = new THREE.Mesh(
            new THREE.SphereGeometry(1, lowPowerMode ? 16 : 24, lowPowerMode ? 10 : 16),
            proxyMaterial,
          );
          proxy.name = name;
          proxy.position.set(
            placement.x + localCenter.x * crystalScale,
            placement.y + localCenter.y * crystalScale,
            placement.z + localCenter.z * crystalScale,
          );
          proxy.scale.set(
            localRadii.x * crystalScale,
            localRadii.y * crystalScale,
            localRadii.z * crystalScale,
          );
          proxy.layers.enable(WORLD_COLLISION_LAYER);
          stageRoot.add(proxy);
          if (canStandOn) floorMeshes.push(proxy);
        };
        addEllipsoidProxy(
          "Crystal Planet main world collider",
          new THREE.Vector3(154.9477, 65.363, 72.6255),
          new THREE.Vector3(132.0145, 65.363, 131.8474),
          true,
        );
        addEllipsoidProxy(
          "Crystal Planet satellite collider",
          new THREE.Vector3(154.2866, 241.6661, 215.0128),
          new THREE.Vector3(34.5826, 34.5826, 34.5826),
        );
        addEllipsoidProxy(
          "Crystal Planet tree world collider",
          new THREE.Vector3(-74.0128, 147.6, -41.2124),
          new THREE.Vector3(47.8436, 49.3569, 42.0303),
        );
        addEllipsoidProxy(
          "Crystal Planet ring world collider",
          new THREE.Vector3(175.838, 204.6785, -127.6047),
          new THREE.Vector3(63.059, 34.5826, 62.5547),
        );
      } catch (crystalError) {
        console.warn("The Crystal Planet landmark could not be loaded.", crystalError);
      }
    };

    const rainbowTextureUrl = (fileName: string) =>
      `/models/rainbow-road-wii/textures/${encodeURIComponent(fileName)}`;

    const createRainbowMaterial = async (materialName: string) => {
      const binding = RAINBOW_TEXTURE_BINDINGS.find(({ pattern }) => pattern.test(materialName));
      const map = binding ? await loadTexture(rainbowTextureUrl(binding.file), true) : null;
      const additive = Boolean(binding?.additive);
      const transparent = Boolean(binding?.transparent || additive);
      if (additive) {
        return new THREE.MeshBasicMaterial({
          color: 0xffffff,
          map,
          transparent: true,
          opacity: binding?.opacity ?? 0.08,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          toneMapped: true,
        });
      }
      const material = new THREE.MeshStandardMaterial({
        color: map ? 0xffffff : /road/i.test(materialName) ? 0x39215f : 0x6f65a5,
        map,
        emissive: binding?.emissive ? 0xffffff : 0x090511,
        emissiveMap: binding?.emissive ? map : null,
        emissiveIntensity: binding?.emissive ?? 0.12,
        roughness: /road/i.test(materialName) ? 0.34 : 0.48,
        metalness: /road|ring|arrow/i.test(materialName) ? 0.34 : 0.08,
        transparent,
        alphaTest: transparent && !additive ? 0.08 : 0,
        opacity: binding?.opacity ?? 1,
        side: THREE.DoubleSide,
        depthWrite: true,
        blending: THREE.NormalBlending,
      });
      material.toneMapped = true;
      return material;
    };

    const loadRainbowStage = async () => {
      setLoadingDetail("Building Rainbow Road Wii…");
      const model = await new OBJLoader().loadAsync(RAINBOW_MODEL_URL);
      if (disposed) {
        disposeObject(model);
        return;
      }
      const trackObject = model.getObjectByName("polygon100") ?? model;
      const trackBounds = new THREE.Box3().setFromObject(trackObject);
      const trackSize = trackBounds.getSize(new THREE.Vector3());
      const trackCenter = trackBounds.getCenter(new THREE.Vector3());
      const scale = 92 / Math.max(trackSize.x, trackSize.z);
      model.scale.setScalar(scale);
      model.position.set(
        -trackCenter.x * scale,
        -trackBounds.min.y * scale,
        -trackCenter.z * scale,
      );
      model.updateWorldMatrix(true, true);

      const materialNames = new Set<string>();
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => materialNames.add(material.name));
      });
      const materialEntries = await Promise.all(
        [...materialNames].map(async (name) => [name, await createRainbowMaterial(name)] as const),
      );
      const materialMap = new Map(materialEntries);

      const detachedMaterials = new Set<THREE.Material>();
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
        sourceMaterials.forEach((material) => detachedMaterials.add(material));
        object.material = Array.isArray(object.material)
          ? sourceMaterials.map((material) => materialMap.get(material.name) ?? material)
          : materialMap.get(sourceMaterials[0].name) ?? sourceMaterials[0];
        const descriptor = `${object.name} ${sourceMaterials.map((material) => material.name).join(" ")}`;
        object.castShadow = false;
        object.receiveShadow = /z1_road/i.test(descriptor);
        object.frustumCulled = true;
        if (object === trackObject || object.parent === trackObject) {
          floorMeshes.push(object);
          terrainMeshes.push(object);
        }
        const isVisualEffect =
          /warp|aurora|star|logo|arrow|ring|heri|dush|hpipe|luminous|saku/i.test(
            descriptor,
          );
        if (!isVisualEffect) {
          object.layers.enable(WORLD_COLLISION_LAYER);
          cameraCollisionMeshes.push(object);
        }
      });
      detachedMaterials.forEach(disposeDetachedMaterial);
      if (floorMeshes.length === 0) {
        trackObject.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            floorMeshes.push(object);
            terrainMeshes.push(object);
            object.layers.enable(WORLD_COLLISION_LAYER);
          }
        });
      }
      stageRoot.add(model);
      const transformedTrackBounds = new THREE.Box3().setFromObject(trackObject);
      stageBounds = transformedTrackBounds.clone();
      stageRayHeight = transformedTrackBounds.max.y + 80;
      placeSpawnAndPortal(transformedTrackBounds, 4.2);
      const clearSpawnZ = stageSpawn.z - 4.2;
      const clearSpawnHeight = getGroundHeight(stageSpawn.x, clearSpawnZ);
      if (clearSpawnHeight !== null) {
        stageSpawn.set(stageSpawn.x, clearSpawnHeight, clearSpawnZ);
      }
      const clearPortalZ = stagePortalPosition.z - 8.4;
      const clearPortalHeight = getGroundHeight(stagePortalPosition.x, clearPortalZ);
      if (clearPortalHeight !== null) {
        stagePortalPosition.set(
          stagePortalPosition.x,
          clearPortalHeight,
          clearPortalZ,
        );
      }
    };

    const createPortal = async () => {
      const group = new THREE.Group();
      group.name = configuration.destinationLabel;
      group.position.copy(stagePortalPosition);
      const direction = stageSpawn.clone().sub(stagePortalPosition);
      group.rotation.y = Math.atan2(direction.x, direction.z);

      const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 2.9, 0.24, 40),
        new THREE.MeshStandardMaterial({
          color: 0x100827,
          emissive: configuration.accent,
          emissiveIntensity: 0.18,
          metalness: 0.62,
          roughness: 0.3,
        }),
      );
      platform.position.y = 0.08;
      platform.receiveShadow = highQualityMode;
      platform.layers.enable(WORLD_COLLISION_LAYER);
      group.add(platform);
      floorMeshes.push(platform);

      try {
        const gltf = await new GLTFLoader().loadAsync(SCI_FI_PORTAL_MODEL_URL);
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }
        const portalModel = gltf.scene;
        const portalBounds = new THREE.Box3().setFromObject(portalModel);
        const portalSize = portalBounds.getSize(new THREE.Vector3());
        const portalCenter = portalBounds.getCenter(new THREE.Vector3());
        const portalScale = 5.2 / Math.max(0.001, portalSize.y);
        portalModel.scale.setScalar(portalScale);
        portalModel.position.set(
          -portalCenter.x * portalScale,
          -portalBounds.min.y * portalScale,
          -portalCenter.z * portalScale + 0.08,
        );
        portalModel.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.castShadow = highQualityMode;
          object.receiveShadow = highQualityMode;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          const descriptor = `${object.name} ${materials.map((material) => material.name).join(" ")}`;
          if (!/energy|core|glass|fx/i.test(descriptor)) {
            object.layers.enable(WORLD_COLLISION_LAYER);
          }
          if (/platform|walkway|base/i.test(descriptor)) floorMeshes.push(object);
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.envMapIntensity = highQualityMode ? 0.72 : 0.48;
              if (/portal_shell/i.test(material.name)) {
                material.emissive.set(configuration.accent);
                material.emissiveIntensity = 0.12;
              }
            }
          });
        });
        group.add(portalModel);
      } catch (portalError) {
        console.warn("The supplied sci-fi portal model could not be loaded; using the energy portal.", portalError);
      }

      for (let index = 0; index < 3; index += 1) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(1.72 + index * 0.23, 0.09 - index * 0.018, 10, 72),
          new THREE.MeshBasicMaterial({
            color: index === 1 ? 0xffffff : configuration.accent,
            transparent: true,
            opacity: 0.92 - index * 0.16,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        ring.position.y = 2.25;
        ring.position.z = index * 0.035;
        ring.userData.spin = index % 2 ? -1 : 1;
        group.add(ring);
      }

      portalCore = new THREE.Mesh(
        new THREE.CircleGeometry(1.7, 64),
        new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(configuration.accent) },
            uPower: { value: 0 },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec2 vUv;
            uniform float uTime;
            uniform float uPower;
            uniform vec3 uColor;
            void main() {
              vec2 p = (vUv - 0.5) * 2.0;
              float r = length(p);
              float a = atan(p.y, p.x);
              float spiral = 0.5 + 0.5 * sin(a * 6.0 - r * 20.0 + uTime * 4.0);
              float rings = 0.5 + 0.5 * sin(r * 34.0 - uTime * 5.0);
              float mask = 1.0 - smoothstep(0.7, 1.0, r);
              float core = 1.0 - smoothstep(0.0, 0.52, r);
              float alpha = mask * (0.34 + spiral * 0.24 + rings * 0.16 + core * 0.45);
              vec3 color = mix(uColor, vec3(1.0), core * 0.75 + uPower * 0.35);
              gl_FragColor = vec4(color * (1.0 + core + uPower), alpha);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: true,
        }),
      );
      portalCore.position.set(0, 2.25, -0.03);
      group.add(portalCore);
      portalLight = new THREE.PointLight(
        configuration.accent,
        highQualityMode ? 2.6 : 1.4,
        11,
        2,
      );
      portalLight.position.set(0, 2.3, 1.2);
      group.add(portalLight);
      stageRoot.add(group);
      portalGroup = group;
    };

    const loadPlayer = async () => {
      setLoadingDetail("Waking Quiu’s movement rig…");
      try {
        const gltf = await new GLTFLoader().loadAsync(QUIU_MODEL_URL);
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const span = Math.max(size.x, size.y, size.z);
        const centered = new THREE.Group();
        centered.position.copy(center).multiplyScalar(-1);
        centered.add(model);
        playerModelFrame.scale.setScalar(QUIU_MODEL_SPAN / Math.max(0.001, span));
        playerModelFrame.add(centered);
        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.castShadow = highQualityMode;
          object.receiveShadow = highQualityMode;
          const animateFace = (material: THREE.Material) => {
            if (!isQuiuFaceCompatibleMaterial(material)) return material;
            Object.values(material).forEach((value) => {
              if (value instanceof THREE.Texture) ownedTextures.add(value);
            });
            const controller = createQuiuFaceMaterial(material, {
              reducedMotion: reduceMotion,
              magicColor: configuration.accent,
            });
            controller.material.color.multiplyScalar(0.78);
            controller.material.envMapIntensity = highQualityMode ? 0.24 : 0.16;
            controller.material.roughness = Math.max(0.58, controller.material.roughness);
            controller.material.metalness = Math.min(0.34, controller.material.metalness);
            controller.material.toneMapped = true;
            faceControllers.push(controller);
            material.dispose();
            return controller.material;
          };
          object.material = Array.isArray(object.material)
            ? object.material.map(animateFace)
            : animateFace(object.material);
        });
        if (!reduceMotion && gltf.animations.length > 0) {
          playerMixer = new THREE.AnimationMixer(model);
          const action = (name: string) => {
            const clip = gltf.animations.find((item) => item.name === name);
            return clip && playerMixer ? playerMixer.clipAction(clip) : null;
          };
          idleAction = action("Quiu_Idle");
          runAction = action("Quiu_Run");
          boostRunAction = action("Quiu_BoostRun");
          jumpAction = action("Quiu_Jump");
          boostAction = action("Quiu_Boost");
          celebrateAction = action("Quiu_Celebrate");
          idleAction?.play();
          locomotionAction = idleAction;
          if (jumpAction) {
            jumpAction.setLoop(THREE.LoopOnce, 1);
            jumpAction.clampWhenFinished = false;
          }
          if (boostAction) boostAction.setLoop(THREE.LoopOnce, 1);
          if (celebrateAction) {
            celebrateAction.setLoop(THREE.LoopOnce, 1);
            celebrateAction.clampWhenFinished = true;
          }
        }
        playerModel = model;
        fallback.visible = false;
      } catch {
        fallback.visible = true;
      }
      playerReady = true;
    };

    const resetPlayer = () => {
      velocity.set(0, 0, 0);
      jumpHeight = 0;
      verticalVelocity = 0;
      jumpPhase = "grounded";
      wasAirborne = false;
      wasBoosting = false;
      groundHeight = stageSpawn.y;
      targetGroundHeight = stageSpawn.y;
      player.position.set(stageSpawn.x, groundHeight + PLAYER_HOVER, stageSpawn.z);
      resetSpeedTrail();
      const direction = stagePortalPosition.clone().sub(stageSpawn);
      heading = Math.atan2(direction.x, direction.z);
      cameraYaw = heading;
      cameraPitch = 0;
      mouseLookPitch = 0;
      mouseLookPitchTarget = 0;
      mouseTurn = 0;
      mouseTurnTarget = 0;
      cameraDistanceOffset = 0;
      player.rotation.set(0, heading, 0);
      player.scale.setScalar(1);
      playerVisual.scale.setScalar(1);
      playerVisual.rotation.set(0, 0, 0);
      cameraForward.set(Math.sin(cameraYaw), 0, Math.cos(cameraYaw));
      camera.position.set(
        player.position.x - cameraForward.x * 6.5,
        player.position.y + 3.25,
        player.position.z - cameraForward.z * 6.5,
      );
      lookTarget.copy(player.position).addScaledVector(cameraForward, 2.2);
      camera.lookAt(lookTarget.x, lookTarget.y + 0.55, lookTarget.z);
      nearPortalValue = false;
      nearElfValue = false;
      transitionKindValue = null;
      setNearPortal(false);
      setNearElf(false);
      setTransitionKind(null);
      setSpeed(0);
      setBoosting(false);
      setLocomotion(idleAction, true);
    };

    const releaseInputs = () => {
      keys.clear();
      touchRef.current = { x: 0, y: 0, boost: false, brake: false };
      jumpQueuedRef.current = false;
      jumpWasPressed = false;
      mouseTurnTarget = 0;
      joystickPointerRef.current = null;
      if (joystickKnobRef.current) {
        joystickKnobRef.current.style.transform = "translate3d(0, 0, 0)";
      }
    };

    const beginTransition = () => {
      if (phaseValue !== "playing") return;
      const useElfMagic = initialStage === "alien" && nearElfValue && Boolean(elfCharacter);
      if (!useElfMagic && (!nearPortalValue || !portalGroup)) return;
      transitionKindValue = useElfMagic ? "magic" : "portal";
      phaseValue = "transitioning";
      transitionStartedAt = performance.now();
      transitionDuration = reduceMotion ? 280 : useElfMagic ? 1250 : 1050;
      velocity.set(0, 0, 0);
      trailMaterial.opacity = 0;
      releaseInputs();
      setPhase("transitioning");
      setNearPortal(false);
      setNearElf(false);
      setTransitionKind(transitionKindValue);
      if (useElfMagic) {
        setLocomotion(celebrateAction, true);
        for (let index = 0; index < (lowPowerMode ? 8 : 18); index += 1) spawnBoostStar(true);
      }
      transitionTimer = window.setTimeout(() => {
        router.push(useElfMagic ? "/gallery?from=quiu-world" : configuration.destination);
      }, transitionDuration);
    };

    const startGame = () => {
      if (!stageReady || !playerReady || phaseValue === "transitioning") return;
      resetPlayer();
      phaseValue = "playing";
      setPhase("playing");
      renderer.domElement.focus({ preventScroll: true });
    };

    startRef.current = startGame;
    interactRef.current = beginTransition;
    resetRef.current = () => {
      if (phaseValue !== "playing") return;
      releaseInputs();
      resetPlayer();
    };

    const renderScene = () => {
      if (composer) composer.render();
      else renderer.render(scene, camera);
    };

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer?.setSize(width, height);
      renderScene();
    };

    const update = (now: number) => {
      animationFrame = null;
      const delta = Math.min(0.04, Math.max(0, (now - lastFrame) / 1000));
      lastFrame = now;
      playerMixer?.update(delta);
      if (phaseValue !== "playing") {
        faceControllers.forEach((controller) => {
          controller.setExpression(
            phaseValue === "transitioning" ? "magic" : "neutral",
            phaseValue === "transitioning" ? 0.55 : 1,
          );
          controller.update(delta);
        });
      }

      if (!reduceMotion) {
        stars.rotation.y += delta * (initialStage === "alien" ? 0.006 : 0.012);
        animatedStageObjects.forEach((object, index) => {
          object.rotation.y += delta * (index % 2 ? -0.12 : 0.12);
          if (object.userData.baseY !== undefined) {
            object.position.y = object.userData.baseY + Math.sin(now * 0.0014) * 0.12;
          }
        });
        if (elfAura) {
          const auraPulse = 0.96 + Math.sin(now * 0.0024) * 0.06;
          elfAura.scale.setScalar(auraPulse);
          elfAura.children.forEach((child, index) => {
            if (!(child instanceof THREE.Mesh)) return;
            child.rotation.z += delta * child.userData.spin * (0.35 + index * 0.12);
            if (child.material instanceof THREE.MeshBasicMaterial) {
              child.material.opacity = 0.34 + Math.sin(now * 0.002 + index) * 0.12;
            }
          });
        }
        coralPlatformRings.forEach((ring) => {
          const phase = Number(ring.userData.phase ?? 0);
          ring.material.opacity = 0.25 + Math.sin(now * 0.0022 + phase) * 0.07;
          ring.rotation.z += delta * 0.12;
        });
        coralPlatformLights.forEach((light) => {
          const phase = Number(light.userData.phase ?? 0);
          light.intensity =
            (highQualityMode ? 0.34 : 0.18) *
            (0.92 + Math.sin(now * 0.0022 + phase) * 0.08);
        });
      }

      if (portalGroup && portalCore) {
        const transitionPower =
          phaseValue === "transitioning" && transitionKindValue === "portal"
            ? Math.min(1, (now - transitionStartedAt) / Math.max(1, transitionDuration))
            : nearPortalValue
              ? 0.28
              : 0;
        portalCore.material.uniforms.uTime.value = now * 0.001;
        portalCore.material.uniforms.uPower.value = transitionPower;
        portalGroup.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.geometry instanceof THREE.TorusGeometry) {
            child.rotation.z += delta * child.userData.spin * (0.8 + transitionPower * 6);
          }
        });
        if (portalLight) {
          portalLight.intensity =
            (highQualityMode ? 2.6 : 1.4) * (1 + transitionPower * 0.65);
        }
      }

      if (phaseValue === "transitioning" && transitionKindValue === "portal" && portalGroup) {
        const progress = Math.min(1, (now - transitionStartedAt) / Math.max(1, transitionDuration));
        const eased = 1 - (1 - progress) ** 3;
        portalTarget.copy(stagePortalPosition);
        portalTarget.y += 1.35;
        player.position.lerp(portalTarget, Math.min(1, delta * (2.5 + progress * 7)));
        player.scale.setScalar(Math.max(0.04, 1 - eased * 0.94));
        camera.position.lerp(portalTarget, Math.min(1, delta * (1.8 + progress * 5)));
        camera.lookAt(portalTarget);
        if (bloomPass) bloomPass.strength = 0.18 + eased * 0.37;
        renderScene();
        if (!disposed) animationFrame = window.requestAnimationFrame(update);
        return;
      }

      if (phaseValue === "transitioning" && transitionKindValue === "magic" && elfCharacter) {
        const progress = Math.min(1, (now - transitionStartedAt) / Math.max(1, transitionDuration));
        const eased = 1 - (1 - progress) ** 3;
        portalTarget.set(stageElfPosition.x, stageElfPosition.y + 1.05, stageElfPosition.z);
        const targetHeading = Math.atan2(
          stageElfPosition.x - player.position.x,
          stageElfPosition.z - player.position.z,
        );
        const headingDifference = Math.atan2(
          Math.sin(targetHeading - heading),
          Math.cos(targetHeading - heading),
        );
        heading += headingDifference * Math.min(1, delta * 8);
        player.rotation.y = heading;
        const pulse = 1 + Math.sin(progress * Math.PI * 5) * 0.035 * (1 - progress);
        player.scale.setScalar(pulse);
        idealCameraPosition
          .copy(player.position)
          .lerp(portalTarget, 0.32)
          .addScaledVector(cameraForward, -3.8 + eased * 1.2);
        idealCameraPosition.y += 2.2;
        camera.position.lerp(idealCameraPosition, Math.min(1, delta * 3.8));
        camera.lookAt(portalTarget);
        if (elfAura) elfAura.scale.setScalar(1 + eased * 1.7);
        if (bloomPass) bloomPass.strength = 0.24 + eased * 0.48;
        updateBoostStars(delta, true);
        renderScene();
        if (!disposed) animationFrame = window.requestAnimationFrame(update);
        return;
      }

      if (phaseValue === "playing") {
        const smoothing = 1 - Math.exp(-delta * 7.5);
        mouseLookPitch = THREE.MathUtils.lerp(mouseLookPitch, mouseLookPitchTarget, smoothing);
        mouseTurn = THREE.MathUtils.lerp(mouseTurn, mouseTurnTarget, smoothing * 0.72);
        cameraYaw -= Math.sign(mouseTurn) * Math.pow(Math.abs(mouseTurn), 1.75) * delta * 1.15;

        const touch = touchRef.current;
        const gamepad = navigator.getGamepads?.().find((item) => item) ?? null;
        const deadzone = (value: number) => (Math.abs(value) > 0.16 ? value : 0);
        const forwardInput = THREE.MathUtils.clamp(
          (keys.has("w") || keys.has("arrowup") ? 1 : 0) -
            (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
            touch.y -
            deadzone(gamepad?.axes[1] ?? 0),
          -1,
          1,
        );
        const lateralInput = THREE.MathUtils.clamp(
          (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
            (keys.has("a") || keys.has("arrowleft") ? 1 : 0) +
            touch.x +
            deadzone(gamepad?.axes[0] ?? 0),
          -1,
          1,
        );
        cameraYaw -= deadzone(gamepad?.axes[2] ?? 0) * delta * 2;
        cameraPitch = THREE.MathUtils.clamp(
          cameraPitch + deadzone(gamepad?.axes[3] ?? 0) * delta * 1.25,
          -0.34,
          0.42,
        );
        const viewYaw = cameraYaw;
        cameraForward.set(Math.sin(viewYaw), 0, Math.cos(viewYaw));
        cameraRight.set(-cameraForward.z, 0, cameraForward.x);
        moveDirection
          .copy(cameraForward)
          .multiplyScalar(forwardInput)
          .addScaledVector(cameraRight, lateralInput);
        if (moveDirection.lengthSq() > 1) moveDirection.normalize();
        const inputStrength = Math.min(1, moveDirection.length());
        const wantsBoost = Boolean(
          keys.has("shift") ||
            touch.boost ||
            gamepad?.buttons[4]?.pressed ||
            gamepad?.buttons[5]?.pressed,
        );
        const isBoosting = wantsBoost && inputStrength > 0.04;
        const braking = Boolean(keys.has("control") || keys.has("b") || touch.brake || gamepad?.buttons[1]?.pressed);
        const maxSpeed = isBoosting ? (initialStage === "alien" ? 10.5 : 12.5) : initialStage === "alien" ? 5.8 : 7;
        desiredVelocity.copy(moveDirection).multiplyScalar(maxSpeed);
        velocity.lerp(desiredVelocity, 1 - Math.exp(-(inputStrength > 0.01 ? 7.6 : 6.5) * delta));
        if (braking) velocity.multiplyScalar(Math.exp(-13 * delta));

        const jumpPressed = Boolean(
          keys.has(" ") || jumpQueuedRef.current || gamepad?.buttons[0]?.pressed,
        );
        if (jumpPressed && !jumpWasPressed && jumpPhase === "grounded") {
          jumpPhase = "rising";
          verticalVelocity = 5.25;
          for (let index = 0; index < (lowPowerMode ? 4 : 7); index += 1) {
            spawnBoostStar(true);
          }
          if (jumpAction) {
            jumpAction.setEffectiveTimeScale(1.12);
            setLocomotion(jumpAction, true);
          }
        }
        jumpQueuedRef.current = false;
        jumpWasPressed = jumpPressed;
        if (jumpPhase !== "grounded") {
          verticalVelocity -= 14.2 * delta;
          jumpHeight += verticalVelocity * delta;
          if (verticalVelocity <= 0 && jumpPhase === "rising") jumpPhase = "falling";
          if (jumpHeight <= 0 && jumpPhase === "falling") {
            jumpHeight = 0;
            verticalVelocity = 0;
            jumpPhase = "grounded";
          }
        }

        const previousX = player.position.x;
        const previousZ = player.position.z;
        const nextX = previousX + velocity.x * delta;
        const nextZ = previousZ + velocity.z * delta;
        const currentSurfaceHeight = groundHeight + jumpHeight;
        const resolvedPosition = resolveHorizontalCollision(
          nextX,
          nextZ,
          currentSurfaceHeight + PLAYER_HOVER,
        );
        const resolvedX = resolvedPosition.x;
        const resolvedZ = resolvedPosition.y;
        const nextGround = getGroundHeight(resolvedX, resolvedZ);
        const airborneNow = jumpPhase !== "grounded";
        const surfaceRise = nextGround === null ? Number.POSITIVE_INFINITY : nextGround - targetGroundHeight;
        const canStepOntoSurface = surfaceRise <= 0.38;
        const canReachSurfaceFromAbove = Boolean(
          nextGround !== null && airborneNow && currentSurfaceHeight >= nextGround - 0.06,
        );
        if (nextGround !== null && (canStepOntoSurface || canReachSurfaceFromAbove)) {
          player.position.x = resolvedX;
          player.position.z = resolvedZ;
          if (canStepOntoSurface) {
            targetGroundHeight = nextGround;
          } else if (
            verticalVelocity <= 0 &&
            currentSurfaceHeight <= nextGround + 0.18
          ) {
            groundHeight = nextGround;
            targetGroundHeight = nextGround;
            jumpHeight = 0;
            verticalVelocity = 0;
            jumpPhase = "grounded";
          }
        } else {
          velocity.multiplyScalar(-0.08);
        }
        groundHeight = THREE.MathUtils.lerp(
          groundHeight,
          targetGroundHeight,
          Math.min(1, delta * 12),
        );

        const horizontalSpeed = velocity.length();
        if (horizontalSpeed > 0.08) {
          const targetHeading = Math.atan2(velocity.x, velocity.z);
          const headingDifference = Math.atan2(
            Math.sin(targetHeading - heading),
            Math.cos(targetHeading - heading),
          );
          heading += headingDifference * Math.min(1, delta * 11);
        }
        const airborne = jumpPhase !== "grounded";
        const faceExpression = isBoosting ? "happy" : "neutral";
        faceControllers.forEach((controller) => {
          controller.setExpression(faceExpression, isBoosting ? 0.58 : 1);
          controller.update(delta);
        });
        const speedRatio = Math.min(1, horizontalSpeed / Math.max(1, maxSpeed));
        if (!airborne) {
          const nextAction =
            speedRatio > 0.08
              ? isBoosting
                ? boostRunAction ?? runAction
                : runAction
              : idleAction;
          setLocomotion(nextAction, wasAirborne);
          runAction?.setEffectiveTimeScale(0.78 + speedRatio * 1.2);
          boostRunAction?.setEffectiveTimeScale(0.9 + speedRatio * 1.4);
          if (wasAirborne) jumpAction?.fadeOut(0.1);
        }
        if (isBoosting && !wasBoosting && !airborne) {
          boostAction?.reset().play();
          for (let index = 0; index < (lowPowerMode ? 5 : 9); index += 1) spawnBoostStar(true);
        }
        wasAirborne = airborne;
        wasBoosting = isBoosting;
        const hover = reduceMotion || airborne ? 0 : Math.sin(now * 0.0045) * 0.035;
        player.position.y = groundHeight + PLAYER_HOVER + jumpHeight + hover;
        player.rotation.y = heading;
        playerVisual.rotation.z = THREE.MathUtils.lerp(
          playerVisual.rotation.z,
          reduceMotion || airborne ? 0 : -lateralInput * speedRatio * 0.14,
          Math.min(1, delta * 8),
        );
        const groundedBoost = isBoosting && !airborne;
        visualScaleTarget.set(
          1 - (groundedBoost ? 0.018 : 0),
          airborne ? 1 : 1 + speedRatio * 0.014 + (groundedBoost ? 0.025 : 0),
          1 - (groundedBoost ? 0.014 : 0),
        );
        playerVisual.scale.lerp(
          visualScaleTarget,
          Math.min(1, delta * (airborne ? 11 : 7)),
        );
        playerGlow.material.opacity = 0.055 + speedRatio * 0.045 + (isBoosting ? 0.08 : 0);
        playerGlow.scale.setScalar(0.82 + speedRatio * 0.1 + (isBoosting ? 0.18 : 0));
        updateSpeedTrail(delta, speedRatio, isBoosting, airborne);
        updateBoostStars(delta, isBoosting);

        if (portalGroup) {
          const portalDistance = Math.hypot(
            player.position.x - stagePortalPosition.x,
            player.position.z - stagePortalPosition.z,
          );
          const nextNearPortal = portalDistance < 3.25;
          if (nextNearPortal !== nearPortalValue) {
            nearPortalValue = nextNearPortal;
            setNearPortal(nextNearPortal);
          }
        }
        if (elfCharacter) {
          const treeDistance = Math.hypot(
            player.position.x - stageElfPosition.x,
            player.position.z - stageElfPosition.z,
          );
          const treeHeightDifference = Math.abs(
            player.position.y - (stageElfPosition.y + PLAYER_HOVER),
          );
          const nextNearElf = treeDistance < 1.9 && treeHeightDifference < 1;
          if (nextNearElf !== nearElfValue) {
            nearElfValue = nextNearElf;
            setNearElf(nextNearElf);
          }
        }

        cameraPitch = THREE.MathUtils.lerp(cameraPitch, 0, Math.min(1, delta * 0.12));
        cameraDistanceOffset = THREE.MathUtils.lerp(
          cameraDistanceOffset,
          0,
          Math.min(1, delta * 0.14),
        );
        const viewPitch = THREE.MathUtils.clamp(
          cameraPitch + mouseLookPitch,
          -0.34,
          0.42,
        );
        const cameraDistance = 6.4 + cameraDistanceOffset + (isBoosting ? 0.95 : 0);
        lookTarget
          .copy(player.position)
          .addScaledVector(cameraForward, initialStage === "alien" ? 2.4 : 3.1);
        lookTarget.y += 0.58;
        idealCameraPosition.set(
          player.position.x - cameraForward.x * cameraDistance,
          player.position.y + 3.15 + viewPitch * 3,
          player.position.z - cameraForward.z * cameraDistance,
        );
        if (cameraCollisionMeshes.length > 0) {
          cameraRayDirection.subVectors(idealCameraPosition, lookTarget);
          const desiredCameraDistance = cameraRayDirection.length();
          if (desiredCameraDistance > 0.001) {
            cameraRayDirection.multiplyScalar(1 / desiredCameraDistance);
            cameraRaycaster.set(lookTarget, cameraRayDirection);
            cameraRaycaster.near = 0.24;
            cameraRaycaster.far = desiredCameraDistance;
            const obstruction = cameraRaycaster.intersectObjects(
              cameraCollisionMeshes,
              false,
            )[0];
            if (obstruction) {
              idealCameraPosition
                .copy(lookTarget)
                .addScaledVector(
                  cameraRayDirection,
                  Math.max(0.82, obstruction.distance - 0.38),
                );
            }
          }
        }
        camera.position.lerp(idealCameraPosition, Math.min(1, delta * 5.2));
        camera.lookAt(lookTarget);
        const targetFov = isBoosting ? 58 : 52 + speedRatio;
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, Math.min(1, delta * 5));
        camera.updateProjectionMatrix();
        if (bloomPass) {
          bloomPass.strength = THREE.MathUtils.lerp(
            bloomPass.strength,
            isBoosting
              ? initialStage === "alien"
                ? 0.24
                : 0.25
              : initialStage === "alien"
                ? 0.14
                : 0.16,
            Math.min(1, delta * 4),
          );
        }

        if (now - lastUiUpdate > 120) {
          lastUiUpdate = now;
          setSpeed(Math.round(horizontalSpeed * 10));
          setBoosting(isBoosting);
        }
      }

      renderScene();
      if (!disposed) animationFrame = window.requestAnimationFrame(update);
    };

    const beginLoop = () => {
      if (animationFrame !== null) return;
      lastFrame = performance.now();
      animationFrame = window.requestAnimationFrame(update);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) {
        return;
      }
      if (!event.repeat && key === "r") {
        event.preventDefault();
        resetRef.current?.();
        return;
      }
      if (!event.repeat && (key === "e" || key === "enter") && (nearPortalValue || nearElfValue)) {
        event.preventDefault();
        interactRef.current?.();
        return;
      }
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift", "control", "b", " "].includes(key)) {
        event.preventDefault();
        keys.add(key);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());

    const handlePointerDown = (event: PointerEvent) => {
      renderer.domElement.focus({ preventScroll: true });
      if (event.pointerType === "touch") {
        cameraDragPointer = event.pointerId;
        cameraDragX = event.clientX;
        cameraDragY = event.clientY;
        renderer.domElement.setPointerCapture(event.pointerId);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId === cameraDragPointer) {
        const deltaX = event.clientX - cameraDragX;
        const deltaY = event.clientY - cameraDragY;
        cameraDragX = event.clientX;
        cameraDragY = event.clientY;
        mouseTurnTarget = 0;
        mouseLookPitchTarget = 0;
        cameraYaw -= deltaX * 0.0042;
        cameraPitch = THREE.MathUtils.clamp(cameraPitch + deltaY * 0.0028, -0.34, 0.42);
        return;
      }
      if (event.pointerType !== "mouse" || phaseValue !== "playing") return;
      const bounds = renderer.domElement.getBoundingClientRect();
      const x = THREE.MathUtils.clamp(
        ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1,
        -1,
        1,
      );
      const y = THREE.MathUtils.clamp(
        ((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2 - 1,
        -1,
        1,
      );
      const turnDeadzone = 0.18;
      mouseTurnTarget =
        Math.abs(x) <= turnDeadzone
          ? 0
          : Math.sign(x) * ((Math.abs(x) - turnDeadzone) / (1 - turnDeadzone));
      mouseLookPitchTarget = -y * 0.26;
    };

    const endPointer = (event: PointerEvent) => {
      if (event.pointerId === cameraDragPointer) cameraDragPointer = null;
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.relatedTarget !== null) return;
      mouseTurnTarget = 0;
      mouseLookPitchTarget = 0;
    };

    const handleWheel = (event: WheelEvent) => {
      if (phaseValue !== "playing") return;
      event.preventDefault();
      cameraDistanceOffset = THREE.MathUtils.clamp(
        cameraDistanceOffset + Math.sign(event.deltaY) * 0.8,
        -2.4,
        5,
      );
    };

    const handleVisibility = () => {
      releaseInputs();
      if (document.hidden && animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      } else if (!document.hidden) {
        beginLoop();
      }
    };

    window.addEventListener("resize", resize);
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", releaseInputs);
    document.addEventListener("visibilitychange", handleVisibility);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    renderer.domElement.addEventListener("pointerup", endPointer);
    renderer.domElement.addEventListener("pointercancel", endPointer);
    window.addEventListener("pointerout", handlePointerOut);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: false });

    resize();
    void Promise.all([
      loadPlayer(),
      initialStage === "alien"
        ? loadAlienStage().then(async () => {
            await loadFantasyElfScene();
            await loadCoralPlatform();
            await loadCrystalPlanet();
          })
        : loadRainbowStage(),
    ])
      .then(async () => {
        if (disposed) return;
        await createPortal();
        if (disposed) return;
        collisionWorld.clear();
        collisionWorld.fromGraphNode(stageRoot);
        collisionReady = true;
        stageReady = true;
        resetPlayer();
        setReady(true);
        setLoadingDetail("World ready");
        const arrivedFromPortal = new URLSearchParams(window.location.search).has("from");
        if (arrivedFromPortal) {
          phaseValue = "playing";
          setPhase("playing");
          setArrivalActive(true);
          arrivalTimer = window.setTimeout(() => setArrivalActive(false), reduceMotion ? 260 : 900);
        }
        beginLoop();
      })
      .catch((loadError) => {
        console.error(loadError);
        if (!disposed) {
          setError("The new 3D environment could not be loaded. Reload the page and try again.");
        }
      });

    return () => {
      disposed = true;
      releaseInputs();
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      if (transitionTimer !== null) window.clearTimeout(transitionTimer);
      if (arrivalTimer !== null) window.clearTimeout(arrivalTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", releaseInputs);
      document.removeEventListener("visibilitychange", handleVisibility);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", endPointer);
      renderer.domElement.removeEventListener("pointercancel", endPointer);
      window.removeEventListener("pointerout", handlePointerOut);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      startRef.current = null;
      interactRef.current = null;
      resetRef.current = null;
      playerMixer?.stopAllAction();
      if (playerModel) playerMixer?.uncacheRoot(playerModel);
      disposeObject(scene);
      ownedTextures.forEach((texture) => texture.dispose());
      environmentTarget?.dispose();
      bloomPass?.dispose();
      composer?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [configuration, initialStage, mobileDisabled, router]);

  const updateJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const radius = Math.min(bounds.width, bounds.height) * 0.34;
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    const length = Math.hypot(x, y) || 1;
    const multiplier = Math.min(1, radius / length);
    const clampedX = x * multiplier;
    const clampedY = y * multiplier;
    touchRef.current.x = THREE.MathUtils.clamp(clampedX / radius, -1, 1);
    touchRef.current.y = THREE.MathUtils.clamp(clampedY / radius, -1, 1);
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
    }
  };

  const beginJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    joystickPointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateJoystick(event);
  };

  const moveJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointerRef.current === event.pointerId) updateJoystick(event);
  };

  const endJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointerRef.current !== event.pointerId) return;
    joystickPointerRef.current = null;
    touchRef.current.x = 0;
    touchRef.current.y = 0;
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = "translate3d(0, 0, 0)";
    }
  };

  const accentStyle = { "--explorer-accent": configuration.accentCss } as CSSProperties;

  return (
    <main className={styles.world} style={accentStyle} data-stage={initialStage}>
      <div ref={mountRef} className={styles.viewport} />
      <div className={styles.vignette} aria-hidden="true" />

      <header className={styles.topbar}>
        <Link href="/" className={styles.brand} aria-label="Back to Press Q home">
          <span className={styles.brandMark}>Q</span>
          <span>
            <strong>QUIU EXPLORER</strong>
            <small>{configuration.eyebrow}</small>
          </span>
        </Link>
        <div className={styles.topActions}>
          {phase === "playing" && (
            <button type="button" onClick={() => resetRef.current?.()} className={styles.resetButton}>
              Reset Quiu
            </button>
          )}
          <Link href="/" className={styles.exitLink}>
            Exit
          </Link>
        </div>
      </header>

      {mobileDisabled && (
        <section className={styles.mobileDisabledPanel} aria-labelledby="mobile-disabled-title">
          <span className={styles.mobileDisabledIcon} aria-hidden="true">Q</span>
          <p>Desktop experience</p>
          <h1 id="mobile-disabled-title">Quiu World rests on mobile</h1>
          <div>
            Open this page on a computer to explore the 3D worlds with a keyboard and 360° mouse camera.
          </div>
          <Link href="/">Return to Press Q</Link>
        </section>
      )}

      {!mobileDisabled && !ready && !error && (
        <section className={styles.loadingPanel} aria-live="polite">
          <span className={styles.loader} aria-hidden="true" />
          <p>{loadingDetail}</p>
          <small>Optimized textures are selected automatically for this device.</small>
        </section>
      )}

      {error && (
        <section className={styles.errorPanel} role="alert">
          <p>{error}</p>
          <Link href="/">Return home</Link>
        </section>
      )}

      {ready && phase === "intro" && (
        <section className={styles.intro}>
          <p>{configuration.eyebrow}</p>
          <h1>{configuration.title}</h1>
          <div className={styles.introCopy}>{configuration.subtitle}</div>
          <div className={styles.featureLine}>
            <span>360° movement</span>
            <span>360° cursor camera</span>
            <span>Run · jump · boost</span>
            {initialStage === "alien" && <span>Magical discoveries</span>}
          </div>
          <button type="button" className={styles.startButton} onClick={() => startRef.current?.()}>
            Start exploring <span aria-hidden="true">→</span>
          </button>
          {initialStage === "alien" && (
            <a
              className={styles.assetCredit}
              href="https://sketchfab.com/3d-models/fantasy-elf-scene-329c4b91a8e4413e8896dbb1118fadc7"
              target="_blank"
              rel="noreferrer"
            >
              “Fantasy Elf Scene” by Sharon Kunne · CC Attribution
            </a>
          )}
        </section>
      )}

      {phase === "playing" && (
        <>
          <aside className={styles.statusPanel} aria-label="Explorer status">
            <span>{configuration.eyebrow}</span>
            <strong>{speed.toString().padStart(2, "0")}</strong>
            <small>{boosting ? "Boost movement" : "Movement speed"}</small>
          </aside>

          <div className={styles.desktopControls}>
            <span><kbd>WASD</kbd> move</span>
            <span><kbd>Shift</kbd> boost</span>
            <span><kbd>Space</kbd> jump</span>
            <span><kbd>Mouse edges</kbd> rotate 360°</span>
            <span><kbd>E</kbd> interact</span>
            <span><kbd>R</kbd> reset</span>
          </div>

          {nearElf ? (
            <button
              type="button"
              className={`${styles.portalPrompt} ${styles.magicPrompt}`}
              onClick={() => interactRef.current?.()}
            >
              <span>The elf&apos;s magic is ready</span>
              <strong>Reveal the character gallery</strong>
              <small>Press E / Enter or tap here</small>
            </button>
          ) : nearPortal ? (
            <button type="button" className={styles.portalPrompt} onClick={() => interactRef.current?.()}>
              <span>Portal ready</span>
              <strong>{configuration.destinationLabel}</strong>
              <small>Press E / Enter or tap here</small>
            </button>
          ) : null}

          <div className={styles.mobileControls} aria-label="Mobile movement controls">
            <div
              className={styles.joystick}
              onPointerDown={beginJoystick}
              onPointerMove={moveJoystick}
              onPointerUp={endJoystick}
              onPointerCancel={endJoystick}
            >
              <span ref={joystickKnobRef} />
            </div>
            <div className={styles.mobileActions}>
              <button
                type="button"
                onPointerDown={() => {
                  touchRef.current.boost = true;
                }}
                onPointerUp={() => {
                  touchRef.current.boost = false;
                }}
                onPointerCancel={() => {
                  touchRef.current.boost = false;
                }}
              >
                Boost
              </button>
              <button type="button" onPointerDown={() => { jumpQueuedRef.current = true; }}>
                Jump
              </button>
              <button
                type="button"
                onPointerDown={() => {
                  touchRef.current.brake = true;
                }}
                onPointerUp={() => {
                  touchRef.current.brake = false;
                }}
                onPointerCancel={() => {
                  touchRef.current.brake = false;
                }}
              >
                Brake
              </button>
            </div>
          </div>
        </>
      )}

      <div
        className={`${styles.portalTransition} ${phase === "transitioning" ? styles.portalTransitionActive : ""} ${transitionKind === "magic" ? styles.magicTransition : ""} ${arrivalActive ? styles.portalArrival : ""}`}
        aria-hidden="true"
      >
        <span />
      </div>

      <p className={styles.liveStatus} aria-live="polite">
        {phase === "transitioning"
          ? transitionKind === "magic"
            ? "The elf is opening the character gallery"
            : `Warping to ${initialStage === "alien" ? "Rainbow Road Wii" : "Alien World"}`
          : nearElf
            ? "Open the character gallery"
            : nearPortal
            ? configuration.destinationLabel
            : ""}
      </p>
    </main>
  );
}
