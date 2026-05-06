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
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, cn } from "@/lib/utils";
import { TrendingUp, CheckCircle2, ChevronDown, Download, Map as MapIcon } from "lucide-react";
import { toPng } from "html-to-image";
import type { StatusPieChartItem } from "@/types/app";

interface RwGroupStat {
  rw: string;
  _sum: { ketetapan: number; pembayaran: number };
}

interface MonthlyPayment {
  tanggalBayar: Date | string | null;
  _sum: { pembayaran: number | null };
}

type ChartTooltipPayload = Array<{ value: number }>;
type ChartTooltipProps = {
  active?: boolean;
  payload?: ChartTooltipPayload;
  label?: string;
};
type TrendChartItem = {
  name: string;
  nominal: number;
};

const RWCustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 border-border shadow-2xl backdrop-blur-md rounded-2xl border p-4 min-w-[180px]">
        <p className="text-foreground text-xs font-bold mb-3 pb-2 border-b border-border/50">{label}</p>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-indigo-500" />
                 <span className="text-[10px] font-medium text-muted-foreground uppercase">Target</span>
             </div>
             <p className="text-xs font-black">{formatCurrency(payload[0].value)}</p>
          </div>
          <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-medium text-muted-foreground uppercase">Terbayar</span>
             </div>
             <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(payload[1].value)}</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function RWBarChart({ data }: { data: RwGroupStat[] }) {
  const chartRef = useRef<HTMLDivElement>(null);
  
  const chartData = data.map((item) => ({
    name: `RW ${item.rw || "?"}`,
    target: item._sum.ketetapan || 0,
    terbayar: item._sum.pembayaran || 0,
  }));

  const handleDownload = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `progress-per-rw-${new Date().getFullYear()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mengunduh grafik RW:", err);
    }
  };

  return (
    <div className="space-y-4" ref={chartRef}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="bg-emerald-500/10 rounded-lg p-1.5">
              <MapIcon className="h-4 w-4 text-emerald-500" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Monitoring Wilayah</p>
              <p className="text-xs font-black uppercase tracking-tight">Capaian Realisasi per RW</p>
           </div>
        </div>
        <button
          onClick={handleDownload}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100/50 text-zinc-500 transition-all hover:bg-emerald-500/10 hover:text-emerald-500 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-emerald-500/20 print:hidden"
          title="Unduh Gambar Grafik RW"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.1} />
            <XAxis 
              dataKey="name" 
              stroke="#94A3B8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: "#A1A1AA", fontWeight: 700 }} 
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#A1A1AA", fontWeight: 700 }}
              tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}J`}
            />
            <Tooltip content={<RWCustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
            <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px', color: '#A1A1AA', fontWeight: 600, fontSize: '12px' }} />
            <Bar dataKey="target" fill="#6366F1" radius={[4, 4, 0, 0]} name="Target" />
            <Bar dataKey="terbayar" fill="#10B981" radius={[4, 4, 0, 0]} name="Terbayar" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function StatusPieChart({ data }: { data: StatusPieChartItem[] }) {
  const chartRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `pencapaian-wp-${new Date().getFullYear()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mengunduh grafik Pie:", err);
    }
  };

  return (
    <div className="relative" ref={chartRef}>
      <button
        onClick={handleDownload}
        className="absolute right-0 top-0 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100/50 text-zinc-500 transition-all hover:bg-orange-500/10 hover:text-orange-500 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-orange-500/20 print:hidden"
        title="Unduh Gambar Grafik Pie"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
      <div className="h-[350px] w-full pt-4">
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
            <Tooltip 
              contentStyle={{
                backgroundColor: "rgba(9, 9, 11, 0.8)",
                borderColor: "rgba(39, 39, 42, 0.8)",
                borderRadius: "12px",
                backdropFilter: "blur(8px)",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: "bold",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
              }}
              itemStyle={{ color: "#E4E4E7" }}
            />
            <Legend 
               verticalAlign="bottom" 
               height={36} 
               wrapperStyle={{ 
                 color: '#A1A1AA', 
                 fontWeight: 600, 
                 fontSize: '11px',
                 paddingTop: '20px'
               }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 border-border shadow-2xl backdrop-blur-md rounded-2xl border p-4">
        <p className="text-foreground text-xs font-bold mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="bg-primary h-2 w-2 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          <p className="text-primary text-sm font-black">
             {formatCurrency(payload[0].value)}
          </p>
        </div>
        <p className="text-muted-foreground mt-1 text-[10px] font-medium uppercase tracking-wider">
          Realisasi Terdata
        </p>
      </div>
    );
  }
  return null;
};

export function TrendAnalysisChart({ data, tahun }: { data: MonthlyPayment[], tahun?: number }) {
  const [view, setView] = useState<"month" | "year">("month");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [mounted, setMounted] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const months = useMemo(() => [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ], []);

  const handleDownload = async () => {
    if (!chartRef.current) return;
    
    try {
      const fileName = `tren-realisasi-${view === 'month' ? months[selectedMonth] : 'tahunan'}-${new Date().getFullYear()}.png`;
      
      const dataUrl = await toPng(chartRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = fileName.toLowerCase().replace(/\s+/g, '-');
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mengunduh grafik:", err);
    }
  };

  const { chartData, totalNominal, countLunas, description } = useMemo(() => {
    const now = new Date();
    const currentYear = tahun || now.getFullYear();

    let finalChartData: TrendChartItem[] = [];
    let total = 0;
    let count = 0;
    let desc = "";

    if (view === "year") {
      const monthlyData = new Array(12).fill(0).map((_, i) => ({
        name: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(2000, i, 1)),
        nominal: 0,
      }));

      data.forEach((item) => {
        if (item.tanggalBayar) {
          const d = new Date(item.tanggalBayar);
          if (d.getFullYear() === currentYear) {
            const month = d.getMonth();
            monthlyData[month].nominal += item._sum.pembayaran || 0;
            total += item._sum.pembayaran || 0;
            count++;
          }
        }
      });
      finalChartData = monthlyData;
      desc = `Total Realisasi Tahun ${currentYear}`;
    } else if (view === "month") {
      const weekGroups = [
        { name: "Mgg 1", start: 1, end: 7, nominal: 0 },
        { name: "Mgg 2", start: 8, end: 14, nominal: 0 },
        { name: "Mgg 3", start: 15, end: 21, nominal: 0 },
        { name: "Mgg 4", start: 22, end: 28, nominal: 0 },
        { name: "Mgg 5", start: 29, end: 31, nominal: 0 },
      ];

      data.forEach((item) => {
        if (item.tanggalBayar) {
          const d = new Date(item.tanggalBayar);
          if (d.getFullYear() === currentYear && d.getMonth() === selectedMonth) {
            const day = d.getDate();
            const val = item._sum.pembayaran || 0;
            
            total += val;
            count++;

            if (day <= 7) weekGroups[0].nominal += val;
            else if (day <= 14) weekGroups[1].nominal += val;
            else if (day <= 21) weekGroups[2].nominal += val;
            else if (day <= 28) weekGroups[3].nominal += val;
            else weekGroups[4].nominal += val;
          }
        }
      });
      finalChartData = weekGroups;
      desc = `Realisasi Bulanan (${months[selectedMonth]})`;
    }

    return { chartData: finalChartData, totalNominal: total, countLunas: count, description: desc };
  }, [data, view, selectedMonth, months, tahun]);

  const triggerStyle = "relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-1.5 py-1.5 text-[10px] font-bold whitespace-nowrap transition-all uppercase outline-none";
  const activeStyle = "bg-white text-foreground shadow-sm dark:bg-zinc-800 dark:text-white";
  const inactiveStyle = "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200";

  if (!mounted) return <div className="h-[350px] w-full animate-pulse bg-zinc-50 dark:bg-zinc-900 rounded-2xl" />;

  return (
    <div className="space-y-6" ref={chartRef}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
            <TrendingUp className="text-primary h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">{formatCurrency(totalNominal)}</div>
            <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
              {description} • {countLunas} Transaksi
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="grid w-auto grid-cols-2 bg-zinc-100/50 p-1 dark:bg-zinc-900/50 rounded-xl min-w-[200px]">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(triggerStyle, view === "month" ? activeStyle : inactiveStyle)}
                onClick={() => setView("month")}
              >
                {view === "month" ? months[selectedMonth] : "Bulan"}
                <ChevronDown className={cn("h-3 w-3 opacity-50", view === "month" && "text-primary")} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-zinc-100 dark:border-zinc-800 max-h-[300px] overflow-y-auto min-w-[140px]">
                {months.map((m, i) => (
                  <DropdownMenuItem 
                    key={i} 
                    className="text-xs font-semibold py-2 px-3 focus:bg-primary/10 focus:text-primary rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      setView("month");
                      setSelectedMonth(i);
                    }}
                  >
                    {m}
                    {selectedMonth === i && view === "month" && (
                      <CheckCircle2 className="ml-auto h-3 w-3 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => setView("year")}
              className={cn(triggerStyle, view === "year" ? activeStyle : inactiveStyle)}
              title="Tahun Pajak"
            >
              Tahun
            </button>
          </div>

          <button
            onClick={handleDownload}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100/50 text-zinc-500 transition-all hover:bg-primary/10 hover:text-primary dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-primary/20 print:hidden"
            title="Unduh Gambar Grafik"
          >
            <Download className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ bottom: 20 }}>
            <defs>
              <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.1} />
            <XAxis
              dataKey="name"
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#A1A1AA", fontWeight: 700 }}
              interval={0}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis 
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#A1A1AA", fontWeight: 700 }}
              tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}J`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366F1', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="nominal"
              stroke="#6366F1"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorNominal)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Named export for compatibility
export const DashboardCharts = {
  RWBarChart,
  StatusPieChart,
  TrendAnalysisChart,
};
