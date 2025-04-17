
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
    
    // Equipment materials
    const equipmentMaterials = {
      default: new THREE.MeshStandardMaterial({ 
        color: 0xb0b0b0, // Gray
        roughness: 0.2,
        metalness: 0.8
      }),
      screen: new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        emissive: 0x1EAEDB,
        emissiveIntensity: 0.5,
        roughness: 0.1,
        metalness: 0.9
      }),
      working: new THREE.MeshStandardMaterial({ 
        color: 0x4ade80,
        emissive: 0x4ade80,
        emissiveIntensity: 0.5
      }),
      maintenance: new THREE.MeshStandardMaterial({ 
        color: 0xfbbd23,
        emissive: 0xfbbd23,
        emissiveIntensity: 0.5
      }),
      offline: new THREE.MeshStandardMaterial({ 
        color: 0xea384c,
        emissive: 0xea384c,
        emissiveIntensity: 0.3
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1, 
        transmission: 0.9,
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
            screen.material.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.1;
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
            screen.material.emissiveIntensity = 0.4 + Math.sin(time * 4) * 0.2;
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
            screen.material.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.1;
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
            screen.material.emissiveIntensity = 0.3 + Math.sin(time * 1.5) * 0.15;
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
              lens.material.opacity = 0.8 + Math.sin(time) * 0.1;
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
            monitor.material.emissiveIntensity = 0.5 + Math.sin(time * 3) * 0.2;
          };
          (monitor as any).animate = animateMonitor;
          
          break;
        }
        
        case 'iv-stand': {
          // Pole
          const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.8, 8);
          const pole = new THREE.Mesh(poleGeometry, equipmentMaterials.default);
          pole.position.y = 0.9;
          group.add(pole);
          
          // Base
          const baseGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
          const base = new THREE.Mesh(baseGeometry, equipmentMaterials.default);
          base.position.y = 0.025;
          group.add(base);
          
          // Hooks
          const hookGeometry = new THREE.TorusGeometry(0.04, 0.01, 8, 16, Math.PI);
          const hook1 = new THREE.Mesh(hookGeometry, equipmentMaterials.default);
          hook1.position.set(0, 1.7, 0);
          hook1.rotation.x = Math.PI / 2;
          group.add(hook1);
          
          const hook2 = new THREE.Mesh(hookGeometry, equipmentMaterials.default);
          hook2.position.set(0, 1.7, 0);
          hook2.rotation.x = Math.PI / 2;
          hook2.rotation.y = Math.PI;
          group.add(hook2);
          
          // IV bag
          const bagGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.04);
          const bag = new THREE.Mesh(bagGeometry, new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
          }));
          bag.position.set(0, 1.55, 0.04);
          group.add(bag);
          
          // Tubing
          const tubeGeometry = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(0, 1.45, 0.04),
              new THREE.Vector3(-0.05, 1.2, 0.1),
              new THREE.Vector3(-0.1, 0.9, 0.12),
              new THREE.Vector3(-0.15, 0.5, 0.1),
            ]),
            20, 0.005, 8, false
          );
          const tube = new THREE.Mesh(tubeGeometry, new THREE.MeshStandardMaterial({
            color: 0xdedede,
            transparent: true,
            opacity: 0.8
          }));
          group.add(tube);
          
          // Status light - small indicator on regulator
          const lightGeometry = new THREE.SphereGeometry(0.02, 8, 8);
          statusLight = new THREE.Mesh(lightGeometry, statusMaterial);
          statusLight.position.set(0, 1.4, 0.06);
          
          // No animation for IV stand
          break;
        }
        
        case 'crash-cart': {
          // Cart body
          const bodyGeometry = new THREE.BoxGeometry(0.8, 0.9, 0.6);
          const body = new THREE.Mesh(bodyGeometry, new THREE.MeshStandardMaterial({ color: 0xe74c3c }));
          body.position.y = 0.45;
          group.add(body);
          
          // Top surface
          const topGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.6);
          const top = new THREE.Mesh(topGeometry, equipmentMaterials.default);
          top.position.y = 0.925;
          group.add(top);
          
          // Drawers
          for (let i = 0; i < 3; i++) {
            const drawerGeometry = new THREE.BoxGeometry(0.7, 0.25, 0.55);
            const drawer = new THREE.Mesh(drawerGeometry, new THREE.MeshStandardMaterial({ 
              color: 0xd63031 
            }));
            drawer.position.y = 0.15 + i * 0.28;
            drawer.position.z = -0.01;
            group.add(drawer);
            
            // Drawer handle
            const handleGeometry = new THREE.BoxGeometry(0.4, 0.04, 0.04);
            const handle = new THREE.Mesh(handleGeometry, equipmentMaterials.default);
            handle.position.y = 0.15 + i * 0.28;
            handle.position.z = 0.29;
            group.add(handle);
          }
          
          // Wheels
          const wheelPositions = [
            [-0.3, 0.08, -0.2],
            [0.3, 0.08, -0.2],
            [-0.3, 0.08, 0.2],
            [0.3, 0.08, 0.2]
          ];
          
          wheelPositions.forEach((pos) => {
            const wheelGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
            const wheel = new THREE.Mesh(wheelGeometry, equipmentMaterials.default);
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.rotation.x = Math.PI / 2;
            group.add(wheel);
          });
          
          // Defibrillator on top
          const defibGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.3);
          const defib = new THREE.Mesh(defibGeometry, equipmentMaterials.default);
          defib.position.y = 1.05;
          group.add(defib);
          
          // Defib screen
          const screenGeometry = new THREE.PlaneGeometry(0.2, 0.15);
          const screen = new THREE.Mesh(screenGeometry, equipmentMaterials.screen);
          screen.position.set(0, 1.1, 0.16);
          group.add(screen);
          
          // Status light
          const lightGeometry = new THREE.SphereGeometry(0.06, 16, 16);
          statusLight = new THREE.Mesh(lightGeometry, statusMaterial);
          statusLight.position.set(0.15, 1.1, 0.16);
          
          // Animate the screen
          const animateScreen = () => {
            const time = Date.now() * 0.001;
            if (status === 'working') {
              screen.material.emissiveIntensity = 0.4 + Math.sin(time * 5) * 0.3; // Fast blinking for crash cart
            } else {
              screen.material.emissiveIntensity = 0.1;
            }
          };
          (screen as any).animate = animateScreen;
          
          break;
        }
        
        // Add more equipment types here
        default: {
          // Generic equipment box
          const boxGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.6);
          const box = new THREE.Mesh(boxGeometry, equipmentMaterials.default);
          box.position.y = 0.4;
          group.add(box);
          
          // Status light
          const lightGeometry = new THREE.SphereGeometry(0.08, 16, 16);
          statusLight = new THREE.Mesh(lightGeometry, statusMaterial);
          statusLight.position.set(0, 0.8, 0.3);
          
          break;
        }
      }
      
      // Add status light to all equipment
      group.add(statusLight);
      
      // Add pulsing effect to status light
      const animateStatusLight = () => {
        const time = Date.now() * 0.001;
        if (status === 'working') {
          statusLight.material.emissiveIntensity = 0.5 + Math.sin(time * 1) * 0.2;
        } else if (status === 'maintenance') {
          statusLight.material.emissiveIntensity = 0.5 + Math.sin(time * 4) * 0.3; // Faster blink for maintenance
        } else {
          statusLight.material.emissiveIntensity = 0.2 + Math.sin(time * 8) * 0.1; // Very fast blink for offline
        }
      };
      
      (statusLight as any).animate = animateStatusLight;
      
      // Position
      group.position.copy(position);
      
      return group;
    };
    
    // Create floors with improved visuals
    floors.forEach((floor, floorIndex) => {
      // Skip if not the selected floor (unless none selected)
      if (selectedFloor && floor.id !== selectedFloor) {
        return;
      }
      
      // Position each floor with space in "All Floors" view
      const verticalOffset = selectedFloor ? 0 : -floorIndex * 10;
      const horizontalOffset = selectedFloor ? 0 : floorIndex * 8; // More spacing
      
      // Find the layout for this floor type
      const layout = roomLayouts.find(l => l.type === floor.type) || roomLayouts[2]; // Default to General if not found
      
      // Create floor base with grid pattern
      const floorGeometry = new THREE.BoxGeometry(28, 0.2, 24);
      const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
      floorMesh.position.set(
        horizontalOffset, 
        floor.level * 3 + verticalOffset, 
        -2 // Center better
      );
      floorMesh.receiveShadow = true;
      scene.add(floorMesh);
      
      // Add grid pattern to floor
      const gridHelper = new THREE.GridHelper(26, 26, 0x9ca3af, 0x9ca3af);
      gridHelper.position.set(
        horizontalOffset, 
        floor.level * 3 + verticalOffset + 0.11, 
        -2
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
            horizontalOffset - 12,
            floor.level * 3 + verticalOffset + 4,
            -2
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
      
      // Create rooms using the floor layout
      layout.rooms.forEach(room => {
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
        
        // Right wall with door opening
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
        const doorFrameMaterial = new THREE.MeshStandardMaterial({
          color: 0xd6d6d6,
          roughness: 0.1,
          metalness: 0.8
        });
        
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
        
        // Add equipment to the room
        if (room.equipment) {
          room.equipment.forEach((equipType, index) => {
            // Random position within the room
            const equipPos = new THREE.Vector3(
              x + width * 0.3 + (index % 2) * width * 0.4 + horizontalOffset,
              y + 0,
              z + height * 0.3 + Math.floor(index / 2) * height * 0.4
            );
            
            // Random status with 80% chance of working
            const statuses: ('working' | 'maintenance' | 'offline')[] = ['working', 'maintenance', 'offline'];
            const weight = [0.8, 0.15, 0.05]; // 80% working, 15% maintenance, 5% offline
            const randomValue = Math.random();
            let statusIndex = 0;
            let weightSum = 0;
            
            for (let i = 0; i < weight.length; i++) {
              weightSum += weight[i];
              if (randomValue <= weightSum) {
                statusIndex = i;
                break;
              }
            }
            
            const equipment = createEquipment(equipType, equipPos, statuses[statusIndex]);
            scene.add(equipment);
          });
        }
      });
      
      // Add common area equipment
      layout.common?.forEach(item => {
        const equipPos = new THREE.Vector3(
          item.position[0] + horizontalOffset,
          y + 0,
          item.position[1]
        );
        
        const equipment = createEquipment(item.type, equipPos, 'working');
        equipment.rotation.y = item.rotation;
        scene.add(equipment);
      });
    });
    
    console.log(`Total beds to render: ${beds.length}`);
    
    // Create beds with modern design and distribute them in rooms
    beds.forEach(bed => {
      const floorObj = floors.find(f => f.type === bed.floor);
      
      // Skip if not the selected floor (unless none selected)
      if (selectedFloor && floorObj && floorObj.id !== selectedFloor) {
        return;
      }
      
      // Calculate offset based on floor
      const floorIndex = floors.findIndex(f => f.type === bed.floor);
      const verticalOffset = selectedFloor ? 0 : -floorIndex * 10;
      const horizontalOffset = selectedFloor ? 0 : floorIndex * 8;
      
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
