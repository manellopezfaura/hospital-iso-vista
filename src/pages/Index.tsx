
import { Hospital, Moon, Sun } from "lucide-react";
import HospitalIsometricView from "@/components/HospitalIsometricView";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const Index = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Add or remove the 'dark' class from the document
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg">
            <Hospital className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300">
            Hospital Iso Vista
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Visualización isométrica interactiva en 3D de la ocupación hospitalaria y el estado de los pacientes
        </p>
      </div>
      
      <div className="mb-6 flex justify-end">
        <div className="flex items-center space-x-2 rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2 shadow-sm transition-all duration-300">
          <Sun className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <Switch
            checked={isDarkMode}
            onCheckedChange={toggleTheme}
            aria-label="Toggle dark mode"
          />
          <Moon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
          </span>
        </div>
      </div>
      
      <HospitalIsometricView isDarkMode={isDarkMode} />
      
      <div className="mt-10 text-center">
        <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300 shadow-sm">
          <span className="animate-pulse mr-2">●</span>
          <p>
            Interactúa con la vista 3D arrastrando para rotar, desplazándote para hacer zoom y haciendo clic en camas o pacientes para ver detalles.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
