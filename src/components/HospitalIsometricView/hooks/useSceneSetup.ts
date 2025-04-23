
import { useRef, useEffect, MutableRefObject } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { setupScene, setupLights } from '../utils/sceneSetup';

interface UseSceneSetupProps {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  isDarkMode: boolean;
  selectedFloor: string | null;
  floorLevel: number | null;
}

interface SceneSetupResult {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
}

export const useSceneSetup = ({
  containerRef,
  isDarkMode,
  selectedFloor,
  floorLevel
}: UseSceneSetupProps): SceneSetupResult | null => {
  const sceneRef = useRef<SceneSetupResult | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const { scene, camera, renderer, controls } = setupScene(
      containerRef.current,
      isDarkMode,
      selectedFloor,
      floorLevel
    );

    setupLights(scene, isDarkMode);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls
    };

    // Ensure the view is updated when the window resizes
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.dispose();
      }
    };
  }, [containerRef, isDarkMode, selectedFloor, floorLevel]);

  return sceneRef.current;
};
