
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
    
    console.log("Initializing ThreeJSCanvas with hospital data:", hospital);
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x5f9ea0); // Teal background color
    
    // Camera setup for isometric view
    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const camera = new THREE.OrthographicCamera(
      -10 * aspect, 10 * aspect, 10, -10, 0.1, 1000
    );
    camera.position.set(15, 15, 15); // Moved camera position to see more of the scene
    camera.lookAt(0, 0, 0);
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    
    // Add orbit controls
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
    
    // Add point light for better visibility
    const pointLight = new THREE.PointLight(0xffffff, 0.8, 50);
    pointLight.position.set(0, 10, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);
    
    // Raycaster for object selection
    const raycaster = new THREE.Raycaster();
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
      color: 0xd6d6d6, // Light gray for bed frame
      roughness: 0.4,
      metalness: 0.3
    });
    
    const bedSheetMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x68b7b8, // Light teal for bedsheets
      roughness: 0.5
    });
    
    const nightstandMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf0f0f0, // Light gray for nightstand
      roughness: 0.6
    });
    
    // Patient status materials based on criticality with higher emissive values
    const patientStatusMaterials = {
      critical: new THREE.MeshStandardMaterial({ 
        color: 0xea384c, // Red for critical
        emissive: 0xea384c,
        emissiveIntensity: 0.7,
        roughness: 0.3
      }),
      stable: new THREE.MeshStandardMaterial({ 
        color: 0x4ade80, // Green for stable
        emissive: 0x4ade80,
        emissiveIntensity: 0.5,
        roughness: 0.3
      }),
      discharged: new THREE.MeshStandardMaterial({ 
        color: 0x8E9196, // Gray for discharged
        emissive: 0x8E9196,
        emissiveIntensity: 0.2,
        roughness: 0.3
      })
    };
    
    // Create floors - MODIFICADO PARA SEPARAR PLANTAS EN "ALL FLOORS" VIEW
    hospital.floors.forEach((floor, floorIndex) => {
      // Skip if not the selected floor (unless none selected)
      if (selectedFloor && floor.id !== selectedFloor) {
        return;
      }
      
      // Posicionar cada planta con espacio vertical entre ellas cuando se muestra "All Floors"
      const verticalOffset = selectedFloor ? 0 : -floorIndex * 10;
      const horizontalOffset = selectedFloor ? 0 : floorIndex * 3;
      
      // Floor base
      const floorGeometry = new THREE.BoxGeometry(20, 0.2, 20);
      const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
      floorMesh.position.set(
        horizontalOffset, 
        floor.level * 3 + verticalOffset, 
        0
      );
      floorMesh.receiveShadow = true;
      scene.add(floorMesh);
      
      // Create floor label when in "All Floors" mode
      if (!selectedFloor) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.width = 512;
          canvas.height = 128;
          
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          
          context.font = 'bold 48px Arial';
          context.fillStyle = '#000000';
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
            horizontalOffset - 6,
            floor.level * 3 + verticalOffset + 3,
            0
          );
          scene.add(label);
        }
      }
      
      // Create rooms with walls
      rooms.forEach(room => {
        const [x, z] = room.position;
        const y = floor.level * 3 + verticalOffset;
        const width = room.width;
        const height = room.height;
        
        // Room floor with slightly different color to distinguish rooms
        const roomFloorGeometry = new THREE.BoxGeometry(width, 0.05, height);
        const roomFloorMesh = new THREE.Mesh(roomFloorGeometry, floorMaterial);
        roomFloorMesh.position.set(
          x + width/2 + horizontalOffset, 
          y + 0.12, 
          z + height/2
        );
        roomFloorMesh.receiveShadow = true;
        scene.add(roomFloorMesh);
        
        // Create walls
        const wallHeight = 2.0;
        const wallThickness = 0.15;
        
        // Back wall
        const backWallGeometry = new THREE.BoxGeometry(width, wallHeight, wallThickness);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
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
        const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        leftWall.position.set(
          x + horizontalOffset, 
          y + wallHeight/2, 
          z + height/2
        );
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
          const topWall = new THREE.Mesh(topWallGeometry, wallMaterial);
          topWall.position.set(
            x + width + horizontalOffset, 
            y + wallHeight/2, 
            z + height - wallSegmentWidth/2
          );
          topWall.castShadow = true;
          topWall.receiveShadow = true;
          scene.add(topWall);
          
          // Door frame top
          const doorFrameTopGeometry = new THREE.BoxGeometry(wallThickness, 0.2, doorWidth);
          const doorFrameTop = new THREE.Mesh(doorFrameTopGeometry, wallMaterial);
          doorFrameTop.position.set(
            x + width + horizontalOffset, 
            y + wallHeight - 0.1, 
            z + height/2
          );
          scene.add(doorFrameTop);
        } else {
          // Full right wall
          const rightWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, height);
          const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
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
    
    console.log(`Total beds to render: ${hospital.beds.length}`);
    
    // Create beds and nightstands - ENHANCED VISIBILITY and CRITICALITY
    hospital.beds.forEach(bed => {
      const floorObj = hospital.floors.find(f => f.type === bed.floor);
      
      // Skip if not the selected floor (unless none selected)
      if (selectedFloor && floorObj && floorObj.id !== selectedFloor) {
        return;
      }
      
      // Calcular el desplazamiento horizontal y vertical según el piso
      const floorIndex = hospital.floors.findIndex(f => f.type === bed.floor);
      const verticalOffset = selectedFloor ? 0 : -floorIndex * 10;
      const horizontalOffset = selectedFloor ? 0 : floorIndex * 3;
      
      console.log(`Creating bed: ${bed.id} with status: ${bed.status}, position:`, bed.position);
      
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
      bedGroup.name = `bed-group-${bed.id}`;
      
      // Create bed frame - with enhanced dimensions for visibility
      const bedFrameGeometry = new THREE.BoxGeometry(1.4, 0.4, 2.2);
      const bedFrame = new THREE.Mesh(bedFrameGeometry, bedFrameMaterial);
      bedFrame.name = "bed-frame";
      bedFrame.position.set(0, 0.3, 0);
      bedFrame.castShadow = true;
      bedFrame.receiveShadow = true;
      bedGroup.add(bedFrame);
      
      // Create bed mattress with enhanced dimensions
      const mattressGeometry = new THREE.BoxGeometry(1.2, 0.15, 2.0);
      const mattress = new THREE.Mesh(mattressGeometry, bedSheetMaterial);
      mattress.name = "mattress";
      mattress.position.set(0, 0.45, 0);
      mattress.castShadow = true;
      bedGroup.add(mattress);
      
      // Create pillow
      const pillowGeometry = new THREE.BoxGeometry(0.9, 0.12, 0.5);
      const pillowMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
      const pillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
      pillow.name = "pillow";
      pillow.position.set(0, 0.52, -0.7);
      bedGroup.add(pillow);
      
      // Create legs
      const legGeometry = new THREE.BoxGeometry(0.12, 0.3, 0.12);
      const legPositions = [
        [-0.5, -0.15, 0.95],
        [0.5, -0.15, 0.95],
        [-0.5, -0.15, -0.95],
        [0.5, -0.15, -0.95]
      ];
      
      legPositions.forEach((position, i) => {
        const leg = new THREE.Mesh(legGeometry, bedFrameMaterial);
        leg.name = `leg-${i}`;
        leg.position.set(position[0], position[1], position[2]);
        leg.castShadow = true;
        bedGroup.add(leg);
      });
      
      // Create status indicator (small sphere above bed) - ENHANCED VISIBILITY
      const indicatorGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const indicatorMaterial = new THREE.MeshStandardMaterial({ 
        color: statusIndicatorColor,
        emissive: statusIndicatorColor,
        emissiveIntensity: 0.7,
      });
      
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.name = "bed-status-indicator";
      indicator.position.set(0, 1.8, -0.8);
      
      // Add pole for indicator
      const poleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.3, 8);
      const poleMaterial = new THREE.MeshStandardMaterial({ color: 0xb0b0b0 });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.name = "indicator-pole";
      pole.position.set(0, 1.2, -0.8);
      bedGroup.add(pole);
      bedGroup.add(indicator);
      
      // Create nightstand
      const nightstandGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
      const nightstand = new THREE.Mesh(nightstandGeometry, nightstandMaterial);
      nightstand.name = "nightstand";
      nightstand.position.set(-0.9, 0.35, -0.5);
      nightstand.castShadow = true;
      nightstand.receiveShadow = true;
      bedGroup.add(nightstand);
      
      // Position the entire bed group with offsets for "All Floors" view
      bedGroup.position.set(
        bed.position.x + horizontalOffset,
        bed.position.y + 0.2 + verticalOffset, // Raise beds slightly to avoid z-fighting with floor
        bed.position.z
      );
      
      // Add outline to make bed more visible
      const bedOutlineGeometry = new THREE.BoxGeometry(1.5, 0.46, 2.3);
      const bedOutlineMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.BackSide
      });
      const bedOutline = new THREE.Mesh(bedOutlineGeometry, bedOutlineMaterial);
      bedOutline.name = "bed-outline";
      bedOutline.position.copy(bedFrame.position);
      bedGroup.add(bedOutline);
      
      scene.add(bedGroup);
      
      // Make bed interactive
      interactiveObjects[bed.id] = bedGroup;
      
      // If there's a patient in the bed, add a patient indicator with ENHANCED CRITICALITY VISUALIZATION
      if (bed.patientId) {
        const patient = hospital.patients.find(p => p.id === bed.patientId);
        
        if (patient) {
          console.log(`Adding patient: ${patient.id} with status: ${patient.status} to bed: ${bed.id}`);
          
          // Determine material based on patient status
          let patientMaterial: THREE.MeshStandardMaterial;
          switch (patient.status) {
            case 'critical':
              patientMaterial = patientStatusMaterials.critical;
              break;
            case 'stable':
              patientMaterial = patientStatusMaterials.stable;
              break;
            case 'discharged':
              patientMaterial = patientStatusMaterials.discharged;
              break;
            default:
              patientMaterial = patientStatusMaterials.stable;
          }
          
          // Create patient visualization on the bed - LARGER AND MORE VISIBLE
          const patientGeometry = new THREE.CapsuleGeometry(0.45, 1.2, 4, 8);
          const patientMesh = new THREE.Mesh(patientGeometry, patientMaterial);
          patientMesh.name = "patient-body";
          patientMesh.position.set(0, 0.8, 0);
          patientMesh.rotation.x = Math.PI / 2;
          patientMesh.scale.set(1, 0.45, 0.6);
          patientMesh.castShadow = true;
          bedGroup.add(patientMesh);
          
          // Add patient head - LARGER
          const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
          const head = new THREE.Mesh(headGeometry, patientMaterial);
          head.name = "patient-head";
          head.position.set(0, 0.8, -0.7);
          head.castShadow = true;
          bedGroup.add(head);
          
          // Create patient indicator (circle with person icon)
          const patientGroup = new THREE.Group();
          patientGroup.name = `patient-indicator-${patient.id}`;
          
          // Circle background - LARGER AND MORE VISIBLE
          const circleGeometry = new THREE.CircleGeometry(0.4, 32);
          const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x33a1c9, // Teal blue circle 
            side: THREE.DoubleSide 
          });
          
          const circle = new THREE.Mesh(circleGeometry, circleMaterial);
          circle.name = "patient-indicator-circle";
          circle.rotation.x = -Math.PI / 2;
          patientGroup.add(circle);
          
          // Create simplified patient icon (small cylinder for head, box for body)
          const iconHeadGeometry = new THREE.SphereGeometry(0.15, 16, 16);
          const iconBodyGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.24);
          const iconMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
          
          const iconHead = new THREE.Mesh(iconHeadGeometry, iconMaterial);
          iconHead.name = "patient-icon-head";
          iconHead.position.y = 0.22;
          patientGroup.add(iconHead);
          
          const iconBody = new THREE.Mesh(iconBodyGeometry, iconMaterial);
          iconBody.name = "patient-icon-body";
          iconBody.position.y = 0.01;
          patientGroup.add(iconBody);
          
          // Position the patient indicator near the bed with offsets for "All Floors" view
          patientGroup.position.set(
            bed.position.x + 1.0 + horizontalOffset,
            bed.position.y + 0.8 + verticalOffset,
            bed.position.z - 0.4
          );
          
          scene.add(patientGroup);
          
          // Make patient interactive
          interactiveObjects[patient.id] = patientGroup;
          
          // Add criticality indicators based on patient status
          if (patient.status === 'critical') {
            // Add alert cone (red warning)
            const alertGeometry = new THREE.ConeGeometry(0.25, 0.5, 16);
            const alertMaterial = new THREE.MeshStandardMaterial({ 
              color: 0xea384c,
              emissive: 0xea384c,
              emissiveIntensity: 0.8
            });
            
            const alert = new THREE.Mesh(alertGeometry, alertMaterial);
            alert.name = "critical-alert";
            alert.position.set(
              bed.position.x - 0.8 + horizontalOffset,
              bed.position.y + 1.8 + verticalOffset,
              bed.position.z
            );
            
            const alertPole = new THREE.CylinderGeometry(0.03, 0.03, 1.3, 8);
            const alertPoleMaterial = new THREE.MeshStandardMaterial({ color: 0xb0b0b0 });
            const pole = new THREE.Mesh(alertPole, alertPoleMaterial);
            pole.name = "alert-pole";
            pole.position.set(
              bed.position.x - 0.8 + horizontalOffset,
              bed.position.y + 1.2 + verticalOffset,
              bed.position.z
            );
            
            scene.add(pole);
            scene.add(alert);
            
            // Add pulsing light effect for critical patients
            const pulsingLight = new THREE.PointLight(0xff0000, 1, 3);
            pulsingLight.name = "critical-light";
            pulsingLight.position.set(
              bed.position.x + horizontalOffset,
              bed.position.y + 1.5 + verticalOffset,
              bed.position.z
            );
            scene.add(pulsingLight);
            
            // Animation parameters for pulsing
            const pulseParams = {
              intensity: 1,
              phase: Math.random() * Math.PI * 2, // Random starting phase
              speed: 2 + Math.random() // Slightly randomized speed
            };
            
            // Store in an object to access in animation loop
            (pulsingLight as any).pulseParams = pulseParams;
          }
          
          // Add heartbeat monitor for critical patients
          if (patient.status === 'critical') {
            const monitorGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.05);
            const monitorMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
            const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
            monitor.name = "heartbeat-monitor";
            monitor.position.set(
              bed.position.x + 0.8 + horizontalOffset,
              bed.position.y + 1.5 + verticalOffset,
              bed.position.z - 0.7
            );
            scene.add(monitor);
            
            // Create a heartbeat line
            const heartbeatPoints = [];
            for (let i = 0; i < 12; i++) {
              const x = (i - 6) * 0.04;
              let y = 0;
              
              // Create ECG-like pattern
              if (i === 4) y = 0.1;
              if (i === 5) y = -0.12;
              if (i === 6) y = 0.18;
              if (i === 7) y = -0.06;
              
              heartbeatPoints.push(new THREE.Vector3(x, y, 0));
            }
            
            const heartbeatGeometry = new THREE.BufferGeometry().setFromPoints(heartbeatPoints);
            const heartbeatMaterial = new THREE.LineBasicMaterial({ 
              color: 0x00ff00,
              linewidth: 2 
            });
            const heartbeatLine = new THREE.Line(heartbeatGeometry, heartbeatMaterial);
            heartbeatLine.name = "heartbeat-line";
            
            heartbeatLine.position.copy(monitor.position);
            heartbeatLine.position.z += 0.03;
            scene.add(heartbeatLine);
          }
          
          // If staff assigned to patient, add staff indicators
          if (patient.assignedStaffIds.length > 0) {
            patient.assignedStaffIds.forEach((staffId, index) => {
              const staff = hospital.staff.find(s => s.id === staffId);
              if (staff) {
                console.log(`Adding staff: ${staffId} for patient: ${patient.id}`);
                
                // Create staff indicator
                const staffGroup = new THREE.Group();
                staffGroup.name = `staff-indicator-${staffId}`;
                
                // Circle background
                const staffCircleGeometry = new THREE.CircleGeometry(0.3, 32);
                const staffCircleMaterial = new THREE.MeshBasicMaterial({ 
                  color: staff.type === 'Doctor' ? 0x9b87f5 : 0x33a1c9, // Purple for doctors, blue for others
                  side: THREE.DoubleSide 
                });
                
                const staffCircle = new THREE.Mesh(staffCircleGeometry, staffCircleMaterial);
                staffCircle.name = "staff-indicator-circle";
                staffCircle.rotation.x = -Math.PI / 2;
                staffGroup.add(staffCircle);
                
                // Create simplified staff icon
                const staffHeadGeometry = new THREE.SphereGeometry(0.1, 16, 16);
                const staffBodyGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.18);
                const staffMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
                
                const staffHead = new THREE.Mesh(staffHeadGeometry, staffMaterial);
                staffHead.name = "staff-icon-head";
                staffHead.position.y = 0.15;
                staffGroup.add(staffHead);
                
                const staffBody = new THREE.Mesh(staffBodyGeometry, staffMaterial);
                staffBody.name = "staff-icon-body";
                staffBody.position.y = 0.01;
                staffGroup.add(staffBody);
                
                // Position the staff indicator near the bed with offsets for "All Floors" view
                staffGroup.position.set(
                  bed.position.x + 0.6 + (index * 0.7) + horizontalOffset,
                  bed.position.y + 0.6 + verticalOffset,
                  bed.position.z + 0.8
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
        label.name = `room-label-${bed.room}`;
        label.position.set(
          bed.position.x + horizontalOffset,
          bed.position.y + 1.5 + verticalOffset,
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
      
      const intersects = raycaster.intersectObjects(Object.values(interactiveObjects), true);
      
      // Reset cursor and hover state
      document.body.style.cursor = 'default';
      setHoveredObject(null);
      
      if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // Find the key (id) for this object by traversing up to parent
        for (const [key, value] of Object.entries(interactiveObjects)) {
          let parent = object;
          // Traverse up to find if this object or any of its parents match the interactive object
          while (parent) {
            if (parent === value) {
              document.body.style.cursor = 'pointer';
              setHoveredObject(key);
              break;
            }
            parent = parent.parent;
          }
          if (hoveredObject) break;
        }
      }
    };
    
    // Handle clicks with improved detection
    const onClick = (event: MouseEvent) => {
      if (!mountRef.current) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / mountRef.current.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / mountRef.current.clientHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObjects(Object.values(interactiveObjects), true);
      
      if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // Find the key (id) for this object by traversing up to parent
        for (const [key, value] of Object.entries(interactiveObjects)) {
          let parent = object;
          // Traverse up to find if this object or any of its parents match the interactive object
          while (parent) {
            if (parent === value) {
              console.log(`Clicked on: ${key}`);
              
              if (key.startsWith('bed-')) {
                onBedSelect?.(key);
              } else {
                onPatientSelect?.(key);
              }
              break;
            }
            parent = parent.parent;
          }
        }
      }
    };
    
    mountRef.current.addEventListener('mousemove', onMouseMove);
    mountRef.current.addEventListener('click', onClick);
    
    // Animation variables
    const clock = new THREE.Clock();
    
    // Animation loop
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      
      // Update controls
      controls.update();
      
      // Update any pulse effects for critical patients
      scene.traverse((object) => {
        if (object instanceof THREE.PointLight && (object as any).pulseParams) {
          const params = (object as any).pulseParams;
          params.phase += delta * params.speed;
          object.intensity = 0.5 + Math.sin(params.phase) * 0.5; // Pulsate between 0 and 1
        }
      });
      
      // Render scene
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Cleanup
    return () => {
      console.log("Cleaning up Three.js resources");
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
      
      // Clear scene
      while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
      }
      
      renderer.dispose();
    };
  }, [hospital, selectedFloor, onBedSelect, onPatientSelect, hoveredObject]);
  
  return <div ref={mountRef} className="w-full h-full min-h-[500px] rounded-lg" />;
};

export default ThreeJSCanvas;
