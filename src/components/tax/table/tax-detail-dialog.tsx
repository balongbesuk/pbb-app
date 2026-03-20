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
import { Edit2, Loader2, Save, User, CheckCircle, Clock, Ban, MapPin, X, ArrowRight, Handshake, ChevronRight, RotateCcw, ShieldAlert, FileX, FileText } from "lucide-react";
import { updateWpRegion } from "@/app/actions/tax-update-actions";
import { checkArchiveByNop } from "@/app/actions/settings-actions";
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
  const [archiveFile, setArchiveFile] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setEditDusun(item.dusun || "");
      setEditRt(item.rt || "");
      setEditRw(item.rw || "");
      setSelectedAdminPenarik(item.penarikId || "none");
      setIsEditing(false);
      setArchiveFile(null);
      
      // Auto detect archive
      checkArchiveByNop(item.nop, item.tahun).then(file => {
        setArchiveFile(file);
      });
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
      <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-hidden overflow-y-auto rounded-3xl border-none bg-white p-0 shadow-2xl sm:max-w-3xl dark:bg-zinc-950">
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
              {/* Archive Detection */}
              {archiveFile && (
                <div className="flex items-center justify-between rounded-2xl bg-blue-500/5 p-3 border border-blue-500/10 mb-2">
                   <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 p-2 rounded-xl">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600/70">Arsip Digital</p>
                        <p className="text-xs font-bold text-blue-700 truncate max-w-[120px]">{archiveFile}</p>
                      </div>
                   </div>
                   <a 
                    href={`/arsip-pbb/${item.tahun}/${archiveFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors uppercase tracking-widest"
                   >
                    Lihat PDF
                   </a>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold">Penarik</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500 dark:bg-zinc-800">
                    {item.penarik?.name?.charAt(0) || "U"}
                  </div>
                  <span className="text-foreground/90 text-sm font-bold">
                    {item.penarik?.name || "-"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold">Status</span>
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
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase"
                >
                  {item.paymentStatus === "LUNAS"
                    ? "Lunas"
                    : item.paymentStatus === "BELUM_LUNAS"
                      ? "Belum Lunas"
                      : item.paymentStatus === "SUSPEND"
                        ? "Suspend / Sengketa"
                        : "Tdk Terbit"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold">
                  Luas Tanah / Bangunan
                </span>
                <span className="text-foreground/90 text-sm font-bold">
                  {item.luasTanah} / {item.luasBangunan} m²
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800">
                <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
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
          <div className="sticky bottom-0 bg-white/95 px-5 py-5 backdrop-blur-md border-t border-zinc-100 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] dark:border-zinc-800/80 dark:bg-zinc-950/98 dark:shadow-none">
            <div className="flex flex-col gap-4">
              {/* Primary Action (LUNAS) */}
              <Button
                onClick={() => handleStatusChange("LUNAS")}
                disabled={isStatusLoading || item.paymentStatus === "LUNAS"}
                className="group relative h-16 w-full overflow-hidden rounded-2xl bg-emerald-600 font-bold shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-50 dark:bg-emerald-500 dark:shadow-emerald-500/10 dark:hover:bg-emerald-400"
              >
                <div className="absolute inset-0 -translate-x-[100%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[100%]" />
                <div className="relative flex items-center justify-center gap-3 text-white">
                  {isStatusLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shadow-inner">
                      <CheckCircle className="h-4.5 w-4.5" />
                    </div>
                  )}
                  <span className="text-16 font-black tracking-[0.15em] uppercase">Tandai Lunas</span>
                </div>
              </Button>

              {/* Secondary Actions (Solid Colors) */}
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => handleStatusChange("BELUM_LUNAS")}
                  disabled={isStatusLoading || item.paymentStatus === "BELUM_LUNAS"}
                  variant="outline"
                  className="flex h-[80px] flex-col items-center justify-center gap-2 rounded-2xl border-none bg-amber-400 text-[#000000] shadow-lg transition-all hover:bg-amber-300 disabled:opacity-30 dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-300"
                >
                  {isStatusLoading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : <RotateCcw className="h-6 w-6" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">Batalkan</span>
                </Button>

                <Button
                  onClick={() => handleStatusChange("SUSPEND")}
                  disabled={isStatusLoading || item.paymentStatus === "SUSPEND"}
                  variant="outline"
                  className="flex h-[80px] flex-col items-center justify-center gap-2 rounded-2xl border-none bg-red-600 text-white shadow-lg transition-all hover:bg-red-500 disabled:opacity-30 dark:bg-red-600 dark:text-white dark:hover:bg-red-500"
                >
                  {isStatusLoading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <ShieldAlert className="h-6 w-6" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">Sengketa</span>
                </Button>

                <Button
                  onClick={() => handleStatusChange("TIDAK_TERBIT")}
                  disabled={isStatusLoading || item.paymentStatus === "TIDAK_TERBIT"}
                  variant="outline"
                  className="flex h-[80px] flex-col items-center justify-center gap-2 rounded-2xl border-none bg-zinc-100 text-[#000000] shadow-lg transition-all hover:bg-zinc-200 disabled:opacity-30 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
                >
                  {isStatusLoading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : <FileX className="h-6 w-6" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">Tdk Terbit</span>
                </Button>
              </div>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
