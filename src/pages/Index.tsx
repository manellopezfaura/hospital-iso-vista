
import { Hospital } from "lucide-react";
import HospitalIsometricView from "@/components/HospitalIsometricView";

const Index = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Hospital className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Hospital Iso Vista</h1>
        </div>
        <p className="text-muted-foreground">
          Interactive 3D isometric visualization of hospital occupancy and patient status
        </p>
      </div>
      
      <HospitalIsometricView />
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Interact with the 3D view by dragging to rotate, scrolling to zoom, and clicking on beds or patients for details.
        </p>
      </div>
    </div>
  );
};

export default Index;
