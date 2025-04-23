
import { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';

interface MouseInteractionProps {
  interactiveObjects: { [key: string]: THREE.Object3D };
  onBedSelect?: (id: string) => void;
  onPatientSelect?: (id: string) => void;
  camera: THREE.Camera;
}

export const useMouseInteraction = ({ 
  interactiveObjects, 
  onBedSelect, 
  onPatientSelect,
  camera 
}: MouseInteractionProps) => {
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  
  const handleMouseMove = useCallback((event: MouseEvent, container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect();
    const raycaster = raycasterRef.current;
    const mouse = mouseRef.current;
    
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(Object.values(interactiveObjects), true);
    
    if (intersects.length > 0) {
      let object = intersects[0].object;
      
      while (object && !object.userData.id) {
        object = object.parent as THREE.Object3D;
      }
      
      if (object && object.userData.id) {
        document.body.style.cursor = 'pointer';
        
        if (hoveredObject !== object.userData.id) {
          setHoveredObject(object.userData.id);
          
          if (object.userData.type === 'bed') {
            const bed = object as THREE.Group;
            bed.scale.set(1.05, 1.05, 1.05);
          } else if (object.userData.type === 'patient') {
            const patient = object as THREE.Group;
            patient.position.y += 0.1;
          }
        }
      } else {
        document.body.style.cursor = 'auto';
        resetHighlights();
      }
    } else {
      document.body.style.cursor = 'auto';
      resetHighlights();
    }
  }, [camera, hoveredObject, interactiveObjects]);
  
  const resetHighlights = useCallback(() => {
    if (hoveredObject) {
      const object = interactiveObjects[hoveredObject];
      
      if (object) {
        if (object.userData.type === 'bed') {
          object.scale.set(1, 1, 1);
        } else if (object.userData.type === 'patient') {
          object.position.y -= 0.1;
        }
      }
      
      setHoveredObject(null);
    }
  }, [hoveredObject, interactiveObjects]);
  
  const handleClick = useCallback((event: MouseEvent, container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect();
    const raycaster = raycasterRef.current;
    const mouse = mouseRef.current;
    
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(Object.values(interactiveObjects), true);
    
    if (intersects.length > 0) {
      let object = intersects[0].object;
      
      while (object && !object.userData.id) {
        object = object.parent as THREE.Object3D;
      }
      
      if (object && object.userData.id) {
        if (object.userData.type === 'bed' && onBedSelect) {
          onBedSelect(object.userData.id);
        } else if (object.userData.type === 'patient' && onPatientSelect) {
          onPatientSelect(object.userData.id);
        }
      }
    }
  }, [camera, interactiveObjects, onBedSelect, onPatientSelect]);
  
  return {
    handleMouseMove,
    handleClick,
    resetHighlights,
    hoveredObject
  };
};
