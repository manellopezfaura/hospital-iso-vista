
import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Hospital, Floor } from '@/types/hospital';
import { createHospitalBed } from './models/HospitalBed';
import { createPatient } from './models/Patient';
import { setupScene, setupLights } from './utils/sceneSetup';
import { createMaterials } from './utils/materials';
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
  
  const { visibleFloors, visibleBeds, visiblePatients } = useMemo(() => {
    const allFloors = hospital.floors;
    
    if (selectedFloor) {
      const currentFloor = allFloors.find(f => f.id === selectedFloor);
      
      if (currentFloor) {
        const beds = hospital.beds.filter(bed => bed.floor === currentFloor.type);
        const bedPatientIds = beds
          .filter(bed => bed.patientId)
          .map(bed => bed.patientId);
        
        const patients = hospital.patients.filter(
          patient => bedPatientIds.includes(patient.id)
        );
        
        return { 
          visibleFloors: [currentFloor], 
          visibleBeds: beds, 
          visiblePatients: patients 
        };
      }
    }
    
    return { 
      visibleFloors: allFloors, 
      visibleBeds: hospital.beds, 
      visiblePatients: hospital.patients 
    };
  }, [hospital, selectedFloor]);
  
  useEffect(() => {
    if (!mountRef.current) return;
    
    console.log("Initializing ThreeJSCanvas with hospital data:", hospital);
    console.log("Selected floor:", selectedFloor);
    console.log("Selected patient ID:", selectedPatientId);
    console.log("Dark mode enabled:", isDarkMode);
    console.log("Visible beds:", visibleBeds.length);
    console.log("Visible floors:", visibleFloors.length);
    
    const floorLevel = selectedFloor ? visibleFloors[0]?.level : null;
    const { scene, camera, renderer, controls } = setupScene(
      mountRef.current,
      isDarkMode,
      selectedFloor,
      floorLevel
    );
    
    setupLights(scene, isDarkMode);
    
    const materials = createMaterials(isDarkMode);
    const interactiveObjects: { [key: string]: THREE.Object3D } = {};
    
    // Create floors
    const floorGeometry = new THREE.BoxGeometry(25, 0.2, 25);
    
    hospital.floors.forEach((floor: Floor) => {
      const isVisible = visibleFloors.some(f => f.id === floor.id);
      const material = isVisible ? materials.floor : materials.nonVisibleFloor;
      
      const floorMesh = new THREE.Mesh(floorGeometry, material);
      floorMesh.position.y = floor.level * 4 - 0.1;
      floorMesh.receiveShadow = isVisible;
      scene.add(floorMesh);
      
      if (!isVisible && selectedFloor) {
        const wallOutlineGeometry = new THREE.EdgesGeometry(
          new THREE.BoxGeometry(24, 2.5, 24)
        );
        const wallOutlineMaterial = new THREE.LineBasicMaterial({
          color: isDarkMode ? 0x6E59A5 : 0xA0AEC0,
          transparent: true,
          opacity: 0.1
        });
        const wallOutlineMesh = new THREE.LineSegments(wallOutlineGeometry, wallOutlineMaterial);
        wallOutlineMesh.position.y = floor.level * 4 + 1.5;
        scene.add(wallOutlineMesh);
      }
    });
    
    // Create beds
    visibleBeds.forEach(bed => {
      const bedPosition = new THREE.Vector3(
        bed.position.x,
        (bed.position.y !== undefined ? bed.position.y : 0) + 0.1,
        bed.position.z
      );
      
      const bedMesh = createHospitalBed(bedPosition, bed.id, isDarkMode);
      
      // Add status indicators
      if (bed.status === 'cleaning' || bed.status === 'available') {
        const indicatorGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const indicatorMaterial = new THREE.MeshStandardMaterial({
          color: bed.status === 'cleaning' ? 0xfbbd23 : 0x4ade80,
          emissive: bed.status === 'cleaning' ? 0xfbbd23 : 0x4ade80,
          emissiveIntensity: 0.5
        });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.set(0, 0.8, 0);
        bedMesh.add(indicator);
      }
      
      scene.add(bedMesh);
      interactiveObjects[bed.id] = bedMesh;
    });
    
    // Create patients
    visiblePatients.forEach(patient => {
      if (patient.bedId) {
        const associatedBed = visibleBeds.find(b => b.id === patient.bedId);
        if (associatedBed) {
          const patientPosition = new THREE.Vector3(
            associatedBed.position.x,
            (associatedBed.position.y !== undefined ? associatedBed.position.y : 0) + 0.45,
            associatedBed.position.z
          );
          
          const isSelected = patient.id === selectedPatientId;
          const patientMesh = createPatient(patientPosition, patient.id, patient.status, isSelected, isDarkMode);
          
          scene.add(patientMesh);
          interactiveObjects[patient.id] = patientMesh;
        }
      }
    });
    
    const { handleMouseMove, handleClick } = useMouseInteraction({
      interactiveObjects,
      onBedSelect,
      onPatientSelect,
      camera
    });
    
    const container = mountRef.current;
    
    const onMouseMove = (event: MouseEvent) => handleMouseMove(event, container);
    const onClick = (event: MouseEvent) => handleClick(event, container);
    
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);
    
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    container.appendChild(renderer.domElement);
    
    return () => {
      if (container) {
        container.removeEventListener('mousemove', onMouseMove);
        container.removeEventListener('click', onClick);
        container.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      
      Object.values(interactiveObjects).forEach(object => {
        scene.remove(object);
      });
    };
  }, [hospital, selectedFloor, selectedPatientId, isDarkMode, visibleBeds, visiblePatients, visibleFloors, onBedSelect, onPatientSelect]);
  
  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
  );
};

export default ThreeJSCanvas;
