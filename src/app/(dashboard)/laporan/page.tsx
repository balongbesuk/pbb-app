import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText, Printer } from "lucide-react";
import { RwWpDialog } from "@/components/laporan/rw-wp-dialog";
import { PenarikWpDialog } from "@/components/laporan/penarik-wp-dialog";
import { LaporanActionButtons } from "@/components/laporan/laporan-action-buttons";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function LaporanPage({ searchParams }: { searchParams: Promise<{ tahun?: string }> }) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as any;
  const params = await searchParams;
  const currentYear = parseInt(params.tahun || new Date().getFullYear().toString());

  // Aggregate Data by Penarik and PaymentStatus
  const penarikStatsRaw = await prisma.taxData.groupBy({
    by: ['penarikId', 'paymentStatus'],
    where: { tahun: currentYear },
    _count: { nop: true },
    _sum: { ketetapan: true, pembayaran: true, sisaTagihan: true }
  });

  const penarikMapReduce = new Map<string, any>();

  penarikStatsRaw.forEach((stat) => {
    const pId = stat.penarikId || 'unassigned';
    if (!penarikMapReduce.has(pId)) {
      penarikMapReduce.set(pId, {
        penarikId: stat.penarikId,
        _count: { nop: 0 },
        _sum: { ketetapan: 0, pembayaran: 0, sisaTagihan: 0 },
        lunasCount: 0,
        belumLunasCount: 0
      });
    }

    const curr = penarikMapReduce.get(pId);
    curr._count.nop += stat._count.nop;
    curr._sum.ketetapan += stat._sum.ketetapan || 0;
    curr._sum.pembayaran += stat._sum.pembayaran || 0;
    curr._sum.sisaTagihan += stat._sum.sisaTagihan || 0;

    if (stat.paymentStatus === 'LUNAS') {
      curr.lunasCount += stat._count.nop;
    } else {
      curr.belumLunasCount += stat._count.nop;
    }
  });

  const penarikStatsFlat = Array.from(penarikMapReduce.values());

  const penarikUsers = await prisma.user.findMany({
    where: { role: 'PENARIK' },
    select: { id: true, name: true, dusun: true }
  });

  const penarikMap = new Map<string, { name: string | null; dusun: string | null }>(
    penarikUsers.map((u: { id: string; name: string | null; dusun: string | null }) => [u.id, u])
  );

  const combinedStats = penarikStatsFlat.map((stat: any) => ({
    ...stat,
    penarikName: stat.penarikId ? (penarikMap.get(stat.penarikId as string)?.name || "Penarik Tidak Ditemukan") : "Belum Dialokasikan",
    penarikDusun: stat.penarikId ? (penarikMap.get(stat.penarikId as string)?.dusun || "") : ""
  }));

  // Calculate overall totals
  const totalWp = penarikStatsFlat.reduce((acc: number, curr: any) => acc + curr._count.nop, 0);
  const totalWpLunas = penarikStatsFlat.reduce((acc: number, curr: any) => acc + curr.lunasCount, 0);
  const totalWpBelumLunas = penarikStatsFlat.reduce((acc: number, curr: any) => acc + curr.belumLunasCount, 0);
  const totalTarget = penarikStatsFlat.reduce((acc: number, curr: any) => acc + (curr._sum.ketetapan || 0), 0);
  const totalRealisasi = penarikStatsFlat.reduce((acc: number, curr: any) => acc + (curr._sum.pembayaran || 0), 0);
  const totalSisa = penarikStatsFlat.reduce((acc: number, curr: any) => acc + (curr._sum.sisaTagihan || 0), 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Laporan Realisasi PBB</h1>
          <p className="text-muted-foreground">Ringkasan penagihan per wilayah untuk tahun {currentYear}</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
           <DashboardFilters />
           <LaporanActionButtons tahun={currentYear} currentUser={currentUser} />
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Total Wajib Pajak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{totalWp.toLocaleString()} <span className="text-sm font-bold text-foreground/50">WP</span></div>
          </CardContent>
        </Card>
        <Card className="glass border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Total Target Penerimaan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{formatCurrency(totalTarget)}</div>
          </CardContent>
        </Card>
        <Card className="glass border-none shadow-lg ring-1 ring-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Realisasi (Dibayar)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(totalRealisasi)}</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400/80 mt-1 font-medium">
              {((totalRealisasi / (totalTarget || 1)) * 100).toFixed(1)}% dari target
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-none shadow-lg ring-1 ring-rose-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Sisa Piutang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-400">{formatCurrency(totalSisa)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-none shadow-xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary to-blue-400" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Rekapitulasi Penarik Pajak
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-xl border border-border/50 bg-background/30 print:border-none print:bg-transparent print:overflow-visible overflow-x-auto">
            <Table className="print:w-full">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[200px] min-w-[150px] text-sm font-bold uppercase tracking-wider">Penarik / Kolektor</TableHead>
                  <TableHead className="text-center text-sm font-bold uppercase tracking-wider">WP</TableHead>
                  <TableHead className="text-center hidden sm:table-cell text-sm font-bold uppercase tracking-wider">Lunas</TableHead>
                  <TableHead className="text-center hidden sm:table-cell text-sm font-bold uppercase tracking-wider">Belum</TableHead>
                  <TableHead className="text-right hidden md:table-cell text-sm font-bold uppercase tracking-wider">Target</TableHead>
                  <TableHead className="text-right text-sm font-bold uppercase tracking-wider">Realisasi</TableHead>
                  <TableHead className="text-right hidden lg:table-cell text-sm font-bold uppercase tracking-wider">Sisa</TableHead>
                  <TableHead className="text-right text-sm font-bold uppercase tracking-wider">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combinedStats.sort((a: any, b: any) => a.penarikName.localeCompare(b.penarikName)).map((stat: any, index: number) => {
                  const target = stat._sum.ketetapan || 0;
                  const realisasi = stat._sum.pembayaran || 0;
                  const sisa = stat._sum.sisaTagihan || 0;
                  const percent = target > 0 ? (realisasi / target) * 100 : 0;
                  
                  return (
                    <TableRow key={index} className="hover:bg-muted/30">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {stat.penarikName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm truncate">{stat.penarikName}</div>
                            {stat.penarikDusun && <div className="text-xs text-muted-foreground truncate">Wilayah: {stat.penarikDusun}</div>}
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
                      <TableCell className="text-center hover:bg-muted/50 transition-colors hidden sm:table-cell">
                        <PenarikWpDialog 
                          penarikId={stat.penarikId} 
                          penarikName={stat.penarikName} 
                          tahun={currentYear} 
                          count={stat.lunasCount} 
                          allPenariks={penarikUsers}
                          paymentStatus="LUNAS"
                          currentUser={currentUser}
                        >
                          <div className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {stat.lunasCount}
                          </div>
                        </PenarikWpDialog>
                      </TableCell>
                      <TableCell className="text-center hover:bg-muted/50 transition-colors hidden sm:table-cell">
                        <PenarikWpDialog 
                          penarikId={stat.penarikId} 
                          penarikName={stat.penarikName} 
                          tahun={currentYear} 
                          count={stat.belumLunasCount} 
                          allPenariks={penarikUsers}
                          paymentStatus="BELUM_LUNAS"
                          currentUser={currentUser}
                        >
                          <div className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                            {stat.belumLunasCount}
                          </div>
                        </PenarikWpDialog>
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell text-sm">{formatCurrency(target)}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(realisasi)}</TableCell>
                      <TableCell className="text-right font-medium text-rose-600 hidden lg:table-cell text-sm">{formatCurrency(sisa)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-black">{percent.toFixed(0)}%</span>
                          <div className="w-12 sm:w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
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
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground text-sm">
                      Belum ada data pajak untuk tahun ini.
                    </TableCell>
                  </TableRow>
                )}
                {combinedStats.length > 0 && (
                  <TableRow className="bg-primary/5 hover:bg-primary/10 transition-colors font-bold text-sm">
                    <TableCell className="py-4">TOTAL</TableCell>
                    <TableCell className="text-center">{totalWp}</TableCell>
                    <TableCell className="text-center hidden sm:table-cell">{totalWpLunas}</TableCell>
                    <TableCell className="text-center hidden sm:table-cell">{totalWpBelumLunas}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{formatCurrency(totalTarget)}</TableCell>
                    <TableCell className="text-right text-emerald-700 dark:text-emerald-400 font-black">{formatCurrency(totalRealisasi)}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell text-rose-700 dark:text-rose-400">{formatCurrency(totalSisa)}</TableCell>
                    <TableCell className="text-right font-black">
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
