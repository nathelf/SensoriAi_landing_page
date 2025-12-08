import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MapVisualization } from "@/components/dashboard/MapVisualization";

const Maps = () => {
  return (
    <DashboardLayout>
      <div id="dashboard-content" className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mapas Georreferenciados</h1>
          <p className="text-muted-foreground">Visualização completa das áreas mapeadas</p>
        </div>
        
        <MapVisualization />
      </div>
    </DashboardLayout>
  );
};

export default Maps;
