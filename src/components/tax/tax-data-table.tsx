"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, Loader2, UserMinus, MapPin } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { updatePaymentStatus } from "@/app/actions/tax-update-actions";
import { assignPenarik, assignPenarikBulk } from "@/app/actions/tax-assign-actions";
import { sendTransferRequest } from "@/app/actions/transfer-actions";
import { toast } from "sonner";
import { BulkRegionDialog } from "./table/bulk-region-dialog";

// Sub-components
import { TaxTableRow } from "./table/tax-table-row";
import { TaxTableFilters } from "./table/tax-table-filters";
import { TaxTablePagination } from "./table/tax-table-pagination";
import { TaxDetailDialog } from "./table/tax-detail-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function TaxDataTable({
  initialData,
  total,
  pageSize,
  penariks = [],
  availableFilters = { dusun: [], rw: [], rt: [], penarik: [] },
  currentUser,
}: {
  initialData: any[];
  total: number;
  pageSize: number;
  penariks?: any[];
  availableFilters?: {
    dusun: string[];
    rw: string[];
    rt: string[];
    penarik: { id: string; name: string }[];
    dusunRefs?: string[];
  };
  currentUser?: { id: string; name?: string | null; email?: string | null; role: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Query parameters from URL
  const q = searchParams.get("q") || "";
  const page = searchParams.get("page") || "1";
  const tahun = searchParams.get("tahun") || new Date().getFullYear().toString();
  const dusun = searchParams.get("dusun") || "";
  const rw = searchParams.get("rw") || "";
  const rt = searchParams.get("rt") || "";
  const penarik = searchParams.get("penarik") || "";
  const regionStatus = searchParams.get("regionStatus") || "all";

  const {
    data: queryData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["tax-data", { q, page, tahun, dusun, rw, rt, penarik, regionStatus }],
    queryFn: async () => {
      const params = new URLSearchParams(searchParams);
      const res = await fetch(`/api/tax?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      return res.json();
    },
    initialData: { data: initialData, total: total, page: parseInt(page), pageSize },
    staleTime: 1000 * 60, // 1 minute
  });

  const displayData = queryData?.data || [];
  const displayTotal = queryData?.total || 0;

  const [search, setSearch] = useState(q);
  const [filterDusun, setFilterDusun] = useState(dusun || "all");
  const [filterRw, setFilterRw] = useState(rw || "all");
  const [filterRt, setFilterRt] = useState(rt || "all");
  const [filterPenarik, setFilterPenarik] = useState(penarik || "all");
  const [filterRegionStatus, setFilterRegionStatus] = useState(regionStatus || "all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);
  const [isBulkRegionOpen, setIsBulkRegionOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);

  const totalPages = Math.ceil(displayTotal / pageSize);
  const currentPage = parseInt(page);

  // Update local state when URL changes (for back/forward buttons)
  useEffect(() => {
    setSearch(q);
    setFilterDusun(dusun || "all");
    setFilterRw(rw || "all");
    setFilterRt(rt || "all");
    setFilterPenarik(penarik || "all");
    setFilterRegionStatus(regionStatus || "all");
  }, [q, dusun, rw, rt, penarik, regionStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) params.set("q", search);
    else params.delete("q");
    if (filterDusun && filterDusun !== "all") params.set("dusun", filterDusun);
    else params.delete("dusun");
    if (filterRw && filterRw !== "all") params.set("rw", filterRw);
    else params.delete("rw");
    if (filterRt && filterRt !== "all") params.set("rt", filterRt);
    else params.delete("rt");
    if (filterPenarik && filterPenarik !== "all") params.set("penarik", filterPenarik);
    else params.delete("penarik");
    if (filterRegionStatus && filterRegionStatus !== "all")
      params.set("regionStatus", filterRegionStatus);
    else params.delete("regionStatus");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    if (key === "dusun") setFilterDusun(value);
    if (key === "rw") setFilterRw(value);
    if (key === "rt") setFilterRt(value);
    if (key === "penarik") setFilterPenarik(value);
    if (key === "regionStatus") setFilterRegionStatus(value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePrint = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterDusun && filterDusun !== "all") params.set("dusun", filterDusun);
    if (filterRw && filterRw !== "all") params.set("rw", filterRw);
    if (filterRt && filterRt !== "all") params.set("rt", filterRt);
    if (filterPenarik && filterPenarik !== "all") params.set("penarik", filterPenarik);
    params.set("tahun", searchParams.get("tahun") || new Date().getFullYear().toString());
    window.open(`/api/export-tax?${params.toString()}`, "_blank");
  };

  const handleUpdateStatus = async (
    id: string,
    status: "LUNAS" | "BELUM_LUNAS" | "TIDAK_TERBIT"
  ) => {
    const res = await updatePaymentStatus(id, status);
    if (res.success) {
      toast.success(`Status diperbarui`);
      queryClient.invalidateQueries({ queryKey: ["tax-data"] });
    } else toast.error(`Gagal: ${res.message}`);
  };

  const handleAssignPenarik = async (taxId: string, penarikId: string | null) => {
    const res = await assignPenarik(taxId, penarikId);
    if (res.success) {
      toast.success("Penarik diatur");
      queryClient.invalidateQueries({ queryKey: ["tax-data"] });
    } else toast.error(res.message);
  };

  const handleBulkAssign = async (penarikId: string | null) => {
    if (selectedIds.size === 0) return;
    setIsAssigning(true);
    const res = await assignPenarikBulk(Array.from(selectedIds), penarikId);
    if (res.success) {
      toast.success(`Berhasil mengalokasikan ${res.count} data`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["tax-data"] });
    } else toast.error(res.message);
    setIsAssigning(false);
  };

  const handleTransferRequestAction = async (
    taxId: number,
    receiverId: string,
    type: "GIVE" | "TAKE"
  ) => {
    const res = await sendTransferRequest(taxId, receiverId, type);
    if (res.success) toast.success("Permintaan dikirim");
    else toast.error(res.message);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayData.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(displayData.map((d: any) => d.id)));
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  return (
    <div className="space-y-4 pt-4">
      <TaxTableFilters
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearch}
        filterDusun={filterDusun}
        onDusunChange={(v) => handleFilterChange("dusun", v)}
        filterRw={filterRw}
        onRwChange={(v) => handleFilterChange("rw", v)}
        filterRt={filterRt}
        onRtChange={(v) => handleFilterChange("rt", v)}
        filterPenarik={filterPenarik}
        onPenarikChange={(v) => handleFilterChange("penarik", v)}
        filterRegionStatus={filterRegionStatus}
        onRegionStatusChange={(v) => handleFilterChange("regionStatus", v)}
        availableFilters={availableFilters}
        onPrint={handlePrint}
        showPrint={currentUser?.role !== "PENGGUNA"}
        isFetching={isFetching && !isLoading}
      />

      {selectedIds.size > 0 && currentUser?.role !== "PENGGUNA" && (
        <div className="bg-primary/5 border-primary/20 animate-in slide-in-from-top-2 flex items-center justify-between rounded-xl border p-3 shadow-sm backdrop-blur-sm">
          <span className="text-primary px-2 text-sm font-bold">
            {selectedIds.size} data terpilih
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-primary/20 hover:bg-primary/10 text-primary gap-2 font-bold"
              onClick={() => setIsBulkRegionOpen(true)}
            >
              <MapPin className="h-4 w-4" />
              Perbaiki Wilayah
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button size="sm" className="font-bold shadow-md" disabled={isAssigning}>
                    {isAssigning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <User className="mr-2 h-4 w-4" />
                    )}
                    Alokasikan ({selectedIds.size})
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-[240px]">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-primary font-bold">
                    Pilih Penarik Tujuan
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer gap-2 font-bold"
                  onClick={() => handleBulkAssign(null)}
                >
                  <UserMinus className="h-4 w-4" /> Kosongkan Penarik
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                  {penariks.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => handleBulkAssign(p.id)}
                      className="flex cursor-pointer items-center gap-2 py-2"
                    >
                      <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="truncate text-sm font-semibold">{p.name}</span>
                        <span className="text-muted-foreground truncate text-[10px]">
                          {p.dusun || "-"} RT {p.rt || "0"}/RW {p.rw || "0"}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      <div className="border-border/50 bg-background overflow-hidden rounded-xl border shadow-lg">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              {currentUser?.role !== "PENGGUNA" && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={displayData.length > 0 && selectedIds.size === displayData.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead className="w-[180px] font-bold">NOP</TableHead>
              <TableHead className="font-bold">Nama Wajib Pajak</TableHead>
              <TableHead className="font-bold">Wilayah</TableHead>
              <TableHead className="text-right font-bold">Tagihan</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Penarik</TableHead>
              {currentUser?.role !== "PENGGUNA" && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Memuat data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-muted-foreground h-40 text-center text-sm italic"
                >
                  Data tidak ditemukan
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((item: any) => (
                <TaxTableRow
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  onToggle={toggleSelect}
                  onOpenDetail={setSelectedDetailItem}
                  currentUser={currentUser}
                  penariks={penariks}
                  onUpdateStatus={handleUpdateStatus}
                  onAssignPenarik={handleAssignPenarik}
                  onTransferRequest={handleTransferRequestAction}
                  role={currentUser?.role || "PENGGUNA"}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TaxTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={displayTotal}
        shownCount={displayData.length}
        onPageChange={(p) => {
          const params = new URLSearchParams(searchParams);
          params.set("page", p.toString());
          router.push(`${pathname}?${params.toString()}`);
        }}
      />

      <TaxDetailDialog
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        availableFilters={availableFilters}
        currentUser={currentUser}
        onUpdateStatus={handleUpdateStatus}
      />

      <BulkRegionDialog
        open={isBulkRegionOpen}
        onOpenChange={setIsBulkRegionOpen}
        selectedIds={Array.from(selectedIds)}
        availableFilters={availableFilters}
        onSuccess={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
