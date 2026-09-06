"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import styles from "./Quiu3DMascot.module.css";

const MODEL_URL = "/models/quiu/quiu-rigged.glb";
const MODEL_SPAN = 3.15;

function disposeObjectResources(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const imageBitmaps = new Set<ImageBitmap>();
  const skeletons = new Set<THREE.Skeleton>();

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
    objectMaterials.forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) textures.add(value);
      });
    });

    if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton);
  });

  textures.forEach((texture) => {
    const image = texture.source.data;
    if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) {
      imageBitmaps.add(image);
    }
    texture.dispose();
  });
  imageBitmaps.forEach((image) => image.close());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  skeletons.forEach((skeleton) => skeleton.dispose());
}

export default function Quiu3DMascot() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.dataset.loading = "true";
    delete host.dataset.fallback;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower = (navigator.hardwareConcurrency || 8) <= 4;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
    camera.position.set(0, 0.08, 6.2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !lowPower,
        powerPreference: lowPower ? "low-power" : "high-performance",
      });
    } catch {
      delete host.dataset.loading;
      host.dataset.fallback = "true";
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.15 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.prepend(renderer.domElement);

    let environmentTarget: THREE.WebGLRenderTarget | null = null;
    const buildEnvironment = () => {
      scene.environment = null;
      environmentTarget?.dispose();
      environmentTarget = null;

      const room = new RoomEnvironment();
      const generator = new THREE.PMREMGenerator(renderer);
      try {
        environmentTarget = generator.fromScene(room, 0.04);
        scene.environment = environmentTarget.texture;
      } finally {
        room.dispose();
        generator.dispose();
      }
    };
    try {
      buildEnvironment();
    } catch {
      scene.environment = null;
      environmentTarget = null;
    }

    scene.add(new THREE.HemisphereLight(0xc6f5ff, 0x130b28, 1.45));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(2.8, 4.2, 5.5);
    scene.add(keyLight);
    const cyanLight = new THREE.PointLight(0x3eeeff, 15, 11, 2);
    cyanLight.position.set(-3.2, 1.8, 3.6);
    scene.add(cyanLight);
    const pinkLight = new THREE.PointLight(0xff4dc9, 17, 11, 2);
    pinkLight.position.set(3, -0.6, 3.8);
    scene.add(pinkLight);

    const rig = new THREE.Group();
    rig.rotation.x = -0.04;
    scene.add(rig);

    const modelFrame = new THREE.Group();
    modelFrame.name = "Quiu model frame";
    rig.add(modelFrame);

    const halo = new THREE.Group();
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x50eaff,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const haloOuter = new THREE.Mesh(new THREE.TorusGeometry(2, 0.012, 5, 96), haloMaterial);
    const haloInner = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, 0.009, 5, 80),
      haloMaterial.clone(),
    );
    haloInner.rotation.x = 0.92;
    haloInner.rotation.y = 0.32;
    halo.add(haloOuter, haloInner);
    halo.position.z = -0.5;
    rig.add(halo);

    const nodes = new THREE.Group();
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      const node = new THREE.Mesh(
        new THREE.OctahedronGeometry(index % 3 === 0 ? 0.055 : 0.035, 0),
        new THREE.MeshBasicMaterial({
          color: index % 2 === 0 ? 0x61eeff : 0xff5bd4,
          transparent: true,
          opacity: 0.72,
        }),
      );
      node.position.set(Math.cos(angle) * 2, Math.sin(angle) * 2, -0.45);
      nodes.add(node);
    }
    rig.add(nodes);

    let disposed = false;
    let modelReady = false;
    let modelFailed = false;
    let contextLost = false;
    let mixer: THREE.AnimationMixer | null = null;
    let lastAnimationTime = 0;

    const showFallback = () => {
      modelFailed = true;
      delete host.dataset.loading;
      host.dataset.fallback = "true";
      if (!contextLost) renderer.render(scene, camera);
    };

    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) {
          disposeObjectResources(gltf.scene);
          return;
        }

        const model = gltf.scene;
        model.updateWorldMatrix(true, true);
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const largestDimension = Math.max(size.x, size.y, size.z);

        if (bounds.isEmpty() || !Number.isFinite(largestDimension) || largestDimension <= 0) {
          disposeObjectResources(model);
          showFallback();
          return;
        }

        const center = bounds.getCenter(new THREE.Vector3());
        const centeredModel = new THREE.Group();
        centeredModel.position.copy(center).multiplyScalar(-1);
        centeredModel.add(model);
        modelFrame.scale.setScalar(MODEL_SPAN / largestDimension);
        modelFrame.add(centeredModel);

        const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.frustumCulled = true;
          const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
          objectMaterials.forEach((material) => {
            Object.values(material).forEach((value) => {
              if (value instanceof THREE.Texture) value.anisotropy = maxAnisotropy;
            });
            if (material instanceof THREE.MeshStandardMaterial) {
              material.envMapIntensity = 1.2;
              material.needsUpdate = true;
            }
          });
        });

        if (!reduceMotion && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          const ambientClips = gltf.animations.filter((clip) => /idle|blink/i.test(clip.name));
          const clips = ambientClips.length > 0 ? ambientClips : gltf.animations.slice(0, 1);
          clips.forEach((clip) => mixer?.clipAction(clip).play());
        }

        modelReady = true;
        modelFailed = false;
        delete host.dataset.loading;
        if (!contextLost) delete host.dataset.fallback;
        if (!contextLost) renderer.render(scene, camera);
      },
      undefined,
      () => {
        if (!disposed) showFallback();
      },
    );

    const pointer = new THREE.Vector2();
    const targetPointer = new THREE.Vector2();
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      targetPointer.set(
        THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
        THREE.MathUtils.clamp(-(((event.clientY - rect.top) / rect.height) * 2 - 1), -1, 1),
      );
    };
    const onPointerLeave = () => targetPointer.set(0, 0);
    if (!reduceMotion) {
      host.addEventListener("pointermove", onPointerMove);
      host.addEventListener("pointerleave", onPointerLeave);
    }

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let frame = 0;
    let inView = true;
    let lastRender = 0;
    const frameInterval = 1000 / (lowPower ? 30 : 45);

    const animate = (time: number) => {
      frame = 0;
      if (!inView || document.hidden || reduceMotion) return;
      if (time - lastRender >= frameInterval) {
        lastRender = time;
        const seconds = time * 0.001;
        pointer.lerp(targetPointer, 0.065);
        rig.position.y = Math.sin(seconds * 1.15) * 0.07;
        rig.rotation.y = pointer.x * 0.3 + Math.sin(seconds * 0.42) * 0.08;
        rig.rotation.x = -pointer.y * 0.14 - 0.035;
        halo.rotation.z = -seconds * 0.085;
        nodes.rotation.z = seconds * 0.13;
        const animationDelta = lastAnimationTime > 0
          ? Math.min((time - lastAnimationTime) * 0.001, 0.1)
          : 0;
        lastAnimationTime = time;
        mixer?.update(animationDelta);
        renderer.render(scene, camera);
      }
      frame = window.requestAnimationFrame(animate);
    };

    const start = () => {
      if (reduceMotion || frame || !inView || document.hidden) return;
      lastAnimationTime = 0;
      frame = window.requestAnimationFrame(animate);
    };
    const stop = () => {
      if (!frame) return;
      window.cancelAnimationFrame(frame);
      frame = 0;
      lastAnimationTime = 0;
    };

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start();
      else stop();
    }, { rootMargin: "80px" });
    intersectionObserver.observe(host);

    const onVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      stop();
      host.dataset.fallback = "true";
    };
    const onContextRestored = () => {
      contextLost = false;
      try {
        buildEnvironment();
      } catch {
        scene.environment = null;
        environmentTarget = null;
      }
      if (modelFailed) {
        host.dataset.fallback = "true";
      } else if (modelReady) {
        delete host.dataset.fallback;
      } else {
        host.dataset.loading = "true";
        delete host.dataset.fallback;
      }
      resize();
      start();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);
    start();

    return () => {
      disposed = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (!reduceMotion) {
        host.removeEventListener("pointermove", onPointerMove);
        host.removeEventListener("pointerleave", onPointerLeave);
      }
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      mixer?.stopAllAction();
      scene.environment = null;
      environmentTarget?.dispose();
      disposeObjectResources(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={styles.scene}
      role="img"
      aria-label="A three-dimensional interactive model of Quiu, the Press Q guide."
    >
      <Image
        src="/press-q-icon.png"
        alt=""
        width={624}
        height={667}
        priority
        loading="eager"
        className={styles.poster}
        aria-hidden="true"
      />
      <p className={styles.label} aria-hidden="true">Model / Q-01</p>
      <p className={styles.status} aria-hidden="true">Archive guide online</p>
    </div>
  );
}
