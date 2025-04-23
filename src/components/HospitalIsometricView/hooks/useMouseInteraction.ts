
import { useCallback, useRef, useState } from 'react';
import * as THREE from 'three';

interface UseMouseInteractionProps {
  camera: THREE.Camera | null;
  interactiveObjects: Record<string, THREE.Object3D> | null;
  onBedSelect?: (id: string) => void;
  onPatientSelect?: (id: string) => void;
}

export const useMouseInteraction = ({
  camera,
  interactiveObjects,
  onBedSelect,
  onPatientSelect
}: UseMouseInteractionProps) => {
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  
  const handleMouseMove = useCallback((event: MouseEvent, container: HTMLDivElement) => {
    if (!camera || !interactiveObjects) return;
    
    const rect = container.getBoundingClientRect();
    mouseRef.current.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    
    const intersects = raycasterRef.current.intersectObjects(Object.values(interactiveObjects), true);
    
    if (intersects.length > 0) {
      let object = intersects[0].object;
      while (object && !object.userData.id) {
        object = object.parent as THREE.Object3D;
      }
      
      if (object?.userData?.id) {
        document.body.style.cursor = 'pointer';
        if (object.userData.type === 'bed') {
          object.scale.set(1.05, 1.05, 1.05);
        } else if (object.userData.type === 'patient') {
          object.position.y += 0.1;
        }
      }
    } else {
      document.body.style.cursor = 'auto';
      Object.values(interactiveObjects).forEach(obj => {
        if (obj.userData.type === 'bed') {
          obj.scale.set(1, 1, 1);
        } else if (obj.userData.type === 'patient') {
          obj.position.y -= 0.1;
        }
      });
    }
  }, [camera, interactiveObjects]);

  const handleClick = useCallback((event: MouseEvent, container: HTMLDivElement) => {
    if (!camera || !interactiveObjects) return;
    
    const rect = container.getBoundingClientRect();
    mouseRef.current.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    
    const intersects = raycasterRef.current.intersectObjects(Object.values(interactiveObjects), true);
    
    if (intersects.length > 0) {
      let object = intersects[0].object;
      while (object && !object.userData.id) {
        object = object.parent as THREE.Object3D;
      }
      
      if (object?.userData?.id) {
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
    handleClick
  };
};
