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
  Zap as ZapIcon,
} from "lucide-react";
import {
  RWBarChart,
  StatusPieChart,
  LineTrendChart,
} from "@/components/dashboard/dashboard-charts";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getVillageConfig } from "@/app/actions/settings-actions";

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
    totalLuas,
  ] = await Promise.all([
    prisma.taxData.count({ where: { tahun } }),
    prisma.taxData.aggregate({ where: { tahun }, _sum: { ketetapan: true } }),
    prisma.taxData.aggregate({
      where: { tahun, paymentStatus: "LUNAS" },
      _sum: { ketetapan: true, pembayaran: true },
      _count: true,
    }),
    prisma.taxData.aggregate({
      where: { tahun, paymentStatus: "BELUM_LUNAS" },
      _sum: { ketetapan: true },
      _count: true,
    }),
    prisma.taxData.count({ where: { tahun, paymentStatus: "TIDAK_TERBIT" } }),

    prisma.taxData.groupBy({
      by: ["rw"],
      where: { tahun },
      _sum: { ketetapan: true, pembayaran: true },
      _count: true,
    }),

    prisma.taxData.groupBy({
      by: ["tanggalBayar"],
      where: {
        tahun,
        tanggalBayar: { not: null },
      },
      _sum: { pembayaran: true },
    }),

    prisma.taxData.groupBy({
      by: ["penarikId"],
      where: { tahun },
      _sum: { pembayaran: true, ketetapan: true },
    }),

    prisma.taxData.count({ where: { tahun, luasTanah: { gt: 0 }, luasBangunan: 0 } }),
    prisma.taxData.count({ where: { tahun, luasTanah: { gt: 0 }, luasBangunan: { gt: 0 } } }),
    prisma.taxData.aggregate({ where: { tahun }, _sum: { luasTanah: true, luasBangunan: true } }),
  ]);

  const totalNominalValue = totalNominal._sum.ketetapan || 0;
  const sudahDibayarValue = sudahDibayar._sum.pembayaran || 0;
  const persentase = totalNominalValue > 0 ? (sudahDibayarValue / totalNominalValue) * 100 : 0;

  // Get penarik names
  const penarikIds = penarikStats.map((s) => s.penarikId).filter(Boolean) as string[];
  const penarikUsers = await prisma.user.findMany({
    where: { id: { in: penarikIds } },
    select: { id: true, name: true },
  });

  const penarikMap = new Map(penarikUsers.map((u) => [u.id, u.name]));
  const topPenariks = penarikStats
    .map((s) => ({
      name: s.penarikId ? penarikMap.get(s.penarikId) || "Petugas" : "Belum Alokasi",
      nominal: s._sum.pembayaran || 0,
      target: s._sum.ketetapan || 0,
      percent:
        (s._sum.ketetapan || 0) > 0
          ? ((s._sum.pembayaran || 0) / (s._sum.ketetapan || 0)) * 100
          : 0,
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
    pajakPerRW: pajakPerRW.sort((a: any, b: any) => (a.rw || "").localeCompare(b.rw || "")),
    trenPembayaran,
    topPenariks,
    tanahTanpaBangunan,
    tanahDenganBangunan,
    totalLuasTanah: totalLuas._sum.luasTanah || 0,
    totalLuasBangunan: totalLuas._sum.luasBangunan || 0,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  const params = await searchParams;
  const currentYear = parseInt(params.tahun || new Date().getFullYear().toString());
  const [stats, villageConfig] = await Promise.all([
    getDashboardStats(currentYear),
    getVillageConfig(),
  ]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="animate-in fade-in space-y-8 duration-700">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          {/* Village Logo */}
          {villageConfig.logoUrl && (
            <div className="hidden h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex items-center justify-center">
              <Image
                src={`${villageConfig.logoUrl}?v=1`}
                alt="Logo Desa"
                width={56}
                height={56}
                className="h-full w-full object-contain p-1"
                unoptimized
              />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-primary text-4xl font-extrabold tracking-tight">
              Ringkasan Progress
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {villageConfig.namaDesa
                ? `Laporan PBB Desa ${villageConfig.namaDesa} • Tahun ${currentYear}`
                : `Laporan Kinerja Penarikan PBB • Tahun ${currentYear}`}
            </p>
          </div>
        </div>
        <DashboardFilters />
      </div>


      {/* Main Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsHeroCard
          title="Total Ketetapan"
          value={formatCurrency(stats.totalNominal)}
          icon={<Wallet className="h-5 w-5" />}
          description="Target anggaran desa"
          trend="+4.5%"
          color="indigo"
        />
        <StatsHeroCard
          title="Sudah Realisasi"
          value={formatCurrency(stats.sudahDibayarValue)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          description={`${stats.persentase.toFixed(1)}% dari target`}
          percent={stats.persentase}
          color="emerald"
        />
        <StatsHeroCard
          title="Sisa Tagihan"
          value={formatCurrency(stats.belumDibayarValue)}
          icon={<AlertCircle className="h-5 w-5" />}
          description={`${stats.belumDibayarCount} WP belum lunas`}
          color="rose"
        />
        <StatsHeroCard
          title="Populasi WP"
          value={stats.totalPajak.toLocaleString("id-ID")}
          icon={<Users className="h-5 w-5" />}
          description="Total wajib pajak terdaftar"
          color="blue"
        />
      </div>

      {/* Analytics Group */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Charts Section */}
        <div className="space-y-6 lg:col-span-8">
          <Card className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-50 pb-4 dark:border-zinc-900/50">
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Progress Per RW</CardTitle>
                <CardDescription className="text-xs font-medium">
                  Distribusi target dan realisasi tiap wilayah
                </CardDescription>
              </div>
              <div className="rounded-xl bg-zinc-50 p-2 dark:bg-zinc-900">
                <TrendingUp className="h-4 w-4 text-zinc-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <RWBarChart data={stats.pajakPerRW} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader className="border-b border-zinc-50 pb-4 dark:border-zinc-900/50">
              <CardTitle className="text-xl font-bold tracking-tight">
                Analisa Tren Bulanan
              </CardTitle>
              <CardDescription className="text-xs font-medium">
                Fluktuasi penerimaan pajak sepanjang tahun
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <LineTrendChart data={stats.trenPembayaran} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader className="border-b border-zinc-50 pb-4 dark:border-zinc-900/50">
              <CardTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
                <div className="bg-primary/5 rounded-lg p-1.5">
                  <PieChartIcon className="text-primary h-4 w-4" />
                </div>
                Pencapaian WP
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <StatusPieChart
                data={[
                  { name: "Lunas", value: stats.sudahDibayarCount, color: "#10b981" },
                  { name: "Belum", value: stats.belumDibayarCount, color: "#ef4444" },
                  { name: "Tidak Terbit", value: "#71717a" },
                ]}
              />
              <div className="mt-6 space-y-2">
                <DashboardMiniStat
                  label="Rasio Kelunasan"
                  value={`${((stats.sudahDibayarCount / (stats.totalPajak || 1)) * 100).toFixed(1)}%`}
                />
                <DashboardMiniStat
                  label="WP Belum Bayar"
                  value={stats.belumDibayarCount.toString()}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader className="border-b border-zinc-50 pb-4 dark:border-zinc-900/50">
              <CardTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
                <div className="rounded-lg bg-blue-500/5 p-1.5">
                  <Target className="h-4 w-4 text-blue-500" />
                </div>
                Top Kolektor
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                {stats.topPenariks.map((p, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground text-xs font-bold">{p.name}</span>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        {p.percent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(p.percent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/laporan" className="mt-8 block">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full gap-2 rounded-xl border-zinc-100 text-[10px] font-bold transition-all hover:bg-zinc-50 sm:text-xs dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  Lihat Semua Laporan <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Physical Stats Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapIcon className="text-primary h-5 w-5" />
          <h2 className="text-xl font-bold">Statistik Fisik Objek Pajak</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <PhysicalStatsCard
            title="Tanah Kosong"
            value={stats.tanahTanpaBangunan.toLocaleString("id-ID")}
            description="Bidang tanpa bangunan"
            icon={<MapIcon className="h-4 w-4 text-orange-500" />}
          />
          <PhysicalStatsCard
            title="Tanah & Bangunan"
            value={stats.tanahDenganBangunan.toLocaleString("id-ID")}
            description="Objek pajak lengkap"
            icon={<HomeIcon className="h-4 w-4 text-purple-500" />}
          />
          <PhysicalStatsCard
            title="Total Luas Tanah"
            value={`${stats.totalLuasTanah.toLocaleString("id-ID")} m²`}
            description="Kumulatif luas tanah"
            icon={<LayersIcon className="h-4 w-4 text-cyan-500" />}
          />
          <PhysicalStatsCard
            title="Total Luas Bangunan"
            value={`${stats.totalLuasBangunan.toLocaleString("id-ID")} m²`}
            description="Kumulatif luas bangunan"
            icon={<ZapIcon className="h-4 w-4 text-yellow-500" />}
          />
        </div>
      </div>
    </div>
  );
}

function PhysicalStatsCard({ title, value, description, icon }: any) {
  return (
    <Card className="hover:border-primary/20 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all duration-300 dark:border-zinc-900 dark:bg-zinc-950">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="text-foreground/50 rounded-xl border border-zinc-100 bg-zinc-50 p-2.5 dark:border-zinc-900 dark:bg-zinc-900">
          {icon}
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-[10px] font-bold tracking-[0.1em] uppercase">
            {title}
          </p>
          <div className="text-foreground text-lg leading-none font-black tracking-tight">
            {value}
          </div>
          <p className="text-muted-foreground/60 text-[9px] font-medium">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsHeroCard({ title, value, icon, description, percent, color }: any) {
  const colors: any = {
    indigo: "bg-indigo-500/5 text-indigo-600 border-indigo-100 dark:border-indigo-900/50",
    emerald: "bg-emerald-500/5 text-emerald-600 border-emerald-100 dark:border-emerald-900/50",
    rose: "bg-rose-500/5 text-rose-600 border-rose-100 dark:border-rose-900/50",
    blue: "bg-blue-500/5 text-blue-600 border-blue-100 dark:border-blue-900/50",
  };

  return (
    <Card className="hover:border-primary/20 group space-y-4 rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm transition-all duration-300 dark:border-zinc-900 dark:bg-zinc-950">
      <div className="flex items-start justify-between">
        <div className={cn("rounded-xl border p-2.5", colors[color])}>{icon}</div>
        {percent !== undefined && (
          <Badge
            variant="outline"
            className="rounded-full border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[9px] font-black text-emerald-600"
          >
            {percent.toFixed(1)}%
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
          {title}
        </p>
        <div className="text-foreground text-2xl leading-none font-black tracking-tighter">
          {value}
        </div>
        <p className="text-muted-foreground flex items-center gap-1.5 pt-1 text-[10px] leading-relaxed">
          <span className="h-1 w-1 rounded-full bg-zinc-200" />
          {description}
        </p>
      </div>
    </Card>
  );
}

function DashboardMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-50 bg-zinc-50 px-4 py-3 dark:border-zinc-900/50 dark:bg-zinc-900/50">
      <span className="text-muted-foreground text-xs font-bold">{label}</span>
      <span className="text-foreground text-sm font-black tracking-tight">{value}</span>
    </div>
  );
}
