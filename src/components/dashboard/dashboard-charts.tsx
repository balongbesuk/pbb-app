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
  Legend
} from 'recharts';

export function RWBarChart({ data }: { data: any[] }) {
  const chartData = data.map(item => ({
    name: `RW ${item.rw || '?' }`,
    target: item._sum.ketetapan || 0,
    terbayar: item._sum.pembayaran || 0
  }));

  return (
    <div className="h-[350px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${(value / 1000000).toFixed(1)}M`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(value: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(value || 0))}
          />
          <Legend />
          <Bar dataKey="target" fill="#6366F1" radius={[4, 4, 0, 0]} name="Target" />
          <Bar dataKey="terbayar" fill="#10B981" radius={[4, 4, 0, 0]} name="Terbayar" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusPieChart({ data }: { data: any[] }) {
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
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineTrendChart({ data }: { data: any[] }) {
  const monthlyData = new Array(12).fill(0).map((_, i) => ({
    name: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(2000, i, 1)),
    nominal: 0
  }));

  data.forEach(item => {
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
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(value: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(value || 0))}
          />
          <Line type="monotone" dataKey="nominal" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: '#6366F1' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Named export for compatibility
export const DashboardCharts = {
  RWBarChart,
  StatusPieChart,
  LineTrendChart
};
