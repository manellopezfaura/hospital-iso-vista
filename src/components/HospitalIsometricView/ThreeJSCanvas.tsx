import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Hospital, Bed, Patient, Position, BedStatus, PatientStatus } from '@/types/hospital';

interface ThreeJSCanvasProps {
  hospital: Hospital;
  selectedFloor?: string | null;
  selectedPatientId?: string | null;
  onBedSelect?: (bedId: string) => void;
  onPatientSelect?: (patientId: string) => void;
}

const ThreeJSCanvas: React.FC<ThreeJSCanvasProps> = ({
  hospital,
  selectedFloor,
  selectedPatientId,
  onBedSelect,
  onPatientSelect
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  
  // Performance optimization: memoize hospital data
  const { floors, beds, patients } = useMemo(() => {
    return {
      floors: hospital.floors,
      beds: hospital.beds,
      patients: hospital.patients
    };
  }, [hospital]);
  
  useEffect(() => {
    if (!mountRef.current) return;
    
    console.log("Initializing ThreeJSCanvas with hospital data:", hospital);
    console.log("Selected patient ID:", selectedPatientId);
    
    // Scene setup with improved background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1A1F2C); // Dark purple background for modern look
    
    // Add fog for depth perception
    scene.fog = new THREE.FogExp2(0x1A1F2C, 0.015);
    
    // Camera setup for isometric view with better positioning
    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const camera = new THREE.OrthographicCamera(
      -10 * aspect, 10 * aspect, 10, -10, 0.1, 1000
    );
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
    
    // Store references to patient meshes for highlighting
    const patientMeshes: { [key: string]: THREE.Mesh[] } = {};
    const patientGroups: { [key: string]: THREE.Group } = {};
    
    // Enhanced renderer with better settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
      alpha: true
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Improved rendering quality
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace; // Better color reproduction
    mountRef.current.appendChild(renderer.domElement);
    
    // Improved orbit controls for smoother rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08; // Smoother damping
    controls.minDistance = 10;
    controls.maxDistance = 60;
    controls.maxPolarAngle = Math.PI / 2.2; // Limit vertical rotation
    controls.enableRotate = true;
    controls.rotateSpeed = 0.7; // Smoother rotation
    controls.enableZoom = true;
    controls.zoomSpeed = 1.0;
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    
    // Enhanced lighting system
    // Ambient light with slight blue tint
    const ambientLight = new THREE.AmbientLight(0x6E59A5, 0.3);
    scene.add(ambientLight);
    
    // Main directional light with shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(15, 25, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);
    
    // Fill light for better illumination
    const fillLight = new THREE.DirectionalLight(0x8B5CF6, 0.3);
    fillLight.position.set(-15, 10, 15);
    scene.add(fillLight);
    
    // Accent point light
    const pointLight = new THREE.PointLight(0x0EA5E9, 1.0, 50);
    pointLight.position.set(0, 15, 0);
    pointLight.castShadow = true;
    pointLight.shadow.bias = -0.001;
    scene.add(pointLight);
    
    // Raycaster for object selection with improved precision
    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.1;
    raycaster.params.Points.threshold = 0.1;
    const mouse = new THREE.Vector2();
    
    // Map of all interactive objects
    const interactiveObjects: { [key: string]: THREE.Object3D } = {};
    
    // Define room layout with walls for each floor
    const rooms: { position: [number, number], width: number, height: number }[] = [
      { position: [-7, -7], width: 6, height: 6 },
      { position: [0, -7], width: 6, height: 6 },
      { position: [-7, 0], width: 6, height: 6 },
      { position: [0, 0], width: 6, height: 6 }
    ];
    
    // Enhanced materials with PBR properties
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x403E43, // Charcoal gray
      roughness: 0.7,
      metalness: 0.3,
      envMapIntensity: 0.8
    });
    
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xF1F0FB, // Soft gray
      roughness: 0.9,
      metalness: 0.1,
      envMapIntensity: 0.5
    });
    
    const bedFrameMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x9F9EA1, // Silver gray
      roughness: 0.4,
      metalness: 0.7,
      envMapIntensity: 1.0
    });
    
    const bedSheetMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xD3E4FD, // Soft blue
      roughness: 0.5,
      metalness: 0.0,
      envMapIntensity: 0.5
    });
    
    const nightstandMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8A898C, // Medium gray
      roughness: 0.6,
      metalness: 0.4,
      envMapIntensity: 0.7
    });
    
    // Glossy patient status materials with glow effect
    const patientStatusMaterials = {
      critical: new THREE.MeshStandardMaterial({ 
        color: 0xea384c, // Red for critical
        emissive: 0xea384c,
        emissiveIntensity: 0.9,
        roughness: 0.3,
        metalness: 0.2
      }),
      stable: new THREE.MeshStandardMaterial({ 
        color: 0x4ade80, // Green for stable
        emissive: 0x4ade80,
        emissiveIntensity: 0.7,
        roughness: 0.3,
        metalness: 0.2
      }),
      discharged: new THREE.MeshStandardMaterial({ 
        color: 0x8E9196, // Gray for discharged
        emissive: 0x8E9196,
        emissiveIntensity: 0.2,
        roughness: 0.3,
        metalness: 0.2
      })
    };
    
    // Create dimmed versions of patient materials for non-selected patients
    const dimmedPatientMaterials = {
      critical: patientStatusMaterials.critical.clone(),
      stable: patientStatusMaterials.stable.clone(),
      discharged: patientStatusMaterials.discharged.clone()
    };
    
    // Apply dimming effect to non-selected patient materials
    Object.values(dimmedPatientMaterials).forEach(material => {
      material.opacity = 0.4;
      material.transparent = true;
      material.emissiveIntensity = 0.2;
    });
    
    // Create highlighted versions of patient materials for selected patient
    const highlightedPatientMaterials = {
      critical: patientStatusMaterials.critical.clone(),
      stable: patientStatusMaterials.stable.clone(),
      discharged: patientStatusMaterials.discharged.clone()
    };
    
    // Apply highlighting effect to selected patient materials
    Object.values(highlightedPatientMaterials).forEach(material => {
      material.emissiveIntensity = 1.2;
    });
    
    // Create environment map for shiny reflections
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    cubeRenderTarget.texture.type = THREE.HalfFloatType;
    const cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
    scene.add(cubeCamera);
    
    // Create floors with improved visuals
    floors.forEach((floor, floorIndex) => {
      // Skip if not the selected floor (unless none selected)
      if (selectedFloor && floor.id !== selectedFloor) {
        return;
      }
      
      // Position each floor with space in "All Floors" view
      const verticalOffset = selectedFloor ? 0 : -floorIndex * 10;
      const horizontalOffset = selectedFloor ? 0 : floorIndex * 5; // More spacing
      
      // Create floor base with grid pattern
      const floorGeometry = new THREE.BoxGeometry(21, 0.2, 21);
      const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
      floorMesh.position.set(
        horizontalOffset, 
        floor.level * 3 + verticalOffset, 
        0
      );
      floorMesh.receiveShadow = true;
      scene.add(floorMesh);
      
      // Add grid pattern to floor
      const gridHelper = new THREE.GridHelper(20, 20, 0x9ca3af, 0x9ca3af);
      gridHelper.position.set(
        horizontalOffset, 
        floor.level * 3 + verticalOffset + 0.11, 
        0
      );
      gridHelper.material.opacity = 0.2;
      gridHelper.material.transparent = true;
      scene.add(gridHelper);
      
      // Create floor label with improved visuals
      if (!selectedFloor) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.width = 512;
          canvas.height = 128;
          
          // Create gradient background
          const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, '#9b87f5');
          gradient.addColorStop(1, '#7E69AB');
          
          context.fillStyle = gradient;
          context.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add border
          context.strokeStyle = '#ffffff';
          context.lineWidth = 4;
          context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
          
          // Text with shadow
          context.shadowColor = 'rgba(0, 0, 0, 0.4)';
          context.shadowBlur = 5;
          context.shadowOffsetX = 3;
          context.shadowOffsetY = 3;
          
          context.font = 'bold 48px Arial';
          context.fillStyle = '#ffffff';
          context.textAlign = 'center';
          context.fillText(floor.name, canvas.width / 2, canvas.height / 2 + 16);
          
          const texture = new THREE.CanvasTexture(canvas);
          const labelMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
          });
          
          const floorLabelGeometry = new THREE.PlaneGeometry(6, 1.5);
          const label = new THREE.Mesh(floorLabelGeometry, labelMaterial);
          label.name = `floor-label-${floor.id}`;
          label.position.set(
            horizontalOffset - 8,
            floor.level * 3 + verticalOffset + 4,
            0
          );
          
          // Make label hover and rotate slightly for dynamic effect
          const labelAnimation = () => {
            const time = Date.now() * 0.001;
            label.position.y = floor.level * 3 + verticalOffset + 4 + Math.sin(time) * 0.1;
            label.rotation.z = Math.sin(time * 0.5) * 0.03;
          };
          
          (label as any).animate = labelAnimation;
          scene.add(label);
        }
      }
      
      // Create rooms with glass walls for modern look
      rooms.forEach(room => {
        const [x, z] = room.position;
        const y = floor.level * 3 + verticalOffset;
        const width = room.width;
        const height = room.height;
        
        // Room floor with slight accent color
        const roomFloorGeometry = new THREE.BoxGeometry(width, 0.05, height);
        const roomFloorMaterial = new THREE.MeshStandardMaterial({
          color: 0x417f81, // Teal accent
          roughness: 0.5,
          metalness: 0.3
        });
        
        const roomFloorMesh = new THREE.Mesh(roomFloorGeometry, roomFloorMaterial);
        roomFloorMesh.position.set(
          x + width/2 + horizontalOffset, 
          y + 0.12, 
          z + height/2
        );
        roomFloorMesh.receiveShadow = true;
        scene.add(roomFloorMesh);
        
        // Create walls with glass effect
        const wallHeight = 2.0;
        const wallThickness = 0.08; // Thinner walls
        
        // Wall material with transparency for glass effect
        const glassWallMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.3,
          roughness: 0.1,
          metalness: 0.2,
          transmission: 0.9,
          ior: 1.5,
          reflectivity: 0.5,
        });
        
        // Back wall
        const backWallGeometry = new THREE.BoxGeometry(width, wallHeight, wallThickness);
        const backWall = new THREE.Mesh(backWallGeometry, glassWallMaterial);
        backWall.position.set(
          x + width/2 + horizontalOffset, 
          y + wallHeight/2, 
          z
        );
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        scene.add(backWall);
        
        // Left wall
        const leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, height);
        const leftWall = new THREE.Mesh(leftWallGeometry, glassWallMaterial);
        leftWall.position.set(
          x + horizontalOffset, 
          y + wallHeight/2, 
          z + height/2
        );
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        scene.add(leftWall);
        
        // Create door openings in some walls with frame
        if ((x === 0 && z === -7) || (x === -7 && z === 0)) {
          // Door frame with chrome finish
          const doorFrameMaterial = new THREE.MeshStandardMaterial({
            color: 0xd6d6d6,
            roughness: 0.1,
            metalness: 0.8
          });
          
          const doorWidth = 1.5;
          const wallSegmentWidth = (height - doorWidth) / 2;
          
          // Bottom wall segment
          const bottomWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, wallSegmentWidth);
          const bottomWall = new THREE.Mesh(bottomWallGeometry, glassWallMaterial);
          bottomWall.position.set(
            x + width + horizontalOffset, 
            y + wallHeight/2, 
            z + wallSegmentWidth/2
          );
          bottomWall.castShadow = true;
          bottomWall.receiveShadow = true;
          scene.add(bottomWall);
          
          // Top wall segment
          const topWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, wallSegmentWidth);
          const topWall = new THREE.Mesh(topWallGeometry, glassWallMaterial);
          topWall.position.set(
            x + width + horizontalOffset, 
            y + wallHeight/2, 
            z + height - wallSegmentWidth/2
          );
          topWall.castShadow = true;
          topWall.receiveShadow = true;
          scene.add(topWall);
          
          // Door frame - top
          const doorFrameTopGeometry = new THREE.BoxGeometry(wallThickness * 2, 0.15, doorWidth + 0.2);
          const doorFrameTop = new THREE.Mesh(doorFrameTopGeometry, doorFrameMaterial);
          doorFrameTop.position.set(
            x + width + horizontalOffset, 
            y + wallHeight - 0.1, 
            z + height/2
          );
          scene.add(doorFrameTop);
          
          // Door frame - sides
          const leftFrameGeometry = new THREE.BoxGeometry(wallThickness * 2, wallHeight, 0.08);
          const leftFrame = new THREE.Mesh(leftFrameGeometry, doorFrameMaterial);
          leftFrame.position.set(
            x + width + horizontalOffset,
            y + wallHeight/2,
            z + height/2 - doorWidth/2
          );
          scene.add(leftFrame);
          
          const rightFrame = new THREE.Mesh(leftFrameGeometry, doorFrameMaterial);
          rightFrame.position.set(
            x + width + horizontalOffset,
            y + wallHeight/2,
            z + height/2 + doorWidth/2
          );
          scene.add(rightFrame);
        } else {
          // Full right wall
          const rightWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, height);
          const rightWall = new THREE.Mesh(rightWallGeometry, glassWallMaterial);
          rightWall.position.set(
            x + width + horizontalOffset, 
            y + wallHeight/2, 
            z + height/2
          );
          rightWall.castShadow = true;
          rightWall.receiveShadow = true;
          scene.add(rightWall);
        }
      });
    });
    
    console.log(`Total beds to render: ${beds.length}`);
    
    // Create beds with modern design
    beds.forEach(bed => {
      const floorObj = floors.find(f => f.type === bed.floor);
      
      // Skip if not the selected floor (unless none selected)
      if (selectedFloor && floorObj && floorObj.id !== selectedFloor) {
        return;
      }
      
      // Calculate offset based on floor
      const floorIndex = floors.findIndex(f => f.type === bed.floor);
      const verticalOffset = selectedFloor ? 0 : -floorIndex * 10;
      const horizontalOffset = selectedFloor ? 0 : floorIndex * 5;
      
      console.log(`Creating bed: ${bed.id} with status: ${bed.status}, position:`, bed.position);
      
      // Bed status determines color with higher contrast
      let statusIndicatorColor: number;
      switch (bed.status) {
        case 'available':
          statusIndicatorColor = 0x4ade80; // Green
          break;
        case 'occupied':
          statusIndicatorColor = 0xF97316; // Bright orange
          break;
        case 'cleaning':
          statusIndicatorColor = 0x0EA5E9; // Ocean blue
          break;
        default:
          statusIndicatorColor = 0x8E9196; // Neutral gray
      }
      
      // Create bed group
      const bedGroup = new THREE.Group();
      bedGroup.name = `bed-group-${bed.id}`;
      
      // Modern bed frame design
      const bedFrameGeometry = new THREE.BoxGeometry(1.5, 0.25, 2.2);
      const bedFrame = new THREE.Mesh(bedFrameGeometry, bedFrameMaterial);
      bedFrame.name = "bed-frame";
      bedFrame.position.set(0, 0.25, 0);
      bedFrame.castShadow = true;
      bedFrame.receiveShadow = true;
      bedGroup.add(bedFrame);
      
      // Create mattress with rounded edges
      const mattressGeometry = new THREE.BoxGeometry(1.3, 0.15, 2.0);
      const mattressEdges = new THREE.BoxGeometry(1.3, 0.15, 2.0);
      mattressEdges.translate(0, 0, 0);
      const mattress = new THREE.Mesh(mattressGeometry, bedSheetMaterial);
      mattress.name = "mattress";
      mattress.position.set(0, 0.45, 0);
      mattress.castShadow = true;
      bedGroup.add(mattress);
      
      // Create pillow with better shape
      const pillowGeometry = new THREE.BoxGeometry(0.9, 0.15, 0.5);
      pillowGeometry.translate(0, 0, 0);
      const pillowMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        roughness: 0.5,
        metalness: 0.05
      });
      const pillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
      pillow.name = "pillow";
      pillow.position.set(0, 0.52, -0.7);
      bedGroup.add(pillow);
      
      // Create sleek modern legs
      const legGeometry = new THREE.BoxGeometry(0.08, 0.25, 0.08);
      const legPositions = [
        [-0.6, -0.12, 0.95],
        [0.6, -0.12, 0.95],
        [-0.6, -0.12, -0.95],
        [0.6, -0.12, -0.95]
      ];
      
      legPositions.forEach((position, i) => {
        const leg = new THREE.Mesh(legGeometry, bedFrameMaterial);
        leg.name = `leg-${i}`;
        leg.position.set(position[0], position[1], position[2]);
        leg.castShadow = true;
        bedGroup.add(leg);
      });
      
      // Create status indicator (holographic-style floating sphere)
      const indicatorGeometry = new THREE.SphereGeometry(0.3, 32, 32);
      const indicatorMaterial = new THREE.MeshStandardMaterial({ 
        color: statusIndicatorColor,
        emissive: statusIndicatorColor,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.9
      });
      
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.name = "bed-status-indicator";
      indicator.position.set(0, 1.8, -0.8);
      
      // Add pole for indicator
      const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.3, 16);
      const poleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xd6d6d6,
        metalness: 0.7,
        roughness: 0.2
      });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.name = "indicator-pole";
      pole.position.set(0, 1.2, -0.8);
      bedGroup.add(pole);
      bedGroup.add(indicator);
      
      // Animate the indicator to float and pulse
      const animateIndicator = () => {
        const time = Date.now() * 0.001;
        indicator.position.y = 1.8 + Math.sin(time * 2) * 0.05;
        indicator.scale.setScalar(0.9 + Math.sin(time * 3) * 0.1);
      };
      
      // Store animation function
      (indicator as any).animate = animateIndicator;
      
      // Create modernized nightstand
      const nightstandGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
      const nightstand = new THREE.Mesh(nightstandGeometry, nightstandMaterial);
      nightstand.name = "nightstand";
      nightstand.position.set(-0.9, 0.35, -0.5);
      nightstand.castShadow = true;
      nightstand.receiveShadow = true;
      bedGroup.add(nightstand);
      
      // Add detail to nightstand - tablet/screen
      const tabletGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.05);
      const tabletMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.1,
        metalness: 0.8,
        emissive: 0x1EAEDB, 
        emissiveIntensity: 0.2
      });
      
      const tablet = new THREE.Mesh(tabletGeometry, tabletMaterial);
      tablet.position.set(-0.9, 0.75, -0.5);
      tablet.rotateX(-Math.PI / 4);
      bedGroup.add(tablet);
      
      // Position the entire bed group with offsets for "All Floors" view
      bedGroup.position.set(
        bed.position.x + horizontalOffset,
        bed.position.y + 0.2 + verticalOffset,
        bed.position.z
      );
      
      // Add glow effect outline to make bed more visible
      const bedOutlineGeometry = new THREE.BoxGeometry(1.6, 0.3, 2.3);
      const bedOutlineMaterial = new THREE.MeshBasicMaterial({
        color: statusIndicatorColor,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.1
      });
      const bedOutline = new THREE.Mesh(bedOutlineGeometry, bedOutlineMaterial);
      bedOutline.name = "bed-outline";
      bedOutline.position.copy(bedFrame.position);
      bedGroup.add(bedOutline);
      
      // Add a colored light beneath the bed for ambient glow
      const bedLight = new THREE.PointLight(statusIndicatorColor, 0.5, 3);
      bedLight.position.set(0, -0.1, 0);
      bedGroup.add(bedLight);
      
      scene.add(bedGroup);
      
      // Make bed interactive
      interactiveObjects[bed.id] = bedGroup;
      
      // If there's a patient in the bed, add a patient indicator with enhanced visuals
      if (bed.patientId) {
        const patient = patients.find(p => p.id === bed.patientId);
        
        if (patient) {
          console.log(`Adding patient: ${patient.id} with status: ${patient.status} to bed: ${bed.id}`);
          
          // Determine if this patient is selected to apply the right material
          const isSelected = selectedPatientId === patient.id;
          console.log(`Patient ${patient.id} selected: ${isSelected}`);
          
          // Choose the appropriate material based on selection state
          let patientMaterial: THREE.MeshStandardMaterial;
          if (isSelected) {
            // Use highlighted material for selected patient
            switch (patient.status) {
              case 'critical':
                patientMaterial = highlightedPatientMaterials.critical;
                break;
              case 'stable':
                patientMaterial = highlightedPatientMaterials.stable;
                break;
              case 'discharged':
                patientMaterial = highlightedPatientMaterials.discharged;
                break;
              default:
                patientMaterial = highlightedPatientMaterials.stable;
            }
          } else {
            // Use dimmed material for non-selected patients
            switch (patient.status) {
              case 'critical':
                patientMaterial = dimmedPatientMaterials.critical;
                break;
              case 'stable':
                patientMaterial = dimmedPatientMaterials.stable;
                break;
              case 'discharged':
                patientMaterial = dimmedPatientMaterials.discharged;
                break;
              default:
                patientMaterial = dimmedPatientMaterials.stable;
            }
          }
          
          // Create patient visualization with improved model
          const patientGeometry = new THREE.CapsuleGeometry(0.45, 1.2, 8, 16);
          const patientMesh = new THREE.Mesh(patientGeometry, patientMaterial);
          patientMesh.name = "patient-body";
          patientMesh.position.set(0, 0.8, 0);
          patientMesh.rotation.x = Math.PI / 2;
          patientMesh.scale.set(1, 0.45, 0.6);
          patientMesh.castShadow = true;
          bedGroup.add(patientMesh);
          
          // Keep track of patient meshes for selection highlighting
          if (!patientMeshes[patient.id]) {
            patientMeshes[patient.id] = [];
          }
          patientMeshes[patient.id].push(patientMesh);
          
          // Animate patient "breathing" if not discharged
          if (patient.status !== 'discharged') {
            const animatePatient = () => {
              const time = Date.now() * 0.001;
              const scale = 1 + Math.sin(time * 1.5) * 0.03;
              patientMesh.scale.set(scale, 0.45, 0.6);
            };
            
            (patientMesh as any).animate = animatePatient;
          }
          
          // Add patient head with better shape
          const headGeometry = new THREE.SphereGeometry(0.25, 24, 24);
          const head = new THREE.Mesh(headGeometry, patientMaterial);
          head.name = "patient-head";
          head.position.set(0, 0.8, -0.7);
          head.castShadow = true;
          bedGroup.add(head);
          
          // Add to patient meshes collection
          patientMeshes[patient.id].push(head);
          
          // Create holographic patient indicator
          const patientGroup = new THREE.Group();
          patientGroup.name = `patient-indicator-${patient.id}`;
          
          // Floating holographic-style circle
          const circleGeometry = new THREE.CircleGeometry(0.4, 32);
          const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x33a1c9, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: isSelected ? 0.9 : 0.4
          });
          
          const circle = new THREE.Mesh(circleGeometry, circleMaterial);
          circle.name = "patient-indicator-circle";
          circle.rotation.x = -Math.PI / 2;
          patientGroup.add(circle);
          
          // Create modern patient icon with opacity based on selection
          const iconHeadGeometry = new THREE.SphereGeometry(0.15, 16, 16);
          const iconBodyGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.24);
          const iconMaterial = new THREE.MeshBasicMaterial({ 
            color: isSelected ? 0xFFFFFF : 0xCCCCCC,
            transparent: true,
            opacity: isSelected ? 0.9 : 0.5
          });
          
          const iconHead = new THREE.Mesh(iconHeadGeometry, iconMaterial);
          iconHead.name = "patient-icon-head";
          iconHead.position.y = 0.22;
          patientGroup.add(iconHead);
          
          const iconBody = new THREE.Mesh(iconBodyGeometry, iconMaterial);
          iconBody.name = "patient-icon-body";
          iconBody.position.y = 0.01;
          patientGroup.add(iconBody);
          
          // Add to patient meshes collection
          patientMeshes[patient.id].push(iconHead, iconBody, circle);
          
          // Make icon float and rotate
          const animateIcon = () => {
            const time = Date.now() * 0.001;
            patientGroup.position.y = bed.position.y + 0.9 + verticalOffset + Math.sin(time * 1.5) * 0.05;
            patientGroup.rotation.y = time * 0.5;
          };
          
          (patientGroup as any).animate = animateIcon;
          
          // Position the patient indicator
          patientGroup.position.set(
            bed.position.x + 1.2 + horizontalOffset,
            bed.position.y + 0.9 + verticalOffset,
            bed.position.z - 0.4
          );
          
          // Store reference to the patient group
          patientGroups[patient.id] = patientGroup;
          
          scene.add(patientGroup);
          
          // Make patient interactive
          interactiveObjects[patient.id] = patientGroup;
          
          // Add selection highlight for selected patient
          if (isSelected) {
            // Add spotlight on selected patient
            const spotlight = new THREE.SpotLight(0x9b87f5, 2, 10, Math.PI / 6, 0.5, 1);
            spotlight.position.set(
              bed.position.x + horizontalOffset,
              bed.position.y + 5 + verticalOffset,
              bed.position.z
            );
            spotlight.target = patientMesh;
            spotlight.castShadow = true;
            spotlight.shadow.bias = -0.001;
            spotlight.name = `spotlight-${patient.id}`;
            scene.add(spotlight);
            
            // Add a pulsing ring around the selected patient
            const ringGeometry = new THREE.RingGeometry(1.2, 1.5, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
              color: 0x9b87f5, // Primary purple
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.7
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.set(
              bed.position.x + horizontalOffset,
              bed.position.y + 0.1 + verticalOffset,
              bed.position.z
            );
            ring.rotation.x = -Math.PI / 2;
            ring.name = `selection-ring-${patient.id}`;
            
            // Animate the ring
            const animateRing = () => {
              const time = Date.now() * 0.001;
              ring.scale.setScalar(1 + Math.sin(time * 2) * 0.2);
              ringMaterial.opacity = 0.5 + Math.sin(time * 2) * 0.2;
            };
            
            (ring as any).animate = animateRing;
            scene.add(ring);
          }
          
          // Add criticality indicators for critical patients
          if (patient.status === 'critical') {
            // Add alert cone (red warning) with improved design
            const alertGeometry = new THREE.ConeGeometry(0.25, 0.5, 16);
            const alertMaterial = new THREE.MeshStandardMaterial({ 
              color: 0xea384c,
              emissive: 0xea384c,
              emissiveIntensity: isSelected ? 0.9 : 0.5,
              transparent: true,
              opacity: isSelected ? 0.9 : 0.5
            });
            
            const alert = new THREE.Mesh(alertGeometry, alertMaterial);
            alert.name = "critical-alert";
            alert.position.set(
              bed.position.x - 0.8 + horizontalOffset,
              bed.position.y + 1.8 + verticalOffset,
              bed.position.z
            );
            
            // Add to patient meshes collection
            patientMeshes[patient.id].push(alert);
            
            const alertPole = new THREE.CylinderGeometry(0.02, 0.02, 1.3, 16);
            const alertPoleMaterial = new THREE.MeshStandardMaterial({ 
              color: 0xd6d6d6,
              metalness: 0.7,
              roughness: 0.2
            });
            const pole = new THREE.Mesh(alertPole, alertPoleMaterial);
            pole.name = "alert-pole";
            pole.position.set(
              bed.position.x - 0.8 + horizontalOffset,
              bed.position.y + 1.2 + verticalOffset,
              bed.position.z
            );
            
            // Animate alert cone
            const animateAlert = () => {
              const time = Date.now() * 0.001;
              alert.rotation.y = time * 2;
              alert.position.y = bed.position.y + 1.8 + verticalOffset + Math.sin(time * 3) * 0.05;
            };
            
            (alert as any).animate = animateAlert;
            
            scene.add(pole);
            scene.add(alert);
            
            // Add enhanced pulsing light effect for critical patients
            const pulsingLight = new THREE.PointLight(0xff0000, isSelected ? 1 : 0.5, 3);
            pulsingLight.name = "critical-light";
            pulsingLight.position.set(
              bed.position.x - 0.8 + horizontalOffset,
              bed.position.y + 1.0 + verticalOffset,
              bed.position.z
            );
            
            // Animate pulsing light
            const animatePulsingLight = () => {
              const time = Date.now() * 0.001;
              pulsingLight.intensity = isSelected ? 
                (0.7 + Math.sin(time * 5) * 0.3) : 
                (0.3 + Math.sin(time * 5) * 0.2);
            };
            
            (pulsingLight as any).animate = animatePulsingLight;
            scene.add(pulsingLight);
          }
        }
      }
    });
    
    // Event handling for interactivity
    const handleClick = (event: MouseEvent) => {
      event.preventDefault();
      
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Calculate mouse position in normalized device coordinates (-1 to +1)
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update the picking ray
      raycaster.setFromCamera(mouse, camera);
      
      // Find intersected objects
      const intersects = raycaster.intersectObjects(Object.values(interactiveObjects));
      
      if (intersects.length > 0) {
        // Find the first intersected object that's in our interactive objects map
        for (const intersect of intersects) {
          let object: THREE.Object3D | null = intersect.object;
          
          // Traverse up the parent chain to find the interactive parent
          while (object && object.parent) {
            // Check if this object or any parent is an interactive object
            const foundKey = Object.entries(interactiveObjects).find(([_, obj]) => obj === object);
            
            if (foundKey) {
              const [key] = foundKey;
              console.log("Selected object:", key);
              
              // Determine if it's a bed or patient
              if (key.startsWith('bed-')) {
                onBedSelect && onBedSelect(key);
              } else if (key.startsWith('patient-')) {
                onPatientSelect && onPatientSelect(key);
              }
              return;
            }
            
            object = object.parent;
          }
        }
      }
    };
    
    // Handle mouse move for hover effects
    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();
      
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Calculate mouse position in normalized device coordinates (-1 to +1)
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update the picking ray
      raycaster.setFromCamera(mouse, camera);
      
      // Find intersected objects
      const intersects = raycaster.intersectObjects(Object.values(interactiveObjects));
      
      // Reset previously hovered object
      if (hoveredObject && interactiveObjects[hoveredObject]) {
        const object = interactiveObjects[hoveredObject];
        object.traverse(child => {
          if (child instanceof THREE.Mesh) {
            if (child.material.userData && child.material.userData.originalEmissiveIntensity !== undefined) {
              child.material.emissiveIntensity = child.material.userData.originalEmissiveIntensity;
            }
          }
        });
      }
      
      // Set new hovered object
      let newHoveredObject: string | null = null;
      
      if (intersects.length > 0) {
        for (const intersect of intersects) {
          let object: THREE.Object3D | null = intersect.object;
          
          while (object && object.parent) {
            const foundKey = Object.entries(interactiveObjects).find(([_, obj]) => obj === object);
            
            if (foundKey) {
              const [key] = foundKey;
              newHoveredObject = key;
              
              // Apply hover effect
              const interactiveObject = interactiveObjects[key];
              interactiveObject.traverse(child => {
                if (child instanceof THREE.Mesh && child.material.emissive) {
                  // Store original emissive intensity for restoration when unhovered
                  if (!child.material.userData) {
                    child.material.userData = {};
                  }
                  
                  if (child.material.userData.originalEmissiveIntensity === undefined) {
                    child.material.userData.originalEmissiveIntensity = child.material.emissiveIntensity || 0;
                  }
                  
                  // Increase emissive intensity for hover effect
                  child.material.emissiveIntensity = (child.material.userData.originalEmissiveIntensity || 0) + 0.5;
                }
              });
              
              break;
            }
            
            object = object.parent;
          }
          
          if (newHoveredObject) break;
        }
      }
      
      setHoveredObject(newHoveredObject);
    };
    
    // Add event listeners for interactivity
    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    
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
    
    // Animation loop for smooth rendering
    let animationFrameId: number;
    
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Update animation effects
      scene.traverse(object => {
        if ((object as any).animate && typeof (object as any).animate === 'function') {
          (object as any).animate();
        }
      });
      
      // Update controls
      controls.update();
      
      // Render the scene
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Clean up resources on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of all geometries, materials, and textures
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else if (object.material) {
            object.material.dispose();
          }
        }
      });
      
      renderer.dispose();
    };
  }, [hospital, selectedFloor, selectedPatientId, onBedSelect, onPatientSelect, hoveredObject]);
  
  return <div ref={mountRef} className="w-full h-full" />;
};

export default ThreeJSCanvas;
