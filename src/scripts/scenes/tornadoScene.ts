import * as THREE from "three/webgpu";
import {
  Fn,
  PI,
  TWO_PI,
  atan,
  color,
  cos,
  luminance,
  min,
  pass,
  positionLocal,
  sin,
  texture,
  time,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Inspector } from "three/addons/inspector/Inspector.js";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import Lenis from "lenis";

type CameraKeyframe = {
  position: any;
  target: any;
};

type SceneRuntime = {
  camera: any;
  renderer: any;
  renderPipeline: any;
  controls: any;
  currentCameraPosition: any;
  currentCameraTarget: any;
  getScrollProgress: () => number;
};

const CAMERA_KEYFRAMES: CameraKeyframe[] = [
  { position: new THREE.Vector3(1, 1, 3), target: new THREE.Vector3(0, 0.4, 0) },
  { position: new THREE.Vector3(3, 0.5, 1), target: new THREE.Vector3(0, 0.4, 0) },
  { position: new THREE.Vector3(-2, 2, 2), target: new THREE.Vector3(0, 0.6, 0) },
  { position: new THREE.Vector3(0, 3, 0.5), target: new THREE.Vector3(0, 0.4, 0) },
];

const CAMERA_SMOOTHING = 0.05;

const createNoiseTexture = (textureLoader: any): any => {
  // This texture drives the procedural-looking shader noise; removing it breaks the effect.
  const perlinTexture = textureLoader.load("/textures/noises/perlin/rgb-256x256.png");
  perlinTexture.wrapS = THREE.RepeatWrapping;
  perlinTexture.wrapT = THREE.RepeatWrapping;
  return perlinTexture;
};

const createShaderFunctions = () => {
  const toRadialUv = Fn((inputs: [any, any, any, any]) => {
    const [inputUv, multiplier, rotation, offset] = inputs;
    const centeredUv = inputUv.sub(0.5).toVar();
    const distanceToCenter = centeredUv.length();
    const angle = atan(centeredUv.y, centeredUv.x);
    const radialUv = vec2(angle.add(PI).div(TWO_PI), distanceToCenter).toVar();

    radialUv.mulAssign(multiplier);
    radialUv.x.addAssign(rotation);
    radialUv.y.addAssign(offset);

    return radialUv;
  });

  const toSkewedUv = Fn((inputs: [any, any]) => {
    const [inputUv, skew] = inputs;
    return vec2(inputUv.x.add(inputUv.y.mul(skew.x)), inputUv.y.add(inputUv.x.mul(skew.y)));
  });

  const twistedCylinder = Fn((inputs: [any, any, any, any, any]) => {
    const [position, parabolStrength, parabolOffset, parabolAmplitude, elapsedTime] = inputs;
    const angle = atan(position.z, position.x).toVar();
    const elevation = position.y;
    const radius = parabolStrength.mul(position.y.sub(parabolOffset)).pow(2).add(parabolAmplitude).toVar();

    radius.addAssign(sin(elevation.sub(elapsedTime).mul(20).add(angle.mul(2))).mul(0.05));

    return vec3(cos(angle).mul(radius), elevation, sin(angle).mul(radius));
  });

  return { toRadialUv, toSkewedUv, twistedCylinder };
};

const createTornadoMeshes = (perlinTexture: any, shaderFns: ReturnType<typeof createShaderFunctions>): any[] => {
  // 2CADE0 - 8A63FF - E51A56
  const emissiveColor = uniform(color("#2CADE0"));
  const timeScale = uniform(0.1);
  const parabolStrength = uniform(1);
  const parabolOffset = uniform(0.3);
  const parabolAmplitude = uniform(0.2);

  const { toRadialUv, toSkewedUv, twistedCylinder } = shaderFns;

  const floorMaterial = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    wireframe: false,
  });

  floorMaterial.outputNode = Fn(() => {
    const scaledTime = time.mul(timeScale);

    const noise1Uv = toRadialUv(uv(), vec2(0.5, 0.5), scaledTime, scaledTime);
    noise1Uv.assign(toSkewedUv(noise1Uv, vec2(-1, 0)));
    noise1Uv.mulAssign(vec2(4, 1));
    const noise1 = texture(perlinTexture, noise1Uv, 1).r.remap(0.45, 0.7);

    const noise2Uv = toRadialUv(uv(), vec2(2, 8), scaledTime.mul(2), scaledTime.mul(8));
    noise2Uv.assign(toSkewedUv(noise2Uv, vec2(-0.25, 0)));
    noise2Uv.mulAssign(vec2(2, 0.25));
    const noise2 = texture(perlinTexture, noise2Uv, 1).b.remap(0.45, 0.7);

    const distanceToCenter = uv().sub(0.5).toVar();
    const outerFade = min(
      distanceToCenter.length().oneMinus().smoothstep(0.5, 0.9),
      distanceToCenter.length().smoothstep(0, 0.2),
    );

    const effect = noise1.mul(noise2).mul(outerFade).toVar();

    return vec4(emissiveColor.mul(effect.step(0.2)).mul(3), effect.smoothstep(0, 0.01));
  })();

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), floorMaterial);
  floor.rotation.x = -Math.PI * 0.5;

  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 20, 20, true);
  cylinderGeometry.translate(0, 0.5, 0);

  const emissiveMaterial = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    wireframe: false,
  });

  emissiveMaterial.positionNode = twistedCylinder(
    positionLocal,
    parabolStrength,
    parabolOffset,
    parabolAmplitude.sub(0.05),
    time.mul(timeScale),
  );

  emissiveMaterial.outputNode = Fn(() => {
    const scaledTime = time.mul(timeScale);

    const noise1Uv = uv().add(vec2(scaledTime, scaledTime.negate())).toVar();
    noise1Uv.assign(toSkewedUv(noise1Uv, vec2(-1, 0)));
    noise1Uv.mulAssign(vec2(2, 0.25));
    const noise1 = texture(perlinTexture, noise1Uv, 1).r.remap(0.45, 0.7);

    const noise2Uv = uv()
      .add(vec2(scaledTime.mul(0.5), scaledTime.negate()))
      .toVar();
    noise2Uv.assign(toSkewedUv(noise2Uv, vec2(-1, 0)));
    noise2Uv.mulAssign(vec2(5, 1));
    const noise2 = texture(perlinTexture, noise2Uv, 1).g.remap(0.45, 0.7);

    const outerFade = min(uv().y.smoothstep(0, 0.1), uv().y.oneMinus().smoothstep(0, 0.4));
    const effect = noise1.mul(noise2).mul(outerFade);
    const emissiveColorLuminance = luminance(emissiveColor);

    return vec4(emissiveColor.mul(1.2).div(emissiveColorLuminance), effect.smoothstep(0, 0.1));
  })();

  const emissive = new THREE.Mesh(cylinderGeometry, emissiveMaterial);

  const darkMaterial = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    wireframe: false,
  });

  darkMaterial.positionNode = twistedCylinder(
    positionLocal,
    parabolStrength,
    parabolOffset,
    parabolAmplitude,
    time.mul(timeScale),
  );

  darkMaterial.outputNode = Fn(() => {
    const scaledTime = time.mul(timeScale).add(123.4);

    const noise1Uv = uv().add(vec2(scaledTime, scaledTime.negate())).toVar();
    noise1Uv.assign(toSkewedUv(noise1Uv, vec2(-1, 0)));
    noise1Uv.mulAssign(vec2(2, 0.25));
    const noise1 = texture(perlinTexture, noise1Uv, 1).g.remap(0.45, 0.7);

    const noise2Uv = uv()
      .add(vec2(scaledTime.mul(0.5), scaledTime.negate()))
      .toVar();
    noise2Uv.assign(toSkewedUv(noise2Uv, vec2(-1, 0)));
    noise2Uv.mulAssign(vec2(5, 1));
    const noise2 = texture(perlinTexture, noise2Uv, 1).b.remap(0.45, 0.7);

    const outerFade = min(uv().y.smoothstep(0, 0.2), uv().y.oneMinus().smoothstep(0, 0.4));
    const effect = noise1.mul(noise2).mul(outerFade);

    return vec4(vec3(0), effect.smoothstep(0, 0.01));
  })();

  const dark = new THREE.Mesh(cylinderGeometry, darkMaterial);

  return [floor, emissive, dark];
};

const createScrollProgressReader = (): (() => number) => {
  let scrollProgress = 0;

  const lenis = new Lenis({ autoRaf: true });
  lenis.on("scroll", ({ progress }) => {
    scrollProgress = progress;
  });

  return () => scrollProgress;
};

const createRuntime = (canvas: HTMLCanvasElement): SceneRuntime => {
  const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(1, 1, 3);

  const scene = new THREE.Scene();

  const textureLoader = new THREE.TextureLoader();
  const perlinTexture = createNoiseTexture(textureLoader);

  const shaderFns = createShaderFunctions();
  const tornadoMeshes = createTornadoMeshes(perlinTexture, shaderFns);
  tornadoMeshes.forEach((mesh) => scene.add(mesh));

  const renderer = new THREE.WebGPURenderer({ antialias: true, canvas });
  renderer.setClearColor(0x201919);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.inspector = new Inspector();

  const renderPipeline = new THREE.RenderPipeline(renderer);
  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode("output");
  const bloomPass = bloom(scenePassColor, 1, 0.1, 1);
  renderPipeline.outputNode = scenePassColor.add(bloomPass);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.4, 0);
  controls.enableDamping = true;
  controls.minDistance = 0.1;
  controls.maxDistance = 50;

  return {
    camera,
    renderer,
    renderPipeline,
    controls,
    currentCameraPosition: new THREE.Vector3(1, 1, 3),
    currentCameraTarget: new THREE.Vector3(0, 0.4, 0),
    getScrollProgress: createScrollProgressReader(),
  };
};

const resizeRenderer = (runtime: SceneRuntime): void => {
  runtime.camera.aspect = window.innerWidth / window.innerHeight;
  runtime.camera.updateProjectionMatrix();
  runtime.renderer.setSize(window.innerWidth, window.innerHeight);
};

const getInterpolatedCameraKeyframe = (progress: number): CameraKeyframe => {
  const segmentCount = CAMERA_KEYFRAMES.length - 1;
  const scaledProgress = progress * segmentCount;
  const baseIndex = Math.floor(scaledProgress);
  const interpolationFactor = scaledProgress - baseIndex;

  const from = CAMERA_KEYFRAMES[Math.min(baseIndex, segmentCount)];
  const to = CAMERA_KEYFRAMES[Math.min(baseIndex + 1, segmentCount)];

  return {
    position: new THREE.Vector3().lerpVectors(from.position, to.position, interpolationFactor),
    target: new THREE.Vector3().lerpVectors(from.target, to.target, interpolationFactor),
  };
};

const startAnimationLoop = (runtime: SceneRuntime): void => {
  runtime.renderer.setAnimationLoop(() => {
    const keyframe = getInterpolatedCameraKeyframe(runtime.getScrollProgress());

    runtime.currentCameraPosition.lerp(keyframe.position, CAMERA_SMOOTHING);
    runtime.currentCameraTarget.lerp(keyframe.target, CAMERA_SMOOTHING);

    runtime.camera.position.copy(runtime.currentCameraPosition);
    runtime.controls.target.copy(runtime.currentCameraTarget);

    runtime.controls.update();
    runtime.renderPipeline.render();
  });
};

const initTornadoScene = (): void => {
  const canvasElement = document.getElementById("canvas");

  if (!(canvasElement instanceof HTMLCanvasElement)) {
    return;
  }

  const runtime = createRuntime(canvasElement);

  window.addEventListener("resize", () => {
    resizeRenderer(runtime);
  });

  startAnimationLoop(runtime);
};

initTornadoScene();
