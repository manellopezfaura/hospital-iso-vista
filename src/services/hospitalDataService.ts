
import { Hospital, Bed, Patient, Staff, Floor, Position, BedStatus, PatientStatus, FloorType, AdmissionType, StaffType } from "@/types/hospital";

// Generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Generate random position with some spacing for the isometric view
const generatePosition = (floorLevel: number, index: number, totalInRow: number = 5): Position => {
  const row = Math.floor(index / totalInRow);
  const col = index % totalInRow;
  
  return {
    x: col * 3 - (totalInRow * 1.5),
    y: floorLevel * 4, // Update: Sync with floor level calculation in ThreeJSCanvas
    z: row * 3 - 5, // Negative to show beds in correct isometric view
  };
};

// Generate random status for beds with more occupied beds for realism
const generateBedStatus = (): BedStatus => {
  const rand = Math.random();
  if (rand < 0.7) return 'occupied'; // Increased to 70% for more patients
  if (rand < 0.9) return 'available';
  return 'cleaning';
};

// Generate random status for patients with more realistic distribution
const generatePatientStatus = (): PatientStatus => {
  const rand = Math.random();
  if (rand < 0.2) return 'critical'; // 20% critical
  if (rand < 0.9) return 'stable'; // 70% stable
  return 'discharged'; // 10% discharged
};

// Generate random floor type
const generateFloorType = (index: number): FloorType => {
  if (index === 0) return 'Emergency';
  if (index === 1) return 'ICU';
  if (index === 2) return 'Surgery';
  return 'General';
};

// Generate realistic patient names
const generatePatientName = (): string => {
  const firstNames = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", 
    "Linda", "William", "Elizabeth", "David", "Susan", "Richard", "Jessica",
    "Emma", "Olivia", "Noah", "Ava", "Liam", "Sophia", "Ethan", "Isabella"
  ];
  
  const lastNames = [
    "Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller",
    "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White",
    "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark"
  ];
  
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
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
        
        // Create a patient with a realistic name
        const patient: Patient = {
          id: patientId,
          name: generatePatientName(),
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
