
import { Hospital, Bed, Patient, Staff, Floor, Position, BedStatus, PatientStatus, FloorType, AdmissionType, StaffType } from "@/types/hospital";

// Generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Generate random position with some spacing for the isometric view
const generatePosition = (floorLevel: number, index: number, totalInRow: number = 5): Position => {
  const row = Math.floor(index / totalInRow);
  const col = index % totalInRow;
  
  return {
    x: col * 3 - (totalInRow * 1.5),
    y: floorLevel * 2, // Floor height
    z: row * 3 - 5, // Negative to show beds in correct isometric view
  };
};

// Generate random status for beds
const generateBedStatus = (): BedStatus => {
  const rand = Math.random();
  if (rand < 0.6) return 'occupied';
  if (rand < 0.85) return 'available';
  return 'cleaning';
};

// Generate random status for patients
const generatePatientStatus = (): PatientStatus => {
  const rand = Math.random();
  if (rand < 0.15) return 'critical';
  if (rand < 0.9) return 'stable';
  return 'discharged';
};

// Generate random floor type
const generateFloorType = (index: number): FloorType => {
  if (index === 0) return 'Emergency';
  if (index === 1) return 'ICU';
  if (index === 2) return 'Surgery';
  return 'General';
};

// Generate mock hospital data
export const generateHospitalData = (): Hospital => {
  // Create floors
  const floors: Floor[] = [];
  const beds: Bed[] = [];
  const patients: Patient[] = [];
  const staff: Staff[] = [];
  
  // Create staff members
  for (let i = 0; i < 30; i++) {
    const staffType: StaffType = i < 10 ? 'Doctor' : i < 25 ? 'Nurse' : 'Technician';
    const floorIndex = Math.floor(i / 8);
    const floorType = generateFloorType(floorIndex);
    
    staff.push({
      id: `staff-${generateId()}`,
      name: `${staffType} ${String.fromCharCode(65 + i % 26)}`,
      type: staffType,
      assignedPatientIds: [],
      floor: floorType,
    });
  }
  
  // Create floors, beds, and patients
  for (let floorIndex = 0; floorIndex < 4; floorIndex++) {
    const floorType = generateFloorType(floorIndex);
    const floorBeds: string[] = [];
    const bedsPerFloor = 20;
    
    // Create floor
    const floor: Floor = {
      id: `floor-${floorIndex}`,
      type: floorType,
      name: `${floorType} Floor`,
      level: floorIndex,
      beds: floorBeds,
    };
    
    // Create beds and patients for this floor
    for (let j = 0; j < bedsPerFloor; j++) {
      const bedId = `bed-${floorIndex}-${j}`;
      const bedStatus = generateBedStatus();
      floorBeds.push(bedId);
      
      // Room numbering: Room 1, Room 2, etc. - 5 beds per room
      const roomNumber = Math.floor(j / 5) + 1;
      
      // Create a bed
      const bed: Bed = {
        id: bedId,
        position: generatePosition(floorIndex, j),
        status: bedStatus,
        floor: floorType,
        room: `Room ${roomNumber}`,
      };
      
      // Add a patient if the bed is occupied
      if (bedStatus === 'occupied') {
        const patientId = `patient-${floorIndex}-${j}`;
        bed.patientId = patientId;
        
        // Assign random staff to this patient
        const availableStaff = staff.filter(s => s.floor === floorType);
        const assignedStaff = availableStaff
          .sort(() => 0.5 - Math.random())
          .slice(0, 1 + Math.floor(Math.random() * 2))
          .map(s => s.id);
        
        // Update staff assignments
        assignedStaff.forEach(staffId => {
          const staffMember = staff.find(s => s.id === staffId);
          if (staffMember) {
            staffMember.assignedPatientIds.push(patientId);
          }
        });
        
        // Create a patient
        const patient: Patient = {
          id: patientId,
          name: `Patient ${String.fromCharCode(65 + Math.floor(Math.random() * 26))} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
          status: generatePatientStatus(),
          assignedStaffIds: assignedStaff,
          admissionType: floorType as AdmissionType,
          bedId: bedId,
        };
        
        patients.push(patient);
      }
      
      beds.push(bed);
    }
    
    floors.push(floor);
  }
  
  return { floors, beds, patients, staff };
};

// Update a specific bed status
export const updateBedStatus = (hospital: Hospital, bedId: string, newStatus: BedStatus): Hospital => {
  const updatedBeds = hospital.beds.map(bed => {
    if (bed.id === bedId) {
      return { ...bed, status: newStatus };
    }
    return bed;
  });
  
  return { ...hospital, beds: updatedBeds };
};

// Update a specific patient status
export const updatePatientStatus = (hospital: Hospital, patientId: string, newStatus: PatientStatus): Hospital => {
  const updatedPatients = hospital.patients.map(patient => {
    if (patient.id === patientId) {
      return { ...patient, status: newStatus };
    }
    return patient;
  });
  
  return { ...hospital, patients: updatedPatients };
};
