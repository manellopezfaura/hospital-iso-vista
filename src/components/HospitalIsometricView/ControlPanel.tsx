
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Hospital, FloorType } from '@/types/hospital';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ControlPanelProps {
  hospital: Hospital;
  selectedFloor: string | null;
  onFloorChange: (floorId: string | null) => void;
  onRefreshData: () => void;
  occupancyRate: number;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  hospital, 
  selectedFloor, 
  onFloorChange,
  onRefreshData,
  occupancyRate 
}) => {
  const getTotalBeds = () => hospital.beds.length;
  
  const getOccupiedBeds = () => hospital.beds.filter(bed => bed.status === 'occupied').length;
  
  const getAvailableBeds = () => hospital.beds.filter(bed => bed.status === 'available').length;
  
  const getCleaningBeds = () => hospital.beds.filter(bed => bed.status === 'cleaning').length;
  
  const getCriticalPatients = () => hospital.patients.filter(patient => patient.status === 'critical').length;
  
  const getPatientsByFloor = (floorId: string) => {
    const floor = hospital.floors.find(f => f.id === floorId);
    if (!floor) return 0;
    
    const floorBeds = hospital.beds.filter(bed => bed.floor === floor.type && bed.patientId);
    return floorBeds.length;
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Hospital Occupancy</CardTitle>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefreshData}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Occupancy rate: {(occupancyRate * 100).toFixed(1)}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="floor-select">Floor</Label>
            <Select 
              value={selectedFloor || "all"} 
              onValueChange={(value) => onFloorChange(value === "all" ? null : value)}
            >
              <SelectTrigger id="floor-select">
                <SelectValue placeholder="Select Floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                {hospital.floors.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    {floor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="summary">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="floors">By Floor</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center justify-center p-2 bg-hospital-bed-occupied bg-opacity-10 rounded-md">
                  <div className="text-xl font-bold">{getOccupiedBeds()}</div>
                  <div className="text-xs text-muted-foreground">Occupied</div>
                </div>
                <div className="flex flex-col items-center justify-center p-2 bg-hospital-bed-available bg-opacity-10 rounded-md">
                  <div className="text-xl font-bold">{getAvailableBeds()}</div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
                <div className="flex flex-col items-center justify-center p-2 bg-hospital-bed-cleaning bg-opacity-10 rounded-md">
                  <div className="text-xl font-bold">{getCleaningBeds()}</div>
                  <div className="text-xs text-muted-foreground">Cleaning</div>
                </div>
                <div className="flex flex-col items-center justify-center p-2 bg-hospital-patient-critical bg-opacity-10 rounded-md">
                  <div className="text-xl font-bold">{getCriticalPatients()}</div>
                  <div className="text-xs text-muted-foreground">Critical</div>
                </div>
              </div>
            
              <div>
                <h4 className="mb-2 text-sm font-medium">Status Legend</h4>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <Badge className="bg-hospital-bed-available border-none">Available</Badge>
                  <Badge className="bg-hospital-bed-occupied border-none">Occupied</Badge>
                  <Badge className="bg-hospital-bed-cleaning border-none">Cleaning</Badge>
                  <Badge className="bg-hospital-patient-critical border-none">Critical</Badge>
                  <Badge className="bg-hospital-patient-stable border-none">Stable</Badge>
                  <Badge className="bg-hospital-patient-discharged border-none">Discharged</Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="floors" className="pt-4">
              <div className="space-y-2">
                {hospital.floors.map((floor) => (
                  <div 
                    key={floor.id} 
                    className="flex items-center justify-between p-2 bg-background rounded-md border"
                  >
                    <span className="text-sm font-medium">{floor.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">
                        {getPatientsByFloor(floor.id)} / {floor.beds.length} beds
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onFloorChange(floor.id)} 
                        className="h-7 text-xs"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
