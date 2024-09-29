"use client";

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/app/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface ChartProps {
  content: {
    chart_type: "bar" | "line";
    data: { x: string; y: number }[];
    x_label: string;
    y_label: string;
  };
}

export function ChartDisplay({ content }: ChartProps) {
  const { chart_type, data, x_label, y_label } = content;

  const chartData = data.map((d) => ({
    [x_label]: d.x,
    [y_label]: d.y,
  }));

  const chartConfig = {
    [y_label]: {
      label: y_label,
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      {chart_type === "bar" ? (
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey={x_label}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "hsl(var(--foreground))" }}
            tickFormatter={(value) => value.toString().slice(0, 5)}
            className="text-xs"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "hsl(var(--foreground))" }}
            className="text-xs"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey={y_label}
            fill="hsl(var(--chart-1))"
            radius={[4, 4, 0, 0]}
            className="fill-primary"
          />
        </BarChart>
      ) : (
        <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey={x_label}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--foreground))" }}
              tickFormatter={(value) => value.toString().slice(0, 5)}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--foreground))" }}
              className="text-xs"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey={y_label}
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
      )}
    </ChartContainer>
  );
}