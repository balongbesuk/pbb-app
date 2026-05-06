import { prisma } from "@/lib/prisma";
import { TaxDataTable } from "@/components/tax/tax-data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { AppUser } from "@/types/app";
import { Suspense } from "react";
import { TaxTableSkeleton } from "@/components/tax/table/tax-skeleton";
import { TaxAddManualDialog } from "@/components/tax/tax-add-manual-dialog";
import { redirect } from "next/navigation";
import { buildTaxWhereInput } from "@/lib/tax-query";


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
    blok?: string;
    penarik?: string;
    regionStatus?: string;
    paymentStatus?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as AppUser | undefined;
  if (!currentUser || currentUser.role === "PENGGUNA") {
    redirect("/");
  }

  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const tahun = parseInt(params.tahun || new Date().getFullYear().toString());
  const filterDusun = params.dusun || "";
  const filterRw = params.rw || "";
  const filterRt = params.rt || "";
  const filterBlok = params.blok || "";
  const filterPenarik = params.penarik || "";
  const regionStatus = params.regionStatus || "all";
  const paymentStatus = params.paymentStatus || "all";
  const pageSize = 50;

  const whereClause = buildTaxWhereInput({
    tahun,
    q: query,
    dusun: filterDusun,
    rw: filterRw,
    rt: filterRt,
    blok: filterBlok,
    penarik: filterPenarik,
    regionStatus,
    paymentStatus,
  });

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
      select: { dusun: true, rw: true, rt: true, nop: true },
      distinct: ["dusun", "rw", "rt", "nop"],
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
  
  const uniqueBloks = Array.from(
    new Set(filterOptions.map((o) => {
        const cleanNop = o.nop.replace(/\D/g, "");
        return cleanNop.length >= 13 ? cleanNop.substring(10, 13) : null;
    }).filter(Boolean))
  ).sort() as string[];
 
  const availableFilters = {
    dusun: uniqueDusuns,
    rw: uniqueRws,
    rt: uniqueRts,
    blok: uniqueBloks,
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
        <TaxAddManualDialog
          dusunList={passDusuns}
          rwList={passRws}
          rtList={passRts}
        />
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
              currentUser={currentUser}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
