
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Hospital, FloorType } from '@/types/hospital';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, AlertCircle, Clock } from 'lucide-react';

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

  // Calculate percentage for progress bar
  const occupancyPercentage = Math.round(occupancyRate * 100);
  const getOccupancyColorClass = () => {
    if (occupancyPercentage < 60) return 'bg-hospital-bed-available/90';
    if (occupancyPercentage < 85) return 'bg-hospital-bed-occupied/90';
    return 'bg-hospital-patient-critical/90';
  };
  
  return (
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 shadow-lg border-slate-200/80 dark:border-slate-700/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-800 dark:text-slate-100 text-xl">Hospital Occupancy</CardTitle>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefreshData}
            className="h-8 w-8 rounded-full"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-sm mt-1">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-medium">
              <span>Occupancy rate</span>
              <span className="font-semibold">{occupancyPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getOccupancyColorClass()} transition-all duration-500 ease-in-out`} 
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="floor-select" className="text-sm font-medium mb-1.5 block">Select Floor</Label>
            <Select 
              value={selectedFloor || "all"} 
              onValueChange={(value) => onFloorChange(value === "all" ? null : value)}
            >
              <SelectTrigger id="floor-select" className="h-9">
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

          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
              <TabsTrigger value="floors" className="text-xs">By Floor</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="pt-4 space-y-5">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-hospital-bed-occupied/10 to-hospital-bed-occupied/20 rounded-lg shadow-sm">
                  <div className="text-xl font-bold text-hospital-bed-occupied">{getOccupiedBeds()}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">Occupied</div>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-hospital-bed-available/10 to-hospital-bed-available/20 rounded-lg shadow-sm">
                  <div className="text-xl font-bold text-hospital-bed-available">{getAvailableBeds()}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">Available</div>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-hospital-bed-cleaning/10 to-hospital-bed-cleaning/20 rounded-lg shadow-sm">
                  <div className="text-xl font-bold text-hospital-bed-cleaning">{getCleaningBeds()}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">Cleaning</div>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-hospital-patient-critical/10 to-hospital-patient-critical/20 rounded-lg shadow-sm">
                  <div className="text-xl font-bold text-hospital-patient-critical">{getCriticalPatients()}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">Critical</div>
                </div>
              </div>
            
              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Status Legend</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="w-3 h-3 rounded-full bg-hospital-bed-available flex-shrink-0"></div>
                      <span className="text-xs font-medium">Available</span>
                      <Check className="w-3.5 h-3.5 ml-auto text-hospital-bed-available" />
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="w-3 h-3 rounded-full bg-hospital-bed-occupied flex-shrink-0"></div>
                      <span className="text-xs font-medium">Occupied</span>
                      <AlertCircle className="w-3.5 h-3.5 ml-auto text-hospital-bed-occupied" />
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="w-3 h-3 rounded-full bg-hospital-bed-cleaning flex-shrink-0"></div>
                      <span className="text-xs font-medium">Cleaning</span>
                      <Clock className="w-3.5 h-3.5 ml-auto text-hospital-bed-cleaning" />
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="w-3 h-3 rounded-full bg-hospital-patient-critical flex-shrink-0"></div>
                      <span className="text-xs font-medium">Critical</span>
                      <AlertCircle className="w-3.5 h-3.5 ml-auto text-hospital-patient-critical" />
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="w-3 h-3 rounded-full bg-hospital-patient-stable flex-shrink-0"></div>
                      <span className="text-xs font-medium">Stable</span>
                      <Check className="w-3.5 h-3.5 ml-auto text-hospital-patient-stable" />
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="w-3 h-3 rounded-full bg-hospital-patient-discharged flex-shrink-0"></div>
                      <span className="text-xs font-medium">Discharged</span>
                      <Clock className="w-3.5 h-3.5 ml-auto text-hospital-patient-discharged" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="floors" className="pt-4">
              <div className="space-y-2.5">
                {hospital.floors.map((floor) => (
                  <div 
                    key={floor.id} 
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors group"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{floor.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {getPatientsByFloor(floor.id)} / {floor.beds.length} beds
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onFloorChange(floor.id)} 
                      className="h-7 text-xs opacity-60 group-hover:opacity-100"
                    >
                      View
                    </Button>
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
