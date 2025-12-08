import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Eye, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for historical reports
const mockReports = [
  {
    id: "1",
    date: "2024-12-15",
    period: "Semana 50",
    weedsPercentage: 15.8,
    failuresPercentage: 8.3,
    vigorPercentage: 72,
    trend: "up" as const,
  },
  {
    id: "2",
    date: "2024-12-08",
    period: "Semana 49",
    weedsPercentage: 13.5,
    failuresPercentage: 7.1,
    vigorPercentage: 67,
    trend: "up" as const,
  },
  {
    id: "3",
    date: "2024-12-01",
    period: "Semana 48",
    weedsPercentage: 11.2,
    failuresPercentage: 9.5,
    vigorPercentage: 65,
    trend: "down" as const,
  },
  {
    id: "4",
    date: "2024-11-24",
    period: "Semana 47",
    weedsPercentage: 9.8,
    failuresPercentage: 8.8,
    vigorPercentage: 70,
    trend: "up" as const,
  },
  {
    id: "5",
    date: "2024-11-17",
    period: "Semana 46",
    weedsPercentage: 8.5,
    failuresPercentage: 7.2,
    vigorPercentage: 68,
    trend: "up" as const,
  },
];

// Data for temporal trend chart
const trendData = [
  { period: "Sem 46", weeds: 8.5, failures: 7.2, vigor: 68 },
  { period: "Sem 47", weeds: 9.8, failures: 8.8, vigor: 70 },
  { period: "Sem 48", weeds: 11.2, failures: 9.5, vigor: 65 },
  { period: "Sem 49", weeds: 13.5, failures: 7.1, vigor: 67 },
  { period: "Sem 50", weeds: 15.8, failures: 8.3, vigor: 72 },
];

const ReportsHistory = () => {
  const [selectedReport, setSelectedReport] = useState(mockReports[0]);
  const [compareReport, setCompareReport] = useState(mockReports[1]);

  const calculateChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change > 0,
    };
  };

  const weedsChange = calculateChange(
    selectedReport.weedsPercentage,
    compareReport.weedsPercentage
  );
  const failuresChange = calculateChange(
    selectedReport.failuresPercentage,
    compareReport.failuresPercentage
  );
  const vigorChange = calculateChange(
    selectedReport.vigorPercentage,
    compareReport.vigorPercentage
  );

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Histórico de Relatórios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare e analise a evolução dos indicadores ao longo do tempo
          </p>
        </div>

        {/* Temporal Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência Temporal dos Indicadores</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="period"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="weeds"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={3}
                  name="Plantas Daninhas (%)"
                  dot={{ fill: 'hsl(var(--destructive))', r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="failures"
                  stroke="hsl(var(--warning))"
                  strokeWidth={3}
                  name="Falhas (%)"
                  dot={{ fill: 'hsl(var(--warning))', r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="vigor"
                  stroke="hsl(var(--success))"
                  strokeWidth={3}
                  name="Vigor (%)"
                  dot={{ fill: 'hsl(var(--success))', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Comparison Cards */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Selected Report */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Relatório Atual</CardTitle>
                <Badge variant="default">Atual</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Período</span>
                  <span className="font-semibold">{selectedReport.period}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data</span>
                  <span className="font-semibold">
                    {new Date(selectedReport.date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Plantas Daninhas</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-destructive">
                      {selectedReport.weedsPercentage}%
                    </span>
                    {weedsChange.isPositive ? (
                      <TrendingUp className="h-4 w-4 text-destructive" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-success" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {weedsChange.value}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Falhas de Plantio</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-warning">
                      {selectedReport.failuresPercentage}%
                    </span>
                    {failuresChange.isPositive ? (
                      <TrendingUp className="h-4 w-4 text-warning" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-success" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {failuresChange.value}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Vigor da Cultura</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-success">
                      {selectedReport.vigorPercentage}%
                    </span>
                    {vigorChange.isPositive ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {vigorChange.value}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compare Report */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Relatório de Comparação</CardTitle>
                <Badge variant="secondary">Anterior</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Período</span>
                  <span className="font-semibold">{compareReport.period}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data</span>
                  <span className="font-semibold">
                    {new Date(compareReport.date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Plantas Daninhas</span>
                  <span className="font-bold text-destructive">
                    {compareReport.weedsPercentage}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Falhas de Plantio</span>
                  <span className="font-bold text-warning">
                    {compareReport.failuresPercentage}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Vigor da Cultura</span>
                  <span className="font-bold text-success">
                    {compareReport.vigorPercentage}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Relatórios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{report.period}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-4 text-sm">
                      <span className="text-destructive font-medium">
                        {report.weedsPercentage}% plantas
                      </span>
                      <span className="text-warning font-medium">
                        {report.failuresPercentage}% falhas
                      </span>
                      <span className="text-success font-medium">
                        {report.vigorPercentage}% vigor
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCompareReport(report)}
                      >
                        Comparar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReportsHistory;
