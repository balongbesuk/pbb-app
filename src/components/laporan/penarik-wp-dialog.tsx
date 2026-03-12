"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus, CheckSquare, ChevronRight, ChevronLeft } from "lucide-react";
import { getWpByPenarik } from "@/app/actions/tax-update-actions";
import { assignPenarikBulk } from "@/app/actions/tax-assign-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { PenarikInfo, AppUser, TaxDataItem } from "@/types/app";

interface PenarikWpDialogProps {
  penarikId: string | null;
  penarikName: string;
  tahun: number;
  count: number;
  allPenariks: PenarikInfo[];
  paymentStatus?: "LUNAS" | "BELUM_LUNAS" | "TIDAK_TERBIT";
  children?: React.ReactNode;
  currentUser?: AppUser;
}

export function PenarikWpDialog({
  penarikId,
  penarikName,
  tahun,
  count,
  allPenariks,
  paymentStatus,
  children,
  currentUser,
}: PenarikWpDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  type WpSummary = Pick<TaxDataItem, "id" | "nop" | "namaWp" | "alamatObjek" | "dusun" | "rt" | "rw" | "ketetapan" | "paymentStatus">;
  const [data, setData] = useState<WpSummary[]>([]);
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
        setData((prev) => [...prev, ...res.data]);
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
      setSelectedIds(new Set(data.map((d) => d.id)));
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
        setData(data.filter((item) => !selectedIds.has(item.id)));
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
            <button
              type="button"
              className="cursor-pointer appearance-none border-none bg-transparent p-0 outline-none"
            >
              {children}
            </button>
          ) : (
            <Button
              variant="link"
              className="text-primary hover:text-primary/80 h-auto p-0 font-bold"
            >
              {count}
            </Button>
          )
        }
      />
      <DialogContent className="flex max-h-[90vh] max-w-[95vw] flex-col lg:max-w-7xl">
        <DialogHeader>
          <DialogTitle>
            Kelola Data WP - {penarikName}
            {paymentStatus === "LUNAS" && " (Lunas)"}
            {paymentStatus === "BELUM_LUNAS" && " (Belum Lunas)"}
          </DialogTitle>
        </DialogHeader>

        {!loading && data.length > 0 && currentUser?.role !== "PENGGUNA" && (
          <div className="bg-primary/5 border-primary/20 mt-2 flex shrink-0 flex-col justify-between gap-3 rounded-lg border p-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={data.length > 0 && selectedIds.size === data.length}
                onCheckedChange={toggleSelectAll}
                id="select-all-penarik"
              />
              <label htmlFor="select-all-penarik" className="cursor-pointer text-sm font-medium">
                Pilih Semua ({selectedIds.size}/{data.length})
              </label>
            </div>

            {selectedIds.size > 0 && (
              <div className="animate-in fade-in zoom-in flex items-center gap-2 duration-200">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button size="sm" disabled={isAssigning} className="gap-2">
                        {isAssigning ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
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
                    {allPenariks
                      .filter((p) => p.id !== penarikId)
                      .map((p) => (
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

        <div className="mt-2 flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-muted-foreground p-8 pt-12 text-center">
              <CheckSquare className="mx-auto mb-3 h-12 w-12 opacity-20" />
              <p>Tidak ada data ditemukan di kategori ini.</p>
              <p className="text-xs">Mungkin data sudah dipindahkan ke penarik lain.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
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
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => currentUser?.role !== "PENGGUNA" && toggleSelect(item.id)}
                    >
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
                      <TableCell className="text-sm font-semibold">{item.namaWp}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {item.alamatObjek}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="bg-primary/10 text-primary border-primary/20 w-fit rounded border px-1.5 py-0.5 text-[10px] font-medium">
                            {item.dusun || "N/A"}
                          </span>
                          <span className="text-muted-foreground font-mono text-[10px]">
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
            <div className="flex justify-center py-4">
              <Button variant="outline" size="sm" onClick={handleLoadMore} className="gap-2">
                Muat Lebih Banyak ({data.length} / {total})
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {loading && data.length > 0 && (
            <div className="flex justify-center py-2">
              <Loader2 className="text-primary h-5 w-5 animate-spin" />
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="border-border/50 text-muted-foreground bg-muted/20 shrink-0 border-t px-4 py-2 text-[10px]">
            Menampilkan {data.length} dari {total} total data Wajib Pajak
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
