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
import { 
  assignPenarik, 
  assignPenarikBulk, 
  assignPenarikByFilter 
} from "@/app/actions/tax-assign-actions";
import { sendTransferRequest } from "@/app/actions/transfer-actions";
import { toast } from "sonner";
import { BulkRegionDialog } from "./table/bulk-region-dialog";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TaxTableSkeleton } from "./table/tax-table-skeleton";

// Sub-components
import { TaxTableRow } from "./table/tax-table-row";
import { TaxTableFilters } from "./table/tax-table-filters";
import { TaxTablePagination } from "./table/tax-table-pagination";
import { TaxDetailDialog } from "./table/tax-detail-dialog";

import type { TaxDataItem, AppUser, PenarikInfo, AvailableFilters } from "@/types/app";
import type { PaymentStatus } from "@prisma/client";

export function TaxDataTable({
  initialData,
  total,
  pageSize,
  penariks = [],
  availableFilters = { dusun: [], rw: [], rt: [], penarik: [] },
  currentUser,
}: {
  initialData: TaxDataItem[];
  total: number;
  pageSize: number;
  penariks?: PenarikInfo[];
  availableFilters?: AvailableFilters;
  currentUser?: AppUser;
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
  const [isAllFilteredSelected, setIsAllFilteredSelected] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isBulkRegionOpen, setIsBulkRegionOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<TaxDataItem | null>(null);

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

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: displayData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, 
    overscan: 10,
  });

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
    setSelectedIds(new Set());
    setIsAllFilteredSelected(false);
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
    status: PaymentStatus
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
    if (selectedIds.size === 0 && !isAllFilteredSelected) return;
    setIsAssigning(true);
    
    let res;
    if (isAllFilteredSelected) {
      res = await assignPenarikByFilter({
        tahun: parseInt(tahun),
        q,
        dusun,
        rw,
        rt,
        penarik,
        regionStatus
      }, penarikId);
    } else {
      res = await assignPenarikBulk(Array.from(selectedIds), penarikId);
    }

    if (res.success) {
      toast.success(`Berhasil mengalokasikan ${res.count} data`);
      setSelectedIds(new Set());
      setIsAllFilteredSelected(false);
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
    if (selectedIds.size === displayData.length) {
      setSelectedIds(new Set());
      setIsAllFilteredSelected(false);
    } else {
      setSelectedIds(new Set(displayData.map((d: TaxDataItem) => d.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
      setIsAllFilteredSelected(false);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  return (
    <div className="space-y-4 pt-4">
      <TaxTableFilters
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearch}
        filterDusun={filterDusun}
        onDusunChange={(v: string) => handleFilterChange("dusun", v)}
        filterRw={filterRw}
        onRwChange={(v: string) => handleFilterChange("rw", v)}
        filterRt={filterRt}
        onRtChange={(v: string) => handleFilterChange("rt", v)}
        filterPenarik={filterPenarik}
        onPenarikChange={(v: string) => handleFilterChange("penarik", v)}
        filterRegionStatus={filterRegionStatus}
        onRegionStatusChange={(v: string) => handleFilterChange("regionStatus", v)}
        availableFilters={availableFilters}
        onPrint={handlePrint}
        showPrint={currentUser?.role !== "PENGGUNA"}
        isFetching={isFetching && !isLoading}
      />

      {selectedIds.size > 0 && currentUser?.role !== "PENGGUNA" && (
        <div className="bg-primary/5 border-primary/20 animate-in fade-in zoom-in-95 duration-300 flex flex-col gap-4 rounded-2xl border p-4 shadow-xl shadow-primary/5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
              <Checkbox
                checked={selectedIds.size > 0}
                onCheckedChange={toggleSelectAll}
                className="border-primary/30"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-primary text-sm font-black">
                  {isAllFilteredSelected 
                    ? `Seluruh ${displayTotal.toLocaleString("id-ID")} Data Pajak Terpilih` 
                    : `${selectedIds.size} Baris Dipilih`}
                </span>
                {isAllFilteredSelected && (
                  <span className="bg-primary/10 text-primary flex h-5 items-center rounded-full px-2 text-[9px] font-black uppercase tracking-widest">
                    Smart Selection
                  </span>
                )}
              </div>
              
              {displayTotal > displayData.length && !isAllFilteredSelected && selectedIds.size === displayData.length && (
                <button 
                  onClick={() => setIsAllFilteredSelected(true)}
                  className="text-primary/70 hover:text-primary w-fit text-left text-[11px] font-bold underline decoration-primary/30 underline-offset-4 transition-colors"
                >
                  Pilih seluruh <span className="text-primary font-black">{displayTotal.toLocaleString("id-ID")}</span> data sesuai filter saat ini
                </button>
              )}
              
              {isAllFilteredSelected && (
                <button 
                  onClick={() => {
                    setSelectedIds(new Set());
                    setIsAllFilteredSelected(false);
                  }}
                  className="text-primary/70 hover:text-primary w-fit text-left text-[11px] font-bold underline decoration-primary/30 underline-offset-4 transition-colors"
                >
                  Batalkan pilihan masal
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-primary/30 hover:bg-primary/10 h-10 rounded-xl px-4 text-xs font-bold transition-all text-primary dark:bg-primary/5 disabled:opacity-30"
              onClick={() => setIsBulkRegionOpen(true)}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Atur Wilayah
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button 
                    className="shadow-primary/20 h-10 rounded-xl px-5 text-xs font-black shadow-lg transition-all hover:scale-[1.02] active:scale-95" 
                    disabled={isAssigning}
                  >
                    {isAssigning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <User className="mr-2 h-4 w-4" />
                    )}
                    Alokasikan ({isAllFilteredSelected ? displayTotal : selectedIds.size})
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-[260px] rounded-2xl border-none p-2 shadow-2xl">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-muted-foreground px-3 pt-3 pb-2 text-[10px] font-bold tracking-widest uppercase">
                    Pilih Penarik Kolektor
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="opacity-50" />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive flex cursor-pointer gap-2 rounded-xl px-3 py-2.5 font-bold transition-colors"
                  onClick={() => handleBulkAssign(null)}
                >
                  <UserMinus className="h-4 w-4" /> 
                  <span>Kosongkan Alokasi</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="opacity-50" />
                <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
                  {penariks.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => handleBulkAssign(p.id)}
                      className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all focus:bg-primary/5"
                    >
                      <div className="bg-primary/10 text-primary group-focus:bg-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors">
                        {(p.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="truncate text-sm font-bold tracking-tight">{p.name}</span>
                        <span className="text-muted-foreground group-focus:text-primary/70 truncate text-[10px] font-medium italic">
                          {p.dusun || "-"} • RT {p.rt || "0"}/{p.rw || "0"}
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

      <div 
        ref={parentRef}
        className="border-border/50 bg-background relative overflow-auto rounded-xl border shadow-lg max-h-[70vh]"
      >
        <Table>
          <TableHeader className="bg-muted/30 sticky top-0 z-20 backdrop-blur-md">
            <TableRow className="flex w-full border-b">
              {currentUser?.role !== "PENGGUNA" && (
                <TableHead className="flex w-[50px] items-center justify-center">
                  <Checkbox
                    checked={displayData.length > 0 && selectedIds.size === displayData.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead className="flex w-[180px] items-center font-bold">NOP</TableHead>
              <TableHead className="flex flex-1 items-center font-bold">Nama Wajib Pajak</TableHead>
              <TableHead className="flex w-[150px] items-center font-bold">Wilayah</TableHead>
              <TableHead className="flex w-[120px] items-center justify-end font-bold">Tagihan</TableHead>
              <TableHead className="flex w-[120px] items-center font-bold">Status</TableHead>
              <TableHead className="flex w-[150px] items-center font-bold">Penarik</TableHead>
              {currentUser?.role !== "PENGGUNA" && <TableHead className="flex w-[60px] items-center"></TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            {isLoading ? (
              <TaxTableSkeleton rows={10} role={currentUser?.role} />
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
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const item = displayData[virtualRow.index];
                if (!item) return null;
                return (
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
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TaxTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={displayTotal}
        shownCount={displayData.length}
        onPageChange={(p: number) => {
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
        isAllFilteredSelected={isAllFilteredSelected}
        filters={{
          tahun: parseInt(tahun),
          q,
          dusun,
          rw,
          rt,
          penarik,
          regionStatus
        }}
        availableFilters={availableFilters}
        onSuccess={() => {
          setSelectedIds(new Set());
          setIsAllFilteredSelected(false);
        }}
      />
    </div>
  );
}
