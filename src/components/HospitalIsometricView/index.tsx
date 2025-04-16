
import React, { useState, useEffect } from 'react';
import ThreeJSCanvas from './ThreeJSCanvas';
import ControlPanel from './ControlPanel';
import DetailPanel from './DetailPanel';
import { generateHospitalData, updateBedStatus, updatePatientStatus } from '@/services/hospitalDataService';
import { Hospital, BedStatus, PatientStatus } from '@/types/hospital';
import { useToast } from '@/hooks/use-toast';

const HospitalIsometricView: React.FC = () => {
  const [hospital, setHospital] = useState<Hospital>(generateHospitalData());
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { toast } = useToast();

  // Calculate occupancy rate
  const occupancyRate = hospital.beds.filter(bed => bed.status === 'occupied').length / hospital.beds.length;

  const handleFloorChange = (floorId: string | null) => {
    setSelectedFloor(floorId);
    setSelectedBedId(null);
    setSelectedPatientId(null);
  };

  const handleBedSelect = (bedId: string) => {
    setSelectedBedId(bedId);
    setSelectedPatientId(null);
    
    const bed = hospital.beds.find(b => b.id === bedId);
    if (bed && bed.patientId) {
      setSelectedPatientId(bed.patientId);
    }
    
    toast({
      title: "Bed selected",
      description: `Viewing details for ${bed?.room || 'unknown bed'}`,
    });
  };

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    
    const patient = hospital.patients.find(p => p.id === patientId);
    if (patient && patient.bedId) {
      setSelectedBedId(patient.bedId);
    }
    
    toast({
      title: "Patient selected",
      description: `Viewing details for ${patient?.name || 'unknown patient'}`,
    });
  };

  const handleCloseDetail = () => {
    setSelectedBedId(null);
    setSelectedPatientId(null);
  };

  const handleUpdateBedStatus = (bedId: string, status: BedStatus) => {
    setHospital(prevHospital => updateBedStatus(prevHospital, bedId, status));
    
    toast({
      title: "Bed status updated",
      description: `Bed status changed to ${status}`,
    });
  };

  const handleUpdatePatientStatus = (patientId: string, status: PatientStatus) => {
    setHospital(prevHospital => updatePatientStatus(prevHospital, patientId, status));
    
    toast({
      title: "Patient status updated",
      description: `Patient status changed to ${status}`,
    });
  };

  const handleRefreshData = () => {
    setHospital(generateHospitalData());
    setSelectedBedId(null);
    setSelectedPatientId(null);
    
    toast({
      title: "Data refreshed",
      description: "Hospital data has been refreshed with new random values",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      <div className="lg:col-span-3 space-y-6">
        <ControlPanel 
          hospital={hospital}
          selectedFloor={selectedFloor}
          onFloorChange={handleFloorChange}
          onRefreshData={handleRefreshData}
          occupancyRate={occupancyRate}
        />
        
        {(selectedBedId || selectedPatientId) && (
          <DetailPanel 
            hospital={hospital}
            selectedBedId={selectedBedId}
            selectedPatientId={selectedPatientId}
            onClose={handleCloseDetail}
            onUpdateBedStatus={handleUpdateBedStatus}
            onUpdatePatientStatus={handleUpdatePatientStatus}
          />
        )}
      </div>
      
      <div className="lg:col-span-9 bg-muted rounded-lg overflow-hidden h-[70vh]">
        <ThreeJSCanvas 
          hospital={hospital}
          selectedFloor={selectedFloor}
          onBedSelect={handleBedSelect}
          onPatientSelect={handlePatientSelect}
        />
      </div>
    </div>
  );
};

export default HospitalIsometricView;
