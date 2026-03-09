import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Database, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Target,
  Users,
  Calendar,
  ChevronRight,
  Wallet,
  PieChart as PieChartIcon,
  Map as MapIcon,
  Home as HomeIcon,
  Layers as LayersIcon,
  Zap as ZapIcon
} from "lucide-react";
import { 
  RWBarChart, 
  StatusPieChart, 
  LineTrendChart 
} from "@/components/dashboard/dashboard-charts";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getDashboardStats(tahun: number = new Date().getFullYear()) {
  const [
    totalPajak,
    totalNominal,
    sudahDibayar,
    belumDibayar,
    tidakTerbit,
    pajakPerRW,
    trenPembayaran,
    penarikStats,
    tanahTanpaBangunan,
    tanahDenganBangunan,
    totalLuas
  ] = await Promise.all([
    prisma.taxData.count({ where: { tahun } }),
    prisma.taxData.aggregate({ where: { tahun }, _sum: { ketetapan: true } }),
    prisma.taxData.aggregate({ where: { tahun, paymentStatus: "LUNAS" }, _sum: { ketetapan: true, pembayaran: true }, _count: true }),
    prisma.taxData.aggregate({ where: { tahun, paymentStatus: "BELUM_LUNAS" }, _sum: { ketetapan: true }, _count: true }),
    prisma.taxData.count({ where: { tahun, paymentStatus: "TIDAK_TERBIT" } }),
    
    prisma.taxData.groupBy({
      by: ['rw'],
      where: { tahun },
      _sum: { ketetapan: true, pembayaran: true },
      _count: true
    }),

    prisma.taxData.groupBy({
      by: ['tanggalBayar'],
      where: { 
        tahun, 
        tanggalBayar: { not: null } 
      },
      _sum: { pembayaran: true },
    }),

    prisma.taxData.groupBy({
      by: ['penarikId'],
      where: { tahun },
      _sum: { pembayaran: true, ketetapan: true },
    }),

    prisma.taxData.count({ where: { tahun, luasTanah: { gt: 0 }, luasBangunan: 0 } }),
    prisma.taxData.count({ where: { tahun, luasTanah: { gt: 0 }, luasBangunan: { gt: 0 } } }),
    prisma.taxData.aggregate({ where: { tahun }, _sum: { luasTanah: true, luasBangunan: true } })
  ]);

  const totalNominalValue = totalNominal._sum.ketetapan || 0;
  const sudahDibayarValue = sudahDibayar._sum.pembayaran || 0;
  const persentase = totalNominalValue > 0 ? (sudahDibayarValue / totalNominalValue) * 100 : 0;

  // Get penarik names
  const penarikIds = penarikStats.map(s => s.penarikId).filter(Boolean) as string[];
  const penarikUsers = await prisma.user.findMany({
    where: { id: { in: penarikIds } },
    select: { id: true, name: true }
  });

  const penarikMap = new Map(penarikUsers.map(u => [u.id, u.name]));
  const topPenariks = penarikStats
    .map(s => ({
      name: s.penarikId ? penarikMap.get(s.penarikId) || "Petugas" : "Belum Alokasi",
      nominal: s._sum.pembayaran || 0,
      target: s._sum.ketetapan || 0,
      percent: (s._sum.ketetapan || 0) > 0 ? ((s._sum.pembayaran || 0) / (s._sum.ketetapan || 0)) * 100 : 0
    }))
    .sort((a, b) => b.nominal - a.nominal)
    .slice(0, 4);

  return {
    totalPajak,
    totalNominal: totalNominalValue,
    sudahDibayarCount: sudahDibayar._count || 0,
    sudahDibayarValue,
    belumDibayarCount: belumDibayar._count || 0,
    belumDibayarValue: belumDibayar._sum.ketetapan || 0,
    tidakTerbit,
    persentase,
    pajakPerRW: pajakPerRW.sort((a: any, b: any) => (a.rw || '').localeCompare(b.rw || '')),
    trenPembayaran,
    topPenariks,
    tanahTanpaBangunan,
    tanahDenganBangunan,
    totalLuasTanah: totalLuas._sum.luasTanah || 0,
    totalLuasBangunan: totalLuas._sum.luasBangunan || 0
  };
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tahun?: string }> }) {
  const params = await searchParams;
  const currentYear = parseInt(params.tahun || new Date().getFullYear().toString());
  const stats = await getDashboardStats(currentYear);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">
            Ringkasan Progress
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Laporan Kinerja Penarikan PBB • Tahun {currentYear}
          </p>
        </div>
        <DashboardFilters />
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsHeroCard 
          title="Total Ketetapan"
          value={formatCurrency(stats.totalNominal)}
          icon={<Wallet className="w-5 h-5" />}
          description="Target anggaran desa"
          trend="+4.5%"
          color="indigo"
        />
        <StatsHeroCard 
          title="Sudah Realisasi"
          value={formatCurrency(stats.sudahDibayarValue)}
          icon={<CheckCircle2 className="w-5 h-5" />}
          description={`${stats.persentase.toFixed(1)}% dari target`}
          percent={stats.persentase}
          color="emerald"
        />
        <StatsHeroCard 
          title="Sisa Tagihan"
          value={formatCurrency(stats.belumDibayarValue)}
          icon={<AlertCircle className="w-5 h-5" />}
          description={`${stats.belumDibayarCount} WP belum lunas`}
          color="rose"
        />
        <StatsHeroCard 
          title="Populasi WP"
          value={stats.totalPajak.toLocaleString('id-ID')}
          icon={<Users className="w-5 h-5" />}
          description="Total wajib pajak terdaftar"
          color="blue"
        />
      </div>

      {/* Analytics Group */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Charts Section */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="glass shadow-2xl border-none overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Progress Per RW</CardTitle>
                <CardDescription>Distribusi target dan realisasi tiap wilayah</CardDescription>
              </div>
              <TrendingUp className="text-muted-foreground w-5 h-5" />
            </CardHeader>
            <CardContent className="pt-4">
              <RWBarChart data={stats.pajakPerRW} />
            </CardContent>
          </Card>

          <Card className="glass shadow-2xl border-none overflow-hidden">
            <CardHeader>
               <CardTitle className="text-xl">Analisa Tren Bulanan</CardTitle>
               <CardDescription>Fluktuasi penerimaan pajak sepanjang tahun</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <LineTrendChart data={stats.trenPembayaran} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Analytics */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass shadow-2xl border-none">
            <CardHeader>
               <CardTitle className="text-xl flex items-center gap-2 text-primary">
                 <PieChartIcon className="w-5 h-5" />
                 Pencapaian WP
               </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusPieChart 
                data={[
                  { name: 'Lunas', value: stats.sudahDibayarCount, color: '#10b981' }, // Hijau
                  { name: 'Belum', value: stats.belumDibayarCount, color: '#ef4444' }, // Merah
                  { name: 'Tidak Terbit', value: stats.tidakTerbit, color: 'var(--foreground)' }, // Adaptif
                ]} 
              />
              <div className="mt-4 space-y-3">
                 <DashboardMiniStat label="Rasio Kelunasan" value={`${((stats.sudahDibayarCount / (stats.totalPajak || 1)) * 100).toFixed(1)}%`} />
                 <DashboardMiniStat label="WP Belum Bayar" value={stats.belumDibayarCount.toString()} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass shadow-2xl border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2 text-primary">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Top Kolektor
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs font-medium">Petugas dengan realisasi tertinggi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 pt-2">
                {stats.topPenariks.map((p, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-foreground">{p.name}</span>
                      <span className="text-blue-600 dark:text-blue-400">{p.percent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 shadow-inner overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-full h-2 transition-all duration-700 ease-out" 
                        style={{ width: `${Math.min(p.percent, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center opacity-80">
                       <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tighter">Realisasi</span>
                       <span className="text-[10px] text-foreground font-black">{formatCurrency(p.nominal)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/laporan" className="block mt-8">
                <Button variant="outline" size="sm" className="w-full text-xs gap-2 border-primary/20 hover:bg-primary/10 transition-all font-bold">
                  Lihat Semua Laporan <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Physical Stats Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <MapIcon className="w-5 h-5 text-primary" />
           <h2 className="text-xl font-bold">Statistik Fisik Objek Pajak</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           <PhysicalStatsCard 
             title="Tanah Kosong" 
             value={stats.tanahTanpaBangunan.toLocaleString('id-ID')} 
             description="Bidang tanpa bangunan" 
             icon={<MapIcon className="w-4 h-4 text-orange-500" />}
           />
           <PhysicalStatsCard 
             title="Tanah & Bangunan" 
             value={stats.tanahDenganBangunan.toLocaleString('id-ID')} 
             description="Objek pajak lengkap" 
             icon={<HomeIcon className="w-4 h-4 text-purple-500" />}
           />
           <PhysicalStatsCard 
             title="Total Luas Tanah" 
             value={`${stats.totalLuasTanah.toLocaleString('id-ID')} m²`} 
             description="Kumulatif luas tanah" 
             icon={<LayersIcon className="w-4 h-4 text-cyan-500" />}
           />
           <PhysicalStatsCard 
             title="Total Luas Bangunan" 
             value={`${stats.totalLuasBangunan.toLocaleString('id-ID')} m²`} 
             description="Kumulatif luas bangunan" 
             icon={<ZapIcon className="w-4 h-4 text-yellow-500" />}
           />
        </div>
      </div>
    </div>
  );
}

function PhysicalStatsCard({ title, value, description, icon }: any) {
  return (
    <Card className="glass border-none shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-background/50 border border-white/10 shadow-inner">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{title}</p>
          <div className="text-lg font-black text-foreground">{value}</div>
          <p className="text-[9px] text-foreground/70 font-medium">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsHeroCard({ title, value, icon, description, percent, color }: any) {
  const colors: any = {
    indigo: "from-indigo-500/20 to-indigo-500/5 text-indigo-600 dark:text-indigo-400",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    rose: "from-rose-500/20 to-rose-500/5 text-rose-600 dark:text-rose-400",
    blue: "from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-400",
  };

  return (
    <Card className="glass border-none shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors[color]} rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-125 transition-transform duration-500`} />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${colors[color]} mb-3`}>
            {icon}
          </div>
          {percent !== undefined && (
             <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] px-1.5 py-0">
               {percent.toFixed(0)}%
             </Badge>
          )}
        </div>
        <CardTitle className="text-[10px] font-black text-foreground uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black text-foreground">{value}</div>
        <p className="text-[10px] text-foreground/80 mt-2 font-semibold flex items-center gap-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function DashboardMiniStat({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/20">
      <span className="text-xs text-foreground font-bold">{label}</span>
      <span className="text-sm font-black text-primary">{value}</span>
    </div>
  );
}
