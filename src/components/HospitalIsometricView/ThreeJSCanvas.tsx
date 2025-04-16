
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Hospital, Bed, Patient, Position, BedStatus, PatientStatus } from '@/types/hospital';

interface ThreeJSCanvasProps {
  hospital: Hospital;
  selectedFloor?: string | null;
  onBedSelect?: (bedId: string) => void;
  onPatientSelect?: (patientId: string) => void;
}

const ThreeJSCanvas: React.FC<ThreeJSCanvasProps> = ({
  hospital,
  selectedFloor,
  onBedSelect,
  onPatientSelect
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Light background
    
    // Camera setup for isometric view
    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const camera = new THREE.OrthographicCamera(
      -10 * aspect, 10 * aspect, 10, -10, 0.1, 1000
    );
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    
    // Add orbit controls with constraints
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.15;
    controls.minDistance = 10;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI / 2.5; // Limit vertical rotation
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);
    
    // Raycaster for object selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Map of all interactive objects
    const interactiveObjects: { [key: string]: THREE.Object3D } = {};
    
    // Materials
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd1d5db, 
      roughness: 0.7 
    });
    
    const gridMaterial = new THREE.LineBasicMaterial({ 
      color: 0x9ca3af, 
      transparent: true,
      opacity: 0.5
    });
    
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xe5e7eb, 
      roughness: 0.9 
    });
    
    // Create floors
    hospital.floors.forEach(floor => {
      // Skip if not the selected floor (unless none selected)
      if (selectedFloor && floor.id !== selectedFloor) {
        return;
      }
      
      // Floor base
      const floorGeometry = new THREE.BoxGeometry(20, 0.2, 20);
      const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
      floorMesh.position.set(0, floor.level * 2, 0);
      scene.add(floorMesh);
      
      // Floor grid
      const gridHelper = new THREE.GridHelper(20, 20, 0x9ca3af, 0x9ca3af);
      gridHelper.position.set(0, floor.level * 2 + 0.1, 0);
      gridHelper.rotation.x = Math.PI / 2;
      scene.add(gridHelper);
      
      // Floor walls (simple rectangle walls)
      const wallHeight = 1.8;
      const wallThickness = 0.2;
      
      // Back wall
      const backWallGeometry = new THREE.BoxGeometry(20, wallHeight, wallThickness);
      const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
      backWall.position.set(0, floor.level * 2 + wallHeight / 2, -10);
      scene.add(backWall);
      
      // Side wall
      const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 20);
      const sideWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
      sideWall.position.set(-10, floor.level * 2 + wallHeight / 2, 0);
      scene.add(sideWall);
    });
    
    // Create beds
    hospital.beds.forEach(bed => {
      const floorObj = hospital.floors.find(f => f.type === bed.floor);
      
      // Skip if not the selected floor (unless none selected)
      if (selectedFloor && floorObj && floorObj.id !== selectedFloor) {
        return;
      }
      
      // Bed status determines color
      let bedColor: number;
      switch (bed.status) {
        case 'available':
          bedColor = 0x4ade80; // Green
          break;
        case 'occupied':
          bedColor = 0xf97316; // Orange
          break;
        case 'cleaning':
          bedColor = 0x60a5fa; // Blue
          break;
        default:
          bedColor = 0x9ca3af; // Gray
      }
      
      // Create bed frame
      const bedMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x94a3b8,
        roughness: 0.7 
      });
      
      const bedFrameGeometry = new THREE.BoxGeometry(1.4, 0.3, 2.2);
      const bedFrame = new THREE.Mesh(bedFrameGeometry, bedMaterial);
      bedFrame.position.set(
        bed.position.x,
        bed.position.y + 0.3,
        bed.position.z
      );
      
      // Create bed mattress
      const mattressMaterial = new THREE.MeshStandardMaterial({ 
        color: bedColor,
        roughness: 0.8 
      });
      
      const mattressGeometry = new THREE.BoxGeometry(1.2, 0.15, 2);
      const mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
      mattress.position.set(
        bed.position.x,
        bed.position.y + 0.55,
        bed.position.z
      );
      
      // Create legs
      const legGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
      
      for (let i = 0; i < 4; i++) {
        const xOffset = i % 2 === 0 ? 0.6 : -0.6;
        const zOffset = i < 2 ? 1 : -1;
        
        const leg = new THREE.Mesh(legGeometry, bedMaterial);
        leg.position.set(
          bed.position.x + xOffset,
          bed.position.y + 0.15,
          bed.position.z + zOffset
        );
        scene.add(leg);
      }
      
      // Group the bed parts
      const bedGroup = new THREE.Group();
      bedGroup.add(bedFrame);
      bedGroup.add(mattress);
      scene.add(bedGroup);
      
      // Make bed interactive
      interactiveObjects[bed.id] = bedGroup;
      
      // If there's a patient in the bed, add a patient indicator
      if (bed.patientId) {
        const patient = hospital.patients.find(p => p.id === bed.patientId);
        
        if (patient) {
          let patientColor: number;
          switch (patient.status) {
            case 'critical':
              patientColor = 0xef4444; // Red
              break;
            case 'stable':
              patientColor = 0x22c55e; // Green
              break;
            case 'discharged':
              patientColor = 0x6b7280; // Gray
              break;
            default:
              patientColor = 0x9ca3af; // Gray
          }
          
          // Create patient indicator (simple cylinder for now)
          const patientGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16);
          const patientMaterial = new THREE.MeshStandardMaterial({ 
            color: patientColor,
            roughness: 0.5 
          });
          
          const patientMesh = new THREE.Mesh(patientGeometry, patientMaterial);
          patientMesh.position.set(
            bed.position.x,
            bed.position.y + 1,
            bed.position.z
          );
          
          scene.add(patientMesh);
          
          // Make patient interactive
          interactiveObjects[patient.id] = patientMesh;
        }
      }
      
      // Add room label
      const roomLabelGeometry = new THREE.PlaneGeometry(1, 0.5);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = 128;
        canvas.height = 64;
        
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = '24px Arial';
        context.fillStyle = '#000000';
        context.textAlign = 'center';
        context.fillText(bed.room, canvas.width / 2, canvas.height / 2 + 8);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide
        });
        
        const label = new THREE.Mesh(roomLabelGeometry, labelMaterial);
        label.position.set(
          bed.position.x,
          bed.position.y + 1.8,
          bed.position.z
        );
        label.rotation.x = -Math.PI / 4;
        
        scene.add(label);
      }
    });
    
    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.left = -10 * (width / height);
      camera.right = 10 * (width / height);
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Handle mouse movement for interactive elements
    const onMouseMove = (event: MouseEvent) => {
      if (!mountRef.current) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / mountRef.current.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / mountRef.current.clientHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObjects(Object.values(interactiveObjects));
      
      // Reset cursor and hover state
      document.body.style.cursor = 'default';
      setHoveredObject(null);
      
      if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // Find the key (id) for this object
        for (const [key, value] of Object.entries(interactiveObjects)) {
          if (object.parent === value || object === value) {
            document.body.style.cursor = 'pointer';
            setHoveredObject(key);
            break;
          }
        }
      }
    };
    
    // Handle clicks
    const onClick = () => {
      if (hoveredObject) {
        if (hoveredObject.startsWith('bed-')) {
          onBedSelect?.(hoveredObject);
        } else if (hoveredObject.startsWith('patient-')) {
          onPatientSelect?.(hoveredObject);
        }
      }
    };
    
    mountRef.current.addEventListener('mousemove', onMouseMove);
    mountRef.current.addEventListener('click', onClick);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Cleanup
    return () => {
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousemove', onMouseMove);
        mountRef.current.removeEventListener('click', onClick);
        mountRef.current.removeChild(renderer.domElement);
      }
      
      window.removeEventListener('resize', handleResize);
      
      // Dispose of geometries and materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, [hospital, selectedFloor, onBedSelect, onPatientSelect, hoveredObject]);
  
  return <div ref={mountRef} className="w-full h-full min-h-[500px] rounded-lg" />;
};

export default ThreeJSCanvas;
