
import * as THREE from 'three';
import { PatientStatus } from '@/types/hospital';

export const createPatient = (
  position: THREE.Vector3, 
  id: string, 
  status: PatientStatus, 
  isSelected: boolean,
  isDarkMode: boolean
): THREE.Group => {
  const patientGroup = new THREE.Group();
  
  const getStatusColor = (status: PatientStatus) => {
    switch (status) {
      case 'critical': return 0xea384c;
      case 'stable': return 0x4ade80;
      default: return 0x8E9196;
    }
  };
  
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: getStatusColor(status),
    emissive: getStatusColor(status),
    emissiveIntensity: isSelected ? (isDarkMode ? 1.2 : 0.8) : (isDarkMode ? 0.7 : 0.5),
    roughness: 0.6,
    metalness: 0.1
  });
  
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.25, 0.8, 4, 8),
    bodyMaterial
  );
  torso.position.y = 0.55;
  torso.rotation.x = Math.PI / 2;
  torso.castShadow = true;
  patientGroup.add(torso);
  
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 16),
    bodyMaterial
  );
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
  
  const blanket = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.08, 0.9),
    new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0xD3E4FD : 0xEBF8FF,
      roughness: 0.8,
      metalness: 0.0
    })
  );
  blanket.position.set(0, 0.5, 0.5);
  blanket.castShadow = true;
  patientGroup.add(blanket);
  
  if (status === 'critical') {
    const ivPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0xCCCCCC,
        roughness: 0.2,
        metalness: 0.9
      })
    );
    ivPole.position.set(0.45, 0.9, -0.3);
    patientGroup.add(ivPole);
    
    const ivBag = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.15, 0.05),
      new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1
      })
    );
    ivBag.position.set(0.45, 1.4, -0.3);
    patientGroup.add(ivBag);
  }
  
  patientGroup.position.copy(position);
  patientGroup.userData.id = id;
  patientGroup.userData.type = 'patient';
  
  return patientGroup;
};
