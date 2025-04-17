
import React, { useState, useEffect } from 'react';
import ThreeJSCanvas from './ThreeJSCanvas';
import ControlPanel from './ControlPanel';
import DetailPanel from './DetailPanel';
import { generateHospitalData, updateBedStatus, updatePatientStatus } from '@/services/hospitalDataService';
import { Hospital, BedStatus, PatientStatus } from '@/types/hospital';
import { useToast } from '@/hooks/use-toast';

interface HospitalIsometricViewProps {
  isDarkMode?: boolean;
}

const HospitalIsometricView: React.FC<HospitalIsometricViewProps> = ({ isDarkMode = true }) => {
  const [hospital, setHospital] = useState<Hospital>(generateHospitalData());
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { toast } = useToast();

  // Calculate occupancy rate
  const occupancyRate = hospital.beds.filter(bed => bed.status === 'occupied').length / hospital.beds.length;

  const handleFloorChange = (floorId: string | null) => {
    setSelectedFloor(floorId);
    // No necesitamos resetear la selección de cama/paciente ya que ahora
    // el usuario puede cambiar directamente de una selección a otra
  };

  const handleBedSelect = (bedId: string) => {
    // Simply update the selectedBedId, no need to check if one is already selected
    setSelectedBedId(bedId);
    
    const bed = hospital.beds.find(b => b.id === bedId);
    if (bed && bed.patientId) {
      setSelectedPatientId(bed.patientId);
    } else {
      setSelectedPatientId(null);
    }
    
    toast({
      title: "Cama seleccionada",
      description: `Viendo detalles de ${bed?.room || 'cama desconocida'}`,
    });
  };

  const handlePatientSelect = (patientId: string) => {
    // Simply update the selectedPatientId, no need to check if one is already selected
    setSelectedPatientId(patientId);
    
    const patient = hospital.patients.find(p => p.id === patientId);
    if (patient && patient.bedId) {
      setSelectedBedId(patient.bedId);
    } else {
      setSelectedBedId(null);
    }
    
    toast({
      title: "Paciente seleccionado",
      description: `Viendo detalles de ${patient?.name || 'paciente desconocido'}`,
    });
  };

  const handleCloseDetail = () => {
    setSelectedBedId(null);
    setSelectedPatientId(null);
  };

  const handleUpdateBedStatus = (bedId: string, status: BedStatus) => {
    setHospital(prevHospital => updateBedStatus(prevHospital, bedId, status));
    
    toast({
      title: "Estado de cama actualizado",
      description: `Estado de cama cambiado a ${status}`,
    });
  };

  const handleUpdatePatientStatus = (patientId: string, status: PatientStatus) => {
    setHospital(prevHospital => updatePatientStatus(prevHospital, patientId, status));
    
    toast({
      title: "Estado de paciente actualizado",
      description: `Estado de paciente cambiado a ${status}`,
    });
  };

  const handleRefreshData = () => {
    setHospital(generateHospitalData());
    setSelectedBedId(null);
    setSelectedPatientId(null);
    
    toast({
      title: "Datos actualizados",
      description: "Datos del hospital han sido actualizados con nuevos valores aleatorios",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      <div className="lg:col-span-3 space-y-6">
        <div className="sticky top-6">
          <ControlPanel 
            hospital={hospital}
            selectedFloor={selectedFloor}
            onFloorChange={handleFloorChange}
            onRefreshData={handleRefreshData}
            occupancyRate={occupancyRate}
            isDarkMode={isDarkMode}
          />
          
          {(selectedBedId || selectedPatientId) && (
            <div className="mt-6 animate-fade-in">
              <DetailPanel 
                hospital={hospital}
                selectedBedId={selectedBedId}
                selectedPatientId={selectedPatientId}
                onClose={handleCloseDetail}
                onUpdateBedStatus={handleUpdateBedStatus}
                onUpdatePatientStatus={handleUpdatePatientStatus}
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="lg:col-span-9 overflow-hidden h-[70vh] rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm bg-white/5 dark:bg-slate-900/5">
        <ThreeJSCanvas 
          hospital={hospital}
          selectedFloor={selectedFloor}
          selectedPatientId={selectedPatientId}
          onBedSelect={handleBedSelect}
          onPatientSelect={handlePatientSelect}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

export default HospitalIsometricView;
