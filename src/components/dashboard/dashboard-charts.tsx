"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import type { RWBarChartItem, StatusPieChartItem } from "@/types/app";

interface RwGroupStat {
  rw: string;
  _sum: { ketetapan: number; pembayaran: number };
}

interface MonthlyPayment {
  tanggalBayar: Date | string | null;
  _sum: { pembayaran: number | null };
}

export function RWBarChart({ data }: { data: RwGroupStat[] }) {
  const chartData = data.map((item) => ({
    name: `RW ${item.rw || "?"}`,
    target: item._sum.ketetapan || 0,
    terbayar: item._sum.pembayaran || 0,
  }));

  return (
    <div className="mt-4 h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)} Juta`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
            formatter={(value) => [`Rp${(Number(value) / 1000000).toFixed(2)} Juta`, ""]}
          />
          <Legend />
          <Bar dataKey="target" fill="#6366F1" radius={[4, 4, 0, 0]} name="Target" />
          <Bar dataKey="terbayar" fill="#10B981" radius={[4, 4, 0, 0]} name="Terbayar" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusPieChart({ data }: { data: StatusPieChartItem[] }) {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={80}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineTrendChart({ data }: { data: MonthlyPayment[] }) {
  const monthlyData = new Array(12).fill(0).map((_, i) => ({
    name: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(2000, i, 1)),
    nominal: 0,
  }));

  data.forEach((item) => {
    if (item.tanggalBayar) {
      const month = new Date(item.tanggalBayar).getMonth();
      monthlyData[month].nominal += item._sum.pembayaran || 0;
    }
  });

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
          <YAxis stroke="#64748B" fontSize={12} hide />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
            formatter={(value) => [`Rp${(Number(value) / 1000000).toFixed(2)} Juta`, ""]}
          />
          <Line
            type="monotone"
            dataKey="nominal"
            stroke="#6366F1"
            strokeWidth={3}
            dot={{ r: 4, fill: "#6366F1" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Named export for compatibility
export const DashboardCharts = {
  RWBarChart,
  StatusPieChart,
  LineTrendChart,
};
