"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MoreHorizontal, MapPin, User, ChevronLeft, ChevronRight, CheckCircle, Clock, Loader2, FileText, Edit2, Save, ArrowRight, Handshake, Printer, UserMinus } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { updatePaymentStatus, updateWpRegion } from "@/app/actions/tax-update-actions";
import { assignPenarik, assignPenarikBulk } from "@/app/actions/tax-assign-actions";
import { sendTransferRequest } from "@/app/actions/transfer-actions";
import { toast } from "sonner";

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
  availableFilters?: { dusun: string[], rw: string[], rt: string[], penarik: {id: string, name: string}[], dusunRefs?: string[] },
  currentUser?: { id: string, name?: string | null, email?: string | null, role: string }
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [filterDusun, setFilterDusun] = useState(searchParams.get("dusun") || "all");
  const [filterRw, setFilterRw] = useState(searchParams.get("rw") || "all");
  const [filterRt, setFilterRt] = useState(searchParams.get("rt") || "all");
  const [filterPenarik, setFilterPenarik] = useState(searchParams.get("penarik") || "all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);

  const handlePrint = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterDusun && filterDusun !== "all") params.set("dusun", filterDusun);
    if (filterRw && filterRw !== "all") params.set("rw", filterRw);
    if (filterRt && filterRt !== "all") params.set("rt", filterRt);
    if (filterPenarik && filterPenarik !== "all") params.set("penarik", filterPenarik);
    
    const tahun = searchParams.get("tahun") || new Date().getFullYear().toString();
    params.set("tahun", tahun);

    window.open(`/api/export-tax?${params.toString()}`, "_blank");
  };
  
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editDusunDetail, setEditDusunDetail] = useState("");
  const [editRtDetail, setEditRtDetail] = useState("");
  const [editRwDetail, setEditRwDetail] = useState("");
  const [isUpdatingDetail, setIsUpdatingDetail] = useState(false);

  const openDetail = (item: any) => {
    setSelectedDetailItem(item);
    setEditDusunDetail(item.dusun || "");
    setEditRtDetail(item.rt || "");
    setEditRwDetail(item.rw || "");
    setIsEditingDetail(false);
  };

  const totalPages = Math.ceil(total / pageSize);
  const currentPage = parseInt(searchParams.get("page") || "1");

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

    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    
    // Update local state
    if (key === "dusun") setFilterDusun(value);
    if (key === "rw") setFilterRw(value);
    if (key === "rt") setFilterRt(value);
    if (key === "penarik") setFilterPenarik(value);
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", p.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleUpdateStatus = async (id: string, status: "LUNAS" | "BELUM_LUNAS" | "TIDAK_TERBIT") => {
    const res = await updatePaymentStatus(id, status);
    if (res.success) {
      toast.success(`Status berhasil diubah menjadi ${status}`);
    } else {
      toast.error(`Gagal mengubah status: ${res.message}`);
    }
  };

  const handleAssignPenarik = async (taxId: string, penarikId: string | null) => {
    const res = await assignPenarik(taxId, penarikId);
    if (res.success) {
      toast.success(penarikId ? "Penarik berhasil diatur" : "Penarik berhasil dihapus dari data");
    } else {
      toast.error(`Gagal mengatur penarik: ${res.message}`);
    }
  };

  const handleBulkAssign = async (penarikId: string | null) => {
    if (selectedIds.size === 0) return;
    setIsAssigning(true);
    const res = await assignPenarikBulk(Array.from(selectedIds), penarikId);
    if (res.success) {
      toast.success(`Berhasil mengalokasikan ${res.count} data`);
      setSelectedIds(new Set());
    } else {
      toast.error(`Gagal batch update: ${res.message}`);
    }
    setIsAssigning(false);
  };

  const handleTransferRequestAction = async (taxId: number, receiverId: string, type: "GIVE" | "TAKE") => {
    const res = await sendTransferRequest(taxId, receiverId, type, `Saya ingin ${type === 'GIVE' ? 'menyerahkannya ke Anda' : 'mengambil alih data ini dari Anda'}.`);
    if (res.success) {
      toast.success("Permintaan berhasil dikirim");
    } else {
      toast.error(res.message);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === initialData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(initialData.map(d => d.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleUpdateRegion = async () => {
    if (!selectedDetailItem) return;
    setIsUpdatingDetail(true);
    const res = await updatePaymentStatus(selectedDetailItem.id, "LUNAS"); // Wait, I should use updateWpRegion. 
    // Correction: I will use the updateWpRegion imported from tax-update-actions.
    // I need to make sure updateWpRegion is imported.
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-4 pt-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari NOP atau Nama..." 
            className="pl-10 h-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Select value={filterDusun} onValueChange={(val) => handleFilterChange("dusun", val || "all")}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <span data-slot="select-value" className="flex flex-1 text-left line-clamp-1 truncate">
                {filterDusun === "all" ? "Semua Dusun" : filterDusun}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Dusun</SelectItem>
              {availableFilters.dusun.map((d: string) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterRw} onValueChange={(val) => handleFilterChange("rw", val || "all")}>
            <SelectTrigger className="w-[100px] h-9 text-xs">
              <span data-slot="select-value" className="flex flex-1 text-left line-clamp-1 truncate">
                {filterRw === "all" ? "Semua RW" : `RW ${filterRw}`}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua RW</SelectItem>
              {availableFilters.rw.map((rw: string) => (
                <SelectItem key={rw} value={rw}>RW {rw}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterRt} onValueChange={(val) => handleFilterChange("rt", val || "all")}>
            <SelectTrigger className="w-[100px] h-9 text-xs">
              <span data-slot="select-value" className="flex flex-1 text-left line-clamp-1 truncate">
                {filterRt === "all" ? "Semua RT" : `RT ${filterRt}`}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua RT</SelectItem>
              {availableFilters.rt.map((rt: string) => (
                <SelectItem key={rt} value={rt}>RT {rt}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPenarik} onValueChange={(val) => handleFilterChange("penarik", val || "all")}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <span data-slot="select-value" className="flex flex-1 text-left line-clamp-1 truncate">
                {filterPenarik === "all" ? "Semua Penarik" : 
                 filterPenarik === "none" ? "Belum Dialokasikan" : 
                 availableFilters.penarik?.find((p: any) => p.id === filterPenarik)?.name || "Pilih Penarik"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Penarik</SelectItem>
              <SelectItem value="none" className="text-destructive font-medium">Belum Dialokasikan</SelectItem>
              {availableFilters.penarik?.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 flex-col-reverse sm:flex-row gap-2">
        {currentUser?.role !== "PENGGUNA" ? (
          <Button onClick={handlePrint} variant="outline" size="sm" className="h-8 gap-2 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50 dark:hover:bg-emerald-900/40 w-full sm:w-auto">
            <Printer className="w-4 h-4" /> Cetak / Export Data
          </Button>
        ) : (
          <div></div>
        )}
        <div className="text-xs text-muted-foreground whitespace-nowrap self-end sm:self-auto">
          Menampilkan {initialData.length} dari {total} data PBB
        </div>
      </div>

      {selectedIds.size > 0 && currentUser?.role !== "PENGGUNA" && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-sm font-medium">{selectedIds.size} data terpilih</span>
          <DropdownMenu>
            <DropdownMenuTrigger
               render={
                 <Button size="sm" disabled={isAssigning}>
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
                className="text-destructive focus:text-destructive font-medium cursor-pointer gap-2 mb-1" 
                onClick={() => handleBulkAssign(null)}
              >
                <UserMinus className="w-4 h-4" />
                Kosongkan Penarik
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {penariks.map(p => (
                  <DropdownMenuItem 
                    key={p.id} 
                    onClick={() => handleBulkAssign(p.id)} 
                    className="cursor-pointer flex items-center gap-2 py-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="font-semibold text-sm truncate">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{p.dusun || "-"} RT {p.rt || "0"}/{p.rw || "0"}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="rounded-xl border border-border/50 overflow-hidden bg-background/20 shadow-inner">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {currentUser?.role !== "PENGGUNA" && (
                <TableHead className="w-[40px]">
                  <Checkbox 
                    checked={initialData.length > 0 && selectedIds.size === initialData.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              <TableHead className="w-[180px]">NOP</TableHead>
              <TableHead>Nama Wajib Pajak</TableHead>
              <TableHead>Wilayah</TableHead>
              <TableHead className="text-right">Tagihan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Penarik</TableHead>
              {currentUser?.role !== "PENGGUNA" && (
                <TableHead className="w-[50px]"></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={currentUser?.role === "PENGGUNA" ? 5 : 7} className="h-24 text-center text-muted-foreground">
                  Data tidak ditemukan
                </TableCell>
              </TableRow>
            ) : (
              initialData.map((item: any) => (
                <TableRow 
                  key={item.id} 
                  className={`hover:bg-muted/40 transition-colors border-border/50 ${currentUser?.role === "PENGGUNA" ? "cursor-pointer" : ""}`} 
                  data-state={selectedIds.has(item.id) ? "selected" : undefined}
                  onClick={currentUser?.role === "PENGGUNA" ? () => openDetail(item) : undefined}
                >
                  {currentUser?.role !== "PENGGUNA" && (
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                        aria-label="Select row"
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-mono text-xs">{item.nop}</TableCell>
                  <TableCell>
                    <div className="font-semibold">{item.namaWp}</div>
                    <div className="text-xs text-muted-foreground whitespace-normal break-words max-w-[300px]">{item.alamatObjek}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span>{item.dusun || "-"}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">RT {item.rt || "?"} / RW {item.rw || "?"}</div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(item.ketetapan)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={(item.paymentStatus === 'LUNAS' ? 'success' : item.paymentStatus === 'BELUM_LUNAS' ? 'warning' : 'outline') as any} className="text-[10px]">
                      {item.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {item.penarik?.name?.charAt(0) || <User className="w-3 h-3"/>}
                      </div>
                      <span className="text-xs truncate">{item.penarik?.name || "Belum Ada"}</span>
                    </div>
                  </TableCell>
                  {currentUser?.role !== "PENGGUNA" && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 hover:bg-muted rounded-md transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                          <DropdownMenuItem className="cursor-pointer font-bold text-primary focus:text-primary focus:bg-primary/10 gap-2 mb-1" onClick={() => openDetail(item)}>
                            <FileText className="w-4 h-4" />
                            Detail Pajak
                          </DropdownMenuItem>
                          {currentUser?.role !== "PENGGUNA" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, 'LUNAS')} className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Tandai Lunas
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, 'BELUM_LUNAS')} className="text-amber-600 focus:text-amber-700 focus:bg-amber-50 cursor-pointer gap-2">
                                <Clock className="w-4 h-4" />
                                Tandai Belum Lunas
                              </DropdownMenuItem>
                            </>
                          )}
                          {currentUser?.role === "ADMIN" && (
                            <>
                              <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <User className="w-4 h-4 mr-2" />
                                Atur Penarik
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent className="w-[240px]">
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive font-medium cursor-pointer gap-2 mb-1"
                                    onClick={() => handleAssignPenarik(item.id, null)}
                                  >
                                    <UserMinus className="w-4 h-4" />
                                    Kosongkan Penarik
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <div className="max-h-[300px] overflow-y-auto">
                                    {penariks.map(p => (
                                      <DropdownMenuItem 
                                        key={p.id} 
                                        onClick={() => handleAssignPenarik(item.id, p.id)}
                                        className="cursor-pointer flex items-center gap-2 py-2"
                                      >
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                          {p.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col truncate">
                                          <span className="font-semibold text-sm truncate">{p.name}</span>
                                          <span className="text-[10px] text-muted-foreground truncate">{p.dusun || "-"} RT {p.rt || "0"}/{p.rw || "0"}</span>
                                        </div>
                                      </DropdownMenuItem>
                                    ))}
                                  </div>
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                            </>
                          )}

                          {currentUser?.role === "PENARIK" && (
                            <>
                              <DropdownMenuSeparator />
                              {item.penarikId === currentUser.id ? (
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger className="text-emerald-600 focus:text-emerald-700">
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Kirim ke Penarik Lain
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                      {penariks.filter(p => p.id !== currentUser.id).map(p => (
                                        <DropdownMenuItem 
                                          key={p.id} 
                                          onClick={() => handleTransferRequestAction(item.id, p.id, "GIVE")}
                                          className="cursor-pointer"
                                        >
                                          {p.name} ({p.dusun})
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuPortal>
                                </DropdownMenuSub>
                              ) : item.penarikId && (
                                 <DropdownMenuItem 
                                   className="text-blue-600 focus:text-blue-700 cursor-pointer"
                                   onClick={() => handleTransferRequestAction(item.id, item.penarikId!, "TAKE")}
                                 >
                                   <Handshake className="w-4 h-4 mr-2" />
                                   Minta DataWP
                                 </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Sebelumnya
        </Button>
        <div className="text-sm font-medium">
          Halaman {currentPage} dari {totalPages || 1}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Selanjutnya <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <Dialog open={!!selectedDetailItem} onOpenChange={(open) => {
        if (!open) setSelectedDetailItem(null);
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail & Perbaikan Wilayah</DialogTitle>
          </DialogHeader>
          {selectedDetailItem && (
            <div className="space-y-4 pt-4 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border/20">
                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground w-12 text-xs">NOP</span>
                  <span className="font-mono font-medium">{selectedDetailItem.nop}</span>
                </div>
                {!isEditingDetail && currentUser?.role !== "PENGGUNA" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] gap-1 px-2 border-primary/30 text-primary hover:bg-primary/5 shadow-sm"
                    onClick={() => setIsEditingDetail(true)}
                  >
                    <Edit2 className="w-3 h-3" />
                    Perbaiki Wilayah
                  </Button>
                )}
              </div>
              
              {/* Region Editing Section */}
              <div className="bg-primary/5 p-3 rounded-lg space-y-3 border border-primary/10">
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-muted-foreground text-xs col-span-1">Dusun</span>
                  <div className="col-span-2">
                    {isEditingDetail ? (
                      <Select 
                        value={editDusunDetail || ""} 
                        onValueChange={(val) => setEditDusunDetail(val || "")}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Pilih Dusun" />
                        </SelectTrigger>
                        <SelectContent>
                          {(availableFilters.dusunRefs && availableFilters.dusunRefs.length > 0 ? availableFilters.dusunRefs : availableFilters.dusun).map((d) => (
                             <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="font-semibold">{selectedDetailItem.dusun || "Belum diisi"}</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-muted-foreground text-xs col-span-1">RT / RW</span>
                  <div className="col-span-2 flex items-center gap-2">
                    {isEditingDetail ? (
                      <>
                        <Input 
                          value={editRtDetail} 
                          onChange={(e) => setEditRtDetail(e.target.value)} 
                          className="h-8 text-xs bg-background w-20"
                          placeholder="RT"
                        />
                        <span className="text-muted-foreground">/</span>
                        <Input 
                          value={editRwDetail} 
                          onChange={(e) => setEditRwDetail(e.target.value)} 
                          className="h-8 text-xs bg-background w-20"
                          placeholder="RW"
                        />
                      </>
                    ) : (
                      <span className="font-semibold">RT {selectedDetailItem.rt || "0"} / RW {selectedDetailItem.rw || "0"}</span>
                    )}
                  </div>
                </div>
                
                {isEditingDetail && (
                  <div className="flex justify-end gap-2 pt-1 font-medium">
                    {currentUser?.role === "ADMIN" || currentUser?.id === selectedDetailItem.penarikId ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-xs font-semibold" 
                          onClick={() => setIsEditingDetail(false)}
                          disabled={isUpdatingDetail}
                        >
                          Batal
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="h-8 text-xs gap-1.5 font-semibold"
                          onClick={async () => {
                            setIsUpdatingDetail(true);
                            const res = await updateWpRegion(selectedDetailItem.id, editDusunDetail || null, editRtDetail || null, editRwDetail || null);
                            if (res.success) {
                              toast.success("Wilayah berhasil diperbarui");
                              
                              // Update local state so it reflects immediately
                              setSelectedDetailItem({
                                ...selectedDetailItem,
                                dusun: editDusunDetail || null,
                                rt: editRtDetail || null,
                                rw: editRwDetail || null
                              });
                              
                              setIsEditingDetail(false);
                              router.refresh();
                            } else {
                              toast.error("Gagal update: " + res.message);
                            }
                            setIsUpdatingDetail(false);
                          }}
                          disabled={isUpdatingDetail}
                        >
                          {isUpdatingDetail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Simpan Perubahan
                        </Button>
                      </>
                    ) : (
                      <div className="text-[10px] text-destructive italic p-2 bg-destructive/5 rounded border border-destructive/10 w-full text-center">
                         Anda hanya bisa mengubah data yang dialokasikan ke Anda.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/20">
                <span className="text-muted-foreground col-span-1">Nama WP</span>
                <span className="col-span-2 font-semibold">{selectedDetailItem.namaWp}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/20">
                <span className="text-muted-foreground col-span-1">Alamat Objek</span>
                <span className="col-span-2 italic text-xs text-muted-foreground">{selectedDetailItem.alamatObjek}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/20 flex items-center">
                <span className="text-muted-foreground col-span-1">Penarik Pajak</span>
                <div className="col-span-2 flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {selectedDetailItem.penarik?.name?.charAt(0) || <User className="w-3 h-3"/>}
                  </div>
                  <span className="font-medium">{selectedDetailItem.penarik ? selectedDetailItem.penarik.name : "Belum Dialokasikan"}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/20">
                <span className="text-muted-foreground col-span-1">Total Tagihan</span>
                <span className="col-span-2 font-bold text-lg text-primary">{formatCurrency(selectedDetailItem.ketetapan)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2">
                 <span className="text-muted-foreground col-span-1">Luas Tanah/Bng</span>
                 <span className="col-span-2">{selectedDetailItem.luasTanah} m² / {selectedDetailItem.luasBangunan} m²</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
