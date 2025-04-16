
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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
    scene.background = new THREE.Color(0x5f9ea0); // Teal background color similar to the image
    
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    
    // Add orbit controls with constraints
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.15;
    controls.minDistance = 10;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI / 2.5; // Limit vertical rotation
    controls.enableRotate = true;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = true;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Raycaster for object selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Map of all interactive objects
    const interactiveObjects: { [key: string]: THREE.Object3D } = {};
    
    // Define room layout with walls
    const rooms: { position: [number, number], width: number, height: number }[] = [
      { position: [-7, -7], width: 6, height: 6 },
      { position: [0, -7], width: 6, height: 6 },
      { position: [-7, 0], width: 6, height: 6 },
      { position: [0, 0], width: 6, height: 6 }
    ];
    
    // Materials
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x417f81, // Darker teal for floor
      roughness: 0.7 
    });
    
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf5f5f5, // Off-white for walls
      roughness: 0.9 
    });
    
    const bedFrameMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, // White for bed frame
      roughness: 0.4
    });
    
    const bedSheetMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x68b7b8, // Light teal for bedsheets
      roughness: 0.5
    });
    
    const nightstandMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf0f0f0, // Light gray for nightstand
      roughness: 0.6
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
      floorMesh.position.set(0, floor.level * 3, 0);
      floorMesh.receiveShadow = true;
      scene.add(floorMesh);
      
      // Create rooms with walls
      rooms.forEach(room => {
        const [x, z] = room.position;
        const y = floor.level * 3;
        const width = room.width;
        const height = room.height;
        
        // Room floor with slightly different color to distinguish rooms
        const roomFloorGeometry = new THREE.BoxGeometry(width, 0.05, height);
        const roomFloorMesh = new THREE.Mesh(roomFloorGeometry, floorMaterial);
        roomFloorMesh.position.set(x + width/2, y + 0.12, z + height/2);
        scene.add(roomFloorMesh);
        
        // Create walls
        const wallHeight = 2.0;
        const wallThickness = 0.15;
        
        // Back wall
        const backWallGeometry = new THREE.BoxGeometry(width, wallHeight, wallThickness);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(x + width/2, y + wallHeight/2, z);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        scene.add(backWall);
        
        // Left wall
        const leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, height);
        const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        leftWall.position.set(x, y + wallHeight/2, z + height/2);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        scene.add(leftWall);
        
        // Create door openings in some walls
        if ((x === 0 && z === -7) || (x === -7 && z === 0)) {
          // Right wall with door opening
          const doorWidth = 1.5;
          const wallSegmentWidth = (height - doorWidth) / 2;
          
          // Bottom wall segment
          const bottomWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, wallSegmentWidth);
          const bottomWall = new THREE.Mesh(bottomWallGeometry, wallMaterial);
          bottomWall.position.set(x + width, y + wallHeight/2, z + wallSegmentWidth/2);
          bottomWall.castShadow = true;
          bottomWall.receiveShadow = true;
          scene.add(bottomWall);
          
          // Top wall segment
          const topWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, wallSegmentWidth);
          const topWall = new THREE.Mesh(topWallGeometry, wallMaterial);
          topWall.position.set(x + width, y + wallHeight/2, z + height - wallSegmentWidth/2);
          topWall.castShadow = true;
          topWall.receiveShadow = true;
          scene.add(topWall);
          
          // Door frame top
          const doorFrameTopGeometry = new THREE.BoxGeometry(wallThickness, 0.2, doorWidth);
          const doorFrameTop = new THREE.Mesh(doorFrameTopGeometry, wallMaterial);
          doorFrameTop.position.set(x + width, y + wallHeight - 0.1, z + height/2);
          scene.add(doorFrameTop);
        } else {
          // Full right wall
          const rightWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, height);
          const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
          rightWall.position.set(x + width, y + wallHeight/2, z + height/2);
          rightWall.castShadow = true;
          rightWall.receiveShadow = true;
          scene.add(rightWall);
        }
      });
    });
    
    // Create beds and nightstands
    hospital.beds.forEach(bed => {
      const floorObj = hospital.floors.find(f => f.type === bed.floor);
      
      // Skip if not the selected floor (unless none selected)
      if (selectedFloor && floorObj && floorObj.id !== selectedFloor) {
        return;
      }
      
      // Bed status determines color
      let statusIndicatorColor: number;
      switch (bed.status) {
        case 'available':
          statusIndicatorColor = 0x4ade80; // Green
          break;
        case 'occupied':
          statusIndicatorColor = 0xf97316; // Orange
          break;
        case 'cleaning':
          statusIndicatorColor = 0x60a5fa; // Blue
          break;
        default:
          statusIndicatorColor = 0x9ca3af; // Gray
      }
      
      // Create bed group
      const bedGroup = new THREE.Group();
      
      // Create bed frame
      const bedFrameGeometry = new THREE.BoxGeometry(1.0, 0.3, 2.0);
      const bedFrame = new THREE.Mesh(bedFrameGeometry, bedFrameMaterial);
      bedFrame.position.set(0, 0.3, 0);
      bedFrame.castShadow = true;
      bedFrame.receiveShadow = true;
      bedGroup.add(bedFrame);
      
      // Create bed mattress
      const mattressGeometry = new THREE.BoxGeometry(0.9, 0.1, 1.8);
      const mattress = new THREE.Mesh(mattressGeometry, bedSheetMaterial);
      mattress.position.set(0, 0.4, 0);
      mattress.castShadow = true;
      bedGroup.add(mattress);
      
      // Create pillow
      const pillowGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.4);
      const pillowMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
      const pillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
      pillow.position.set(0, 0.45, -0.65);
      bedGroup.add(pillow);
      
      // Create legs
      const legGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
      const legPositions = [
        [-0.4, -0.15, 0.85],
        [0.4, -0.15, 0.85],
        [-0.4, -0.15, -0.85],
        [0.4, -0.15, -0.85]
      ];
      
      legPositions.forEach(position => {
        const leg = new THREE.Mesh(legGeometry, bedFrameMaterial);
        leg.position.set(position[0], position[1], position[2]);
        leg.castShadow = true;
        bedGroup.add(leg);
      });
      
      // Create status indicator (small sphere above bed)
      if (bed.status !== 'available') {
        const indicatorGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const indicatorMaterial = new THREE.MeshStandardMaterial({ 
          color: statusIndicatorColor,
          emissive: statusIndicatorColor,
          emissiveIntensity: 0.5,
        });
        
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.set(0, 1.5, -0.8);
        
        // Add pole for indicator
        const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0xb0b0b0 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(0, 1.0, -0.8);
        bedGroup.add(pole);
        bedGroup.add(indicator);
      }
      
      // Create nightstand
      const nightstandGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      const nightstand = new THREE.Mesh(nightstandGeometry, nightstandMaterial);
      nightstand.position.set(-0.8, 0.3, -0.5);
      nightstand.castShadow = true;
      nightstand.receiveShadow = true;
      bedGroup.add(nightstand);
      
      // Position the entire bed group
      bedGroup.position.set(
        bed.position.x,
        bed.position.y,
        bed.position.z
      );
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
          
          // Create patient indicator (circle with person icon)
          const patientGroup = new THREE.Group();
          
          // Circle background
          const circleGeometry = new THREE.CircleGeometry(0.3, 32);
          const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x33a1c9, // Teal blue circle 
            side: THREE.DoubleSide 
          });
          
          const circle = new THREE.Mesh(circleGeometry, circleMaterial);
          circle.rotation.x = -Math.PI / 2;
          patientGroup.add(circle);
          
          // Create simplified patient icon (small cylinder for head, box for body)
          const headGeometry = new THREE.SphereGeometry(0.1, 16, 16);
          const bodyGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.2);
          const patientMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
          
          const head = new THREE.Mesh(headGeometry, patientMaterial);
          head.position.y = 0.15;
          patientGroup.add(head);
          
          const body = new THREE.Mesh(bodyGeometry, patientMaterial);
          body.position.y = 0.01;
          patientGroup.add(body);
          
          // Position the patient indicator near the bed
          patientGroup.position.set(
            bed.position.x + 0.7,
            bed.position.y + 0.5,
            bed.position.z - 0.3
          );
          
          scene.add(patientGroup);
          
          // Make patient interactive
          interactiveObjects[patient.id] = patientGroup;
          
          // Add patient status indicator if critical
          if (patient.status === 'critical') {
            const alertGeometry = new THREE.ConeGeometry(0.15, 0.3, 16);
            const alertMaterial = new THREE.MeshStandardMaterial({ 
              color: 0xef4444,
              emissive: 0xef4444,
              emissiveIntensity: 0.5
            });
            
            const alert = new THREE.Mesh(alertGeometry, alertMaterial);
            alert.position.set(
              bed.position.x - 0.7,
              bed.position.y + 1.5,
              bed.position.z
            );
            
            const alertPole = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8);
            const alertPoleMaterial = new THREE.MeshStandardMaterial({ color: 0xb0b0b0 });
            const pole = new THREE.Mesh(alertPole, alertPoleMaterial);
            pole.position.set(
              bed.position.x - 0.7,
              bed.position.y + 1.0,
              bed.position.z
            );
            
            scene.add(pole);
            scene.add(alert);
          }
          
          // If staff assigned to patient, add staff indicators
          if (patient.assignedStaffIds.length > 0) {
            patient.assignedStaffIds.forEach((staffId, index) => {
              const staff = hospital.staff.find(s => s.id === staffId);
              if (staff) {
                // Create staff indicator
                const staffGroup = new THREE.Group();
                
                // Circle background
                const staffCircleGeometry = new THREE.CircleGeometry(0.25, 32);
                const staffCircleMaterial = new THREE.MeshBasicMaterial({ 
                  color: 0x33a1c9, // Teal blue circle
                  side: THREE.DoubleSide 
                });
                
                const staffCircle = new THREE.Mesh(staffCircleGeometry, staffCircleMaterial);
                staffCircle.rotation.x = -Math.PI / 2;
                staffGroup.add(staffCircle);
                
                // Create simplified staff icon
                const staffHeadGeometry = new THREE.SphereGeometry(0.08, 16, 16);
                const staffBodyGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.16);
                const staffMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
                
                const staffHead = new THREE.Mesh(staffHeadGeometry, staffMaterial);
                staffHead.position.y = 0.12;
                staffGroup.add(staffHead);
                
                const staffBody = new THREE.Mesh(staffBodyGeometry, staffMaterial);
                staffBody.position.y = 0.01;
                staffGroup.add(staffBody);
                
                // Position the staff indicator near the bed, offset by index
                staffGroup.position.set(
                  bed.position.x + 0.5 + (index * 0.6),
                  bed.position.y + 0.5,
                  bed.position.z + 0.5
                );
                
                scene.add(staffGroup);
              }
            });
          }
        }
      }
      
      // Add room label
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
        
        const roomLabelGeometry = new THREE.PlaneGeometry(0.8, 0.4);
        const label = new THREE.Mesh(roomLabelGeometry, labelMaterial);
        label.position.set(
          bed.position.x,
          bed.position.y + 1.3,
          bed.position.z - 0.3
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
