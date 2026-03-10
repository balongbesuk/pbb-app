"use client";

import { useState } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, Loader2, UserMinus } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { updatePaymentStatus } from "@/app/actions/tax-update-actions";
import { assignPenarik, assignPenarikBulk } from "@/app/actions/tax-assign-actions";
import { sendTransferRequest } from "@/app/actions/transfer-actions";
import { toast } from "sonner";

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
  currentUser
}: {
  initialData: any[],
  total: number,
  pageSize: number,
  penariks?: any[],
  availableFilters?: { dusun: string[], rw: string[], rt: string[], penarik: { id: string, name: string }[], dusunRefs?: string[] },
  currentUser?: { id: string, name?: string | null, email?: string | null, role: string }
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

  const { data: queryData, isLoading, isFetching } = useQuery({
    queryKey: ["tax-data", { q, page, tahun, dusun, rw, rt, penarik }],
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);
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
  }, [q, dusun, rw, rt, penarik]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) params.set("q", search); else params.delete("q");
    if (filterDusun && filterDusun !== "all") params.set("dusun", filterDusun); else params.delete("dusun");
    if (filterRw && filterRw !== "all") params.set("rw", filterRw); else params.delete("rw");
    if (filterRt && filterRt !== "all") params.set("rt", filterRt); else params.delete("rt");
    if (filterPenarik && filterPenarik !== "all") params.set("penarik", filterPenarik); else params.delete("penarik");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") params.set(key, value); else params.delete(key);
    params.set("page", "1");
    if (key === "dusun") setFilterDusun(value);
    if (key === "rw") setFilterRw(value);
    if (key === "rt") setFilterRt(value);
    if (key === "penarik") setFilterPenarik(value);
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

  const handleUpdateStatus = async (id: string, status: "LUNAS" | "BELUM_LUNAS" | "TIDAK_TERBIT") => {
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

  const handleTransferRequestAction = async (taxId: number, receiverId: string, type: "GIVE" | "TAKE") => {
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
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  return (
    <div className="space-y-4 pt-4">
      <TaxTableFilters
        search={search} onSearchChange={setSearch} onSearchSubmit={handleSearch}
        filterDusun={filterDusun} onDusunChange={(v) => handleFilterChange("dusun", v)}
        filterRw={filterRw} onRwChange={(v) => handleFilterChange("rw", v)}
        filterRt={filterRt} onRtChange={(v) => handleFilterChange("rt", v)}
        filterPenarik={filterPenarik} onPenarikChange={(v) => handleFilterChange("penarik", v)}
        availableFilters={availableFilters}
        onPrint={handlePrint}
        showPrint={currentUser?.role !== "PENGGUNA"}
        isFetching={isFetching && !isLoading}
      />

      {selectedIds.size > 0 && currentUser?.role !== "PENGGUNA" && (
        <div className="bg-primary/5 border border-primary/20 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-top-2 shadow-sm">
          <span className="text-sm font-bold text-primary px-2">{selectedIds.size} data terpilih</span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="sm" className="font-bold shadow-md" disabled={isAssigning}>
                  {isAssigning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <User className="w-4 h-4 mr-2" />}
                  Alokasikan ({selectedIds.size})
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-[240px]">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-bold text-primary">Pilih Penarik Tujuan</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive font-bold cursor-pointer gap-2"
                onClick={() => handleBulkAssign(null)}
              >
                <UserMinus className="w-4 h-4" /> Kosongkan Penarik
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {penariks.map(p => (
                  <DropdownMenuItem key={p.id} onClick={() => handleBulkAssign(p.id)} className="cursor-pointer flex items-center gap-2 py-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{p.name.charAt(0)}</div>
                    <div className="flex flex-col truncate">
                      <span className="font-semibold text-sm truncate">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{p.dusun || "-"} RT {p.rt || "0"}/RW {p.rw || "0"}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="rounded-xl border border-border/50 overflow-hidden bg-background shadow-lg">
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
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memuat data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-muted-foreground text-sm italic">Data tidak ditemukan</TableCell>
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
        currentPage={currentPage} totalPages={totalPages} total={displayTotal} shownCount={displayData.length}
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
      />
    </div>
  );
}
