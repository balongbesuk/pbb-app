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
import { Edit2, Loader2, Save, User, CheckCircle, Clock, Ban, MapPin, X, ArrowRight, Handshake, ChevronRight } from "lucide-react";
import { updateWpRegion } from "@/app/actions/tax-update-actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, normalizeNum } from "@/lib/utils";
import type { TaxDataItem, AppUser, AvailableFilters } from "@/types/app";
import type { PaymentStatus } from "@prisma/client";

interface TaxDetailDialogProps {
  item: TaxDataItem | null;
  onClose: () => void;
  availableFilters: AvailableFilters;
  currentUser: AppUser | undefined;
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
  onTransferRequest: (taxId: number, receiverId: string, type: "GIVE" | "TAKE") => void;
  onAssignPenarik: (taxId: string, penarikId: string | null) => void;
}

export function TaxDetailDialog({
  item,
  onClose,
  availableFilters,
  currentUser,
  onUpdateStatus,
  onTransferRequest,
  onAssignPenarik,
}: TaxDetailDialogProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editDusun, setEditDusun] = useState(item?.dusun || "");
  const [editRt, setEditRt] = useState(item?.rt || "");
  const [editRw, setEditRw] = useState(item?.rw || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [selectedTransferPenarik, setSelectedTransferPenarik] = useState<string>("");
  const [isTransferSubmitting, setIsTransferSubmitting] = useState(false);
  const [selectedAdminPenarik, setSelectedAdminPenarik] = useState<string>(item?.penarikId || "");
  const [isAssignSubmitting, setIsAssignSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setEditDusun(item.dusun || "");
      setEditRt(item.rt || "");
      setEditRw(item.rw || "");
      setSelectedAdminPenarik(item.penarikId || "none");
      setIsEditing(false);
    }
  }, [item]);

  if (!item) return null;

  const isAdmin = currentUser?.role === "ADMIN";
  const isOwner = item.penarikId === currentUser?.id;
  const canManage = isAdmin || isOwner;

  const handleUpdate = async () => {
    const finalRt = normalizeNum(editRt);
    const finalRw = normalizeNum(editRw);

    setIsUpdating(true);
    const res = await updateWpRegion(item.id, editDusun || null, finalRt || null, finalRw || null);
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

  const handleStatusChange = async (status: "LUNAS" | "BELUM_LUNAS" | "SUSPEND" | "TIDAK_TERBIT") => {
    setIsStatusLoading(true);
    try {
      await onUpdateStatus(item.id.toString(), status);
      onClose();
    } finally {
      setIsStatusLoading(false);
    }
  };
  
  const handleTransferSubmit = async (type: "GIVE" | "TAKE") => {
    const receiverId = type === "GIVE" ? selectedTransferPenarik : item.penarikId;
    if (!receiverId) return;
    
    setIsTransferSubmitting(true);
    try {
      await onTransferRequest(item.id, receiverId, type);
      onClose();
    } finally {
      setIsTransferSubmitting(false);
    }
  };

  const handleAssignSubmit = async () => {
    setIsAssignSubmitting(true);
    try {
      const penarikId = selectedAdminPenarik === "none" ? null : selectedAdminPenarik;
      await onAssignPenarik(item.id.toString(), penarikId);
      toast.success("Petugas berhasil dialokasikan");
      onClose();
    } finally {
      setIsAssignSubmitting(false);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-hidden overflow-y-auto rounded-3xl border-none bg-white p-0 shadow-2xl dark:bg-zinc-950">
        {/* Header: Compact */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/5 flex h-8 w-8 items-center justify-center rounded-full">
              <MapPin className="text-primary/60 h-4 w-4" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-bold tracking-tight leading-tight">
                Detail Objek Pajak
              </h2>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {item.nop}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 px-5 pb-3 sm:grid-cols-2">
          {/* Column 1: Identity & Details */}
          <div className="space-y-3">
            {/* Wajib Pajak Section */}
            <div className="space-y-0.5">
              <span className="text-muted-foreground text-xs leading-none font-bold tracking-widest uppercase">
                Wajib Pajak
              </span>
              <h3 className="text-foreground text-lg leading-tight font-black tracking-tighter uppercase">
                {item.namaWp}
              </h3>
              <p className="text-muted-foreground/80 text-sm leading-snug">{item.alamatObjek}</p>
            </div>

            {/* List Attributes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs font-semibold shrink-0">Penarik</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500 dark:bg-zinc-800">
                    {item.penarik?.name?.charAt(0) || "U"}
                  </div>
                  <span className="text-foreground/90 text-sm font-bold truncate">
                    {item.penarik?.name || "-"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs font-semibold shrink-0">Status</span>
                <Badge
                  variant={
                    (item.paymentStatus === "LUNAS"
                      ? "success"
                      : item.paymentStatus === "BELUM_LUNAS"
                        ? "warning"
                        : item.paymentStatus === "SUSPEND"
                          ? "destructive"
                          : "outline") as any
                  }
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase max-w-[120px] truncate"
                >
                  {item.paymentStatus === "LUNAS"
                    ? "Lunas"
                    : item.paymentStatus === "BELUM_LUNAS"
                      ? "Belum Lunas"
                      : item.paymentStatus === "SUSPEND"
                        ? "Sengketa"
                        : "Tdk Terbit"}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs font-semibold shrink-0">
                  Luas Tanah / Bangunan
                </span>
                <span className="text-foreground/90 text-sm font-bold">
                  {item.luasTanah} / {item.luasBangunan} m²
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase shrink-0">
                  Total Tagihan
                </span>
                <span className="text-primary text-xl font-black tracking-tighter">
                  {formatCurrency(item.ketetapan)}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Region & Actions */}
          <div className="flex h-full flex-col rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800/50 dark:bg-zinc-900/30">
            {/* Region Edit Section */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                  Wilayah Penagihan
                </span>
                {!isEditing && canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-6 rounded-lg px-2 text-xs font-bold text-primary hover:bg-primary/5 hover:text-primary"
                  >
                    <Edit2 className="mr-1 h-3 w-3" /> Ubah
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground/60 text-xs font-bold uppercase">
                    Dusun
                  </span>
                  {isEditing ? (
                    <Select value={editDusun} onValueChange={(v) => setEditDusun(v || "")}>
                      <SelectTrigger className="h-8 rounded-lg border-zinc-200 bg-white text-xs dark:bg-zinc-950">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(availableFilters.dusunRefs ?? availableFilters.dusun).map((d: string) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-bold text-foreground">{item.dusun || "-"}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground/60 text-xs font-bold uppercase">
                      RT
                    </span>
                    {isEditing ? (
                      <Input
                        value={editRt}
                        onChange={(e) => setEditRt(e.target.value.replace(/\D/g, "").slice(0, 2))}
                        className="h-8 rounded-lg border-zinc-200 bg-white text-xs dark:bg-zinc-950"
                        placeholder="01"
                      />
                    ) : (
                      <p className="font-mono text-sm font-bold text-foreground">
                        {item.rt || "01"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground/60 text-xs font-bold uppercase">
                      RW
                    </span>
                    {isEditing ? (
                      <Input
                        value={editRw}
                        onChange={(e) => setEditRw(e.target.value.replace(/\D/g, "").slice(0, 2))}
                        className="h-8 rounded-lg border-zinc-200 bg-white text-xs dark:bg-zinc-950"
                        placeholder="01"
                      />
                    ) : (
                      <p className="font-mono text-sm font-bold text-foreground">
                        {item.rw || "01"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="h-8 flex-1 rounded-lg text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="h-8 flex-1 rounded-lg text-xs font-bold"
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
            {/* Admin: Direct Assignment */}
            {isAdmin && !isEditing && (
              <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                  Alokasi Petugas
                </span>
                <div className="space-y-2">
                  <Select value={selectedAdminPenarik} onValueChange={(v) => setSelectedAdminPenarik(v || "none")}>
                    <SelectTrigger className="h-8 rounded-lg border-zinc-200 bg-white text-xs dark:bg-zinc-950">
                      <span className="truncate">
                        {selectedAdminPenarik === "none" 
                          ? "Kosongkan Petugas" 
                          : availableFilters.penarik.find(p => p.id === selectedAdminPenarik)?.name || "Pilih Petugas"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-red-500 font-medium italic">
                        Tanpa Petugas (Hapus Alokasi)
                      </SelectItem>
                      {availableFilters.penarik.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleAssignSubmit}
                    disabled={isAssignSubmitting}
                    className="h-8 w-full rounded-lg bg-zinc-900 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  >
                    {isAssignSubmitting ? (
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="mr-1.5 h-3 w-3" />
                    )}
                    Simpan Alokasi
                  </Button>
                </div>
              </div>
            )}

            {currentUser?.role === "PENARIK" && !isEditing && (
              <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                  Pemindahan Alokasi
                </span>
                
                {item.penarikId === currentUser.id ? (
                  // GIVE Logic
                  <div className="space-y-2">
                    <Select value={selectedTransferPenarik} onValueChange={(v) => setSelectedTransferPenarik(v || "")}>
                      <SelectTrigger className="h-8 rounded-lg border-zinc-200 bg-white text-xs dark:bg-zinc-950">
                        <span className="truncate">
                          {selectedTransferPenarik 
                            ? availableFilters.penarik.find(p => p.id === selectedTransferPenarik)?.name 
                            : "Pilih Petugas Penerima"}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {availableFilters.penarik
                          .filter((p) => p.id !== currentUser.id)
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => handleTransferSubmit("GIVE")}
                      disabled={!selectedTransferPenarik || isTransferSubmitting}
                      className="h-8 w-full rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-400"
                    >
                      {isTransferSubmitting ? (
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      ) : (
                        <ArrowRight className="mr-1.5 h-3 w-3" />
                      )}
                      Kirim ke Petugas Lain
                    </Button>
                  </div>
                ) : (
                  // TAKE Logic
                  item.penarikId ? (
                    <div className="rounded-lg bg-blue-50/50 p-2.5 dark:bg-blue-900/10">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="bg-blue-100 p-1 rounded-full dark:bg-blue-900/30">
                          <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-blue-600/70 font-bold uppercase dark:text-blue-400/70">Milik Petugas</p>
                          <p className="text-sm font-bold text-blue-700 truncate dark:text-blue-300">{item.penarik?.name || "Lainnya"}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleTransferSubmit("TAKE")}
                        disabled={isTransferSubmitting}
                        className="h-8 w-full rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-all active:scale-[0.98]"
                      >
                        {isTransferSubmitting ? (
                          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                        ) : (
                          <Handshake className="mr-1.5 h-3 w-3" />
                        )}
                        Minta Data WP
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-zinc-200 p-2.5 text-center dark:border-zinc-800">
                      <p className="text-xs text-muted-foreground font-medium">Belum ada alokasi petugas</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5 italic">Hanya ADMIN yang dapat mengatur alokasi awal</p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payment Actions - Compact */}
        {canManage && !isEditing && (
          <div className="sticky bottom-0 bg-white/90 px-5 py-4 backdrop-blur-md dark:bg-zinc-950/90 border-t border-zinc-100 dark:border-zinc-800">
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                onClick={() => handleStatusChange("LUNAS")}
                disabled={isStatusLoading || item.paymentStatus === "LUNAS"}
                className="col-span-2 h-12 w-full rounded-xl bg-emerald-500 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-emerald-900/20"
              >
                {isStatusLoading ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-1.5 h-4 w-4" />
                )}
                TANDAI LUNAS
              </Button>
              
              <Button
                onClick={() => handleStatusChange("SUSPEND")}
                disabled={isStatusLoading || item.paymentStatus === "SUSPEND"}
                className="col-span-1 h-12 w-full rounded-xl bg-rose-100/80 text-xs font-bold text-rose-600 transition-all hover:bg-rose-200 disabled:opacity-50 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-400"
              >
                {isStatusLoading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Ban className="mr-1.5 h-3.5 w-3.5" />
                )}
                SENGKETA
              </Button>

              <Button
                onClick={() => handleStatusChange("TIDAK_TERBIT")}
                disabled={isStatusLoading || item.paymentStatus === "TIDAK_TERBIT"}
                className="col-span-1 h-12 w-full rounded-xl bg-zinc-100 text-xs font-bold text-zinc-600 transition-all hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-500/20 dark:hover:bg-zinc-500/30 dark:text-zinc-300"
              >
                {isStatusLoading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="mr-1.5 h-3.5 w-3.5" />
                )}
                TDK TERBIT
              </Button>
              
              <Button
                onClick={() => handleStatusChange("BELUM_LUNAS")}
                disabled={isStatusLoading || item.paymentStatus === "BELUM_LUNAS"}
                className="col-span-2 h-12 w-full rounded-xl border-2 border-amber-200 bg-white text-xs font-bold text-amber-600 transition-all hover:bg-amber-50 disabled:opacity-50 dark:border-amber-500/30 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-400"
              >
                {isStatusLoading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                )}
                BATALKAN & RESET
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
