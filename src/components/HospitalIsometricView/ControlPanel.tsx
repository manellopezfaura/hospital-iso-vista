
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Hospital, FloorType } from '@/types/hospital';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, AlertCircle, Clock, Activity, BedDouble, Brush, UserCheck } from 'lucide-react';

interface ControlPanelProps {
  hospital: Hospital;
  selectedFloor: string | null;
  onFloorChange: (floorId: string | null) => void;
  onRefreshData: () => void;
  occupancyRate: number;
  isDarkMode?: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  hospital, 
  selectedFloor, 
  onFloorChange,
  onRefreshData,
  occupancyRate,
  isDarkMode = true
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
  
  const cardTheme = isDarkMode 
    ? "backdrop-blur-sm bg-slate-900/80 shadow-lg border-slate-700/80" 
    : "backdrop-blur-sm bg-white/80 shadow-lg border-slate-200/80";

  const statusBgClass = isDarkMode ? "bg-slate-800" : "bg-white";
  const statusBorderClass = isDarkMode ? "border-slate-700" : "border-slate-200";
  
  return (
    <Card className={cardTheme}>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center p-3 rounded-lg shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-600/20 border border-amber-500/20">
                  <div className="mr-3 p-2 rounded-full bg-amber-500/20">
                    <BedDouble className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-amber-500">{getOccupiedBeds()}</div>
                    <div className="text-xs font-medium mt-0.5 text-slate-600 dark:text-slate-300">Occupied Beds</div>
                  </div>
                </div>
                <div className="flex items-center p-3 rounded-lg shadow-sm bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 border border-emerald-500/20">
                  <div className="mr-3 p-2 rounded-full bg-emerald-500/20">
                    <Check className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-emerald-500">{getAvailableBeds()}</div>
                    <div className="text-xs font-medium mt-0.5 text-slate-600 dark:text-slate-300">Available</div>
                  </div>
                </div>
                <div className="flex items-center p-3 rounded-lg shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/20">
                  <div className="mr-3 p-2 rounded-full bg-blue-500/20">
                    <Brush className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-blue-500">{getCleaningBeds()}</div>
                    <div className="text-xs font-medium mt-0.5 text-slate-600 dark:text-slate-300">Cleaning</div>
                  </div>
                </div>
                <div className="flex items-center p-3 rounded-lg shadow-sm bg-gradient-to-br from-rose-500/10 to-rose-600/20 border border-rose-500/20">
                  <div className="mr-3 p-2 rounded-full bg-rose-500/20">
                    <Activity className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-rose-500">{getCriticalPatients()}</div>
                    <div className="text-xs font-medium mt-0.5 text-slate-600 dark:text-slate-300">Critical</div>
                  </div>
                </div>
              </div>
            
              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Status Legend</h4>
                <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden bg-gradient-to-br from-slate-50/30 to-slate-100/30 dark:from-slate-800/30 dark:to-slate-700/30 p-3 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-slate-800/80 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    </div>
                    <span className="text-xs font-medium">Available</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-slate-800/80 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    </div>
                    <span className="text-xs font-medium">Occupied</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-slate-800/80 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    </div>
                    <span className="text-xs font-medium">Cleaning</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-slate-800/80 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                    </div>
                    <span className="text-xs font-medium">Critical</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-slate-800/80 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-xs font-medium">Stable</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-slate-800/80 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-900/30">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>
                    </div>
                    <span className="text-xs font-medium">Discharged</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="floors" className="pt-4">
              <div className="space-y-2.5">
                {hospital.floors.map((floor) => (
                  <div 
                    key={floor.id} 
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors group shadow-sm"
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
