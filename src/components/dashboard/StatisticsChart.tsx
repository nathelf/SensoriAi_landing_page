import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartPoint {
  name: string;
  value?: number;
  percentage?: number;
  [key: string]: any;
}

interface StatisticsChartProps {
  data: ChartPoint[];
  title: string;
  unit?: string; // ex: "%" or " ha"
  yAxisDomain?: [number | "auto", number | "auto"];
  valueKey?: string; // qual campo usar como principal (default: "value")
  tooltipRawKey?: string | null; // ex: "rawHa"
  showValues?: boolean; // mostra rótulos
  forceLine?: boolean; // força desenhar linha mesmo para poucos pontos
  lineColor?: string; // cor da linha (override)
  dotRadius?: number; // raio do ponto
}

export const StatisticsChart = ({
  data,
  title,
  unit = "",
  yAxisDomain = ["auto", "auto"],
  valueKey = "value",
  tooltipRawKey = null,
  showValues = false,
  forceLine = false,
  lineColor = "hsl(var(--primary))",
  dotRadius = 6,
}: StatisticsChartProps) => {
  const domain = Array.isArray(yAxisDomain) ? yAxisDomain : ["auto", "auto"];

  const renderTooltip = (props: any) => {
    if (!props.active || !props.payload || !props.payload.length) return null;
    const payload = props.payload[0].payload as ChartPoint;
    const label = props.label;
    const val = payload[valueKey];
    const raw = tooltipRawKey ? payload[tooltipRawKey] : null;

    return (
      <div
        style={{
          background: "var(--background)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: 8,
          fontSize: 12,
        }}
      >
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div style={{ marginTop: 4 }}>
          <span style={{ fontWeight: 600 }}>{val !== undefined ? `${val}${unit}` : "-"}</span>
          {raw !== null && raw !== undefined ? <span>{` — ${raw} ha`}</span> : null}
        </div>
      </div>
    );
  };

  const showPercentageLine = !!data?.[0]?.percentage && valueKey !== "percentage";

  // legenda customizada: mostra só as séries que fazem sentido
  const mainLabel = unit === "%" ? "Percentual (%)" : unit ? `Valor (${unit})` : valueKey;
  const legendPayload: any[] = [
    { value: mainLabel, id: "main", type: "line", color: lineColor },
  ];
  if (showPercentageLine) {
    legendPayload.push({ value: "Porcentagem (%)", id: "percentage", type: "line", color: "hsl(var(--secondary))" });
  }

  const singlePoint = Array.isArray(data) && data.length === 1;
  const singleValue = singlePoint ? (data[0][valueKey] ?? data[0].value ?? null) : null;
  const singleRaw = singlePoint && tooltipRawKey ? data[0][tooltipRawKey] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--foreground))" }}
              domain={domain as any}
              tickFormatter={(v: any) => `${v}${unit}`}
            />
            <Tooltip content={renderTooltip} />

            {/* legenda customizada */}
            <Legend payload={legendPayload.map((p) => ({ value: p.value, type: p.type, color: p.color }))} />

            {/* Se for apenas 1 ponto, desenha uma ReferenceLine horizontal para ficar visível */}
            {singlePoint && singleValue !== null && (
              <ReferenceLine
                y={singleValue}
                stroke={lineColor}
                strokeWidth={3}
                strokeOpacity={0.95}
                label={{
                  value: `${singleValue}${unit}${singleRaw ? ` — ${singleRaw} ha` : ""}`,
                  position: "top",
                  fill: "hsl(var(--foreground))",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              />
            )}

            <Line
              type="monotone"
              dataKey={valueKey}
              stroke={lineColor}
              strokeWidth={3}
              strokeOpacity={0.95}
              name={mainLabel}
              dot={{ fill: lineColor, r: dotRadius }}
              activeDot={{ r: dotRadius + 2 }}
              isAnimationActive={false}
            >
              {showValues && <LabelList dataKey={valueKey} position="top" formatter={(v: any) => `${v}${unit}`} />}
            </Line>

            {showPercentageLine && (
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                strokeDasharray="4 4"
                name="%"
                dot={{ fill: "hsl(var(--secondary))", r: Math.max(3, dotRadius - 2) }}
                activeDot={{ r: Math.max(5, dotRadius) }}
                isAnimationActive={false}
              >
                {showValues && <LabelList dataKey="percentage" position="top" formatter={(v: any) => `${v}%`} />}
              </Line>
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default StatisticsChart;
