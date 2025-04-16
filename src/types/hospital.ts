
export type BedStatus = 'available' | 'occupied' | 'cleaning';
export type PatientStatus = 'critical' | 'stable' | 'discharged';
export type AdmissionType = 'ICU' | 'General' | 'Emergency';
export type StaffType = 'Doctor' | 'Nurse' | 'Technician';
export type FloorType = 'ICU' | 'Emergency' | 'General' | 'Surgery';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Bed {
  id: string;
  position: Position;
  patientId?: string;
  status: BedStatus;
  floor: FloorType;
  room: string;
}

export interface Patient {
  id: string;
  name: string;
  status: PatientStatus;
  assignedStaffIds: string[];
  admissionType: AdmissionType;
  bedId?: string;
  notes?: string;
}

export interface Staff {
  id: string;
  name: string;
  type: StaffType;
  assignedPatientIds: string[];
  floor: FloorType;
}

export interface Floor {
  id: string;
  type: FloorType;
  name: string;
  level: number;
  beds: string[];
}

export interface Hospital {
  floors: Floor[];
  beds: Bed[];
  patients: Patient[];
  staff: Staff[];
}
