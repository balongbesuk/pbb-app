import { Suspense, type ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  AlertCircle,
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
  Clock,
  History,
  UserCheck,
  XCircle,
} from "lucide-react";
import dynamic from "next/dynamic";

const RWBarChart = dynamic(
  () => import("@/components/dashboard/dashboard-charts").then((mod) => mod.RWBarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const StatusPieChart = dynamic(
  () => import("@/components/dashboard/dashboard-charts").then((mod) => mod.StatusPieChart),
  { ssr: false, loading: () => <SidebarCardSkeleton /> }
);

const TrendAnalysisChart = dynamic(
  () => import("@/components/dashboard/dashboard-charts").then((mod) => mod.TrendAnalysisChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getVillageConfig } from "@/app/actions/settings-actions";
import { formatCurrency, toTitleCase, cn } from "@/lib/utils";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

type SessionUser = {
  id?: string;
  role?: string;
  name?: string | null;
};

type DailyLogItem = {
  id: string;
  details: string | null;
  createdAt: Date;
  entityId: string | null;
};

type PhysicalStatsCardProps = {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
};

type DashboardAggregateRow = {
  totalPajak: number | bigint;
  totalKetetapan: number | bigint | null;
  totalPembayaranLunas: number | bigint | null;
  totalKetetapanBelumLunas: number | bigint | null;
  countLunas: number | bigint;
  countBelumLunas: number | bigint;
  countTidakTerbit: number | bigint;
  countSengketa: number | bigint;
  tanahTanpaBangunan: number | bigint;
  tanahDenganBangunan: number | bigint;
  totalLuasTanah: number | bigint | null;
  totalLuasBangunan: number | bigint | null;
};

type StatsHeroCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
  description: string;
  percent?: number;
  color: "indigo" | "emerald" | "rose" | "blue";
};

async function getPenarikPersonalStats(userId: string, tahun: number) {
  const [all, lunas, sengketa, tdkTerbit] = await Promise.all([
    prisma.taxData.aggregate({
      where: { penarikId: userId, tahun },
      _sum: { ketetapan: true },
      _count: true,
    }),
    prisma.taxData.aggregate({
      where: { penarikId: userId, tahun, paymentStatus: "LUNAS" },
      _sum: { pembayaran: true },
      _count: true,
    }),
    prisma.taxData.count({
      where: { penarikId: userId, tahun, paymentStatus: "SUSPEND" }
    }),
    prisma.taxData.count({
      where: { penarikId: userId, tahun, paymentStatus: "TIDAK_TERBIT" }
    }),
  ]);

  return {
    totalTarget: all._sum.ketetapan || 0,
    totalWp: all._count || 0,
    totalLunas: lunas._sum.pembayaran || 0,
    wpLunas: lunas._count || 0,
    wpSengketa: sengketa,
    wpTdkTerbit: tdkTerbit,
  };
}

async function getPenarikDailyLog(userId: string) {
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { 
        userId, 
        action: "UPDATE_PAYMENT",
      },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.auditLog.count({
      where: { 
        userId, 
        action: "UPDATE_PAYMENT",
      }
    }),
  ]);
  
  return { logs, total };
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 w-full bg-muted/40 rounded-3xl border border-border/20" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[350px] w-full animate-pulse bg-muted/40 rounded-3xl border border-border/20" />
  );
}

function SidebarCardSkeleton() {
  return (
    <div className="h-[400px] w-full animate-pulse bg-muted/40 rounded-3xl border border-border/20" />
  );
}

async function StatsHeroGridContainer({ tahun }: { tahun: number }) {
  const aggregateRows = await prisma.$queryRaw<DashboardAggregateRow[]>`
    SELECT
      COUNT(*) AS totalPajak,
      SUM(ketetapan) AS totalKetetapan,
      SUM(CASE WHEN paymentStatus = 'LUNAS' THEN pembayaran ELSE 0 END) AS totalPembayaranLunas,
      SUM(CASE WHEN paymentStatus = 'BELUM_LUNAS' THEN ketetapan ELSE 0 END) AS totalKetetapanBelumLunas,
      SUM(CASE WHEN paymentStatus = 'LUNAS' THEN 1 ELSE 0 END) AS countLunas,
      SUM(CASE WHEN paymentStatus = 'BELUM_LUNAS' THEN 1 ELSE 0 END) AS countBelumLunas
    FROM TaxData
    WHERE tahun = ${tahun}
  `;
  const aggregate = aggregateRows[0];
  const totalPajak = Number(aggregate?.totalPajak ?? 0);
  const totalNominal = Number(aggregate?.totalKetetapan ?? 0);
  const sudahDibayarValue = Number(aggregate?.totalPembayaranLunas ?? 0);
  const sudahDibayarCount = Number(aggregate?.countLunas ?? 0);
  const belumDibayarCount = Number(aggregate?.countBelumLunas ?? 0);
  const belumDibayarValue = Number(aggregate?.totalKetetapanBelumLunas ?? 0);
  const persentase = totalNominal > 0 ? (sudahDibayarValue / totalNominal) * 100 : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsHeroCard
        title="Total Ketetapan"
        value={formatCurrency(totalNominal)}
        icon={<Wallet className="h-5 w-5" />}
        description={`${totalPajak.toLocaleString("id-ID")} WP Desa terdaftar`}
        color="indigo"
      />
      <StatsHeroCard
        title="Sudah Realisasi"
        value={formatCurrency(sudahDibayarValue)}
        icon={<CheckCircle2 className="h-5 w-5" />}
        description={`${sudahDibayarCount.toLocaleString("id-ID")} WP sudah lunas`}
        percent={persentase}
        color="emerald"
      />
      <StatsHeroCard
        title="Sisa Tagihan"
        value={formatCurrency(belumDibayarValue)}
        icon={<AlertCircle className="h-5 w-5" />}
        description={`${belumDibayarCount} WP belum lunas`}
        color="rose"
      />
      <StatsHeroCard
        title="Partisipasi Warga"
        value={`${((sudahDibayarCount / (totalPajak || 1)) * 100).toFixed(1)}%`}
        icon={<UserCheck className="h-5 w-5" />}
        description="Wajib Pajak yang sudah lunas"
        color="blue"
      />
    </div>
  );
}

async function RWBarChartContainer({ tahun }: { tahun: number }) {
  const data = await prisma.taxData.groupBy({
    by: ["rw"],
    where: { tahun },
    _sum: { ketetapan: true, pembayaran: true },
    _count: true,
  });

  const sortedData = data
    .sort((a, b) => (a.rw || "").localeCompare(b.rw || ""))
    .map((item) => ({
      rw: item.rw || "?",
      _sum: { ketetapan: item._sum.ketetapan || 0, pembayaran: item._sum.pembayaran || 0 },
    }));

  return (
    <Card className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
      <CardContent className="pt-6">
        <RWBarChart data={sortedData} />
      </CardContent>
    </Card>
  );
}

async function TrendAnalysisChartContainer({ tahun }: { tahun: number }) {
  const data = await prisma.taxData.groupBy({
    by: ["tanggalBayar"],
    where: {
      tahun,
      tanggalBayar: { not: null },
    },
    _sum: { pembayaran: true },
    _count: { _all: true },
  });

  return (
    <Card className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
      <CardContent className="pt-6">
        <TrendAnalysisChart data={data} tahun={tahun} />
      </CardContent>
    </Card>
  );
}

async function StatusPieChartContainer({ tahun }: { tahun: number }) {
  const aggregateRows = await prisma.$queryRaw<DashboardAggregateRow[]>`
    SELECT
      COUNT(*) AS totalPajak,
      SUM(CASE WHEN paymentStatus = 'LUNAS' THEN 1 ELSE 0 END) AS countLunas,
      SUM(CASE WHEN paymentStatus = 'BELUM_LUNAS' THEN 1 ELSE 0 END) AS countBelumLunas,
      SUM(CASE WHEN paymentStatus = 'TIDAK_TERBIT' THEN 1 ELSE 0 END) AS countTidakTerbit,
      SUM(CASE WHEN paymentStatus = 'SUSPEND' THEN 1 ELSE 0 END) AS countSengketa
    FROM TaxData
    WHERE tahun = ${tahun}
  `;
  const aggregate = aggregateRows[0];
  const totalPajak = Number(aggregate?.totalPajak ?? 0);
  const sudahDibayarCount = Number(aggregate?.countLunas ?? 0);
  const belumDibayarCount = Number(aggregate?.countBelumLunas ?? 0);
  const sengketaCount = Number(aggregate?.countSengketa ?? 0);
  const tidakTerbit = Number(aggregate?.countTidakTerbit ?? 0);

  return (
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
            { name: "Lunas", value: sudahDibayarCount, color: "#10b981" },
            { name: "Belum", value: belumDibayarCount, color: "#ef4444" },
            { name: "Sengketa", value: sengketaCount, color: "#f59e0b" },
            { name: "Tdk Terbit", value: tidakTerbit, color: "#71717a" },
          ]}
        />
        <div className="mt-6 space-y-2">
          <DashboardMiniStat
            label="Rasio Kelunasan"
            value={`${((sudahDibayarCount / (totalPajak || 1)) * 100).toFixed(1)}%`}
          />
          <DashboardMiniStat
            label="WP Belum Bayar"
            value={belumDibayarCount.toString()}
          />
          <DashboardMiniStat
            label="Bermasalah / Sengketa"
            value={sengketaCount.toString()}
          />
        </div>
      </CardContent>
    </Card>
  );
}

async function TopPenariksContainer({ tahun }: { tahun: number }) {
  const penarikStats = await prisma.taxData.groupBy({
    by: ["penarikId"],
    where: { tahun },
    _sum: { pembayaran: true, ketetapan: true },
  });

  const penarikIds = penarikStats.map((s) => s.penarikId).filter(Boolean) as string[];
  const penarikUsers = await prisma.user.findMany({
    where: { id: { in: penarikIds } },
    select: { id: true, name: true },
  });

  const penarikMap = new Map<string, string | null>(
    penarikUsers.map((u) => [u.id, u.name])
  );

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
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4);

  return (
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
          {topPenariks.map((p, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-xs font-bold">{p.name}</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  {p.percent.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-950">
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
  );
}

async function PhysicalStatsGridContainer({ tahun }: { tahun: number }) {
  const aggregateRows = await prisma.$queryRaw<DashboardAggregateRow[]>`
    SELECT
      SUM(CASE WHEN luasTanah > 0 AND luasBangunan = 0 THEN 1 ELSE 0 END) AS tanahTanpaBangunan,
      SUM(CASE WHEN luasTanah > 0 AND luasBangunan > 0 THEN 1 ELSE 0 END) AS tanahDenganBangunan,
      SUM(luasTanah) AS totalLuasTanah,
      SUM(luasBangunan) AS totalLuasBangunan
    FROM TaxData
    WHERE tahun = ${tahun}
  `;
  const aggregate = aggregateRows[0];
  const tanahTanpaBangunan = Number(aggregate?.tanahTanpaBangunan ?? 0);
  const tanahDenganBangunan = Number(aggregate?.tanahDenganBangunan ?? 0);
  const totalLuasTanah = Number(aggregate?.totalLuasTanah ?? 0);
  const totalLuasBangunan = Number(aggregate?.totalLuasBangunan ?? 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <PhysicalStatsCard
        title="Tanah Kosong"
        value={tanahTanpaBangunan.toLocaleString("id-ID")}
        description="Bidang tanpa bangunan"
        icon={<MapIcon className="h-4 w-4 text-orange-500" />}
      />
      <PhysicalStatsCard
        title="Tanah & Bangunan"
        value={tanahDenganBangunan.toLocaleString("id-ID")}
        description="Objek pajak lengkap"
        icon={<HomeIcon className="h-4 w-4 text-purple-500" />}
      />
      <PhysicalStatsCard
        title="Total Luas Tanah"
        value={`${totalLuasTanah.toLocaleString("id-ID")} m²`}
        description="Kumulatif luas tanah"
        icon={<LayersIcon className="h-4 w-4 text-cyan-500" />}
      />
      <PhysicalStatsCard
        title="Total Luas Bangunan"
        value={`${totalLuasBangunan.toLocaleString("id-ID")} m²`}
        description="Kumulatif luas bangunan"
        icon={<ZapIcon className="h-4 w-4 text-yellow-500" />}
      />
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  const params = await searchParams;
  const currentYear = parseInt(params.tahun || new Date().getFullYear().toString());
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as SessionUser | undefined;
  if (!currentUser) {
    redirect("/");
  }

  const villageConfig = await getVillageConfig();

  let personalStats = null;
  let dailyLogs: DailyLogItem[] = [];
  let totalLogs = 0;
  if (currentUser?.role === "PENARIK" && currentUser?.id) {
    const [ps, dl] = await Promise.all([
      getPenarikPersonalStats(currentUser.id, currentYear),
      getPenarikDailyLog(currentUser.id)
    ]);
    personalStats = ps;
    dailyLogs = dl.logs;
    totalLogs = dl.total;
  }

  const logoVersion = villageConfig.updatedAt?.getTime() ?? 0;

  return (
    <div className="animate-in fade-in space-y-8 duration-700">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          {/* Village Logo */}
          {villageConfig.logoUrl && (
            <div className="hidden h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:bg-zinc-100 sm:flex items-center justify-center">
              <Image
                src={`${villageConfig.logoUrl}?t=${logoVersion}`}
                alt="Logo Desa"
                width={56}
                height={56}
                className="h-full w-full object-contain p-1"
                unoptimized
              />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-primary text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Ringkasan Progress
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {villageConfig.namaDesa
                ? `Laporan PBB Desa ${toTitleCase(villageConfig.namaDesa)} • Tahun ${currentYear}`
                : `Laporan Kinerja Penarikan PBB • Tahun ${currentYear}`}
            </p>
          </div>
        </div>
        <Suspense fallback={<div className="h-9 w-[190px] animate-pulse bg-muted rounded-xl" />}>
          <DashboardFilters />
        </Suspense>
      </div>

      {personalStats && (
        <div className="bg-primary/5 border-primary/20 animate-in slide-in-from-top-4 relative overflow-hidden rounded-3xl border p-6 shadow-xl sm:p-8">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h2 className="text-primary text-xl sm:text-2xl font-black tracking-tight">Halo, {currentUser?.name}! 👋</h2>
              <p className="text-muted-foreground text-sm font-medium">
                Ini adalah progress penagihan PBB Anda untuk tahun <strong>{currentYear}</strong>. Semangat berkeliling!
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 lg:gap-8">
              <div className="space-y-1">
                <p className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase">Target Kelunasan</p>
                <div className="text-foreground text-xl sm:text-2xl lg:text-xl xl:text-2xl font-black">{formatCurrency(personalStats.totalTarget)}</div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-tight">
                    Tagihan Aktif: {personalStats.totalWp - personalStats.wpLunas - personalStats.wpSengketa - personalStats.wpTdkTerbit} WP
                  </p>
                  {(personalStats.wpSengketa > 0 || personalStats.wpTdkTerbit > 0) && (
                    <div className="flex items-center gap-2 opacity-80">
                      {personalStats.wpSengketa > 0 && (
                        <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded uppercase">
                          {personalStats.wpSengketa} Sengketa
                        </p>
                      )}
                      {personalStats.wpTdkTerbit > 0 && (
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-500/10 px-2 py-0.5 rounded uppercase">
                          {personalStats.wpTdkTerbit} Tdk Terbit
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="hidden h-12 w-px bg-primary/20 sm:block"></div>

              <div className="space-y-1">
                <p className="text-primary text-[11px] font-bold tracking-widest uppercase">Telah Terkumpul</p>
                <div className="text-emerald-600 dark:text-emerald-400 text-xl sm:text-2xl lg:text-xl xl:text-2xl font-black">{formatCurrency(personalStats.totalLunas)}</div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-500">{personalStats.wpLunas} WP Lunas</p>
              </div>

              <div className="hidden h-12 w-px bg-primary/20 sm:block"></div>

              <div className="w-full sm:w-32 lg:w-48">
                <div className="mb-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-primary">Progress</span>
                  <span className="text-primary">{personalStats.totalTarget > 0 ? ((personalStats.totalLunas / personalStats.totalTarget) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-primary/10">
                  <div 
                    className="h-full rounded-full bg-primary shadow-lg transition-all duration-1000 ease-out" 
                    style={{ width: `${personalStats.totalTarget > 0 ? Math.min((personalStats.totalLunas / personalStats.totalTarget) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-primary/10 absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="bg-primary/5 absolute -bottom-24 -left-24 h-64 w-64 rounded-full blur-3xl opacity-50 pointer-events-none" />
        </div>
      )}

      {currentUser?.role === "PENARIK" && (
        <div className="bg-background rounded-3xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-emerald-500/10 rounded-lg p-1.5">
              <Clock className="h-4 w-4 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">Riwayat Pekerjaan Terakhir</h2>
          </div>
          <div className="space-y-4">
            {dailyLogs?.length > 0 ? (
              <>
                {dailyLogs.map((log) => {
                  const isUnpaid = log.details?.includes("BELUM_LUNAS") || log.details?.includes("TIDAK_TERBIT");
                  return (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      <div className={`mt-0.5 rounded-full p-1 ${isUnpaid ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}>
                        {isUnpaid ? (
                          <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{log.details}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {log.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB 
                          {log.entityId ? ` • WP: ${log.entityId}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {dailyLogs.length === 5 && totalLogs > 5 && (
                  <div className="pt-4 mt-2 border-t">
                    <Link href="/riwayat" className="w-full">
                      <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                        <History className="h-4 w-4" /> Lihat Semua Riwayat ({totalLogs} Aktivitas)
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm font-medium text-muted-foreground">Belum ada riwayat penagihan yang tercatat.</p>
                <p className="text-xs text-muted-foreground mt-1">Aktivitas update status pembayaran Anda akan muncul di sini.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsHeroGridContainer tahun={currentYear} />
      </Suspense>

      {/* Analytics Group */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Charts Section */}
        <div className="space-y-6 lg:col-span-8">
          <Suspense fallback={<ChartSkeleton />}>
            <RWBarChartContainer tahun={currentYear} />
          </Suspense>

          <Suspense fallback={<ChartSkeleton />}>
            <TrendAnalysisChartContainer tahun={currentYear} />
          </Suspense>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6 lg:col-span-4">
          <Suspense fallback={<SidebarCardSkeleton />}>
            <StatusPieChartContainer tahun={currentYear} />
          </Suspense>

          <Suspense fallback={<SidebarCardSkeleton />}>
            <TopPenariksContainer tahun={currentYear} />
          </Suspense>
        </div>
      </div>

      {/* Physical Stats Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapIcon className="text-primary h-5 w-5" />
          <h2 className="text-xl font-bold">Statistik Fisik Objek Pajak</h2>
        </div>
        <Suspense fallback={<StatsSkeleton />}>
          <PhysicalStatsGridContainer tahun={currentYear} />
        </Suspense>
      </div>
    </div>
  );
}

function PhysicalStatsCard({ title, value, description, icon }: PhysicalStatsCardProps) {
  return (
    <Card className="hover:border-primary/30 hover:-translate-y-1 hover:shadow-md dark:hover:shadow-black/20 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="text-foreground/50 rounded-xl border border-border bg-muted/30 p-2.5">
          {icon}
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-[11px] font-bold tracking-[0.1em] uppercase">
            {title}
          </p>
          <div className="text-foreground text-base sm:text-lg leading-none font-black tracking-tight">
            {value}
          </div>
          <p className="text-muted-foreground/60 text-[10px] font-medium">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsHeroCard({ title, value, icon, description, percent, color }: StatsHeroCardProps) {
  const colors: Record<StatsHeroCardProps["color"], string> = {
    indigo: "bg-indigo-500/5 text-indigo-600 border-indigo-100 dark:border-indigo-900/40 group-hover:bg-indigo-500/10 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]",
    emerald: "bg-emerald-500/5 text-emerald-600 border-emerald-100 dark:border-emerald-900/40 group-hover:bg-emerald-500/10 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    rose: "bg-rose-500/5 text-rose-600 border-rose-100 dark:border-rose-900/40 group-hover:bg-rose-500/10 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]",
    blue: "bg-blue-500/5 text-blue-600 border-blue-100 dark:border-blue-900/40 group-hover:bg-blue-500/10 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]",
  };

  return (
    <Card className="hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-black/40 group space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className={cn("rounded-xl border p-2.5 transition-all duration-300", colors[color])}>{icon}</div>
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
        <p className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase">
          {title}
        </p>
        <div className="text-foreground text-xl sm:text-2xl lg:text-xl xl:text-2xl leading-none font-black tracking-tighter">
          {value}
        </div>
        <p className="text-muted-foreground flex items-center gap-1.5 pt-1 text-[11px] leading-relaxed">
          <span className="h-1 w-1 rounded-full bg-zinc-200" />
          {description}
        </p>
      </div>
    </Card>
  );
}

function DashboardMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
      <span className="text-muted-foreground text-xs font-bold">{label}</span>
      <span className="text-foreground text-sm font-black tracking-tight">{value}</span>
    </div>
  );
}
