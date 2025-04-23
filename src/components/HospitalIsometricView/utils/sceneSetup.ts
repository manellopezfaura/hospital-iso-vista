
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
}

export const setupScene = (
  container: HTMLDivElement,
  isDarkMode: boolean,
  selectedFloor: string | null,
  floorLevel: number | null
): SceneSetup => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(isDarkMode ? 0x1A1F2C : 0xF6F6F7);
  scene.fog = new THREE.FogExp2(isDarkMode ? 0x1A1F2C : 0xF6F6F7, 0.015);
  
  const aspect = container.clientWidth / container.clientHeight;
  const camera = new THREE.OrthographicCamera(
    -10 * aspect, 10 * aspect, 10, -10, 0.1, 1000
  );
  
  if (selectedFloor && floorLevel !== null) {
    camera.position.set(15, floorLevel * 4 + 10, 15);
    camera.lookAt(0, floorLevel * 4, 0);
  } else {
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
  }
  
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true,
    alpha: true
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 10;
  controls.maxDistance = 60;
  controls.maxPolarAngle = Math.PI / 2.2;
  controls.enableRotate = true;
  controls.rotateSpeed = 0.7;
  controls.enableZoom = true;
  controls.zoomSpeed = 1.0;
  controls.enablePan = true;
  controls.panSpeed = 0.8;
  
  return { scene, camera, renderer, controls };
};

export const setupLights = (scene: THREE.Scene, isDarkMode: boolean): void => {
  const ambientLight = new THREE.AmbientLight(
    isDarkMode ? 0x6E59A5 : 0xF0EAD6, 
    isDarkMode ? 0.3 : 0.5
  );
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(
    isDarkMode ? 0xffffff : 0xF5F5F5, 
    isDarkMode ? 0.8 : 0.9
  );
  directionalLight.position.set(15, 25, 15);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.bias = -0.001;
  scene.add(directionalLight);
  
  const fillLight = new THREE.DirectionalLight(
    isDarkMode ? 0x8B5CF6 : 0x90CDF4, 
    isDarkMode ? 0.3 : 0.4
  );
  fillLight.position.set(-15, 10, 15);
  scene.add(fillLight);
  
  const pointLight = new THREE.PointLight(
    isDarkMode ? 0x0EA5E9 : 0x3182CE, 
    isDarkMode ? 1.0 : 0.8, 
    50
  );
  pointLight.position.set(0, 15, 0);
  pointLight.castShadow = true;
  pointLight.shadow.bias = -0.001;
  scene.add(pointLight);
};
