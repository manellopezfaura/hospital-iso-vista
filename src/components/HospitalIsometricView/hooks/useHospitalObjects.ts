
import { useMemo } from 'react';
import * as THREE from 'three';
import { Hospital } from '@/types/hospital';

interface UseHospitalObjectsProps {
  hospital: Hospital;
  selectedFloor: string | null;
  selectedPatientId: string | null;
  isDarkMode: boolean;
}

export const useHospitalObjects = ({
  hospital,
  selectedFloor,
  selectedPatientId,
  isDarkMode
}: UseHospitalObjectsProps) => {
  return useMemo(() => {
    const allFloors = hospital.floors;
    const visibleObjects: { [key: string]: THREE.Object3D } = {};
    
    // If a specific floor is selected, only show objects for that floor
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
          visiblePatients: patients,
          visibleObjects
        };
      }
    }
    
    // When no floor is selected or on initial load, show all floors with their beds and patients
    console.log("Showing all hospital floors:", allFloors.length);
    return { 
      visibleFloors: allFloors, 
      visibleBeds: hospital.beds, 
      visiblePatients: hospital.patients,
      visibleObjects
    };
  }, [hospital, selectedFloor, selectedPatientId, isDarkMode]);
};
