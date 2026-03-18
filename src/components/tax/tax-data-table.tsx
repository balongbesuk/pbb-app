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

import { cn } from "@/lib/utils";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Check on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: displayData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isMobile ? 210 : 64),
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

      {/* Desktop & Mobile Mass Actions */}
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
                  Pilih seluruh <span className="text-primary font-black">{displayTotal.toLocaleString("id-ID")}</span> data sesuai filter
                </button>
              )}
            </div>
          </div>
          
          {/* Action buttons - only for ADMIN */}
          {currentUser?.role === "ADMIN" && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 hover:bg-primary/10 h-10 rounded-xl px-4 text-xs font-bold transition-all text-primary dark:bg-primary/5"
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
                    className="text-destructive focus:text-destructive flex cursor-pointer gap-2 rounded-xl px-3 py-2.5 font-bold transition-all"
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
          )}
        </div>
      )}

      {/* Unified Virtualized Container */}
      <div 
        key={isMobile ? "mobile-view" : "desktop-view"}
        ref={parentRef}
        className="border-border/50 bg-background relative overflow-auto rounded-2xl border shadow-xl max-h-[75vh] min-h-[400px]"
      >
        <div className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
          {/* Desktop Table Header (Sticky) */}
          <div className="hidden md:block sticky top-0 z-30 bg-muted border-b border-border/80">
            <div className="flex w-full items-center h-12 px-4 text-foreground font-black uppercase tracking-tight text-[11px]">
              {currentUser?.role !== "PENGGUNA" && <div className="w-[50px] shrink-0" />}
              <div className="w-[180px] shrink-0">NOP</div>
              <div className="flex-1 px-4">Nama Wajib Pajak</div>
              <div className="w-[150px] shrink-0 px-4">Wilayah</div>
              <div className="w-[120px] shrink-0 text-right px-4">Tagihan</div>
              <div className="w-[120px] shrink-0 px-4">Status</div>
              <div className="w-[150px] shrink-0 px-4">Penarik</div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium animate-pulse">Memuat Data Pajak...</p>
            </div>
          ) : displayData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground italic text-sm">
               Data pajak tidak ditemukan
            </div>
          ) : (
            rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = displayData[virtualRow.index];
              if (!item) return null;
              
              const isLunas = item.paymentStatus === "LUNAS";

              return (
                <div
                  key={item.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    padding: '8px', 
                  }}
                >
                  {/* Desktop view (md and up) */}
                  <div className="hidden md:block h-full">
                    <TaxTableRow
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
                      style={{ height: '100%' }}
                    />
                  </div>

                  {/* Mobile Card Redesign (Structured Sections) */}
                  <div className="md:hidden h-full">
                    <div 
                      onClick={() => setSelectedDetailItem(item)}
                      className={cn(
                        "group relative h-full flex flex-col bg-white dark:bg-zinc-900 border transition-all duration-300 overflow-hidden rounded-2xl shadow-sm",
                        selectedIds.has(item.id) 
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-primary/10 shadow-lg" 
                          : "border-border/60 shadow-md",
                      )}
                    >
                      {/* Section 1: Header - Identitas Objek */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/40">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-0.5">NOMOR OBJEK PAJAK</span>
                            <span className="text-[11px] font-mono font-bold text-foreground/80 tracking-tighter">
                               {item.nop}
                            </span>
                         </div>
                         <div className={cn(
                           "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                           isLunas 
                             ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
                             : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                         )}>
                           {isLunas ? "Lunas" : "Tertunggak"}
                         </div>
                      </div>

                      {/* Section 2: Body - Detail Wajib Pajak */}
                      <div className="flex-1 px-4 py-3.5 flex items-start justify-between">
                        <div className="min-w-0 space-y-1">
                          <h3 className="font-black text-[16px] text-foreground tracking-tight uppercase leading-tight truncate">
                            {item.namaWp}
                          </h3>
                          <div className="flex items-start gap-1.5 opacity-80 mt-1">
                             <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                             <p className="text-[10px] font-medium text-muted-foreground italic leading-tight line-clamp-1">
                               {item.alamatObjek || "Alamat tidak lengkap"}
                             </p>
                          </div>
                        </div>
                        
                        <div 
                          onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                          className="flex h-10 w-10 items-center justify-center -mr-2 -mt-1"
                        >
                           <Checkbox 
                             checked={selectedIds.has(item.id)} 
                             className="h-6 w-6 rounded-lg border-primary/30 bg-background shadow-sm" 
                           />
                        </div>
                      </div>

                      {/* Section 3: Data Grid - Administrasi & Lokasi */}
                      <div className="grid grid-cols-2 border-t border-border/40 divide-x divide-border/40">
                         <div className="px-4 py-3 flex flex-col justify-center">
                            <span className="text-[8px] font-black text-muted-foreground uppercase opacity-60 tracking-widest mb-0.5">TAGIHAN PAJAK</span>
                            <div className="text-lg font-black text-primary tracking-tighter flex items-baseline gap-1">
                               <span className="text-[10px]">Rp</span>
                               {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(item.ketetapan)}
                            </div>
                         </div>
                         <div className="px-4 py-3 flex flex-col justify-center overflow-hidden">
                            <span className="text-[8px] font-black text-muted-foreground uppercase opacity-60 tracking-widest mb-0.5 whitespace-nowrap">LOKASI WILAYAH</span>
                            <div className="text-[10px] font-black text-foreground/80 flex items-center gap-1 uppercase truncate">
                               <span>{item.dusun || "-"}</span>
                               <span className="text-zinc-300 mx-0.5">•</span>
                               <span className="whitespace-nowrap">RT {item.rt}/{item.rw}</span>
                            </div>
                         </div>
                      </div>

                      {/* Section 4: Footer - Alokasi Petugas */}
                      <div className="px-4 py-2 bg-muted/20 border-t border-border/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="bg-primary/10 text-primary h-6 w-6 rounded-full flex items-center justify-center border border-primary/20 text-[9px] font-black">
                              {(item.penarik?.name || "?").charAt(0).toUpperCase()}
                           </div>
                           <div className="flex items-baseline gap-2 overflow-hidden">
                             <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none">PENGAMBIL:</span>
                             <span className="text-[10px] font-black text-foreground/60 tracking-tight uppercase truncate max-w-[120px]">
                               {item.penarik?.name || "BELUM DIALOKASIKAN"}
                             </span>
                           </div>
                        </div>
                        <div className="flex h-1.5 w-1.5 rounded-full bg-primary/40" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
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
        onTransferRequest={handleTransferRequestAction}
        onAssignPenarik={handleAssignPenarik}
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
