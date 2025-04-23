
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
    
    console.log("Setting up scene");
    
    // Create the scene, camera, renderer, and controls
    const { scene, camera, renderer, controls } = setupScene(
      containerRef.current,
      isDarkMode,
      selectedFloor,
      floorLevel
    );

    // Set up lighting for the scene
    setupLights(scene, isDarkMode);

    // Store references to scene elements
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
      
      // For OrthographicCamera, we need to update the projection parameters
      // instead of using the aspect property
      const aspectRatio = width / height;
      const frustumSize = 10; // Same value as in setupScene
      
      camera.left = -frustumSize * aspectRatio;
      camera.right = frustumSize * aspectRatio;
      camera.top = frustumSize;
      camera.bottom = -frustumSize;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
      
      // Force a render after resize
      renderer.render(scene, camera);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Force an initial size calculation and render
    handleResize();

    // Force an initial render to make sure content is visible
    renderer.render(scene, camera);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.dispose();
      }
    };
  }, [containerRef, isDarkMode, selectedFloor, floorLevel]);

  return sceneRef.current;
};
