// src/pages/Dashboard.tsx  (ou onde estiver o seu Dashboard)
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MapVisualization } from "@/components/dashboard/MapVisualization";
import { RecommendationsPanel } from "@/components/dashboard/RecommendationsPanel";
import { FarmInfoHeader } from "@/components/dashboard/FarmInfoHeader";
import StatisticsChart from "@/components/dashboard/StatisticsChart"; // default import
import { Sprout, AlertTriangle, Activity, MapPin } from "lucide-react";

const Dashboard = () => {
  const totalAreaHa = 80;

  const farmInfo = {
    consultant: "Rufer Haubricht Furtado Filho",
    crop: "Soja",
    season: "2025-2026",
  };

  const vigorPct = {
    alto: 47.04,
    medio: 12.29,
    baixo: 40.67,
  };

  const weedsPct = 5.671;
  const failuresPct = 2.19;

  const hectares = {
    weeds: +(totalAreaHa * (weedsPct / 100)).toFixed(2),
    failures: +(totalAreaHa * (failuresPct / 100)).toFixed(2),
    vigor: {
      alto: +(totalAreaHa * (vigorPct.alto / 100)).toFixed(2),
      medio: +(totalAreaHa * (vigorPct.medio / 100)).toFixed(2),
      baixo: +(totalAreaHa * (vigorPct.baixo / 100)).toFixed(2),
    },
  };

  // <<< IMPORTANT: value = PERCENT (0-100). rawHa só para tooltip.
  const weedsChartData = [
    { name: "Infestação (global)", value: weedsPct, rawHa: hectares.weeds },
  ];

  const failuresChartData = [
    { name: "Falhas (global)", value: failuresPct, rawHa: hectares.failures },
  ];

  const vigorChartData = [
    { name: "Alto Vigor", value: vigorPct.alto, rawHa: hectares.vigor.alto },
    { name: "Vigor Médio", value: vigorPct.medio, rawHa: hectares.vigor.medio },
    { name: "Baixo Vigor", value: vigorPct.baixo, rawHa: hectares.vigor.baixo },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Análise</h1>
          <p className="text-muted-foreground">Visão geral das análises da lavoura</p>
        </div>

        <FarmInfoHeader info={farmInfo} />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Área Total Mapeada"
            value={`${totalAreaHa} ha`}
            subtitle="100% da propriedade"
            icon={MapPin}
            variant="success"
          />

          <MetricCard
            title="Plantas Daninhas"
            value={`${weedsPct.toFixed(3)}%`}
            subtitle={`≈ ${hectares.weeds} ha infestados`}
            icon={Sprout}
            variant="warning"
            trend={{ value: "Distribuição esparsa — nível baixo", isPositive: true }}
          />

          <MetricCard
            title="Falhas de Plantio"
            value={`${failuresPct.toFixed(2)}%`}
            subtitle={`≈ ${hectares.failures} ha com falhas`}
            icon={AlertTriangle}
            variant="danger"
          />

          <MetricCard
            title="Vigor Médio"
            value={`${((vigorPct.alto * 1)).toFixed(2)}%`}
            subtitle={`Alto: ${vigorPct.alto.toFixed(2)}% | Médio: ${vigorPct.medio.toFixed(2)}% | Baixo: ${vigorPct.baixo.toFixed(2)}%`}
            icon={Activity}
            variant="success"
            trend={{ value: "Padrão em mosaico — considerar manejo localizado", isPositive: true }}
          />
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <StatisticsChart
            data={weedsChartData}
            title="Evolução de Plantas Daninhas"
            unit="%"
            yAxisDomain={[0, 100]}
            valueKey="value"
            tooltipRawKey="rawHa"
            showValues={true}
            forceLine={true} // opcional, veja comentário abaixo
          />

          <StatisticsChart
            data={failuresChartData}
            title="Evolução de Falhas de Plantio"
            unit="%"
            yAxisDomain={[0, 100]}
            valueKey="value"
            tooltipRawKey="rawHa"
            showValues={true}
            forceLine={true}
          />

          <StatisticsChart
            data={vigorChartData}
            title="Evolução de Vigor"
            unit="%"
            yAxisDomain={[0, 100]}
            valueKey="value"
            tooltipRawKey="rawHa"
            showValues={true}
            forceLine={true}
          />
        </div>

        <MapVisualization />

        <RecommendationsPanel />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
