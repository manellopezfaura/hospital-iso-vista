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
  
  // Helper function to create a debug bed for visual testing
  const createDebugBed = (position: THREE.Vector3, id: string): THREE.Group => {
    const bedGroup = new THREE.Group();
    
    // Create bed frame (simple box for debugging)
    const frameGeometry = new THREE.BoxGeometry(0.9, 0.3, 2.1);
    const frameMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8888ff, 
      roughness: 0.4,
      metalness: 0.7
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 0.15;
    frame.castShadow = true;
    frame.receiveShadow = true;
    bedGroup.add(frame);
    
    // Create mattress (simple box on top of frame)
    const mattressGeometry = new THREE.BoxGeometry(0.8, 0.1, 2);
    const mattressMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xccccff, 
      roughness: 0.5,
      metalness: 0.0
    });
    const mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
    mattress.position.y = 0.35;
    mattress.castShadow = true;
    mattress.receiveShadow = true;
    bedGroup.add(mattress);
    
    // Position the bed at the given position
    bedGroup.position.copy(position);
    
    // Set user data for interaction
    bedGroup.userData.id = id;
    bedGroup.userData.type = 'bed';
    
    return bedGroup;
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
    scene.background = new THREE.Color(isDarkMode ? 0x1A1F2C : 0xF6F6F7); // Dark purple or light gray
    
    // Add fog for depth perception - adjust based on theme
    scene.fog = new THREE.FogExp2(isDarkMode ? 0x1A1F2C : 0xF6F6F7, 0.015);
    
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
    
    // Enhanced lighting system - adjusted based on theme
    // Ambient light with slight blue tint in dark mode or warm tint in light mode
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
    
    // Fill light for better illumination - color based on theme
    const fillLight = new THREE.DirectionalLight(
      isDarkMode ? 0x8B5CF6 : 0x90CDF4, 
      isDarkMode ? 0.3 : 0.4
    );
    fillLight.position.set(-15, 10, 15);
    scene.add(fillLight);
    
    // Accent point light - color based on theme
    const pointLight = new THREE.PointLight(
      isDarkMode ? 0x0EA5E9 : 0x3182CE, 
      isDarkMode ? 1.0 : 0.8, 
      50
    );
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
    
    // Define realistic hospital room layouts - more varied and complex
    const roomLayouts = [
      // ICU ward - compact rooms with equipment
      { 
        type: 'ICU',
        rooms: [
          { position: [-12, -9], width: 5, height: 4, bedsPerRoom: 2, equipment: ['monitor', 'ventilator'] },
          { position: [-6, -9], width: 5, height: 4, bedsPerRoom: 2, equipment: ['monitor', 'ventilator'] },
          { position: [0, -9], width: 5, height: 4, bedsPerRoom: 2, equipment: ['monitor', 'ventilator'] },
          { position: [-12, -4], width: 5, height: 4, bedsPerRoom: 2, equipment: ['monitor', 'ventilator'] },
          { position: [-6, -4], width: 5, height: 4, bedsPerRoom: 2, equipment: ['monitor', 'ventilator'] },
          { position: [0, -4], width: 5, height: 4, bedsPerRoom: 2, equipment: ['monitor', 'ventilator'] }
        ],
        common: [
          { type: 'nurses-station', position: [4, -6.5], rotation: 0 },
          { type: 'mri', position: [8, -9], rotation: 0 }
        ]
      },
      // Emergency room - open layout with treatment areas
      {
        type: 'Emergency',
        rooms: [
          { position: [-12, -9], width: 4, height: 4, bedsPerRoom: 1, equipment: ['monitor', 'crash-cart'] },
          { position: [-7, -9], width: 4, height: 4, bedsPerRoom: 1, equipment: ['monitor', 'crash-cart'] },
          { position: [-2, -9], width: 4, height: 4, bedsPerRoom: 1, equipment: ['monitor', 'crash-cart'] },
          { position: [3, -9], width: 4, height: 4, bedsPerRoom: 1, equipment: ['monitor', 'crash-cart'] },
          { position: [-12, -4], width: 6, height: 6, bedsPerRoom: 0, equipment: ['ct-scanner'] },
          { position: [-5, -4], width: 12, height: 6, bedsPerRoom: 6, equipment: ['triage'] }
        ],
        common: [
          { type: 'reception', position: [0, -12], rotation: Math.PI/2 },
          { type: 'ambulance-bay', position: [-12, -14], rotation: 0 }
        ]
      },
      // General ward - standard patient rooms
      {
        type: 'General',
        rooms: [
          { position: [-12, -10], width: 4, height: 4, bedsPerRoom: 2, equipment: ['iv-stand'] },
          { position: [-7, -10], width: 4, height: 4, bedsPerRoom: 2, equipment: ['iv-stand'] },
          { position: [-2, -10], width: 4, height: 4, bedsPerRoom: 2, equipment: ['iv-stand'] },
          { position: [3, -10], width: 4, height: 4, bedsPerRoom: 2, equipment: ['iv-stand'] },
          { position: [-12, -5], width: 4, height: 4, bedsPerRoom: 2, equipment: ['iv-stand'] },
          { position: [-7, -5], width: 4, height: 4, bedsPerRoom: 2, equipment: ['iv-stand'] },
          { position: [-2, -5], width: 4, height: 4, bedsPerRoom: 2, equipment: ['iv-stand'] },
          { position: [3, -5], width: 4, height: 4, bedsPerRoom: 2, equipment: ['iv-stand'] }
        ],
        common: [
          { type: 'nurses-station', position: [-4, -13], rotation: Math.PI/2 },
          { type: 'storage', position: [9, -7], rotation: 0 }
        ]
      },
      // Surgery floor - operating rooms and recovery
      {
        type: 'Surgery',
        rooms: [
          { position: [-12, -10], width: 7, height: 7, bedsPerRoom: 1, equipment: ['surgical-lights', 'anesthesia-machine'] },
          { position: [-4, -10], width: 7, height: 7, bedsPerRoom: 1, equipment: ['surgical-lights', 'anesthesia-machine'] },
          { position: [4, -10], width: 7, height: 7, bedsPerRoom: 1, equipment: ['surgical-lights', 'anesthesia-machine'] },
          { position: [-12, -2], width: 5, height: 8, bedsPerRoom: 4, equipment: ['monitor'] }, // recovery
          { position: [-6, -2], width: 5, height: 8, bedsPerRoom: 4, equipment: ['monitor'] }, // recovery
          { position: [0, -2], width: 5, height: 8, bedsPerRoom: 4, equipment: ['monitor'] }, // recovery
        ],
        common: [
          { type: 'scrub-station', position: [-8, -12], rotation: 0 },
          { type: 'sterile-supply', position: [0, -12], rotation: 0 },
          { type: 'viewing-gallery', position: [8, -12], rotation: 0 }
        ]
      }
    ];
    
    // Enhanced materials with PBR properties - adjusted for light/dark mode
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0x403E43 : 0xE2E8F0, // Charcoal gray or light gray
      roughness: 0.7,
      metalness: 0.3,
      envMapIntensity: 0.8
    });
    
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0xF1F0FB : 0xFFFFFF, // Soft gray or white
      roughness: 0.9,
      metalness: 0.1,
      envMapIntensity: 0.5
    });
    
    const bedFrameMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0x9F9EA1 : 0xCBD5E0, // Silver gray or light gray
      roughness: 0.4,
      metalness: 0.7,
      envMapIntensity: 1.0
    });
    
    const bedSheetMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0xD3E4FD : 0xEBF8FF, // Soft blue or lighter blue
      roughness: 0.5,
      metalness: 0.0,
      envMapIntensity: 0.5
    });
    
    const nightstandMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0x8A898C : 0xA0AEC0, // Medium gray or medium blue-gray
      roughness: 0.6,
      metalness: 0.4,
      envMapIntensity: 0.7
    });
    
    // Glossy patient status materials with glow effect - keep same colors but adjust intensity
    const patientStatusMaterials = {
      critical: new THREE.MeshStandardMaterial({ 
        color: 0xea384c, // Red for critical
        emissive: 0xea384c,
        emissiveIntensity: isDarkMode ? 0.9 : 0.6,
        roughness: 0.3,
        metalness: 0.2
      }),
      stable: new THREE.MeshStandardMaterial({ 
        color: 0x4ade80, // Green for stable
        emissive: 0x4ade80,
        emissiveIntensity: isDarkMode ? 0.7 : 0.5,
        roughness: 0.3,
        metalness: 0.2
      }),
      discharged: new THREE.MeshStandardMaterial({ 
        color: 0x8E9196, // Gray for discharged
        emissive: 0x8E9196,
        emissiveIntensity: isDarkMode ? 0.2 : 0.1,
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
      material.emissiveIntensity = isDarkMode ? 0.2 : 0.1;
    });
    
    // Create highlighted versions of patient materials for selected patient
    const highlightedPatientMaterials = {
      critical: patientStatusMaterials.critical.clone(),
      stable: patientStatusMaterials.stable.clone(),
      discharged: patientStatusMaterials.discharged.clone()
    };
    
    // Apply highlighting effect to selected patient materials
    Object.values(highlightedPatientMaterials).forEach(material => {
      material.emissiveIntensity = isDarkMode ? 1.2 : 0.8;
    });
    
    // Create environment map for shiny reflections
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    cubeRenderTarget.texture.type = THREE.HalfFloatType;
    const cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
    scene.add(cubeCamera);
    
    // Equipment materials - adjusted for light/dark mode
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
          monitor.position.set(0, 1.6, 0);
          group.add(monitor);
          
          // Tubing
          const tubeGeometry = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(0, 0.7, 0.3),
              new THREE.Vector3(0.3, 0.5, 0.4),
              new THREE.Vector3(0.5, 0.3, 0.3),
              new THREE.Vector3(0.7, 0, 0.3),
            ]),
            20, 0.03, 8, false
          );
          const tube = new THREE.Mesh(tubeGeometry, new THREE.MeshStandardMaterial({
            color: 0xdedede,
            roughness: 0.7
          }));
          group.add(tube);
          
          // Status light
          const lightGeometry = new THREE.SphereGeometry(0.07, 16, 16);
          statusLight = new THREE.Mesh(lightGeometry, statusMaterial);
          statusLight.position.set(-0.25, 0.4, 0.31);
          
          // Animate the monitor
          const animateMonitor = () => {
            const time = Date.now() * 0.001;
            const monitorMat = monitor.material as THREE.MeshStandardMaterial;
            monitorMat.emissiveIntensity = 0.5 + Math.sin(time * 3) * 0.2;
          };
          (monitor as any).animate = animateMonitor;
          
          break;
        }
      }
      
      // Add the status light to the group if it exists
      if (statusLight) {
        group.add(statusLight);
      }
      
      // Position the equipment
      group.position.set(position.x, position.y, position.z);
      
      return group;
    };
    
    // Create floors and rooms
    const floorObjects: { [key: string]: THREE.Group } = {};
    
    let bedsAdded = 0;
    
    floors.forEach((floor, floorIndex) => {
      const floorGroup = new THREE.Group();
      floorGroup.position.y = floorIndex * 5; // Stack floors vertically
      
      // Create floor base
      const floorBaseGeometry = new THREE.BoxGeometry(30, 0.5, 25);
      const floorBase = new THREE.Mesh(floorBaseGeometry, floorMaterial);
      floorBase.position.y = -0.25;
      floorBase.receiveShadow = true;
      floorGroup.add(floorBase);
      
      // Find layout for this floor type
      const layout = roomLayouts.find(l => l.type === floor.type) || roomLayouts[0];
      
      // Create rooms based on layout
      layout.rooms.forEach((room, roomIndex) => {
        const roomGroup = new THREE.Group();
        
        // Create room floor
        const roomFloorGeometry = new THREE.BoxGeometry(room.width, 0.1, room.height);
        const roomFloor = new THREE.Mesh(roomFloorGeometry, floorMaterial);
        roomFloor.position.set(room.position[0] + room.width/2, 0, room.position[1] + room.height/2);
        roomFloor.receiveShadow = true;
        roomGroup.add(roomFloor);
        
        // Create room walls
        const wallHeight = 3;
        const wallThickness = 0.2;
        
        // Back wall
        const backWallGeometry = new THREE.BoxGeometry(room.width, wallHeight, wallThickness);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(
          room.position[0] + room.width/2, 
          wallHeight/2, 
          room.position[1]
        );
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        roomGroup.add(backWall);
        
        // Left wall
        const leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, room.height);
        const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        leftWall.position.set(
          room.position[0], 
          wallHeight/2, 
          room.position[1] + room.height/2
        );
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        roomGroup.add(leftWall);
        
        // Right wall
        const rightWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, room.height);
        const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
        rightWall.position.set(
          room.position[0] + room.width, 
          wallHeight/2, 
          room.position[1] + room.height/2
        );
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        roomGroup.add(rightWall);
        
        // Create beds in the room based on the beds array from hospital data
        if (room.bedsPerRoom > 0) {
          // Filter beds for this floor and room
          const bedsInRoom = beds.filter(bed => 
            bed.floor === floor.type && 
            bed.room.includes(`Room ${roomIndex + 1}`)
          );
          
          console.log(`Floor ${floor.name}, Room ${roomIndex + 1}: Found ${bedsInRoom.length} beds`);
          
          bedsInRoom.forEach((bed, bedIndex) => {
            // Calculate bed position within the room
            const offsetX = (room.width - room.bedsPerRoom * 1.2) / (room.bedsPerRoom + 1);
            const bedX = room.position[0] + offsetX + (bedIndex % room.bedsPerRoom) * (1.2 + offsetX);
            const bedY = 0;
            const bedZ = room.position[1] + room.height * 0.7 - Math.floor(bedIndex / room.bedsPerRoom) * 2.5;
            
            // Create bed frame
            const bedGroup = new THREE.Group();
            const frameGeometry = new THREE.BoxGeometry(0.9, 0.3, 2.1);
            const frame = new THREE.Mesh(frameGeometry, bedFrameMaterial);
            frame.position.y = 0.15;
            frame.castShadow = true;
            frame.receiveShadow = true;
            bedGroup.add(frame);
            
            // Create mattress
            const mattressGeometry = new THREE.BoxGeometry(0.8, 0.1, 2);
            const mattress = new THREE.Mesh(mattressGeometry, bedSheetMaterial);
            mattress.position.y = 0.35;
            mattress.castShadow = true;
            mattress.receiveShadow = true;
            bedGroup.add(mattress);
            
            // Position bed within room
            bedGroup.position.set(bedX, bedY, bedZ);
            
            // Add bed to interactive objects
            bedGroup.userData.id = bed.id;
            bedGroup.userData.type = 'bed';
            interactiveObjects[`bed-${bed.id}`] = bedGroup;
            
            // Add the bed to the room
            roomGroup.add(bedGroup);
            bedsAdded++;
            
            // Create nightstand next to bed
            const nightstandGeometry = new THREE.BoxGeometry(0.6, 0.7, 0.6);
            const nightstand = new THREE.Mesh(nightstandGeometry, nightstandMaterial);
            nightstand.position.set(bedX + 0.7, 0.35, bedZ - 0.5);
            nightstand.castShadow = true;
            nightstand.receiveShadow = true;
            roomGroup.add(nightstand);
            
            // Add patient to bed if occupied
            if (bed.status === 'occupied' && bed.patientId) {
              const patient = patients.find(p => p.id === bed.patientId);
              if (patient) {
                const patientGroup = new THREE.Group();
                
                // Create patient body
                const bodyGeometry = new THREE.CapsuleGeometry(0.25, 1.3, 4, 8);
                
                // Select material based on patient status
                let patientMaterial;
                
                if (selectedPatientId === patient.id) {
                  patientMaterial = new THREE.MeshStandardMaterial({ 
                    color: patient.status === 'critical' ? 0xea384c : patient.status === 'stable' ? 0x4ade80 : 0x8E9196,
                    emissive: patient.status === 'critical' ? 0xea384c : patient.status === 'stable' ? 0x4ade80 : 0x8E9196,
                    emissiveIntensity: isDarkMode ? 1.2 : 0.8,
                    roughness: 0.3,
                    metalness: 0.2
                  });
                } else {
                  patientMaterial = new THREE.MeshStandardMaterial({ 
                    color: patient.status === 'critical' ? 0xea384c : patient.status === 'stable' ? 0x4ade80 : 0x8E9196,
                    emissive: patient.status === 'critical' ? 0xea384c : patient.status === 'stable' ? 0x4ade80 : 0x8E9196,
                    emissiveIntensity: isDarkMode ? 0.7 : 0.5,
                    roughness: 0.3,
                    metalness: 0.2
                  });
                }
                
                const body = new THREE.Mesh(bodyGeometry, patientMaterial);
                body.position.y = 0.9;
                body.rotation.x = Math.PI / 2;
                body.castShadow = true;
                patientGroup.add(body);
                
                // Create patient head
                const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
                const head = new THREE.Mesh(headGeometry, patientMaterial);
                head.position.set(0, 0.9, -0.8);
                head.castShadow = true;
                patientGroup.add(head);
                
                // Track patient meshes for highlighting
                patientMeshes[patient.id] = [body, head];
                patientGroups[patient.id] = patientGroup;
                
                // Position patient on bed
                patientGroup.position.set(bedX, 0.35, bedZ);
                
                // Add patient to interactive objects
                patientGroup.userData.id = patient.id;
                patientGroup.userData.type = 'patient';
                interactiveObjects[`patient-${patient.id}`] = patientGroup;
                
                // Add the patient to the room
                roomGroup.add(patientGroup);
              }
            }
            
            // Add equipment based on room type
            if (room.equipment && room.equipment.length > 0) {
              const equipType = room.equipment[bedIndex % room.equipment.length];
              const eqPosition = new THREE.Vector3(
                bedX + (bedIndex % 2 ? 0.5 : -0.5), 
                0, 
                bedZ + (bedIndex % 2 ? 0.8 : -0.8)
              );
              const equipment = createEquipment(equipType, eqPosition);
              roomGroup.add(equipment);
            }
          });
          
          // If no beds were found for this room, add dummy beds for debugging
          if (bedsInRoom.length === 0 && room.bedsPerRoom > 0) {
            for (let i = 0; i < room.bedsPerRoom; i++) {
              const offsetX = (room.width - room.bedsPerRoom * 1.2) / (room.bedsPerRoom + 1);
              const bedX = room.position[0] + offsetX + i * (1.2 + offsetX);
              const bedZ = room.position[1] + room.height * 0.7;
              
              const dummyBedId = `dummy-bed-${floor.id}-${roomIndex}-${i}`;
              const dummyBed = createDebugBed(new THREE.Vector3(bedX, 0, bedZ), dummyBedId);
              roomGroup.add(dummyBed);
            }
          }
        }
        
        floorGroup.add(roomGroup);
      });
      
      // Add common areas from layout
      if (layout.common) {
        // ... keep existing code (common areas creation)
      }
      
      // Only show the selected floor or show all floors if none selected
      if (selectedFloor === floor.id) {
        floorGroup.visible = true;
        scene.add(floorGroup);
      } else if (!selectedFloor) {
        // If no floor selected, show all floors but offset them
        floorGroup.visible = true;
        floorGroup.position.y = floorIndex * 5;
        scene.add(floorGroup);
      } else {
        floorGroup.visible = false;
      }
      
      floorObjects[floor.id] = floorGroup;
    });
    
    console.log(`Total beds added to scene: ${bedsAdded}`);
    
    // Debug - add a sample bed if none were created
    if (bedsAdded === 0) {
      const debugBed = createDebugBed(new THREE.Vector3(0, 0, 0), "debug-bed-1");
      scene.add(debugBed);
      
      console.log("No beds were added from hospital data - added a debug bed at origin");
    }
    
    // Set up click handler for interactive objects
    const handleClick = (event: MouseEvent) => {
      if (!mountRef.current) return;
      
      // Calculate mouse position in normalized device coordinates
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Find intersections with interactive objects
      const interactiveArray = Object.values(interactiveObjects);
      const intersects = raycaster.intersectObjects(interactiveArray, true);
      
      if (intersects.length > 0) {
        // Find the first ancestor with userData
        let currentObject: THREE.Object3D | null = intersects[0].object;
        while (currentObject && (!currentObject.userData || !currentObject.userData.type)) {
          currentObject = currentObject.parent;
        }
        
        if (currentObject && currentObject.userData.id) {
          if (currentObject.userData.type === 'bed' && onBedSelect) {
            onBedSelect(currentObject.userData.id);
          } else if (currentObject.userData.type === 'patient' && onPatientSelect) {
            onPatientSelect(currentObject.userData.id);
          }
        }
      }
    };
    
    // Set up hover handler for interactive objects
    const handleMouseMove = (event: MouseEvent) => {
      if (!mountRef.current) return;
      
      // Calculate mouse position in normalized device coordinates
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Find intersections with interactive objects
      const interactiveArray = Object.values(interactiveObjects);
      const intersects = raycaster.intersectObjects(interactiveArray, true);
      
      // Reset hovered state
      if (hoveredObject) {
        setHoveredObject(null);
      }
      
      if (intersects.length > 0) {
        // Find the first ancestor with userData
        let currentObject: THREE.Object3D | null = intersects[0].object;
        while (currentObject && (!currentObject.userData || !currentObject.userData.type)) {
          currentObject = currentObject.parent;
        }
        
        if (currentObject && currentObject.userData.id) {
          setHoveredObject(`${currentObject.userData.type}-${currentObject.userData.id}`);
          document.body.style.cursor = 'pointer';
        } else {
          document.body.style.cursor = 'default';
        }
      } else {
        document.body.style.cursor = 'default';
      }
    };
    
    // Add event listeners
    mountRef.current.addEventListener('click', handleClick);
    mountRef.current.addEventListener('mousemove', handleMouseMove);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Update controls
      controls.update();
      
      // Animate any objects with animate methods
      scene.traverseVisible(object => {
        if (object.userData && (object as any).animate && typeof (object as any).animate === 'function') {
          (object as any).animate();
        }
      });
      
      // Render the scene
      renderer.render(scene, camera);
    };
    
    // Start the animation loop
    animate();
    
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
    
    // Clean up function
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current) {
        mountRef.current.removeEventListener('click', handleClick);
        mountRef.current.removeEventListener('mousemove', handleMouseMove);
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of resources
      renderer.dispose();
      
      // Dispose of geometries and materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
    };
  }, [hospital, selectedFloor, selectedPatientId, onBedSelect, onPatientSelect, isDarkMode, hoveredObject]);
  
  return <div ref={mountRef} className="w-full h-full" />;
};

export default ThreeJSCanvas;
