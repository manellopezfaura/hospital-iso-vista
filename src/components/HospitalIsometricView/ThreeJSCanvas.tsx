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
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  
  // Helper function to create a realistic hospital bed
  const createHospitalBed = (position: THREE.Vector3, id: string): THREE.Group => {
    const bedGroup = new THREE.Group();
    
    // Create bed frame (more detailed)
    const frameGeometry = new THREE.BoxGeometry(0.9, 0.3, 2.1);
    const frameMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0x9F9EA1 : 0xCBD5E0, // Silver gray
      roughness: 0.3,
      metalness: 0.8
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 0.15;
    frame.castShadow = true;
    frame.receiveShadow = true;
    bedGroup.add(frame);
    
    // Create mattress
    const mattressGeometry = new THREE.BoxGeometry(0.8, 0.15, 1.9);
    const mattressMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0xD3E4FD : 0xEBF8FF, // Light blue for sheets
      roughness: 0.7,
      metalness: 0.0
    });
    const mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
    mattress.position.y = 0.38;
    mattress.castShadow = true;
    mattress.receiveShadow = true;
    bedGroup.add(mattress);
    
    // Add pillow
    const pillowGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.4);
    const pillowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, // White
      roughness: 0.8,
      metalness: 0.0
    });
    const pillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
    pillow.position.set(0, 0.45, -0.7);
    pillow.castShadow = true;
    bedGroup.add(pillow);
    
    // Add bed rails (sides)
    const railGeometry = new THREE.BoxGeometry(0.05, 0.3, 1.8);
    const railMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0x9F9EA1 : 0xCBD5E0, 
      roughness: 0.2,
      metalness: 0.9
    });
    
    // Left rail
    const leftRail = new THREE.Mesh(railGeometry, railMaterial);
    leftRail.position.set(-0.425, 0.5, 0);
    leftRail.castShadow = true;
    bedGroup.add(leftRail);
    
    // Right rail
    const rightRail = new THREE.Mesh(railGeometry, railMaterial);
    rightRail.position.set(0.425, 0.5, 0);
    rightRail.castShadow = true;
    bedGroup.add(rightRail);
    
    // Add bed head/foot boards
    const headboardGeometry = new THREE.BoxGeometry(0.9, 0.6, 0.08);
    const headboardMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0x8A898C : 0xA0AEC0,
      roughness: 0.4,
      metalness: 0.5
    });
    
    // Headboard (at the top)
    const headboard = new THREE.Mesh(headboardGeometry, headboardMaterial);
    headboard.position.set(0, 0.5, -1.05);
    headboard.castShadow = true;
    bedGroup.add(headboard);
    
    // Footboard (at the bottom)
    const footboard = new THREE.Mesh(headboardGeometry, headboardMaterial);
    footboard.position.set(0, 0.5, 1.05);
    footboard.castShadow = true;
    bedGroup.add(footboard);
    
    // Add legs
    const legGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0x8A898C : 0xA0AEC0,
      roughness: 0.2,
      metalness: 0.8
    });
    
    // Position legs at each corner
    const legPositions = [
      [-0.4, 0, -0.9],
      [0.4, 0, -0.9],
      [-0.4, 0, 0.9],
      [0.4, 0, 0.9]
    ];
    
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos[0], -0.15, pos[1]);
      leg.castShadow = true;
      bedGroup.add(leg);
    });
    
    // Position the bed at the given position
    bedGroup.position.copy(position);
    
    // Set user data for interaction
    bedGroup.userData.id = id;
    bedGroup.userData.type = 'bed';
    
    return bedGroup;
  };
  
  // Helper function to create a more realistic patient
  const createPatient = (position: THREE.Vector3, id: string, status: PatientStatus, isSelected: boolean): THREE.Group => {
    const patientGroup = new THREE.Group();
    
    // Choose material based on patient status and selection state
    let bodyMaterial;
    
    if (isSelected) {
      // Selected patient has brighter emissive intensity
      bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: status === 'critical' ? 0xea384c : status === 'stable' ? 0x4ade80 : 0x8E9196,
        emissive: status === 'critical' ? 0xea384c : status === 'stable' ? 0x4ade80 : 0x8E9196,
        emissiveIntensity: isDarkMode ? 1.2 : 0.8,
        roughness: 0.6,
        metalness: 0.1
      });
    } else {
      // Regular patient
      bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: status === 'critical' ? 0xea384c : status === 'stable' ? 0x4ade80 : 0x8E9196,
        emissive: status === 'critical' ? 0xea384c : status === 'stable' ? 0x4ade80 : 0x8E9196,
        emissiveIntensity: isDarkMode ? 0.7 : 0.5,
        roughness: 0.6,
        metalness: 0.1
      });
    }
    
    // Create a more realistic body - torso
    const torsoGeometry = new THREE.CapsuleGeometry(0.25, 0.8, 4, 8);
    const torso = new THREE.Mesh(torsoGeometry, bodyMaterial);
    torso.position.y = 0.55;
    torso.rotation.x = Math.PI / 2;
    torso.castShadow = true;
    patientGroup.add(torso);
    
    // Create head
    const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.6, -0.65);
    head.castShadow = true;
    patientGroup.add(head);
    
    // Create arms and legs with simplified shapes for performance
    
    // Left arm
    const armGeometry = new THREE.CapsuleGeometry(0.08, 0.5, 4, 8);
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.35, 0.55, -0.15);
    leftArm.rotation.z = Math.PI / 2;
    leftArm.castShadow = true;
    patientGroup.add(leftArm);
    
    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.35, 0.55, -0.15);
    rightArm.rotation.z = -Math.PI / 2;
    rightArm.castShadow = true;
    patientGroup.add(rightArm);
    
    // Add a blanket covering legs
    const blanketGeometry = new THREE.BoxGeometry(0.7, 0.08, 0.9);
    const blanketMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0xD3E4FD : 0xEBF8FF, // Light blue
      roughness: 0.8,
      metalness: 0.0
    });
    const blanket = new THREE.Mesh(blanketGeometry, blanketMaterial);
    blanket.position.set(0, 0.5, 0.5);
    blanket.castShadow = true;
    patientGroup.add(blanket);
    
    // Critical patients get monitoring equipment
    if (status === 'critical') {
      // Add a simple IV stand
      const ivPoleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
      const ivPoleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xCCCCCC, 
        roughness: 0.2, 
        metalness: 0.9 
      });
      const ivPole = new THREE.Mesh(ivPoleGeometry, ivPoleMaterial);
      ivPole.position.set(0.45, 0.9, -0.3);
      patientGroup.add(ivPole);
      
      // Add IV bag
      const ivBagGeometry = new THREE.BoxGeometry(0.05, 0.15, 0.05);
      const ivBagMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF, 
        transparent: true,
        opacity: 0.7,
        roughness: 0.1
      });
      const ivBag = new THREE.Mesh(ivBagGeometry, ivBagMaterial);
      ivBag.position.set(0.45, 1.4, -0.3);
      patientGroup.add(ivBag);
    }
    
    // Position the patient
    patientGroup.position.copy(position);
    
    // Set user data for interaction
    patientGroup.userData.id = id;
    patientGroup.userData.type = 'patient';
    
    return patientGroup;
  };
  
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
    console.log("Dark mode enabled:", isDarkMode);
    console.log("Number of beds:", beds.length);
    
    // Scene setup with background based on theme
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDarkMode ? 0x1A1F2C : 0xF6F6F7);
    
    // Add fog for depth perception - adjust based on theme
    scene.fog = new THREE.FogExp2(isDarkMode ? 0x1A1F2C : 0xF6F6F7, 0.015);
    
    // Camera setup for isometric view with better positioning
    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const camera = new THREE.OrthographicCamera(
      -10 * aspect, 10 * aspect, 10, -10, 0.1, 1000
    );
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
    
    // Enhanced renderer with better settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
      alpha: true
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountRef.current.appendChild(renderer.domElement);
    
    // Improved orbit controls for smoother rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 10;
    controls.maxDistance = 60;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.enableRotate = true;
    controls.rotateSpeed = 0.7;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.0;
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    
    // Enhanced lighting system - adjusted based on theme
    const ambientLight = new THREE.AmbientLight(
      isDarkMode ? 0x6E59A5 : 0xF0EAD6, 
      isDarkMode ? 0.3 : 0.5
    );
    scene.add(ambientLight);
    
    // Main directional light with shadows
    const directionalLight = new THREE.DirectionalLight(
      isDarkMode ? 0xffffff : 0xF5F5F5, 
      isDarkMode ? 0.8 : 0.9
    );
    directionalLight.position.set(15, 25, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);
    
    // Fill light for better illumination
    const fillLight = new THREE.DirectionalLight(
      isDarkMode ? 0x8B5CF6 : 0x90CDF4, 
      isDarkMode ? 0.3 : 0.4
    );
    fillLight.position.set(-15, 10, 15);
    scene.add(fillLight);
    
    // Accent point light
    const pointLight = new THREE.PointLight(
      isDarkMode ? 0x0EA5E9 : 0x3182CE, 
      isDarkMode ? 1.0 : 0.8, 
      50
    );
    pointLight.position.set(0, 15, 0);
    pointLight.castShadow = true;
    pointLight.shadow.bias = -0.001;
    scene.add(pointLight);
    
    // Raycaster for object selection
    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.1;
    raycaster.params.Points.threshold = 0.1;
    const mouse = new THREE.Vector2();
    
    // Map of all interactive objects
    const interactiveObjects: { [key: string]: THREE.Object3D } = {};
    
    // Store references to patient meshes for highlighting
    const patientGroups: { [key: string]: THREE.Group } = {};
    
    // Enhanced materials with PBR properties
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0x403E43 : 0xE2E8F0,
      roughness: 0.7,
      metalness: 0.3,
      envMapIntensity: 0.8
    });
    
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0xF1F0FB : 0xFFFFFF,
      roughness: 0.9,
      metalness: 0.1,
      envMapIntensity: 0.5
    });
    
    const nightstandMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0x8A898C : 0xA0AEC0,
      roughness: 0.6,
      metalness: 0.4,
      envMapIntensity: 0.7
    });
    
    // Create equipment materials
    const equipmentMaterials = {
      default: new THREE.MeshStandardMaterial({ 
        color: isDarkMode ? 0xb0b0b0 : 0xA0AEC0, // Gray
        roughness: 0.2,
        metalness: 0.8
      }),
      screen: new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        emissive: isDarkMode ? 0x1EAEDB : 0x3182CE,
        emissiveIntensity: isDarkMode ? 0.5 : 0.3,
        roughness: 0.1,
        metalness: 0.9
      }),
      working: new THREE.MeshStandardMaterial({ 
        color: 0x4ade80,
        emissive: 0x4ade80,
        emissiveIntensity: isDarkMode ? 0.5 : 0.3
      }),
      maintenance: new THREE.MeshStandardMaterial({ 
        color: 0xfbbd23,
        emissive: 0xfbbd23,
        emissiveIntensity: isDarkMode ? 0.5 : 0.3
      }),
      offline: new THREE.MeshStandardMaterial({ 
        color: 0xea384c,
        emissive: 0xea384c,
        emissiveIntensity: isDarkMode ? 0.3 : 0.2
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: isDarkMode ? 0xffffff : 0xE2E8F0,
        transparent: true,
        opacity: isDarkMode ? 0.3 : 0.4,
        roughness: 0.1, 
        transmission: isDarkMode ? 0.9 : 0.7,
        ior: 1.5
      })
    };
    
    // Create medical equipment factory functions
    const createEquipment = (type: string, position: THREE.Vector3, status: 'working' | 'maintenance' | 'offline' = 'working') => {
      const group = new THREE.Group();
      let statusLight: THREE.Mesh;
      const statusMaterial = equipmentMaterials[status];
      
      switch(type) {
        case 'monitor': {
          // Base stand
          const standGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 16);
          const stand = new THREE.Mesh(standGeometry, equipmentMaterials.default);
          stand.position.y = 0.4;
          group.add(stand);
          
          // Monitor arm
          const armGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
          const arm = new THREE.Mesh(armGeometry, equipmentMaterials.default);
          arm.position.y = 1.2;
          group.add(arm);
          
          // Screen
          const screenGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.08);
          const screen = new THREE.Mesh(screenGeometry, equipmentMaterials.screen);
          screen.position.y = 1.5;
          screen.position.z = 0.1;
          group.add(screen);
          
          // Status light
          const lightGeometry = new THREE.SphereGeometry(0.08, 16, 16);
          statusLight = new THREE.Mesh(lightGeometry, statusMaterial);
          statusLight.position.set(0.3, 1.3, 0);
          
          // Animate the screen
          const animateScreen = () => {
            const time = Date.now() * 0.001;
            const screenMat = screen.material as THREE.MeshStandardMaterial;
            screenMat.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.1;
          };
          (screen as any).animate = animateScreen;
          
          break;
        }
        
        case 'ventilator': {
          // Base unit
          const baseGeometry = new THREE.BoxGeometry(0.7, 1.2, 0.7);
          const base = new THREE.Mesh(baseGeometry, equipmentMaterials.default);
          base.position.y = 0.6;
          group.add(base);
          
          // Screen
          const screenGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.05);
          const screen = new THREE.Mesh(screenGeometry, equipmentMaterials.screen);
          screen.position.y = 0.9;
          screen.position.z = 0.38;
          group.add(screen);
          
          // Tubes
          const tubeGeometry = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(0, 0.8, 0.35),
              new THREE.Vector3(0.3, 0.7, 0.4),
              new THREE.Vector3(0.4, 0.5, 0.5),
              new THREE.Vector3(0.3, 0, 0.5),
            ]),
            20, 0.05, 8, false
          );
          const tube = new THREE.Mesh(tubeGeometry, new THREE.MeshStandardMaterial({
            color: 0xdedede,
            roughness: 0.7
          }));
          group.add(tube);
          
          // Status light
          const lightGeometry = new THREE.SphereGeometry(0.08, 16, 16);
          statusLight = new THREE.Mesh(lightGeometry, statusMaterial);
          statusLight.position.set(-0.25, 1.05, 0.38);
          
          // Animate the screen
          const animateScreen = () => {
            const time = Date.now() * 0.001;
            const screenMat = screen.material as THREE.MeshStandardMaterial;
            screenMat.emissiveIntensity = 0.4 + Math.sin(time * 4) * 0.2;
          };
          (screen as any).animate = animateScreen;
          
          break;
        }
        
        case 'ct-scanner': {
          // Scanner base
          const baseGeometry = new THREE.CylinderGeometry(1.4, 1.4, 0.4, 32);
          const base = new THREE.Mesh(baseGeometry, equipmentMaterials.default);
          base.position.y = 0.2;
          group.add(base);
          
          // Scanner gantry (the ring)
          const ringGeometry = new THREE.TorusGeometry(1.2, 0.2, 16, 32);
          const ring = new THREE.Mesh(ringGeometry, equipmentMaterials.default);
          ring.position.y = 1.0;
          ring.rotation.x = Math.PI / 2;
          group.add(ring);
          
          // Patient table
          const tableGeometry = new THREE.BoxGeometry(0.8, 0.1, 2.5);
          const table = new THREE.Mesh(tableGeometry, equipmentMaterials.default);
          table.position.y = 0.7;
          table.position.z = 0.5;
          group.add(table);
          
          // Control panel
          const panelGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.15);
          const panel = new THREE.Mesh(panelGeometry, equipmentMaterials.default);
          panel.position.set(-1.0, 1.0, 1.5);
          group.add(panel);
          
          // Screen on panel
          const screenGeometry = new THREE.PlaneGeometry(0.4, 0.3);
          const screen = new THREE.Mesh(screenGeometry, equipmentMaterials.screen);
          screen.position.set(-1.0, 1.2, 1.58);
          group.add(screen);
          
          // Status light
          const lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
          statusLight = new THREE.Mesh(lightGeometry, statusMaterial);
          statusLight.position.set(-1.0, 0.8, 1.58);
          
          // Animate the ring
          const animateRing = () => {
            const time = Date.now() * 0.001;
            if (status === 'working') {
              ring.rotation.z = time * 0.3;
            }
          };
          (ring as any).animate = animateRing;
          
          // Animate screen 
          const animateScreen = () => {
            const time = Date.now() * 0.001;
            const screenMat = screen.material as THREE.MeshStandardMaterial;
            screenMat.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.1;
          };
          (screen as any).animate = animateScreen;
          
          break;
        }
        
        case 'mri': {
          // Main body
          const bodyGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2, 32);
          const body = new THREE.Mesh(bodyGeometry, equipmentMaterials.default);
          body.position.y = 1;
          body.rotation.x = Math.PI / 2;
          group.add(body);
          
          // Bore hole (the tunnel)
          const boreGeometry = new THREE.CylinderGeometry(0.6, 0.6, 2.2, 32);
          const bore = new THREE.Mesh(boreGeometry, new THREE.MeshBasicMaterial({ 
            color: 0x000000 
          }));
          bore.position.y = 1;
          bore.rotation.x = Math.PI / 2;
          group.add(bore);
          
          // Patient table
          const tableGeometry = new THREE.BoxGeometry(0.8, 0.1, 3);
          const table = new THREE.Mesh(tableGeometry, equipmentMaterials.default);
          table.position.y = 0.7;
          table.position.z = 0.5;
          group.add(table);
          
          // Control terminal
          const terminalGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.5);
          const terminal = new THREE.Mesh(terminalGeometry, equipmentMaterials.default);
          terminal.position.set(-1.5, 0.6, 1.5);
          group.add(terminal);
          
          // Screen
          const screenGeometry = new THREE.PlaneGeometry(0.6, 0.5);
          const screen = new THREE.Mesh(screenGeometry, equipmentMaterials.screen);
          screen.position.set(-1.5, 1.0, 1.76);
          group.add(screen);
          
          // Status light
          const lightGeometry = new THREE.SphereGeometry(0.12, 16, 16);
          statusLight = new THREE.Mesh(lightGeometry, statusMaterial);
          statusLight.position.set(0, 1.8, 0);
          
          // Animate the screen
          const animateScreen = () => {
            const time = Date.now() * 0.001;
            const screenMat = screen.material as THREE.MeshStandardMaterial;
            screenMat.emissiveIntensity = 0.3 + Math.sin(time * 1.5) * 0.15;
          };
          (screen as any).animate = animateScreen;
          
          break;
        }
        
        case 'surgical-lights': {
          // Main boom arm
          const boomGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
          const boom = new THREE.Mesh(boomGeometry, equipmentMaterials.default);
          boom.position.y = 2.25;
          boom.rotation.x = Math.PI / 2;
          group.add(boom);
          
          // Light housing
          const housingGeometry = new THREE.CylinderGeometry(0.4, 0.6, 0.2, 16);
          const housing = new THREE.Mesh(housingGeometry, equipmentMaterials.default);
          housing.position.y = 1.5;
          group.add(housing);
          
          // Light lens
          const lensGeometry = new THREE.CircleGeometry(0.5, 32);
          const lens = new THREE.Mesh(lensGeometry, new THREE.MeshBasicMaterial({ 
            color: status === 'working' ? 0xffffee : 0x555555,
            transparent: true,
            opacity: 0.9
          }));
          lens.position.y = 1.38;
          lens.rotation.x = -Math.PI / 2;
          group.add(lens);
          
          // Add a spotlight
          const spotlight = new THREE.SpotLight(
            status === 'working' ? 0xffffee : 0x000000, 
            status === 'working' ? 1 : 0, 
            10, 
            Math.PI / 4, 
            0.5
          );
          spotlight.position.set(0, 1.5, 0);
          spotlight.target.position.set(0, 0, 0);
          group.add(spotlight);
          group.add(spotlight.target);
          
          // Status light
          const lightGeometry = new THREE.SphereGeometry(0.08, 16, 16);
          statusLight = new THREE.Mesh(lightGeometry, statusMaterial);
          statusLight.position.set(0.3, 1.5, 0);
          
          // Animate the light
          const animateLight = () => {
            if (status === 'working') {
              const time = Date.now() * 0.001;
              const lensMat = lens.material as THREE.MeshBasicMaterial;
              lensMat.opacity = 0.8 + Math.sin(time) * 0.1;
            }
          };
          (lens as any).animate = animateLight;
          
          break;
        }
        
        case 'anesthesia-machine': {
          // Main body
          const bodyGeometry = new THREE.BoxGeometry(0.8, 1.4, 0.6);
          const body = new THREE.Mesh(bodyGeometry, equipmentMaterials.default);
          body.position.y = 0.7;
          group.add(body);
          
          // Gas canisters
          const cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16);
          const cylinder1 = new THREE.Mesh(cylinderGeometry, new THREE.MeshStandardMaterial({ 
            color: 0x6e9df1, roughness: 0.2, metalness: 0.9 
          }));
          cylinder1.position.set(-0.25, 1.2, 0.35);
          group.add(cylinder1);
          
          const cylinder2 = new THREE.Mesh(cylinderGeometry, new THREE.MeshStandardMaterial({ 
            color: 0xc1f16e, roughness: 0.2, metalness: 0.9 
          }));
          cylinder2.position.set(0, 1.2, 0.35);
          group.add(cylinder2);
          
          const cylinder3 = new THREE.Mesh(cylinderGeometry, new THREE.MeshStandardMaterial({ 
            color: 0xf1a66e, roughness: 0.2, metalness: 0.9 
          }));
          cylinder3.position.set(0.25, 1.2, 0.35);
          group.add(cylinder3);
          
          // Monitor
          const monitorGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.05);
          const monitor = new THREE.Mesh(monitorGeometry, equipmentMaterials.screen);
