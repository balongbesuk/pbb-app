import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { TaxDataTable } from "@/components/tax/tax-data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { AppUser } from "@/types/app";
import { Suspense } from "react";
import { TaxTableSkeleton } from "@/components/tax/table/tax-skeleton";
import { TaxAddManualDialog } from "@/components/tax/tax-add-manual-dialog";


export default async function DataPajakPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    tahun?: string;
    dusun?: string;
    rw?: string;
    rt?: string;
    penarik?: string;
    regionStatus?: string;
    paymentStatus?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const tahun = parseInt(params.tahun || new Date().getFullYear().toString());
  const filterDusun = params.dusun || "";
  const filterRw = params.rw || "";
  const filterRt = params.rt || "";
  const filterPenarik = params.penarik || "";
  const regionStatus = params.regionStatus || "all";
  const paymentStatus = params.paymentStatus || "all";
  const pageSize = 50;

  const whereClause: Prisma.TaxDataWhereInput = {
    tahun,
  };

  if (paymentStatus !== "all") {
    whereClause.paymentStatus = paymentStatus as any;
  }

  const andFilters: Prisma.TaxDataWhereInput[] = [];

  if (query) {
    const searchQuery = query.trim();
    const pureNumbers = searchQuery.replace(/\D/g, "");
    
    // Generasi variasi format NOP untuk pencarian yang lebih tangguh
    const variations: string[] = [searchQuery];
    if (pureNumbers.length > 0) variations.push(pureNumbers); // Cari angka mentah

    if (pureNumbers.length >= 2) {
      let v1 = ""; // Standard: XX.XX.XXX.XXX.XXX-XXXX.X
      let v2 = ""; // All Dots: XX.XX.XXX.XXX.XXX.XXXX.X
      
      v1 += pureNumbers.substring(0, 2);
      v2 += pureNumbers.substring(0, 2);
      
      if (pureNumbers.length > 2) {
        v1 += "." + pureNumbers.substring(2, 4);
        v2 += "." + pureNumbers.substring(2, 4);
      }
      if (pureNumbers.length > 4) {
        v1 += "." + pureNumbers.substring(4, 7);
        v2 += "." + pureNumbers.substring(4, 7);
      }
      if (pureNumbers.length > 7) {
        v1 += "." + pureNumbers.substring(7, 10);
        v2 += "." + pureNumbers.substring(7, 10);
      }
      if (pureNumbers.length > 10) {
        v1 += "." + pureNumbers.substring(10, 13);
        v2 += "." + pureNumbers.substring(10, 13);
      }
      if (pureNumbers.length > 13) {
        v1 += "-" + pureNumbers.substring(13, 17);
        v2 += "." + pureNumbers.substring(13, 17);
      }
      if (pureNumbers.length > 17) {
        v1 += "." + pureNumbers.substring(17, 18);
        v2 += "." + pureNumbers.substring(17, 18);
      }
      variations.push(v1, v2);
    }

    // Filter duplikat dan string kosong
    const finalVariations = Array.from(new Set(variations.filter(v => v.length >= 3)));

    const orConditions: Prisma.TaxDataWhereInput[] = [
      ...finalVariations.map(v => ({ nop: { contains: v } })),
      { namaWp: { contains: searchQuery } },
      { namaWp: { contains: searchQuery.toUpperCase() } },
      { alamatObjek: { contains: searchQuery } },
      { alamatObjek: { contains: searchQuery.toUpperCase() } },
    ];
    andFilters.push({ OR: orConditions });
  }

  if (regionStatus === "incomplete") {
    andFilters.push({
      OR: [{ dusun: null }, { rw: null }, { rt: null }, { dusun: "" }, { rw: "" }, { rt: "" }],
    });
  }

  if (filterDusun && filterDusun !== "all") whereClause.dusun = filterDusun;
  if (filterRw && filterRw !== "all") whereClause.rw = filterRw;
  if (filterRt && filterRt !== "all") whereClause.rt = filterRt;
  if (filterPenarik && filterPenarik !== "all") {
    if (filterPenarik === "none") {
      whereClause.penarikId = null;
    } else {
      whereClause.penarikId = filterPenarik;
    }
  }

  if (andFilters.length > 0) {
    whereClause.AND = andFilters;
  }

  const [data, total, penariks, filterOptions, dusunRefsRaw] = await Promise.all([
    prisma.taxData.findMany({
      where: whereClause,
      include: {
        penarik: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            dusun: true,
            rt: true,
            rw: true,
          },
        },
      },
      orderBy: { nop: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.taxData.count({
      where: whereClause,
    }),
    prisma.user.findMany({
      where: { role: "PENARIK" },
      select: { id: true, name: true, dusun: true, rt: true, rw: true },
    }),
    prisma.taxData.findMany({
      where: { tahun },
      select: { dusun: true, rw: true, rt: true },
      distinct: ["dusun", "rw", "rt"],
    }),
    prisma.dusunReference.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const uniqueDusuns = Array.from(
    new Set(filterOptions.map((o) => o.dusun).filter(Boolean))
  ) as string[];
  const uniqueRws = Array.from(
    new Set(filterOptions.map((o) => o.rw).filter(Boolean))
  ).sort() as string[];
  const uniqueRts = Array.from(
    new Set(filterOptions.map((o) => o.rt).filter(Boolean))
  ).sort() as string[];

  const availableFilters = {
    dusun: uniqueDusuns,
    rw: uniqueRws,
    rt: uniqueRts,
    penarik: penariks.map((p) => ({ id: p.id, name: p.name || "" })),
    dusunRefs: dusunRefsRaw.map((d) => d.name),
  };

  const villageRegions = await prisma.villageRegion.findMany({
    select: { dusun: true, rw: true, rt: true },
  });
  const configDusuns = Array.from(new Set(villageRegions.map(v => v.dusun))).sort();
  const configRws = Array.from(new Set(villageRegions.map(v => v.rw))).sort();
  const configRts = Array.from(new Set(villageRegions.map(v => v.rt))).sort();

  // Fallback to populated data if config is empty
  const passDusuns = configDusuns.length > 0 ? configDusuns : (availableFilters.dusunRefs.length > 0 ? availableFilters.dusunRefs : uniqueDusuns);
  const passRws = configRws.length > 0 ? configRws : uniqueRws;
  const passRts = configRts.length > 0 ? configRts : uniqueRts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Pajak PBB</h1>
          <p className="text-muted-foreground">Kelola dan pantau seluruh data pajak terdaftar</p>
        </div>
        {session?.user?.role !== "PENGGUNA" && (
          <TaxAddManualDialog 
            dusunList={passDusuns}
            rwList={passRws}
            rtList={passRts}
          />
        )}
      </div>

      <Card className="glass border-none shadow-xl">
        <CardHeader className="pb-0">
          <CardTitle>Daftar Wajib Pajak {tahun}</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TaxTableSkeleton isMobile={false} />}>
            <TaxDataTable
              initialData={JSON.parse(JSON.stringify(data))}
              total={total}
              pageSize={pageSize}
              penariks={JSON.parse(JSON.stringify(penariks))}
              availableFilters={availableFilters}
              currentUser={session?.user as AppUser | undefined}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
