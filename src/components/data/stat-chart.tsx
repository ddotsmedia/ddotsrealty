"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const COLORS = {
  navy: "#1e3a5f",
  gold: "#c8a45c",
  green: "#2d8b4e",
  orange: "#e8922a",
  red: "#dc2626",
  gray: "#9ca3af",
};

interface RevenueBarChartProps {
  data: Array<{ month: string; value: number }>;
}

export function RevenueBarChart({ data }: RevenueBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
        <YAxis hide />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value ?? 0))}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
          }}
        />
        <Bar dataKey="value" fill={COLORS.navy} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface OccupancyDonutProps {
  data: { available: number; rented: number; other: number };
}

export function OccupancyDonut({ data }: OccupancyDonutProps) {
  const total = (data.available || 0) + (data.rented || 0) + (data.other || 0);

  if (total === 0) {
    return (
      <div className="h-60 flex items-center justify-center text-muted-foreground">
        No properties
      </div>
    );
  }

  const chartData = [
    { name: "Available", value: data.available || 0 },
    { name: "Rented", value: data.rented || 0 },
    { name: "Other", value: data.other || 0 },
  ].filter((item) => item.value > 0);

  const chartColors = [COLORS.green, COLORS.navy, COLORS.gold];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={chartColors[index % chartColors.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => Number(value ?? 0).toString()}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface LeadPipelineBarProps {
  data: Array<{ status: string; count: number }>;
}

export function LeadPipelineBar({ data }: LeadPipelineBarProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center text-muted-foreground">
        No leads
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" stroke="#6b7280" fontSize={12} />
        <YAxis dataKey="status" type="category" stroke="#6b7280" fontSize={11} />
        <Tooltip
          formatter={(value) => Number(value ?? 0).toString()}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
          }}
        />
        <Bar dataKey="count" fill={COLORS.gold} radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
