
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Hospital } from '@/types/hospital';
import { createHospitalBed } from './models/HospitalBed';
import { createPatient } from './models/Patient';
import { createMaterials } from './utils/materials';
import { useSceneSetup } from './hooks/useSceneSetup';
import { useHospitalObjects } from './hooks/useHospitalObjects';
import { useMouseInteraction } from './hooks/useMouseInteraction';

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

  useEffect(() => {
    if (!mountRef.current || !sceneSetup) return;
    
    const { scene, camera, renderer, controls } = sceneSetup;
    const materials = createMaterials(isDarkMode);
    const interactiveObjects: { [key: string]: THREE.Object3D } = {};

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
      interactiveObjects[bed.id] = bedMesh;
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
          interactiveObjects[patient.id] = patientMesh;
        }
      }
    });

    const { handleMouseMove, handleClick } = useMouseInteraction({
      camera,
      interactiveObjects,
      onBedSelect,
      onPatientSelect
    });

    const container = mountRef.current;
    
    container.addEventListener('mousemove', e => handleMouseMove(e, container));
    container.addEventListener('click', e => handleClick(e, container));
    
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    container.appendChild(renderer.domElement);
    
    return () => {
      if (container) {
        container.removeEventListener('mousemove', e => handleMouseMove(e, container));
        container.removeEventListener('click', e => handleClick(e, container));
        container.removeChild(renderer.domElement);
      }
      
      Object.values(interactiveObjects).forEach(object => {
        scene.remove(object);
      });
    };
  }, [hospital, selectedFloor, selectedPatientId, isDarkMode, visibleBeds, visiblePatients, visibleFloors, sceneSetup]);
  
  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
  );
};

export default ThreeJSCanvas;
