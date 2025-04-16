
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Hospital, Bed, Patient, Staff } from '@/types/hospital';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from 'lucide-react';

interface DetailPanelProps {
  hospital: Hospital;
  selectedBedId?: string | null;
  selectedPatientId?: string | null;
  onClose: () => void;
  onUpdateBedStatus: (bedId: string, status: 'available' | 'occupied' | 'cleaning') => void;
  onUpdatePatientStatus: (patientId: string, status: 'critical' | 'stable' | 'discharged') => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  hospital,
  selectedBedId,
  selectedPatientId,
  onClose,
  onUpdateBedStatus,
  onUpdatePatientStatus
}) => {
  const selectedBed = selectedBedId 
    ? hospital.beds.find(bed => bed.id === selectedBedId)
    : null;
    
  const selectedPatient = selectedPatientId
    ? hospital.patients.find(patient => patient.id === selectedPatientId)
    : selectedBed?.patientId
      ? hospital.patients.find(patient => patient.id === selectedBed.patientId)
      : null;
      
  if (!selectedBed && !selectedPatient) {
    return null;
  }
  
  const getAssignedStaff = (patientId: string): Staff[] => {
    if (!patientId) return [];
    const patient = hospital.patients.find(p => p.id === patientId);
    if (!patient) return [];
    
    return hospital.staff.filter(staff => 
      patient.assignedStaffIds.includes(staff.id)
    );
  };
  
  const getBedStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-hospital-bed-available';
      case 'occupied': return 'bg-hospital-bed-occupied';
      case 'cleaning': return 'bg-hospital-bed-cleaning';
      default: return 'bg-gray-500';
    }
  };
  
  const getPatientStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-hospital-patient-critical';
      case 'stable': return 'bg-hospital-patient-stable';
      case 'discharged': return 'bg-hospital-patient-discharged';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full h-full min-h-[400px] overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            {selectedBed && (
              <Badge variant="outline" className="mb-1">
                {selectedBed.floor} - {selectedBed.room}
              </Badge>
            )}
            <CardTitle>
              {selectedPatient ? selectedPatient.name : `Bed ${selectedBedId}`}
            </CardTitle>
            <CardDescription>
              {selectedBed && (
                <Badge className={`${getBedStatusColor(selectedBed.status)} border-none mt-1`}>
                  Bed: {selectedBed.status}
                </Badge>
              )}
              {selectedPatient && (
                <Badge className={`${getPatientStatusColor(selectedPatient.status)} border-none mt-1 ml-2`}>
                  Patient: {selectedPatient.status}
                </Badge>
              )}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <ScrollArea className="h-[calc(100%-8rem)]">
        <CardContent>
          {selectedBed && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm mb-1">Bed Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted p-2 rounded-md">
                    <div className="text-muted-foreground text-xs">Floor</div>
                    <div>{selectedBed.floor}</div>
                  </div>
                  <div className="bg-muted p-2 rounded-md">
                    <div className="text-muted-foreground text-xs">Room</div>
                    <div>{selectedBed.room}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-sm mb-1">Bed Status</h3>
                <div className="grid grid-cols-3 gap-1">
                  <Button 
                    variant={selectedBed.status === 'available' ? "default" : "outline"} 
                    size="sm"
                    className={selectedBed.status === 'available' ? "bg-hospital-bed-available hover:bg-hospital-bed-available/80" : ""}
                    onClick={() => onUpdateBedStatus(selectedBed.id, 'available')}
                  >
                    Available
                  </Button>
                  <Button 
                    variant={selectedBed.status === 'occupied' ? "default" : "outline"} 
                    size="sm"
                    className={selectedBed.status === 'occupied' ? "bg-hospital-bed-occupied hover:bg-hospital-bed-occupied/80" : ""}
                    onClick={() => onUpdateBedStatus(selectedBed.id, 'occupied')}
                  >
                    Occupied
                  </Button>
                  <Button 
                    variant={selectedBed.status === 'cleaning' ? "default" : "outline"} 
                    size="sm"
                    className={selectedBed.status === 'cleaning' ? "bg-hospital-bed-cleaning hover:bg-hospital-bed-cleaning/80" : ""}
                    onClick={() => onUpdateBedStatus(selectedBed.id, 'cleaning')}
                  >
                    Cleaning
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {selectedPatient && (
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-medium text-sm mb-1">Patient Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted p-2 rounded-md">
                    <div className="text-muted-foreground text-xs">Admission Type</div>
                    <div>{selectedPatient.admissionType}</div>
                  </div>
                  <div className="bg-muted p-2 rounded-md">
                    <div className="text-muted-foreground text-xs">Status</div>
                    <div>{selectedPatient.status}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-sm mb-1">Patient Status</h3>
                <div className="grid grid-cols-3 gap-1">
                  <Button 
                    variant={selectedPatient.status === 'critical' ? "default" : "outline"} 
                    size="sm"
                    className={selectedPatient.status === 'critical' ? "bg-hospital-patient-critical hover:bg-hospital-patient-critical/80" : ""}
                    onClick={() => onUpdatePatientStatus(selectedPatient.id, 'critical')}
                  >
                    Critical
                  </Button>
                  <Button 
                    variant={selectedPatient.status === 'stable' ? "default" : "outline"} 
                    size="sm"
                    className={selectedPatient.status === 'stable' ? "bg-hospital-patient-stable hover:bg-hospital-patient-stable/80" : ""}
                    onClick={() => onUpdatePatientStatus(selectedPatient.id, 'stable')}
                  >
                    Stable
                  </Button>
                  <Button 
                    variant={selectedPatient.status === 'discharged' ? "default" : "outline"} 
                    size="sm"
                    className={selectedPatient.status === 'discharged' ? "bg-hospital-patient-discharged hover:bg-hospital-patient-discharged/80" : ""}
                    onClick={() => onUpdatePatientStatus(selectedPatient.id, 'discharged')}
                  >
                    Discharged
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-sm mb-1">Assigned Staff</h3>
                {getAssignedStaff(selectedPatient.id).length > 0 ? (
                  <div className="space-y-1">
                    {getAssignedStaff(selectedPatient.id).map(staff => (
                      <div key={staff.id} className="bg-muted p-2 rounded-md flex justify-between">
                        <div>{staff.name}</div>
                        <Badge variant="outline">{staff.type}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No staff assigned</div>
                )}
              </div>
              
              {selectedPatient.notes && (
                <div>
                  <h3 className="font-medium text-sm mb-1">Notes</h3>
                  <div className="text-sm bg-muted p-2 rounded-md">
                    {selectedPatient.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default DetailPanel;
