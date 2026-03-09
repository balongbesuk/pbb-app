"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus, CheckSquare, ChevronRight, ChevronLeft } from "lucide-react";
import { getWpByPenarik } from "@/app/actions/tax-update-actions";
import { assignPenarikBulk } from "@/app/actions/tax-assign-actions";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";

interface PenarikWpDialogProps {
  penarikId: string | null;
  penarikName: string;
  tahun: number;
  count: number;
  allPenariks: any[];
  paymentStatus?: "LUNAS" | "BELUM_LUNAS" | "TIDAK_TERBIT";
  children?: React.ReactNode;
  currentUser?: any;
}

export function PenarikWpDialog({ penarikId, penarikName, tahun, count, allPenariks, paymentStatus, children, currentUser }: PenarikWpDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Pagination stats
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 50;

  const fetchPage = async (p: number, isInitial = false) => {
    setLoading(true);
    const res = await getWpByPenarik(penarikId, tahun, p, pageSize, paymentStatus);
    if (res.success && res.data) {
      if (isInitial) {
        setData(res.data);
      } else {
        setData(prev => [...prev, ...res.data]);
      }
      setTotal(res.total || 0);
      setHasMore(data.length + res.data.length < (res.total || 0));
    } else {
      toast.error("Gagal mengambil data Wajib Pajak");
    }
    setLoading(false);
  };

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setPage(1);
      await fetchPage(1, true);
    } else {
      setSelectedIds(new Set());
      setData([]);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(d => d.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkAssign = async (targetPenarikId: string | null) => {
    if (selectedIds.size === 0) return;
    
    setIsAssigning(true);
    const res = await assignPenarikBulk(Array.from(selectedIds), targetPenarikId);
    
    if (res.success) {
      toast.success(`Berhasil memindahkan ${res.count} data wp`);
      
      // Update local state by removing assigned items if they don't belong here anymore
      // (Unless we are in the same penarik, which wouldn't make sense to re-assign to same)
      if (targetPenarikId !== penarikId) {
        setData(data.filter(item => !selectedIds.has(item.id)));
      }
      
      setSelectedIds(new Set());
    } else {
      toast.error(`Gagal alokasi: ${res.message}`);
    }
    setIsAssigning(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger
        render={
          children ? (
             <button type="button" className="p-0 border-none bg-transparent cursor-pointer appearance-none outline-none">
               {children}
             </button>
          ) : (
            <Button variant="link" className="p-0 h-auto font-bold text-primary hover:text-primary/80">
              {count}
            </Button>
          )
        }
      />
      <DialogContent className="max-w-[95vw] lg:max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Kelola Data WP - {penarikName} 
            {paymentStatus === "LUNAS" && " (Lunas)"}
            {paymentStatus === "BELUM_LUNAS" && " (Belum Lunas)"}
          </DialogTitle>
        </DialogHeader>

        {!loading && data.length > 0 && currentUser?.role !== "PENGGUNA" && (
          <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 p-3 bg-primary/5 rounded-lg border border-primary/20 gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={data.length > 0 && selectedIds.size === data.length}
                onCheckedChange={toggleSelectAll}
                id="select-all-penarik"
              />
              <label htmlFor="select-all-penarik" className="text-sm font-medium cursor-pointer">
                Pilih Semua ({selectedIds.size}/{data.length})
              </label>
            </div>
            
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button size="sm" disabled={isAssigning} className="gap-2">
                        {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        Tentukan Penarik Baru
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem 
                      className="text-destructive font-medium"
                      onClick={() => handleBulkAssign(null)}
                    >
                      Kosongkan Penarik
                    </DropdownMenuItem>
                    {allPenariks.filter(p => p.id !== penarikId).map(p => (
                      <DropdownMenuItem key={p.id} onClick={() => handleBulkAssign(p.id)}>
                        {p.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto mt-2 pr-2">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground pt-12">
              <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Tidak ada data ditemukan di kategori ini.</p>
              <p className="text-xs">Mungkin data sudah dipindahkan ke penarik lain.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[40px] text-center">
                      {currentUser?.role !== "PENGGUNA" ? "#" : "No."}
                    </TableHead>
                    <TableHead className="w-[150px]">NOP</TableHead>
                    <TableHead>Nama Wajib Pajak</TableHead>
                    <TableHead>Alamat Objek Pajak</TableHead>
                    <TableHead className="w-[150px]">Wilayah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow key={item.id} className="cursor-pointer" onClick={() => currentUser?.role !== "PENGGUNA" && toggleSelect(item.id)}>
                      <TableCell className="text-center font-medium">
                        {currentUser?.role !== "PENGGUNA" ? (
                          <Checkbox 
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={() => toggleSelect(item.id)}
                            onClick={(e) => e.stopPropagation()} 
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{item.nop}</TableCell>
                      <TableCell className="font-semibold text-sm">{item.namaWp}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.alamatObjek}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] w-fit px-1.5 py-0.5 bg-primary/10 text-primary font-medium rounded border border-primary/20">
                            {item.dusun || "N/A"}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            RT {item.rt || "0"} / RW {item.rw || "0"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && hasMore && (
            <div className="py-4 flex justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLoadMore}
                className="gap-2"
              >
                Muat Lebih Banyak ({data.length} / {total})
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {loading && data.length > 0 && (
            <div className="py-2 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="px-4 py-2 border-t border-border/50 text-[10px] text-muted-foreground bg-muted/20 shrink-0">
             Menampilkan {data.length} dari {total} total data Wajib Pajak
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
