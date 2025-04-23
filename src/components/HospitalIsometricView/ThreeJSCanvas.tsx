
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Hospital } from '@/types/hospital';
import { createHospitalBed } from './models/HospitalBed';
import { createPatient } from './models/Patient';
import { createMaterials } from './utils/materials';
import { useSceneSetup } from './hooks/useSceneSetup';
import { useHospitalObjects } from './hooks/useHospitalObjects';

interface ThreeJSCanvasProps {
  hospital: Hospital;
  selectedFloor?: string | null;
  selectedPatientId?: string | null;
  onBedSelect?: (bedId: string) => void;
  onPatientSelect?: (patientId: string) => void;
  isDarkMode?: boolean;
}

const ThreeJSCanvas: React.FC<ThreeJSCanvasProps> = ({
  hospital,
  selectedFloor,
  selectedPatientId,
  onBedSelect,
  onPatientSelect,
  isDarkMode = true
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const floorLevel = selectedFloor ? hospital.floors.find(f => f.id === selectedFloor)?.level : null;
  const [interactiveObjects, setInteractiveObjects] = useState<Record<string, THREE.Object3D>>({});
  
  const sceneSetup = useSceneSetup({
    containerRef: mountRef,
    isDarkMode,
    selectedFloor,
    floorLevel
  });
  
  const { visibleFloors, visibleBeds, visiblePatients } = useHospitalObjects({
    hospital,
    selectedFloor,
    selectedPatientId,
    isDarkMode
  });

  // Setup mouse interaction handlers
  useEffect(() => {
    if (!mountRef.current || !sceneSetup?.camera) return;
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredObject: THREE.Object3D | null = null;
    
    const handleMouseMove = (event: MouseEvent) => {
      const container = mountRef.current;
      if (!container || !sceneSetup?.camera) return;
      
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, sceneSetup.camera);
      
      const intersects = raycaster.intersectObjects(Object.values(interactiveObjects));
      
      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object !== hoveredObject) {
          document.body.style.cursor = 'pointer';
          hoveredObject = object;
        }
      } else if (hoveredObject) {
        document.body.style.cursor = 'default';
        hoveredObject = null;
      }
    };
    
    const handleClick = (event: MouseEvent) => {
      const container = mountRef.current;
      if (!container || !sceneSetup?.camera) return;
      
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, sceneSetup.camera);
      
      const intersects = raycaster.intersectObjects(Object.values(interactiveObjects));
      
      if (intersects.length > 0) {
        const object = intersects[0].object;
        const objectId = Object.entries(interactiveObjects).find(([_, obj]) => obj === object)?.[0];
        
        if (objectId) {
          if (objectId.startsWith('bed-') && onBedSelect) {
            onBedSelect(objectId);
          } else if (objectId.startsWith('patient-') && onPatientSelect) {
            onPatientSelect(objectId);
          }
        }
      }
    };
    
    const container = mountRef.current;
    
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      document.body.style.cursor = 'default';
    };
  }, [sceneSetup, interactiveObjects, onBedSelect, onPatientSelect]);

  useEffect(() => {
    if (!mountRef.current || !sceneSetup) return;
    
    const { scene, camera, renderer, controls } = sceneSetup;
    const materials = createMaterials(isDarkMode);
    const newInteractiveObjects: Record<string, THREE.Object3D> = {};

    // Clear previous scene objects (except lights)
    scene.children.forEach(child => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
        scene.remove(child);
      }
    });

    // Create floors
    const floorGeometry = new THREE.BoxGeometry(25, 0.2, 25);
    visibleFloors.forEach(floor => {
      const material = materials.floor;
      const floorMesh = new THREE.Mesh(floorGeometry, material);
      floorMesh.position.y = floor.level * 4 - 0.1;
      floorMesh.receiveShadow = true;
      scene.add(floorMesh);
    });

    // Create beds and patients
    visibleBeds.forEach(bed => {
      const bedMesh = createHospitalBed(
        new THREE.Vector3(bed.position.x, bed.position.y ?? 0, bed.position.z),
        bed.id,
        isDarkMode
      );
      scene.add(bedMesh);
      newInteractiveObjects[bed.id] = bedMesh;
    });

    visiblePatients.forEach(patient => {
      if (patient.bedId) {
        const bed = visibleBeds.find(b => b.id === patient.bedId);
        if (bed) {
          const patientMesh = createPatient(
            new THREE.Vector3(
              bed.position.x,
              (bed.position.y ?? 0) + 0.45,
              bed.position.z
            ),
            patient.id,
            patient.status,
            patient.id === selectedPatientId,
            isDarkMode
          );
          scene.add(patientMesh);
          newInteractiveObjects[patient.id] = patientMesh;
        }
      }
    });

    setInteractiveObjects(newInteractiveObjects);
    
    const container = mountRef.current;
    
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    // Start animation loop
    const animationId = requestAnimationFrame(animate);
    
    // Make sure the renderer is attached to the DOM
    if (!container.contains(renderer.domElement)) {
      container.appendChild(renderer.domElement);
    }
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [hospital, selectedFloor, selectedPatientId, isDarkMode, visibleBeds, visiblePatients, visibleFloors, sceneSetup]);
  
  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
  );
};

export default ThreeJSCanvas;
