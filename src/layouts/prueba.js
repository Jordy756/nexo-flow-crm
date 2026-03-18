import * as THREE from "three/webgpu";
import {
  luminance,
  cos,
  min,
  time,
  atan,
  uniform,
  pass,
  PI,
  TWO_PI,
  color,
  positionLocal,
  sin,
  texture,
  Fn,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Inspector } from "three/addons/inspector/Inspector.js";
import Lenis from "lenis";

let camera, scene, renderer, renderPipeline, controls;

let scrollProgress = 0;

// Posiciones de cámara por sección — ajusta estos valores a tu gusto
const cameraKeyframes = [
  { position: new THREE.Vector3(1, 1, 3), target: new THREE.Vector3(0, 0.4, 0) }, // sección 1
  { position: new THREE.Vector3(3, 0.5, 1), target: new THREE.Vector3(0, 0.4, 0) }, // sección 2
  { position: new THREE.Vector3(-2, 2, 2), target: new THREE.Vector3(0, 0.6, 0) }, // sección 3
  { position: new THREE.Vector3(0, 3, 0.5), target: new THREE.Vector3(0, 0.4, 0) }, // sección 4
];

// Posición actual interpolada (lerp suavizado)
const currentCamPos = new THREE.Vector3(1, 1, 3);
const currentCamTarget = new THREE.Vector3(0, 0.4, 0);

const lenis = new Lenis({ autoRaf: true });

lenis.on("scroll", ({ progress }) => {
  scrollProgress = progress;
});

init();

function init() {
  camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(1, 1, 3);

  scene = new THREE.Scene();

  const textureLoader = new THREE.TextureLoader();
  const perlinTexture = textureLoader.load("./textures/noises/perlin/rgb-256x256.png");
  perlinTexture.wrapS = THREE.RepeatWrapping;
  perlinTexture.wrapT = THREE.RepeatWrapping;

  const toRadialUv = Fn(([uv, multiplier, rotation, offset]) => {
    const centeredUv = uv.sub(0.5).toVar();
    const distanceToCenter = centeredUv.length();
    const angle = atan(centeredUv.y, centeredUv.x);
    const radialUv = vec2(angle.add(PI).div(TWO_PI), distanceToCenter).toVar();
    radialUv.mulAssign(multiplier);
    radialUv.x.addAssign(rotation);
    radialUv.y.addAssign(offset);
    return radialUv;
  });

  const toSkewedUv = Fn(([uv, skew]) => {
    return vec2(uv.x.add(uv.y.mul(skew.x)), uv.y.add(uv.x.mul(skew.y)));
  });

  const twistedCylinder = Fn(([position, parabolStrength, parabolOffset, parabolAmplitude, time]) => {
    const angle = atan(position.z, position.x).toVar();
    const elevation = position.y;
    const radius = parabolStrength.mul(position.y.sub(parabolOffset)).pow(2).add(parabolAmplitude).toVar();
    radius.addAssign(sin(elevation.sub(time).mul(20).add(angle.mul(2))).mul(0.05));
    const twistedPosition = vec3(cos(angle).mul(radius), elevation, sin(angle).mul(radius));
    return twistedPosition;
  });

  // Uniforms — color fijo, velocidad fija
  const emissiveColor = uniform(color("#8A63FF"));
  const timeScale = uniform(0.1);
  const parabolStrength = uniform(1);
  const parabolOffset = uniform(0.3);
  const parabolAmplitude = uniform(0.2);

  // tornado floor
  const floorMaterial = new THREE.MeshBasicNodeMaterial({ transparent: true, wireframe: false });

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
  scene.add(floor);

  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 20, 20, true);
  cylinderGeometry.translate(0, 0.5, 0);

  // emissive cylinder
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
  scene.add(emissive);

  // dark cylinder
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
  scene.add(dark);

  // renderer
  const canvas = document.getElementById("canvas");

  renderer = new THREE.WebGPURenderer({ antialias: true, canvas });
  renderer.setClearColor(0x201919);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.inspector = new Inspector();

  // post processing
  renderPipeline = new THREE.RenderPipeline(renderer);

  const scenePass = pass(scene, camera);
  const scenePassColor = scenePass.getTextureNode("output");
  const bloomPass = bloom(scenePassColor, 1, 0.1, 1);
  renderPipeline.outputNode = scenePassColor.add(bloomPass);

  // controls — siguen funcionando con mouse normalmente
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.4, 0);
  controls.enableDamping = true;
  controls.minDistance = 0.1;
  controls.maxDistance = 50;

  window.addEventListener("resize", onWindowResize);

  renderer.setAnimationLoop(animate);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function getLerpedKeyframe(progress) {
  const count = cameraKeyframes.length - 1;
  const scaled = progress * count; // ej: progress 0.5 con 4 keyframes → 1.5
  const index = Math.floor(scaled); // keyframe base → 1
  const t = scaled - index; // fracción entre keyframes → 0.5

  const from = cameraKeyframes[Math.min(index, count)];
  const to = cameraKeyframes[Math.min(index + 1, count)];

  return {
    position: new THREE.Vector3().lerpVectors(from.position, to.position, t),
    target: new THREE.Vector3().lerpVectors(from.target, to.target, t),
  };
}

function animate() {
  const keyframe = getLerpedKeyframe(scrollProgress);

  // Lerp suavizado hacia la posición objetivo del keyframe
  currentCamPos.lerp(keyframe.position, 0.05);
  currentCamTarget.lerp(keyframe.target, 0.05);

  // Aplicar a la cámara y a OrbitControls
  camera.position.copy(currentCamPos);
  controls.target.copy(currentCamTarget);

  controls.update();
  renderPipeline.render();
}
