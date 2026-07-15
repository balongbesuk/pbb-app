import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { AppUser } from "@/types/app";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, AlertTriangle, CheckCircle2, Info, Database } from "lucide-react";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { LaporanGisFilters } from "./laporan-gis-filters";
import { LaporanGisPagination } from "./laporan-gis-pagination";
import fs from "fs";
import path from "path";

export default async function LaporanGisPage({
  searchParams,
}: {
  searchParams: Promise<{
    tahun?: string;
    q?: string;
    dusun?: string;
    blok?: string;
    rw?: string;
    rt?: string;
    page?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as AppUser | undefined;
  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const tahun = parseInt(params.tahun || new Date().getFullYear().toString());
  const q = params.q || "";
  const filterDusun = params.dusun || "";
  const filterBlok = params.blok || "";
  const filterRw = params.rw || "";
  const filterRt = params.rt || "";
  const page = parseInt(params.page || "1");
  const limit = 25; // items per page

  // Baca NOP dari wp.json
  const wpJsonPath = path.join(process.cwd(), "public/maps/wp.json");
  const gisNops = new Set<string>();
  const gisNopMap = new Map<string, string>(); // cleanNop -> fullNop
  if (fs.existsSync(wpJsonPath)) {
    try {
      const wpData = JSON.parse(fs.readFileSync(wpJsonPath, "utf-8"));
      for (const f of wpData.features || []) {
        const fullNop = f.properties?.fullNop || "";
        const clean = fullNop.replace(/\D/g, "");
        if (clean) {
          gisNops.add(clean);
          gisNopMap.set(clean, fullNop);
        }
      }
    } catch {}
  }

  // Ambil semua NOP dari database
  const dbWps = await prisma.taxData.findMany({
    where: { tahun },
    select: {
      nop: true,
      namaWp: true,
      alamatObjek: true,
      dusun: true,
      rt: true,
      rw: true,
      paymentStatus: true,
    },
    orderBy: { nop: "asc" },
  });

  const dbNopSet = new Set(dbWps.map((w) => w.nop.replace(/\D/g, "")));

  // Ambil opsi filter unik dari data database
  const uniqueDusuns = [...new Set(dbWps.map((w) => w.dusun).filter(Boolean))].sort() as string[];
  const uniqueRws = [...new Set(dbWps.map((w) => w.rw).filter(Boolean))].sort() as string[];
  const uniqueRts = [...new Set(dbWps.map((w) => w.rt).filter(Boolean))].sort() as string[];
  const uniqueBloks = [
    ...new Set(
      dbWps
        .map((w) => {
          const clean = w.nop.replace(/\D/g, "");
          return clean.length >= 13 ? clean.substring(10, 13) : "";
        })
        .filter(Boolean)
    ),
  ].sort() as string[];

  // NOP database yang tidak ada di peta
  const missingFromGis = dbWps.filter((w) => !gisNops.has(w.nop.replace(/\D/g, "")));

  // NOP di peta yang tidak ada di database
  const gisOnlyCount = [...gisNops].filter((n) => !dbNopSet.has(n)).length;

  // Filter list missingFromGis berdasarkan query & select parameters
  let filteredMissing = missingFromGis;

  if (q) {
    const searchLower = q.toLowerCase();
    filteredMissing = filteredMissing.filter(
      (w) =>
        w.namaWp.toLowerCase().includes(searchLower) ||
        w.nop.replace(/\D/g, "").includes(searchLower) ||
        (w.alamatObjek || "").toLowerCase().includes(searchLower)
    );
  }

  if (filterDusun) {
    filteredMissing = filteredMissing.filter(
      (w) => (w.dusun || "").toUpperCase() === filterDusun.toUpperCase()
    );
  }

  if (filterBlok) {
    filteredMissing = filteredMissing.filter((w) => {
      const clean = w.nop.replace(/\D/g, "");
      const b = clean.length >= 13 ? clean.substring(10, 13) : "";
      return b === filterBlok;
    });
  }

  if (filterRw) {
    filteredMissing = filteredMissing.filter((w) => parseInt(w.rw || "0") === parseInt(filterRw));
  }

  if (filterRt) {
    filteredMissing = filteredMissing.filter((w) => parseInt(w.rt || "0") === parseInt(filterRt));
  }

  // Paginate list
  const totalItems = filteredMissing.length;
  const totalPages = Math.ceil(totalItems / limit);
  const currentPage = Math.min(Math.max(1, page), totalPages || 1);
  const startIndex = (currentPage - 1) * limit;
  const paginatedMissing = filteredMissing.slice(startIndex, startIndex + limit);

  const statusLabel: Record<string, { label: string; color: string }> = {
    LUNAS: { label: "Lunas", color: "text-emerald-600 bg-emerald-50" },
    BELUM_LUNAS: { label: "Belum Lunas", color: "text-rose-600 bg-rose-50" },
    TIDAK_TERBIT: { label: "Tidak Terbit", color: "text-zinc-500 bg-zinc-100" },
    SUSPEND: { label: "Sengketa", color: "text-orange-600 bg-orange-50" },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MapPin className="w-8 h-8 text-indigo-500" />
            Laporan GIS & Sinkronisasi Peta
          </h1>
          <p className="text-muted-foreground mt-1">
            Analisis kesenjangan antara data peta bidang tanah (wp.json) dengan data pajak terdaftar tahun {tahun}
          </p>
        </div>
        <DashboardFilters />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-900 dark:bg-zinc-950 space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-xl">
              <Database className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">NOP di Database</p>
          </div>
          <div className="text-foreground text-xl font-black tracking-tight">
            {dbWps.length.toLocaleString()}
            <span className="text-muted-foreground text-[10px] font-bold ml-1">WP</span>
          </div>
        </Card>

        <Card className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-900 dark:bg-zinc-950 space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2 rounded-xl">
              <MapPin className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">NOP di Peta</p>
          </div>
          <div className="text-foreground text-xl font-black tracking-tight">
            {gisNops.size.toLocaleString()}
            <span className="text-muted-foreground text-[10px] font-bold ml-1">Bidang</span>
          </div>
        </Card>

        <Card className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4 shadow-sm dark:border-zinc-900 dark:bg-zinc-950 space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500/10 p-2 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-rose-600 text-[10px] font-bold tracking-widest uppercase">Belum Terpetakan</p>
          </div>
          <div className="text-rose-700 text-xl font-black tracking-tight dark:text-rose-400">
            {missingFromGis.length}
            <span className="text-rose-400 text-[10px] font-bold ml-1">NOP</span>
          </div>
          <p className="text-[10px] font-bold text-rose-500">
            ~{((missingFromGis.length / (dbWps.length || 1)) * 100).toFixed(1)}% dari database
          </p>
        </Card>

        <Card className="rounded-2xl border border-amber-100 bg-amber-50/30 p-4 shadow-sm dark:border-zinc-900 dark:bg-zinc-950 space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-xl">
              <Info className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-amber-600 text-[10px] font-bold tracking-widest uppercase">Peta Tanpa Data</p>
          </div>
          <div className="text-amber-700 text-xl font-black tracking-tight dark:text-amber-400">
            {gisOnlyCount.toLocaleString()}
            <span className="text-amber-400 text-[10px] font-bold ml-1">Bidang (Abu-abu)</span>
          </div>
          <p className="text-[10px] font-bold text-amber-500">
            Bidang di peta tanpa data pajak
          </p>
        </Card>
      </div>

      {/* Filter GIS */}
      <LaporanGisFilters
        dusuns={uniqueDusuns}
        bloks={uniqueBloks}
        rws={uniqueRws}
        rts={uniqueRts}
      />

      {/* Info box */}
      {totalItems === 0 ? (
        <Card className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 shrink-0" />
            <div>
              <p className="font-bold text-emerald-700 text-lg">Semua NOP sesuai filter sudah terpetakan!</p>
              <p className="text-emerald-600 text-sm mt-1">
                {q || filterDusun || filterBlok || filterRw || filterRt
                  ? "Tidak ada NOP belum terpetakan yang cocok dengan filter aktif Anda."
                  : `Seluruh NOP di database tahun ${tahun} telah memiliki koordinat bidang tanah di peta GIS.`}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-bold mb-1">Terdapat {totalItems} NOP sesuai filter yang belum memiliki koordinat GIS.</p>
            <p>Bidang-bidang ini tidak akan tampil di Peta Bidang WP. Untuk menampilkannya, bidang tanah perlu didigitasi dan ditambahkan ke berkas <code className="bg-amber-100 px-1 rounded">public/maps/wp.json</code> menggunakan fitur Geoman pada halaman Peta Wilayah.</p>
          </div>
        </div>
      )}

      {/* Table */}
      {totalItems > 0 && (
        <Card className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
          <CardHeader className="border-b border-zinc-50 pb-4 dark:border-zinc-900/50">
            <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
              <div className="bg-rose-500/10 rounded-xl p-2">
                <AlertTriangle className="text-rose-500 h-5 w-5" />
              </div>
              NOP Database Belum Terpetakan di Peta GIS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold uppercase text-xs tracking-wider">No</TableHead>
                    <TableHead className="font-bold uppercase text-xs tracking-wider">NOP</TableHead>
                    <TableHead className="font-bold uppercase text-xs tracking-wider">Nama WP</TableHead>
                    <TableHead className="hidden md:table-cell font-bold uppercase text-xs tracking-wider">Alamat Objek</TableHead>
                    <TableHead className="font-bold uppercase text-xs tracking-wider">Wilayah</TableHead>
                    <TableHead className="font-bold uppercase text-xs tracking-wider">Status</TableHead>
                    <TableHead className="font-bold uppercase text-xs tracking-wider">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMissing.map((wp, index) => {
                    const st = statusLabel[wp.paymentStatus] ?? { label: wp.paymentStatus, color: "text-zinc-500 bg-zinc-100" };
                    return (
                      <TableRow key={wp.nop} className="hover:bg-muted/30">
                        <TableCell className="text-muted-foreground text-xs">{startIndex + index + 1}</TableCell>
                        <TableCell className="font-mono text-xs font-bold">{wp.nop}</TableCell>
                        <TableCell className="font-medium text-sm">{wp.namaWp}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[180px] truncate">
                          {wp.alamatObjek || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="text-muted-foreground">RT {wp.rt} RW {wp.rw}</span>
                          {wp.dusun && wp.dusun !== "-" && (
                            <div className="font-bold text-foreground">{wp.dusun}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${st.color}`}>
                            {st.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <a
                            href={`/data-pajak?q=${wp.nop.replace(/\D/g, "")}&tahun=${tahun}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            Lihat Data →
                          </a>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            <LaporanGisPagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
