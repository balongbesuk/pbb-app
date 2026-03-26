import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText, Printer } from "lucide-react";
import { RwWpDialog } from "@/components/laporan/rw-wp-dialog";
import { PenarikWpDialog } from "@/components/laporan/penarik-wp-dialog";
import { LaporanActionButtons } from "@/components/laporan/laporan-action-buttons";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as any;
  const params = await searchParams;
  const currentYear = parseInt(params.tahun || new Date().getFullYear().toString());

  // Aggregate Data by Penarik and PaymentStatus
  const penarikStatsRaw = await prisma.taxData.groupBy({
    by: ["penarikId", "paymentStatus"],
    where: { tahun: currentYear },
    _count: { nop: true },
    _sum: { ketetapan: true, pembayaran: true, sisaTagihan: true },
  });

  const penarikMapReduce = new Map<string, any>();

  penarikStatsRaw.forEach((stat) => {
    const pId = stat.penarikId || "unassigned";
    if (!penarikMapReduce.has(pId)) {
      penarikMapReduce.set(pId, {
        penarikId: stat.penarikId,
        _count: { nop: 0 },
        _sum: { ketetapan: 0, pembayaran: 0, sisaTagihan: 0 },
        lunasCount: 0,
        belumLunasCount: 0,
        sengketaCount: 0,
        tdkTerbitCount: 0,
      });
    }

    const curr = penarikMapReduce.get(pId);
    curr._count.nop += stat._count.nop;
    curr._sum.ketetapan += stat._sum.ketetapan || 0;
    curr._sum.pembayaran += stat._sum.pembayaran || 0;
    curr._sum.sisaTagihan += stat._sum.sisaTagihan || 0;

    if (stat.paymentStatus === "LUNAS") {
      curr.lunasCount += stat._count.nop;
    } else if (stat.paymentStatus === "BELUM_LUNAS") {
      curr.belumLunasCount += stat._count.nop;
    } else if (stat.paymentStatus === "SUSPEND") {
      curr.sengketaCount += stat._count.nop;
    } else if (stat.paymentStatus === "TIDAK_TERBIT") {
      curr.tdkTerbitCount += stat._count.nop;
    }
  });

  const penarikStatsFlat = Array.from(penarikMapReduce.values());

  const penarikUsers = await prisma.user.findMany({
    where: { role: "PENARIK" },
    select: { id: true, name: true, dusun: true },
  });

  const penarikMap = new Map<string, { name: string | null; dusun: string | null }>(
    penarikUsers.map((u: { id: string; name: string | null; dusun: string | null }) => [u.id, u])
  );

  const combinedStats = penarikStatsFlat.map((stat: any) => ({
    ...stat,
    penarikName: stat.penarikId
      ? penarikMap.get(stat.penarikId as string)?.name || "Penarik Tidak Ditemukan"
      : "Belum Dialokasikan",
    penarikDusun: stat.penarikId ? penarikMap.get(stat.penarikId as string)?.dusun || "" : "",
  }));

  // Calculate overall totals
  const totalWp = penarikStatsFlat.reduce((acc: number, curr: any) => acc + curr._count.nop, 0);
  const totalWpLunas = penarikStatsFlat.reduce(
    (acc: number, curr: any) => acc + curr.lunasCount,
    0
  );
  const totalWpBelumLunas = penarikStatsFlat.reduce(
    (acc: number, curr: any) => acc + curr.belumLunasCount,
    0
  );
  const totalWpSengketa = penarikStatsFlat.reduce(
    (acc: number, curr: any) => acc + (curr.sengketaCount || 0),
    0
  );
  const totalWpTdkTerbit = penarikStatsFlat.reduce(
    (acc: number, curr: any) => acc + (curr.tdkTerbitCount || 0),
    0
  );
  const totalTarget = penarikStatsFlat.reduce(
    (acc: number, curr: any) => acc + (curr._sum.ketetapan || 0),
    0
  );
  const totalRealisasi = penarikStatsFlat.reduce(
    (acc: number, curr: any) => acc + (curr._sum.pembayaran || 0),
    0
  );
  const totalSisa = penarikStatsFlat.reduce(
    (acc: number, curr: any) => acc + (curr._sum.sisaTagihan || 0),
    0
  );


  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Laporan Realisasi PBB</h1>
          <p className="text-muted-foreground">
            Ringkasan penagihan per wilayah untuk tahun {currentYear}
          </p>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Suspense fallback={<div className="h-9 w-[190px] animate-pulse bg-muted rounded-xl" />}>
            <DashboardFilters />
          </Suspense>
          <LaporanActionButtons tahun={currentYear} currentUser={currentUser} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="space-y-2 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
          <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            Total Wajib Pajak
          </p>
          <div className="text-foreground text-xl font-black tracking-tight">
            {totalWp.toLocaleString()}{" "}
            <span className="text-muted-foreground text-[10px] font-bold">WP</span>
          </div>
        </Card>
        <Card className="space-y-2 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
          <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            Target Penerimaan
          </p>
          <div className="text-foreground text-xl font-black tracking-tighter">
            {formatCurrency(totalTarget)}
          </div>
        </Card>
        <Card className="space-y-1 rounded-2xl border border-zinc-100 bg-emerald-500/5 bg-white p-4 shadow-sm transition-all dark:border-zinc-900 dark:bg-zinc-950">
          <p className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
            Total Realisasi
          </p>
          <div className="text-xl font-black tracking-tighter text-emerald-700 dark:text-emerald-400">
            {formatCurrency(totalRealisasi)}
          </div>
          <p className="text-[10px] font-bold text-emerald-600">
            {((totalRealisasi / (totalTarget || 1)) * 100).toFixed(1)}% Progress
          </p>
        </Card>
        <Card className="space-y-2 rounded-2xl border border-zinc-100 bg-rose-500/5 bg-white p-4 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
          <p className="text-[10px] font-bold tracking-widest text-rose-600 uppercase">
            Sisa Piutang
          </p>
          <div className="text-xl font-black tracking-tighter text-rose-700 dark:text-rose-400">
            {formatCurrency(totalSisa)}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
        <CardHeader className="border-b border-zinc-50 pb-4 dark:border-zinc-900/50">
          <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
            <div className="bg-primary/5 rounded-xl p-2">
              <FileText className="text-primary h-5 w-5" />
            </div>
            Rekapitulasi Penarik Pajak
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-border/50 bg-background/30 overflow-x-auto rounded-xl border print:overflow-visible print:border-none print:bg-transparent">
            <Table className="print:w-full">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[200px] min-w-[150px] text-sm font-bold tracking-wider uppercase">
                    Penarik / Kolektor
                  </TableHead>
                  <TableHead className="text-center text-sm font-bold tracking-wider uppercase">
                    WP
                  </TableHead>
                  <TableHead className="hidden text-center text-sm font-bold tracking-wider uppercase sm:table-cell">
                    Lunas
                  </TableHead>
                  <TableHead className="hidden text-center text-sm font-bold tracking-wider uppercase sm:table-cell">
                    Blm
                  </TableHead>
                  <TableHead className="hidden text-center text-sm font-bold tracking-wider uppercase md:table-cell">
                    Sengketa
                  </TableHead>
                  <TableHead className="hidden text-center text-sm font-bold tracking-wider uppercase lg:table-cell">
                    Tdk Terbit
                  </TableHead>
                  <TableHead className="hidden text-right text-sm font-bold tracking-wider uppercase md:table-cell">
                    Target
                  </TableHead>
                  <TableHead className="text-right text-sm font-bold tracking-wider uppercase">
                    Realisasi
                  </TableHead>
                  <TableHead className="hidden text-right text-sm font-bold tracking-wider uppercase lg:table-cell">
                    Sisa
                  </TableHead>
                  <TableHead className="text-right text-sm font-bold tracking-wider uppercase">
                    %
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combinedStats
                  .sort((a: any, b: any) => a.penarikName.localeCompare(b.penarikName))
                  .map((stat: any, index: number) => {
                    const target = stat._sum.ketetapan || 0;
                    const realisasi = stat._sum.pembayaran || 0;
                    const sisa = stat._sum.sisaTagihan || 0;
                    const percent = target > 0 ? (realisasi / target) * 100 : 0;

                    return (
                      <TableRow key={index} className="hover:bg-muted/30">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                              {stat.penarikName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold">{stat.penarikName}</div>
                              {stat.penarikDusun && (
                                <div className="text-muted-foreground truncate text-xs">
                                  Wilayah: {stat.penarikDusun}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium">
                          <PenarikWpDialog
                            penarikId={stat.penarikId}
                            penarikName={stat.penarikName}
                            tahun={currentYear}
                            count={stat._count.nop}
                            allPenariks={penarikUsers}
                            currentUser={currentUser}
                          />
                        </TableCell>
                        <TableCell className="hover:bg-muted/50 hidden text-center transition-colors sm:table-cell">
                          <PenarikWpDialog
                            penarikId={stat.penarikId}
                            penarikName={stat.penarikName}
                            tahun={currentYear}
                            count={stat.lunasCount}
                            allPenariks={penarikUsers}
                            paymentStatus="LUNAS"
                            currentUser={currentUser}
                          >
                            <div className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                              {stat.lunasCount}
                            </div>
                          </PenarikWpDialog>
                        </TableCell>
                        <TableCell className="hover:bg-muted/50 hidden text-center transition-colors sm:table-cell">
                          <PenarikWpDialog
                            penarikId={stat.penarikId}
                            penarikName={stat.penarikName}
                            tahun={currentYear}
                            count={stat.belumLunasCount}
                            allPenariks={penarikUsers}
                            paymentStatus="BELUM_LUNAS"
                            currentUser={currentUser}
                          >
                            <div className="inline-flex items-center justify-center rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-400">
                              {stat.belumLunasCount}
                            </div>
                          </PenarikWpDialog>
                        </TableCell>
                        <TableCell className="hover:bg-muted/50 hidden text-center transition-colors md:table-cell">
                          <PenarikWpDialog
                            penarikId={stat.penarikId}
                            penarikName={stat.penarikName}
                            tahun={currentYear}
                            count={stat.sengketaCount}
                            allPenariks={penarikUsers}
                            paymentStatus="SUSPEND"
                            currentUser={currentUser}
                          >
                            <div className="inline-flex items-center justify-center rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-800 dark:bg-orange-900/40 dark:text-orange-400">
                              {stat.sengketaCount}
                            </div>
                          </PenarikWpDialog>
                        </TableCell>
                        <TableCell className="hover:bg-muted/50 hidden text-center transition-colors lg:table-cell">
                          <PenarikWpDialog
                            penarikId={stat.penarikId}
                            penarikName={stat.penarikName}
                            tahun={currentYear}
                            count={stat.tdkTerbitCount}
                            allPenariks={penarikUsers}
                            paymentStatus="TIDAK_TERBIT"
                            currentUser={currentUser}
                          >
                            <div className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                              {stat.tdkTerbitCount}
                            </div>
                          </PenarikWpDialog>
                        </TableCell>
                        <TableCell className="hidden text-right text-sm md:table-cell">
                          {formatCurrency(target)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(realisasi)}
                        </TableCell>
                        <TableCell className="hidden text-right text-sm font-medium text-rose-600 lg:table-cell">
                          {formatCurrency(sisa)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-black">{percent.toFixed(0)}%</span>
                            <div className="bg-muted h-1.5 w-12 overflow-hidden rounded-full sm:w-16">
                              <div
                                className={`h-full ${percent >= 80 ? "bg-emerald-500" : percent >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {combinedStats.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-muted-foreground h-24 text-center text-sm"
                    >
                      Belum ada data pajak untuk tahun ini.
                    </TableCell>
                  </TableRow>
                )}
                {combinedStats.length > 0 && (
                  <TableRow className="bg-primary/5 hover:bg-primary/10 text-sm font-bold transition-colors">
                    <TableCell className="py-4">TOTAL</TableCell>
                    <TableCell className="text-center">{totalWp}</TableCell>
                    <TableCell className="hidden text-center sm:table-cell">
                      {totalWpLunas}
                    </TableCell>
                    <TableCell className="hidden text-center sm:table-cell">
                      {totalWpBelumLunas}
                    </TableCell>
                    <TableCell className="hidden text-center md:table-cell">
                      {totalWpSengketa}
                    </TableCell>
                    <TableCell className="hidden text-center lg:table-cell">
                      {totalWpTdkTerbit}
                    </TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      {formatCurrency(totalTarget)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalRealisasi)}
                    </TableCell>
                    <TableCell className="hidden text-right text-rose-600 lg:table-cell dark:text-rose-400">
                      {formatCurrency(totalSisa)}
                    </TableCell>
                    <TableCell className="text-primary text-right font-bold">
                      {((totalRealisasi / (totalTarget || 1)) * 100).toFixed(0)}%
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
