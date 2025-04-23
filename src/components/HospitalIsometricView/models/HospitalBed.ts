
import * as THREE from 'three';

export const createHospitalBed = (position: THREE.Vector3, id: string, isDarkMode: boolean): THREE.Group => {
  const bedGroup = new THREE.Group();
  
  const frameMaterial = new THREE.MeshStandardMaterial({ 
    color: isDarkMode ? 0x9F9EA1 : 0xCBD5E0,
    roughness: 0.3,
    metalness: 0.8
  });
  
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.3, 2.1),
    frameMaterial
  );
  frame.position.y = 0.15;
  frame.castShadow = true;
  frame.receiveShadow = true;
  bedGroup.add(frame);
  
  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.15, 1.9),
    new THREE.MeshStandardMaterial({ 
      color: isDarkMode ? 0xD3E4FD : 0xEBF8FF,
      roughness: 0.7,
      metalness: 0.0
    })
  );
  mattress.position.y = 0.38;
  mattress.castShadow = true;
  mattress.receiveShadow = true;
  bedGroup.add(mattress);
  
  const pillow = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.1, 0.4),
    new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.0
    })
  );
  pillow.position.set(0, 0.45, -0.7);
  pillow.castShadow = true;
  bedGroup.add(pillow);
  
  const railMaterial = new THREE.MeshStandardMaterial({ 
    color: isDarkMode ? 0x9F9EA1 : 0xCBD5E0,
    roughness: 0.2,
    metalness: 0.9
  });
  
  const leftRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.3, 1.8),
    railMaterial
  );
  leftRail.position.set(-0.425, 0.5, 0);
  leftRail.castShadow = true;
  bedGroup.add(leftRail);
  
  const rightRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.3, 1.8),
    railMaterial
  );
  rightRail.position.set(0.425, 0.5, 0);
  rightRail.castShadow = true;
  bedGroup.add(rightRail);
  
  const headboardMaterial = new THREE.MeshStandardMaterial({ 
    color: isDarkMode ? 0x8A898C : 0xA0AEC0,
    roughness: 0.4,
    metalness: 0.5
  });
  
  const headboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.6, 0.08),
    headboardMaterial
  );
  headboard.position.set(0, 0.5, -1.05);
  headboard.castShadow = true;
  bedGroup.add(headboard);
  
  const footboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.6, 0.08),
    headboardMaterial
  );
  footboard.position.set(0, 0.5, 1.05);
  footboard.castShadow = true;
  bedGroup.add(footboard);
  
  const legPositions = [
    [-0.4, 0, -0.9],
    [0.4, 0, -0.9],
    [-0.4, 0, 0.9],
    [0.4, 0, 0.9]
  ];
  
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8),
      new THREE.MeshStandardMaterial({ 
        color: isDarkMode ? 0x8A898C : 0xA0AEC0,
        roughness: 0.2,
        metalness: 0.8
      })
    );
    leg.position.set(pos[0], -0.15, pos[1]);
    leg.castShadow = true;
    bedGroup.add(leg);
  });
  
  bedGroup.position.copy(position);
  bedGroup.userData.id = id;
  bedGroup.userData.type = 'bed';
  
  return bedGroup;
};
