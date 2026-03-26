"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Loader2 } from "lucide-react";

import { updatePaymentStatus, bulkUpdatePaymentStatus, syncBapendaByFilter } from "@/app/actions/tax-update-actions";
import { 
  assignPenarik, 
  assignPenarikBulk, 
  assignPenarikByFilter 
} from "@/app/actions/tax-assign-actions";
import { sendTransferRequest } from "@/app/actions/transfer-actions";
import { toast } from "sonner";
import { BulkRegionDialog } from "./table/bulk-region-dialog";

import { cn, formatCurrency } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence } from "framer-motion";

// Sub-components
import { TaxTableRow } from "./table/tax-table-row";
import { TaxTableFilters } from "./table/tax-table-filters";
import { TaxTablePagination } from "./table/tax-table-pagination";
import { TaxDetailDialog } from "./table/tax-detail-dialog";
import { TAX_TABLE_WIDTHS } from "@/constants/table-layout";
// This comment is added to force a refresh on the dashboard page.
import { TaxBulkActions } from "./table/tax-bulk-actions";
import { TaxMobileCard } from "./table/tax-mobile-card";
import { TaxTableSkeleton } from "./table/tax-skeleton";

// Hooks
import { useTaxFilters } from "@/hooks/use-tax-filters";
import { useTaxSelection } from "@/hooks/use-tax-selection";


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
  const queryClient = useQueryClient();
  const {
    q, setQ,
    page, setPage,
    tahun,
    dusun, setDusun,
    rw, setRw,
    rt, setRt,
    penarik, setPenarik,
    regionStatus, setRegionStatus,
    paymentStatus, setPaymentStatus,
  } = useTaxFilters();

  // Derive the initial filter state from URL params to detect if we're on the default view
  const isDefaultFilter = !q && page === 1 && (!dusun || dusun === "all") && (!rw || rw === "all") && (!rt || rt === "all") && (!penarik || penarik === "all") && (!regionStatus || regionStatus === "all") && (!paymentStatus || paymentStatus === "all");

  const {
    data: queryData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["tax-data", { q, page, tahun, dusun, rw, rt, penarik, regionStatus, paymentStatus }],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: q || "",
        page: page.toString(),
        tahun: tahun || "",
        dusun: dusun || "all",
        rw: rw || "all",
        rt: rt || "all",
        penarik: penarik || "all",
        regionStatus: regionStatus || "all",
        paymentStatus: paymentStatus || "all",
      });
      const res = await fetch(`/api/tax?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      return res.json();
    },
    // Only use server-rendered initialData when on the default (unfiltered) view
    // so that changing a filter always triggers a fresh fetch
    initialData: isDefaultFilter ? { data: initialData, total: total, page: 1, pageSize } : undefined,
    staleTime: 0, // Always refetch when filters change
    placeholderData: (prev) => prev, // Keep previous data while fetching (smooth UX)
  });

  const displayData = queryData?.data || [];
  const displayTotal = queryData?.total || 0;

  const isPenarik = currentUser?.role === "PENARIK";
  const ownPenarikFilterActive = !isPenarik || penarik === currentUser?.id;

  const switchToOwnAssignments = () => {
    if (!isPenarik || !currentUser?.id) return;
    setPenarik(currentUser.id);
    setPage(1);
    toast.info("Checklist dialihkan ke Tugas Saya agar hanya data milik Anda yang bisa dipilih.");
  };

  const {
    selectedIds,
    selectedAmounts,
    isAllFilteredSelected,
    setIsAllFilteredSelected,
    selectedSum,
    resetSelection,
    isRowSelectable,
    getSelectionHint,
    toggleSelectAll,
    toggleSelect,
  } = useTaxSelection({
    displayData,
    currentUser,
    isPenarik,
    ownPenarikFilterActive,
    onSwitchToOwnAssignments: switchToOwnAssignments,
  });

  const [isAssigning, setIsAssigning] = useState(false);
  const [isBulkRegionOpen, setIsBulkRegionOpen] = useState(false);

  const [selectedDetailItem, setSelectedDetailItem] = useState<TaxDataItem | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: displayData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isMobile ? 240 : 64),
    overscan: 25,
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [isMobile, rowVirtualizer]);



  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handlePrint = () => {
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    if (dusun && dusun !== "all") params.set("dusun", dusun);
    if (rw && rw !== "all") params.set("rw", rw);
    if (rt && rt !== "all") params.set("rt", rt);
    if (penarik && penarik !== "all") params.set("penarik", penarik);
    params.set("tahun", tahun || new Date().getFullYear().toString());
    window.open(`/api/export-tax?${params.toString()}`, "_blank");
  };



  const handleBulkAssign = async (penarikId: string | null) => {
    setIsAssigning(true);
    let res;
    if (isAllFilteredSelected) {
      res = await assignPenarikByFilter({
        tahun: parseInt(tahun || "0"), q: q || undefined, dusun: dusun || undefined, rw: rw || undefined, rt: rt || undefined, penarik: penarik || undefined, regionStatus: regionStatus || undefined
      }, penarikId);
    } else {
      res = await assignPenarikBulk(Array.from(selectedIds), penarikId);
    }

    if (res.success) {
      toast.success(`Berhasil mengalokasikan ${res.count} data`);
      resetSelection();
      queryClient.invalidateQueries({ queryKey: ["tax-data"] });
    } else toast.error(res.message);
    setIsAssigning(false);
  };

  const handleBulkPayment = async (status: PaymentStatus) => {
    setIsAssigning(true);
    const res = await bulkUpdatePaymentStatus(Array.from(selectedIds), status);
    if (res.success) {
      toast.success(`Berhasil mengupdate ${res.count} data`);
      resetSelection();
      queryClient.invalidateQueries({ queryKey: ["tax-data"] });
    } else toast.error(res.message);
    setIsAssigning(false);
  };

  const handleBulkBapendaSync = async () => {
    setIsAssigning(true);
    const toastId = toast.loading(`Menyiapkan sinkronisasi massal...`);
    try {
      let ids: any[] = [];
      if (isAllFilteredSelected) {
        toast.loading(`Mengambil data filter...`, { id: toastId });
        const res = await syncBapendaByFilter({
           tahun: parseInt(tahun || "0"), q: q || undefined, dusun: dusun || undefined, rw: rw || undefined, rt: rt || undefined, penarik: penarik || undefined, regionStatus: regionStatus || undefined, paymentStatus: paymentStatus || undefined
        });
        if (!res.success) throw new Error(res.message);
        ids = res.data || [];
      } else {
        ids = Array.from(selectedIds).map(id => {
          const item = displayData.find((d: any) => d.id === id);
          return { id, nop: item?.nop, tahun: item?.tahun };
        });
      }

      const totalSyncItems = ids.length;
      if (totalSyncItems === 0) {
        toast.dismiss(toastId);
        setIsAssigning(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < ids.length; i++) {
        const item = ids[i];
        if (!item?.nop) continue;
        
        if (i % 5 === 0) {
          toast.loading(`Sinkronisasi: ${i+1}/${totalSyncItems} data...`, { id: toastId });
        }

        try {
          const res = await fetch("/api/check-bapenda", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nop: item.nop, tahun: item.tahun }),
          });
          const data = await res.json();
          if (data.isPaid) successCount++;
          else failCount++;
        } catch (e) { failCount++; }
        
        await new Promise(r => setTimeout(r, 400));
      }

      toast.success(`Selesai: ${successCount} Lunas, ${failCount} Tetap.`, { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["tax-data"] });
      resetSelection();
    } catch (error: any) {
      toast.error(error.message || "Gagal sinkronisasi", { id: toastId });
    } finally { setIsAssigning(false); }
  };

  return (
    <div className="space-y-4 pt-4">
      <TaxTableFilters
        search={q || ""}
        onSearchChange={setQ}
        onSearchSubmit={handleSearch}
        filterDusun={dusun || "all"}
        onDusunChange={setDusun}
        filterRw={rw || "all"}
        onRwChange={setRw}
        filterRt={rt || "all"}
        onRtChange={setRt}
        filterPenarik={penarik || "all"}
        onPenarikChange={setPenarik}
        filterRegionStatus={regionStatus || "all"}
        onRegionStatusChange={setRegionStatus}
        filterPaymentStatus={paymentStatus || "all"}
        onPaymentStatusChange={setPaymentStatus}
        availableFilters={availableFilters}
        onPrint={handlePrint}
        showPrint={currentUser?.role !== "PENGGUNA"}
        isFetching={isFetching && !isLoading}
        currentUser={currentUser}
      />

      <TaxBulkActions
        selectedCount={selectedIds.size}
        totalFiltered={displayTotal}
        isAllFilteredSelected={isAllFilteredSelected}
        currentUser={currentUser}
        penariks={penariks}
        isAssigning={isAssigning}
        selectedSum={selectedSum}
        selectedDetails={selectedAmounts}
        onToggleSelectAll={toggleSelectAll}
        onSelectAllFiltered={() => setIsAllFilteredSelected(true)}
        onBulkRegion={() => setIsBulkRegionOpen(true)}
        onBulkSync={handleBulkBapendaSync}
        onBulkAssign={handleBulkAssign}
        onBulkPayment={handleBulkPayment}
        onRemoveItem={toggleSelect}
      />

      <div 
        ref={parentRef}
        className="border-border/50 bg-background relative overflow-auto rounded-2xl border shadow-xl max-h-[75vh] min-h-[400px]"
      >
        {isLoading ? (
          <TaxTableSkeleton isMobile={isMobile} />
        ) : (
          <div className={TAX_TABLE_WIDTHS.minContainerWidth}>
            {/* Desktop Table Header */}
            <div className="hidden md:flex sticky top-0 z-30 bg-muted/80 backdrop-blur-md border-b border-border/80 w-full items-center h-12 px-4 text-foreground font-black uppercase tracking-tight text-[11px]">
              {currentUser?.role !== "PENGGUNA" && <div className={TAX_TABLE_WIDTHS.checkbox} />}
              <div className={TAX_TABLE_WIDTHS.nop}>NOP</div>
              <div className={TAX_TABLE_WIDTHS.wpInfo + " px-4"}>Nama Wajib Pajak</div>
              <div className={TAX_TABLE_WIDTHS.wilayah + " px-4"}>Wilayah</div>
              <div className={TAX_TABLE_WIDTHS.tagihan + " px-4 text-right"}>Tagihan</div>
              <div className={TAX_TABLE_WIDTHS.status + " px-4"}>Status</div>
              <div className={TAX_TABLE_WIDTHS.penarik + " px-4 text-center"}>Penarik</div>
            </div>

            <div className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              {displayData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-4">
                   <div className="bg-muted p-4 rounded-full">
                     <Loader2 className="h-8 w-8 text-muted-foreground/50" />
                   </div>
                   <p className="italic text-sm font-medium">Data pajak tidak ditemukan</p>
                </div>
              ) : (
                rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const item = displayData[virtualRow.index];
                  if (!item) return null;
                  
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
                        padding: isMobile ? '10px 12px' : '0px', 
                      }}
                    >
                      {isMobile ? (
                        <TaxMobileCard
                          item={item}
                          selected={selectedIds.has(item.id)}
                          onToggle={toggleSelect}
                          onOpenDetail={setSelectedDetailItem}
                          isSelectable={isRowSelectable(item)}
                          selectionHint={getSelectionHint(item)}
                          isPengguna={currentUser?.role === "PENGGUNA"}
                        />
                      ) : (
                        <TaxTableRow
                          item={item}
                          selected={selectedIds.has(item.id)}
                          onToggle={toggleSelect}
                          onOpenDetail={setSelectedDetailItem}
                          role={currentUser?.role || "PENGGUNA"}
                          selectionDisabled={!isRowSelectable(item)}
                          selectionHint={getSelectionHint(item)}
                          style={{ height: '100%' }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <TaxTablePagination
        currentPage={page}
        totalPages={Math.ceil(displayTotal / pageSize)}
        total={displayTotal}
        onPageChange={setPage}
        label="N.O.P"
      />

      <TaxDetailDialog
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        availableFilters={availableFilters}
        currentUser={currentUser}
        onUpdateStatus={async (id, status) => {
          const res = await updatePaymentStatus(id, status);
          if (res.success) {
            toast.success("Status diperbarui");
            queryClient.invalidateQueries({ queryKey: ["tax-data"] });
            setSelectedDetailItem(null);
          } else toast.error(res.message);
        }}
        onTransferRequest={async (taxId, receiverId, type) => {
          const res = await sendTransferRequest(taxId, receiverId, type);
          if (res.success) {
            toast.success("Permintaan dikirim");
          } else toast.error(res.message);
        }}
        onAssignPenarik={async (id, pId) => {
          const res = await assignPenarik(id.toString(), pId);
          if (res.success) {
            toast.success("Penarik diatur");
            queryClient.invalidateQueries({ queryKey: ["tax-data"] });
          } else toast.error(res.message);
        }}
      />

      <BulkRegionDialog
        open={isBulkRegionOpen}
        onOpenChange={setIsBulkRegionOpen}
        selectedIds={Array.from(selectedIds)}
        isAllFilteredSelected={isAllFilteredSelected}
        filters={{
          tahun: parseInt(tahun || "0"), q: q || undefined, dusun: dusun || undefined, rw: rw || undefined, rt: rt || undefined
        }}
        availableFilters={availableFilters}
        onSuccess={() => {
          resetSelection();
          queryClient.invalidateQueries({ queryKey: ["tax-data"] });
        }}
      />
    </div>
  );
}
