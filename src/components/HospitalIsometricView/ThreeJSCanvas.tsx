import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Hospital, Bed, Patient, Position, BedStatus, PatientStatus, Floor } from '@/types/hospital';

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
  
  const positionToVector3 = (position: Position): THREE.Vector3 => {
    return new THREE.Vector3(position.x, position.y, position.z);
  };
  
  const createHospitalBed = (position: THREE.Vector3, id: string): THREE.Group => {
    const bedGroup = new THREE.Group();
    
    const frameGeometry = new THREE.BoxGeometry(0.9, 0.3, 2.1);
    const frameMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0x9F9EA1 : 0xCBD5E0,
      roughness: 0.3,
      metalness: 0.8
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 0.15;
    frame.castShadow = true;
    frame.receiveShadow = true;
    bedGroup.add(frame);
    
    const mattressGeometry = new THREE.BoxGeometry(0.8, 0.15, 1.9);
    const mattressMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0xD3E4FD : 0xEBF8FF,
      roughness: 0.7,
      metalness: 0.0
    });
    const mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
    mattress.position.y = 0.38;
    mattress.castShadow = true;
    mattress.receiveShadow = true;
    bedGroup.add(mattress);
    
    const pillowGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.4);
    const pillowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.0
    });
    const pillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
    pillow.position.set(0, 0.45, -0.7);
    pillow.castShadow = true;
    bedGroup.add(pillow);
    
    const railGeometry = new THREE.BoxGeometry(0.05, 0.3, 1.8);
    const railMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0x9F9EA1 : 0xCBD5E0,
      roughness: 0.2,
      metalness: 0.9
    });
    
    const leftRail = new THREE.Mesh(railGeometry, railMaterial);
    leftRail.position.set(-0.425, 0.5, 0);
    leftRail.castShadow = true;
    bedGroup.add(leftRail);
    
    const rightRail = new THREE.Mesh(railGeometry, railMaterial);
    rightRail.position.set(0.425, 0.5, 0);
    rightRail.castShadow = true;
    bedGroup.add(rightRail);
    
    const headboardGeometry = new THREE.BoxGeometry(0.9, 0.6, 0.08);
    const headboardMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0x8A898C : 0xA0AEC0,
      roughness: 0.4,
      metalness: 0.5
    });
    
    const headboard = new THREE.Mesh(headboardGeometry, headboardMaterial);
    headboard.position.set(0, 0.5, -1.05);
    headboard.castShadow = true;
    bedGroup.add(headboard);
    
    const footboard = new THREE.Mesh(headboardGeometry, headboardMaterial);
    footboard.position.set(0, 0.5, 1.05);
    footboard.castShadow = true;
    bedGroup.add(footboard);
    
    const legGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0x8A898C : 0xA0AEC0,
      roughness: 0.2,
      metalness: 0.8
    });
    
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
    
    bedGroup.position.copy(position);
    
    bedGroup.userData.id = id;
    bedGroup.userData.type = 'bed';
    
    return bedGroup;
  };
  
  const createPatient = (position: THREE.Vector3, id: string, status: PatientStatus, isSelected: boolean): THREE.Group => {
    const patientGroup = new THREE.Group();
    
    let bodyMaterial;
    
    if (isSelected) {
      bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: status === 'critical' ? 0xea384c : status === 'stable' ? 0x4ade80 : 0x8E9196,
        emissive: status === 'critical' ? 0xea384c : status === 'stable' ? 0x4ade80 : 0x8E9196,
        emissiveIntensity: isDarkMode ? 1.2 : 0.8,
        roughness: 0.6,
        metalness: 0.1
      });
    } else {
      bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: status === 'critical' ? 0xea384c : status === 'stable' ? 0x4ade80 : 0x8E9196,
        emissive: status === 'critical' ? 0xea384c : status === 'stable' ? 0x4ade80 : 0x8E9196,
        emissiveIntensity: isDarkMode ? 0.7 : 0.5,
        roughness: 0.6,
        metalness: 0.1
      });
    }
    
    const torsoGeometry = new THREE.CapsuleGeometry(0.25, 0.8, 4, 8);
    const torso = new THREE.Mesh(torsoGeometry, bodyMaterial);
    torso.position.y = 0.55;
    torso.rotation.x = Math.PI / 2;
    torso.castShadow = true;
    patientGroup.add(torso);
    
    const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.6, -0.65);
    head.castShadow = true;
    patientGroup.add(head);
    
    const armGeometry = new THREE.CapsuleGeometry(0.08, 0.5, 4, 8);
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.35, 0.55, -0.15);
    leftArm.rotation.z = Math.PI / 2;
    leftArm.castShadow = true;
    patientGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.35, 0.55, -0.15);
    rightArm.rotation.z = -Math.PI / 2;
    rightArm.castShadow = true;
    patientGroup.add(rightArm);
    
    const blanketGeometry = new THREE.BoxGeometry(0.7, 0.08, 0.9);
    const blanketMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0xD3E4FD : 0xEBF8FF,
      roughness: 0.8,
      metalness: 0.0
    });
    const blanket = new THREE.Mesh(blanketGeometry, blanketMaterial);
    blanket.position.set(0, 0.5, 0.5);
    blanket.castShadow = true;
    patientGroup.add(blanket);
    
    if (status === 'critical') {
      const ivPoleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
      const ivPoleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xCCCCCC,
        roughness: 0.2,
        metalness: 0.9
      });
      const ivPole = new THREE.Mesh(ivPoleGeometry, ivPoleMaterial);
      ivPole.position.set(0.45, 0.9, -0.3);
      patientGroup.add(ivPole);
      
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
    
    patientGroup.position.copy(position);
    
    patientGroup.userData.id = id;
    patientGroup.userData.type = 'patient';
    
    return patientGroup;
  };
  
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
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDarkMode ? 0x1A1F2C : 0xF6F6F7);
    
    scene.fog = new THREE.FogExp2(isDarkMode ? 0x1A1F2C : 0xF6F6F7, 0.015);
    
    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const camera = new THREE.OrthographicCamera(
      -10 * aspect, 10 * aspect, 10, -10, 0.1, 1000
    );
    
    if (selectedFloor && visibleFloors.length === 1) {
      const floorLevel = visibleFloors[0].level;
      camera.position.set(15, floorLevel * 4 + 10, 15);
      camera.lookAt(0, floorLevel * 4, 0);
    } else {
      camera.position.set(20, 20, 20);
      camera.lookAt(0, 0, 0);
    }
    
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
    
    const ambientLight = new THREE.AmbientLight(
      isDarkMode ? 0x6E59A5 : 0xF0EAD6, 
      isDarkMode ? 0.3 : 0.5
    );
    scene.add(ambientLight);
    
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
    
    const fillLight = new THREE.DirectionalLight(
      isDarkMode ? 0x8B5CF6 : 0x90CDF4, 
      isDarkMode ? 0.3 : 0.4
    );
    fillLight.position.set(-15, 10, 15);
    scene.add(fillLight);
    
    const pointLight = new THREE.PointLight(
      isDarkMode ? 0x0EA5E9 : 0x3182CE, 
      isDarkMode ? 1.0 : 0.8, 
      50
    );
    pointLight.position.set(0, 15, 0);
    pointLight.castShadow = true;
    pointLight.shadow.bias = -0.001;
    scene.add(pointLight);
    
    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.1;
    raycaster.params.Points.threshold = 0.1;
    const mouse = new THREE.Vector2();
    
    const interactiveObjects: { [key: string]: THREE.Object3D } = {};
    const patientGroups: { [key: string]: THREE.Group } = {};
    
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0x403E43 : 0xE2E8F0,
      roughness: 0.7,
      metalness: 0.3,
      envMapIntensity: 0.8
    });
    
    const nonVisibleFloorMaterial = new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0x403E43 : 0xE2E8F0,
      roughness: 0.7,
      metalness: 0.3,
      transparent: true,
      opacity: 0.15,
      envMapIntensity: 0.4
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
    
    const equipmentMaterials = {
      default: new THREE.MeshStandardMaterial({ 
        color: isDarkMode ? 0xb0b0b0 : 0xA0AEC0,
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
    
    const createEquipment = (type: string, position: THREE.Vector3, equipmentId: string, status: 'working' | 'maintenance' | 'offline' = 'working') => {
      const group = new THREE.Group();
      let statusLight: THREE.Mesh;
      const statusMaterial = equipmentMaterials[status];
      
      switch(type) {
        case 'monitor': {
          const standGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 16);
          const stand = new THREE.Mesh(standGeometry, equipmentMaterials.default);
          stand.position.y = 0.4;
          group.add(stand);
          
          const armGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
          const arm = new THREE.Mesh(armGeometry, equipmentMaterials.default);
          arm.position.y = 1.2;
          group.add(arm);
          
          const screenGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.08);
          const screen = new THREE.Mesh(screenGeometry, equipmentMaterials.screen);
          screen.position.y = 1.5;
          screen.position.z = 0.1;
          group.add(screen);
          
          const lightGeometry = new THREE.SphereGeometry(0.08, 16, 16);
          statusLight = new THREE.Mesh(lightGeometry, statusMaterial);
          statusLight.position.set(0.3, 1.3, 0);
          
          const animateScreen = () => {
            const time = Date.now() * 0.001;
            const screenMat = screen.material as THREE.MeshStandardMaterial;
            screenMat.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.1;
          };
          (screen as any).animate = animateScreen;
          
          break;
        }
        
        case 'ventilator': {
          const baseGeometry = new THREE.BoxGeometry(0.7, 1.2, 0.7);
          const base = new THREE.Mesh(baseGeometry, equipmentMaterials.default);
          base.position.y = 0.6;
          group.add(base);
          
          const screenGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.05);
          const screen = new THREE.Mesh(screenGeometry, equipmentMaterials.screen);
          screen.position.y = 0.9;
          screen.position.z = 0.38;
          group.add(screen);
          
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
          
          const lightGeometry = new THREE.SphereGeometry(0.08, 16, 16);
          statusLight = new THREE.Mesh(lightGeometry, statusMaterial);
          statusLight.position.set(-0.25, 1.05, 0.38);
          
          const animateScreen = () => {
            const time = Date.now() * 0.001;
            const screenMat = screen.material as THREE.MeshStandardMaterial;
            screenMat.emissiveIntensity = 0.4 + Math.sin(time * 4) * 0.2;
          };
          (screen as any).animate = animateScreen;
          
          break;
        }
        
        case 'ct-scanner': {
          const baseGeometry = new THREE.CylinderGeometry(1.4, 1.4, 0.4, 32);
          const base = new THREE.Mesh(baseGeometry, equipmentMaterials.default);
          base.position.y = 0.2;
          group.add(base);
          
          const ringGeometry = new THREE.TorusGeometry(1.2, 0.2, 16, 32);
          const ring = new THREE.Mesh(ringGeometry, equipmentMaterials.default);
          ring.position.y = 1.0;
          ring.rotation.x = Math.PI / 2;
          group.add(ring);
          
          const tableGeometry = new THREE.BoxGeometry(0.8, 0.1, 2.5);
          const table = new THREE.Mesh(tableGeometry, equipmentMaterials.default);
          table.position.y = 0.7;
          table.position.z = 0.5;
          group.add(table);
          
          const panelGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.15);
          const panel = new THREE.Mesh(panelGeometry, equipmentMaterials.default);
          panel.position.set(-1.0, 1.0, 1.5);
          group.add(panel);
          
          const screenGeometry = new THREE.PlaneGeometry(0.4, 0.3);
          const screen = new THREE.Mesh(screenGeometry, equipmentMaterials.screen);
          screen.position.set(-1.0, 1.2, 1.58);
          group.add(screen);
          
          const lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
          statusLight = new THREE.Mesh(lightGeometry, statusMaterial);
          statusLight.position.set(-1.0, 0.8, 1.58);
          
          const animateRing = () => {
            const time = Date.now() * 0.001;
            if (status === 'working') {
              ring.rotation.z = time * 0.3;
            }
          };
          (ring as any).animate = animateRing;
          
          const animateScreen = () => {
            const time = Date.now() * 0.001;
            const screenMat = screen.material as THREE.MeshStandardMaterial;
            screenMat.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.1;
          };
          (screen as any).animate = animateScreen;
          
          break;
        }
        
        case 'mri': {
          const bodyGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2, 32);
          const body = new THREE.Mesh(bodyGeometry, equipmentMaterials.default);
          body.position.y = 1;
          body.rotation.x = Math.PI / 2;
          group.add(body);
          
          const boreGeometry = new THREE.CylinderGeometry(0.6, 0.6, 2.2, 32);
          const bore = new THREE.Mesh(boreGeometry, new THREE.MeshBasicMaterial({ 
            color: 0x000000 
          }));
          bore.position.y = 1;
          bore.rotation.x = Math.PI / 2;
          group.add(bore);
          
          const tableGeometry = new THREE.BoxGeometry(0.8, 0.1, 3);
          const table = new THREE.Mesh(tableGeometry, equipmentMaterials.default);
          table.position.y = 0.7;
          table.position.z = 0.5;
          group.add(table);
          
          const terminalGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.5);
          const terminal = new THREE.Mesh(terminalGeometry, equipmentMaterials.default);
          terminal.position.set(-1.5, 0.6, 1.5);
          group.add(terminal);
          
          const screenGeometry = new THREE.PlaneGeometry(0.6, 0.5);
          const screen = new THREE.Mesh(screenGeometry, equipmentMaterials.screen);
          screen.position.set(-1.5, 1.0, 1.76);
          group.add(screen);
          
          const lightGeometry = new THREE.SphereGeometry(0.12, 16, 16);
          statusLight = new THREE.Mesh(lightGeometry, statusMaterial);
          statusLight.position.set(0, 1.8, 0);
          
          const animateScreen = () => {
            const time = Date.now() * 0.001;
            const screenMat = screen.material as THREE.MeshStandardMaterial;
            screenMat.emissiveIntensity = 0.3 + Math.sin(time * 1.5) * 0.15;
          };
          (screen as any).animate = animateScreen;
          
          break;
        }
        
        case 'surgical-lights': {
          const boomGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
          const boom = new THREE.Mesh(boomGeometry, equipmentMaterials.default);
          boom.position.y = 2.25;
          boom.rotation.x = Math.PI / 2;
          group.add(boom);
          
          const housingGeometry = new THREE.CylinderGeometry(0.4, 0.6, 0.2, 16);
          const housing = new THREE.Mesh(housingGeometry, equipmentMaterials.default);
          housing.position.y = 1.5;
          group.add(housing);
          
          const lensGeometry = new THREE.CircleGeometry(0.5, 32);
          const lens = new THREE.Mesh(lensGeometry, new THREE.MeshBasicMaterial({ 
            color: status === 'working' ? 0xffffee : 0x555555,
            transparent: true,
            opacity: 0.9
          }));
          lens.position.y = 1.38;
          lens.rotation.x = -Math.PI / 2;
          group.add(lens);
          
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
          
          const lightGeometry = new THREE.SphereGeometry(0.08, 16, 16);
          statusLight = new THREE.Mesh(lightGeometry, statusMaterial);
          statusLight.position.set(0.3, 1.5, 0);
          
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
          const bodyGeometry = new THREE.BoxGeometry(0.8, 1.4, 0.6);
          const body = new THREE.Mesh(bodyGeometry, equipmentMaterials.default);
          body.position.y = 0.7;
          group.add(body);
          
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
          
          const monitorGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.05);
          const monitor = new THREE.Mesh(monitorGeometry, equipmentMaterials.screen);
          monitor.position.set(0.25, 1.3, 0.35);
          group.add(monitor);
          
          const animateMonitor = () => {
            const time = Date.now() * 0.001;
            const monitorMat = monitor.material as THREE.MeshStandardMaterial;
            monitorMat.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.1;
          };
          (monitor as any).animate = animateMonitor;
          
          const lightGeometry = new THREE.SphereGeometry(0.08, 16, 16);
          statusLight = new THREE.Mesh(lightGeometry, statusMaterial);
          statusLight.position.set(-0.25, 1.4, 0.35);
          group.add(statusLight);
          
          break;
        }
      }
      
      group.position.copy(position);
      group.userData.id = equipmentId;
      group.userData.type = type;
      
      return group;
    };
    
    const floorGeometry = new THREE.BoxGeometry(25, 0.2, 25);
    
    hospital.floors.forEach(floor => {
      const isVisible = visibleFloors.some(f => f.id === floor.id);
      const material = isVisible ? floorMaterial : nonVisibleFloorMaterial;
      
      const floorMesh = new THREE.Mesh(floorGeometry, material);
      floorMesh.position.y = floor.level * 4;
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
    
    visibleBeds.forEach(bed => {
      const bedPosition = positionToVector3(bed.position);
      const bedMesh = createHospitalBed(bedPosition, bed.id);
      scene.add(bedMesh);
      interactiveObjects[bed.id] = bedMesh;
    });
    
    visiblePatients.forEach(patient => {
      if (patient.bedId) {
        const associatedBed = visibleBeds.find(b => b.id === patient.bedId);
        if (associatedBed) {
          const bedPosition = associatedBed.position;
          const patientPosition = new THREE.Vector3(bedPosition.x, bedPosition.y + 0.45, bedPosition.z);
          
          const isSelected = patient.id === selectedPatientId;
          
          const patientMesh = createPatient(patientPosition, patient.id, patient.status, isSelected);
          scene.add(patientMesh);
          interactiveObjects[patient.id] = patientMesh;
          patientGroups[patient.id] = patientMesh;
        }
      }
    });
    
    const handleMouseMove = (event: MouseEvent) => {
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObjects(Object.values(interactiveObjects), true);
      
      if (intersects.length > 0) {
        let object = intersects[0].object;
        
        while (object && !object.userData.id) {
          object = object.parent as THREE.Object3D;
        }
        
        if (object && object.userData.id) {
          document.body.style.cursor = 'pointer';
          
          if (hoveredObject !== object.userData.id) {
            setHoveredObject(object.userData.id);
            
            if (object.userData.type === 'bed') {
              const bed = object as THREE.Group;
              bed.scale.set(1.05, 1.05, 1.05);
            } else if (object.userData.type === 'patient') {
              const patient = object as THREE.Group;
              patient.position.y += 0.1;
            }
          }
        } else {
          document.body.style.cursor = 'auto';
          resetHighlights();
        }
      } else {
        document.body.style.cursor = 'auto';
        resetHighlights();
      }
    };
    
    const resetHighlights = () => {
      if (hoveredObject) {
        const object = interactiveObjects[hoveredObject];
        
        if (object) {
          if (object.userData.type === 'bed') {
            object.scale.set(1, 1, 1);
          } else if (object.userData.type === 'patient') {
            const patient = visiblePatients.find(p => p.id === object.userData.id);
            if (patient && patient.bedId) {
              const bed = visibleBeds.find(b => b.id === patient.bedId);
              if (bed) {
                const floorObj = visibleFloors.find(f => f.type === bed.floor);
                if (floorObj) {
                  const floorY = floorObj.level * 4;
                  object.position.y = floorY + 0.65;
                }
              }
            }
          }
        }
        
        setHoveredObject(null);
      }
    };
    
    const handleClick = (event: MouseEvent) => {
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObjects(Object.values(interactiveObjects), true);
      
      if (intersects.length > 0) {
        let object = intersects[0].object;
        
        while (object && !object.userData.id) {
          object = object.parent as THREE.Object3D;
        }
        
        if (object && object.userData.id) {
          if (object.userData.type === 'bed' && onBedSelect) {
            onBedSelect(object.userData.id);
          } else if (object.userData.type === 'patient' && onPatientSelect) {
            onPatientSelect(object.userData.id);
          }
        }
      }
    };
    
    const animate = () => {
      requestAnimationFrame(animate);
      
      controls.update();
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    mountRef.current.addEventListener('mousemove', handleMouseMove);
    mountRef.current.addEventListener('click', handleClick);
    
    return () => {
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousemove', handleMouseMove);
        mountRef.current.removeEventListener('click', handleClick);
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      
      Object.values(interactiveObjects).forEach(object => {
        scene.remove(object);
      });
    };
  }, [mountRef, hospital, selectedFloor, selectedPatientId, isDarkMode, visibleBeds, visiblePatients, visibleFloors, onBedSelect, onPatientSelect]);
  
  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
  );
};

export default ThreeJSCanvas;
