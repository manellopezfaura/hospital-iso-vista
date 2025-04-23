
import * as THREE from 'three';

export const createMaterials = (isDarkMode: boolean) => ({
  floor: new THREE.MeshStandardMaterial({ 
    color: isDarkMode ? 0x403E43 : 0xE2E8F0,
    roughness: 0.7,
    metalness: 0.3,
    envMapIntensity: 0.8
  }),
  
  nonVisibleFloor: new THREE.MeshStandardMaterial({ 
    color: isDarkMode ? 0x403E43 : 0xE2E8F0,
    roughness: 0.7,
    metalness: 0.3,
    transparent: true,
    opacity: 0.15,
    envMapIntensity: 0.4
  }),
  
  wall: new THREE.MeshStandardMaterial({ 
    color: isDarkMode ? 0xF1F0FB : 0xFFFFFF,
    roughness: 0.9,
    metalness: 0.1,
    envMapIntensity: 0.5
  }),
  
  nightstand: new THREE.MeshStandardMaterial({ 
    color: isDarkMode ? 0x8A898C : 0xA0AEC0,
    roughness: 0.6,
    metalness: 0.4,
    envMapIntensity: 0.7
  }),
  
  equipment: {
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
  }
});
