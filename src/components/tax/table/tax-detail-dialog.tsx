"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Loader2, Save, User, CheckCircle, Clock, MapPin, X } from "lucide-react";
import { updateWpRegion } from "@/app/actions/tax-update-actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

interface TaxDetailDialogProps {
  item: any;
  onClose: () => void;
  availableFilters: any;
  currentUser: any;
  onUpdateStatus: (id: string, status: "LUNAS" | "BELUM_LUNAS" | "TIDAK_TERBIT") => void;
}

export function TaxDetailDialog({
  item,
  onClose,
  availableFilters,
  currentUser,
  onUpdateStatus,
}: TaxDetailDialogProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editDusun, setEditDusun] = useState(item?.dusun || "");
  const [editRt, setEditRt] = useState(item?.rt || "");
  const [editRw, setEditRw] = useState(item?.rw || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setEditDusun(item.dusun || "");
      setEditRt(item.rt || "");
      setEditRw(item.rw || "");
      setIsEditing(false);
    }
  }, [item]);

  if (!item) return null;

  const handleUpdate = async () => {
    setIsUpdating(true);
    const res = await updateWpRegion(item.id, editDusun || null, editRt || null, editRw || null);
    if (res.success) {
      toast.success("Wilayah berhasil diperbarui");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["tax-data"] });
      onClose();
    } else {
      toast.error("Gagal update: " + res.message);
    }
    setIsUpdating(false);
  };

  const handleStatusChange = async (status: "LUNAS" | "BELUM_LUNAS") => {
    setIsStatusLoading(true);
    try {
      await onUpdateStatus(item.id.toString(), status);
      onClose();
    } finally {
      setIsStatusLoading(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-hidden overflow-y-auto rounded-3xl border-none bg-white p-0 shadow-2xl sm:max-w-3xl dark:bg-zinc-950">
        {/* Header: Minimalist */}
        <div className="flex items-center justify-between p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/5 flex h-10 w-10 items-center justify-center rounded-full">
              <MapPin className="text-primary/60 h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-xl font-bold tracking-tight">
                Detail Objek Pajak
              </h2>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {item.nop}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 px-6 py-4 sm:grid-cols-2">
          {/* Column 1: Identity & Details */}
          <div className="space-y-6">
            {/* Wajib Pajak Section */}
            <div className="space-y-1">
              <span className="text-muted-foreground text-[10px] leading-none font-bold tracking-widest uppercase">
                Wajib Pajak
              </span>
              <h3 className="text-foreground text-2xl leading-tight font-black tracking-tighter uppercase">
                {item.namaWp}
              </h3>
              <p className="text-muted-foreground/80 text-sm leading-snug">{item.alamatObjek}</p>
            </div>

            {/* List Attributes: Clean & Simple */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground text-xs font-semibold">Penarik</span>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800">
                    {item.penarik?.name?.charAt(0) || "U"}
                  </div>
                  <span className="text-foreground/90 text-sm font-bold">
                    {item.penarik?.name || "-"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground text-xs font-semibold">Status</span>
                <Badge
                  variant={
                    (item.paymentStatus === "LUNAS"
                      ? "success"
                      : item.paymentStatus === "BELUM_LUNAS"
                        ? "warning"
                        : "outline") as any
                  }
                  className="rounded-full px-3 py-1 text-[9px] font-black uppercase"
                >
                  {item.paymentStatus}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground text-xs font-semibold">
                  Luas Tanah / Bangunan
                </span>
                <span className="text-foreground/90 text-sm font-bold">
                  {item.luasTanah} / {item.luasBangunan} m²
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                  Total Tagihan
                </span>
                <span className="text-primary text-3xl font-black tracking-tighter">
                  {formatCurrency(item.ketetapan)}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Region & Actions */}
          <div className="flex h-full flex-col rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6 dark:border-zinc-800/50 dark:bg-zinc-900/30">
            {/* Region Edit Section */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                  Wilayah Penagihan
                </span>
                {!isEditing && currentUser?.role !== "PENGGUNA" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-primary hover:text-primary hover:bg-primary/5 h-7 rounded-lg px-2 text-xs font-bold"
                  >
                    <Edit2 className="mr-1 h-3 w-3" /> Ubah
                  </Button>
                )}
              </div>

              <div className="space-y-4 pt-1">
                <div className="space-y-1">
                  <span className="text-muted-foreground/60 text-[9px] font-bold uppercase">
                    Dusun
                  </span>
                  {isEditing ? (
                    <Select value={editDusun} onValueChange={(v) => setEditDusun(v)}>
                      <SelectTrigger className="h-9 rounded-xl border-zinc-200 bg-white text-xs dark:bg-zinc-950">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(availableFilters.dusunRefs || availableFilters.dusun).map((d: string) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-foreground text-base font-bold">{item.dusun || "-"}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-muted-foreground/60 text-[9px] font-bold uppercase">
                      RT
                    </span>
                    {isEditing ? (
                      <Input
                        value={editRt}
                        onChange={(e) => setEditRt(e.target.value)}
                        className="h-9 rounded-xl border-zinc-200 bg-white text-xs dark:bg-zinc-950"
                      />
                    ) : (
                      <p className="text-foreground font-mono text-base font-bold">
                        {item.rt || "00"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground/60 text-[9px] font-bold uppercase">
                      RW
                    </span>
                    {isEditing ? (
                      <Input
                        value={editRw}
                        onChange={(e) => setEditRw(e.target.value)}
                        className="h-9 rounded-xl border-zinc-200 bg-white text-xs dark:bg-zinc-950"
                      />
                    ) : (
                      <p className="text-foreground font-mono text-base font-bold">
                        {item.rw || "00"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="h-9 flex-1 rounded-xl text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="h-9 flex-1 rounded-xl text-xs font-bold"
                  >
                    {isUpdating ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-3 w-3" />
                    )}
                    Simpan
                  </Button>
                </div>
              )}
            </div>

            {/* Payment Actions */}
            {currentUser?.role !== "PENGGUNA" && !isEditing && (
              <div className="space-y-3 pt-8">
                <Button
                  onClick={() => handleStatusChange("LUNAS")}
                  disabled={isStatusLoading || item.paymentStatus === "LUNAS"}
                  className="h-12 w-full rounded-2xl bg-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/10 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
                >
                  {isStatusLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-5 w-5" />
                  )}
                  KONFIRMASI LUNAS
                </Button>
                <Button
                  onClick={() => handleStatusChange("BELUM_LUNAS")}
                  disabled={isStatusLoading || item.paymentStatus === "BELUM_LUNAS"}
                  className="h-11 w-full rounded-2xl border border-amber-200 bg-transparent text-xs font-bold text-amber-600 transition-all hover:bg-amber-50 disabled:opacity-50"
                >
                  {isStatusLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Clock className="mr-2 h-4 w-4" />
                  )}
                  BATALKAN PELUNASAN
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="h-4" />
      </DialogContent>
    </Dialog>
  );
}
