"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Loader2, Save, User, CheckCircle, MapPin, X, RotateCcw, ShieldAlert, FileX, FileText, RefreshCcw, Copy, Check, Trash2, AlertTriangle, Printer, FileDown, Search } from "lucide-react";
import { updateWpRegion } from "@/app/actions/tax-update-actions";
import { getVillageConfig as fetchConfig } from "@/app/actions/settings-actions";
import { checkArchiveByNop } from "@/app/actions/archive-actions";
import { deleteTaxData, updateTaxData } from "@/app/actions/tax-actions";
import { UnpaidBillDialog } from "@/components/tax/unpaid-bill-dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { formatCurrency, normalizeNum, cn, getPaymentStatusColor, getPaymentStatusLabel } from "@/lib/utils";
import type { TaxDataItem, AppUser, AvailableFilters } from "@/types/app";
import type { PaymentStatus } from "@prisma/client";

function sanitizeArchiveFilename(filename: string): string {
  const cleaned = filename.replace(/[^a-zA-Z0-9._-]/g, "");
  return cleaned;
}

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
  const { resolvedTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editDusun, setEditDusun] = useState("");
  const [editRt, setEditRt] = useState("");
  const [editRw, setEditRw] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [selectedTransferPenarik, setSelectedTransferPenarik] = useState<string>("");
  const [selectedAdminPenarik, setSelectedAdminPenarik] = useState<string>("");
  const [isAssignSubmitting, setIsAssignSubmitting] = useState(false);
  const [archiveFile, setArchiveFile] = useState<string | null>(null);
  const [isCheckingBapenda, setIsCheckingBapenda] = useState(false);
  const [showPayRedirect, setShowPayRedirect] = useState(false);
  const [enableBapendaSync, setEnableBapendaSync] = useState(false);
  const [enableBapendaPayment, setEnableBapendaPayment] = useState(true);
  const [bapendaPaymentUrl, setBapendaPaymentUrl] = useState<string | null>(null);
  const [bapendaUrl, setBapendaUrl] = useState<string | null>(null);
  const [bapendaRegionName, setBapendaRegionName] = useState("Bapenda");
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [copiedNop, setCopiedNop] = useState(false);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [isJombangBapenda, setIsJombangBapenda] = useState(false);
  
  const [isFullEditing, setIsFullEditing] = useState(false);
  const [editNamaWp, setEditNamaWp] = useState("");
  const [editAlamatObjek, setEditAlamatObjek] = useState("");
  const [editLuasTanah, setEditLuasTanah] = useState(0);
  const [editLuasBangunan, setEditLuasBangunan] = useState(0);
  const [editKetetapan, setEditKetetapan] = useState(0);
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>("BELUM_LUNAS");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (item) {
      setEditDusun(item.dusun || "");
      setEditRt(item.rt || "");
      setEditRw(item.rw || "");
      setSelectedAdminPenarik(item.penarikId || "none");
      setIsEditing(false);
      setArchiveFile(null);
      setShowPdfViewer(false);
      
      setIsArchiveLoading(true);
      checkArchiveByNop(item.nop, item.tahun).then(file => {
        setArchiveFile(file ? sanitizeArchiveFilename(file) : null);
        setIsArchiveLoading(false);
      });

      fetchConfig().then(config => {
        setEnableBapendaSync(config.enableBapendaSync ?? true);
        setEnableBapendaPayment(config.enableBapendaPayment ?? true);
        setBapendaPaymentUrl(config.bapendaPaymentUrl || null);
        setBapendaUrl(config.bapendaUrl || null);
        setBapendaRegionName(config.bapendaRegionName || "Bapenda");
        setIsJombangBapenda(config.isJombangBapenda ?? false);
      });

      setIsFullEditing(false);
      setEditNamaWp(item.namaWp || "");
      setEditAlamatObjek(item.alamatObjek || "");
      setEditLuasTanah(item.luasTanah || 0);
      setEditLuasBangunan(item.luasBangunan || 0);
      setEditKetetapan(item.ketetapan || 0);
      setEditPaymentStatus(item.paymentStatus);
    }
  }, [item]);

  if (!item) return null;

  const isAdmin = currentUser?.role === "ADMIN";
  const isOwner = item.penarikId === currentUser?.id;
  const canManage = isAdmin || isOwner;
  const isUIBlocked = isUpdating || isStatusLoading || isDeleting || isDeleteDialogOpen || showPayRedirect;

  const handleUpdate = async () => {
    const finalRt = normalizeNum(editRt);
    const finalRw = normalizeNum(editRw);
    setIsUpdating(true);
    const res = await updateWpRegion(item.id, editDusun || null, finalRt || null, finalRw || null);
    if (res.success) {
      toast.success("Wilayah berhasil diperbarui");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["tax-data"] });
    } else {
      toast.error("Gagal update: " + res.message);
    }
    setIsUpdating(false);
  };

  const handleFullUpdate = async () => {
    setIsUpdating(true);
    const res = await updateTaxData(item.id, {
      namaWp: editNamaWp,
      alamatObjek: editAlamatObjek,
      luasTanah: editLuasTanah,
      luasBangunan: editLuasBangunan,
      ketetapan: editKetetapan,
      paymentStatus: editPaymentStatus
    });
    if (res.success) {
      toast.success("Data pajak berhasil diperbarui");
      setIsFullEditing(false);
      queryClient.invalidateQueries({ queryKey: ["tax-data"] });
      onClose();
    } else {
      toast.error("Gagal update: " + res.message);
    }
    setIsUpdating(false);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    const res = await deleteTaxData(item.id);
    if (res.success) {
      toast.success("Data pajak berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["tax-data"] });
      setIsDeleteDialogOpen(false);
      onClose();
    } else {
      toast.error("Gagal menghapus: " + res.message);
    }
    setIsDeleting(false);
  };

  const handleStatusChange = async (status: PaymentStatus) => {
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
    await onTransferRequest(item.id, receiverId, type);
    onClose();
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

  const handleCheckBapenda = async () => {
    const now = Date.now();
    const COOLDOWN_MS = 15000;
    if (now - lastCheckTime < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - lastCheckTime)) / 1000);
      toast.warning(`Mohon tunggu ${remainingSeconds} detik lagi sebelum mengecek kembali.`);
      return;
    }
    setIsCheckingBapenda(true);
    setLastCheckTime(now);
    toast.info("Mengambil data dari server Bapenda...");
    try {
      const res = await fetch("/api/check-bapenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nop: item.nop, tahun: item.tahun })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.isPaid) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["tax-data"] });
        onClose();
      } else {
        toast.warning(data.message);
        setShowPayRedirect(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal cek Bapenda";
      toast.error(message);
    } finally {
      setIsCheckingBapenda(false);
    }
  };
  
  const handlePrint = () => {
    if (iframeRef.current) {
        iframeRef.current.contentWindow?.focus();
        iframeRef.current.contentWindow?.print();
    }
  };

  const handleDownload = () => {
    if (!item || !archiveFile) return;
    const link = document.createElement("a");
    link.href = `/arsip-pbb/${item.tahun}/${archiveFile}`;
    link.download = `E-SPPT-${item.nop}-${item.tahun}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyNop = (nop: string) => {
    const cleanNop = nop.replace(/\D/g, "");
    navigator.clipboard.writeText(cleanNop);
    setCopiedNop(true);
    toast.success(`NOP ${cleanNop} disalin`);
    setTimeout(() => setCopiedNop(false), 2000);
  };

  return (
    <>
      <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
        <DialogContent 
          className="max-h-[90vh] max-w-[95vw] overflow-hidden overflow-y-auto rounded-3xl border-none bg-white p-0 shadow-2xl sm:max-w-4xl dark:bg-zinc-950"
          showCloseButton={false}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/5 flex h-8 w-8 items-center justify-center rounded-full">
                <MapPin className="text-primary/60 h-4 w-4" />
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isUIBlocked}
                  className="h-8 w-8 rounded-full text-red-500/50 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors"
                  title="Hapus Data"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h2 className="text-foreground text-lg font-bold tracking-tight leading-tight">Detail Objek Pajak</h2>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{item.nop}</p>
                  <button onClick={() => handleCopyNop(item.nop)} disabled={isUIBlocked || copiedNop} className="opacity-40 hover:opacity-100 transition-opacity active:scale-90 disabled:opacity-10">
                    {copiedNop ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {item.paymentStatus === "BELUM_LUNAS" && enableBapendaSync && isJombangBapenda && (
                <Button variant="outline" size="sm" className="flex h-8 items-center justify-center gap-2 rounded-full border-emerald-500/30 bg-emerald-50 px-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50" onClick={handleCheckBapenda} disabled={isUIBlocked || isCheckingBapenda}>
                  {isCheckingBapenda ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  <span className="hidden sm:inline text-[9px]">Cek Bapenda</span>
                </Button>
              )}

              {item.paymentStatus === "BELUM_LUNAS" && !isJombangBapenda && enableBapendaPayment && bapendaPaymentUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex h-8 items-center justify-center gap-2 rounded-full border-blue-500/30 bg-blue-50 px-3 text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/50" 
                  onClick={() => {
                    const cleanNop = item.nop.replace(/\D/g, "");
                    const targetUrl = bapendaPaymentUrl.replace(/\{nop\}/gi, cleanNop);
                    window.open(targetUrl, "_blank");
                  }} 
                  disabled={isUIBlocked}
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline text-[9px]">Bayar Online</span>
                </Button>
              )}
              <DialogClose 
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isUIBlocked}
                  className="h-8 w-8 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  title="Tutup"
                >
                  <X className="h-4 w-4" />
                </Button>
              }
            />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 px-5 pb-3 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase">Wajib Pajak</span>
                  {isAdmin && !isFullEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsFullEditing(true)} disabled={isUIBlocked} className="h-8 rounded-lg px-3 text-xs font-bold text-primary hover:bg-primary/5 transition-colors">
                      <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Ubah
                    </Button>
                  )}
                </div>
                {isFullEditing ? (
                  <div className="space-y-2 pt-1">
                    <Input value={editNamaWp} onChange={(e) => setEditNamaWp(e.target.value)} className="h-9 font-bold uppercase" placeholder="Nama Wajib Pajak" />
                    <Input value={editAlamatObjek} onChange={(e) => setEditAlamatObjek(e.target.value)} className="h-9 text-sm" placeholder="Alamat Objek" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-foreground text-lg font-black tracking-tighter uppercase">{item.namaWp}</h3>
                    <p className="text-muted-foreground/80 text-sm leading-snug">{item.alamatObjek}</p>
                  </>
                )}
              </div>

              <div className="space-y-2">
                {isArchiveLoading ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-zinc-100/50 dark:bg-zinc-800/50 p-3 animate-pulse border border-zinc-200/50 dark:border-zinc-700/50">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  </div>
                ) : archiveFile ? (
                  <div className="flex items-center justify-between rounded-2xl bg-blue-500/5 p-3 border border-blue-500/10 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 p-2 rounded-xl"><FileText className="h-4 w-4 text-blue-600" /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600/70">Arsip Digital</p>
                        <p className="text-xs font-bold text-blue-700 truncate max-w-[120px]">{archiveFile}</p>
                      </div>
                    </div>
                    <Button onClick={() => setShowPdfViewer(true)} disabled={isUIBlocked} className="bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 h-auto rounded-lg hover:bg-blue-700 uppercase tracking-widest">
                      Lihat PDF
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl bg-red-500/5 p-3 border border-red-500/10 mb-2">
                    <FileX className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-bold text-red-700">Tidak ada arsip</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-semibold">Penarik</span>
                  <span className="text-foreground/90 text-sm font-bold">{item.penarik?.name || "-"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-semibold">Status</span>
                  {isFullEditing ? (
                    <Select value={editPaymentStatus} onValueChange={(v) => setEditPaymentStatus(v as PaymentStatus)}>
                      <SelectTrigger className="h-7 w-32 text-[10px] font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BELUM_LUNAS">BELUM LUNAS</SelectItem>
                        <SelectItem value="LUNAS">LUNAS</SelectItem>
                        <SelectItem value="SUSPEND">SENGKETA</SelectItem>
                        <SelectItem value="TIDAK_TERBIT">TDK TERBIT</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase border-transparent", getPaymentStatusColor(item.paymentStatus))}>
                      {getPaymentStatusLabel(item.paymentStatus)}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800">
                  <span className="text-muted-foreground text-xs font-bold uppercase">Total Tagihan</span>
                  {isFullEditing ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">Rp</span>
                      <Input type="number" value={editKetetapan} onChange={(e) => setEditKetetapan(Number(e.target.value))} className="h-8 w-32 text-right font-bold" />
                    </div>
                  ) : (
                    <span className="text-primary text-xl font-black">{formatCurrency(item.ketetapan)}</span>
                  )}
                </div>

                {isFullEditing && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 h-9 rounded-xl text-xs font-bold" onClick={() => setIsFullEditing(false)}>Batal</Button>
                    <Button className="flex-1 h-9 rounded-xl text-xs font-bold bg-primary" onClick={handleFullUpdate} disabled={isUpdating}>
                      {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />} Simpan
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex h-full flex-col rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800/50 dark:bg-zinc-900/30">
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-bold uppercase">Wilayah</span>
                  {!isEditing && canManage && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} disabled={isUIBlocked} className="h-8 rounded-lg px-3 text-xs font-bold text-primary hover:bg-primary/5 transition-colors">
                      <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Ubah
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Select value={editDusun} onValueChange={(v) => setEditDusun(v || "")}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{(availableFilters.dusunRefs ?? availableFilters.dusun).map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={editRt} onChange={(e) => setEditRt(e.target.value.slice(0, 2))} className="h-8 text-xs text-center" placeholder="RT" />
                        <Input value={editRw} onChange={(e) => setEditRw(e.target.value.slice(0, 2))} className="h-8 text-xs text-center" placeholder="RW" />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => setIsEditing(false)}>Batal</Button>
                        <Button size="sm" className="flex-1 h-8 font-bold" onClick={handleUpdate} disabled={isUpdating}>{isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Simpan"}</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl space-y-1">
                      <p className="text-sm font-bold">{item.dusun || "-"}</p>
                      <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">RT {item.rt || "00"} / RW {item.rw || "00"}</p>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && !isEditing && (
                <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Alokasi Petugas</span>
                  <div className="flex items-center gap-1.5">
                    <Select value={selectedAdminPenarik} onValueChange={(v) => setSelectedAdminPenarik(v || "none")}>
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue>
                          {selectedAdminPenarik === "none" 
                            ? "Kosongkan Petugas" 
                            : availableFilters.penarik.find(p => p.id === selectedAdminPenarik)?.name 
                              || (selectedAdminPenarik === item.penarikId ? item.penarik?.name : null)
                              || selectedAdminPenarik}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-red-500 italic">Hapus Alokasi</SelectItem>
                        {availableFilters.penarik.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAssignSubmit} disabled={isUIBlocked || isAssignSubmitting} className="h-8 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] px-3 font-black uppercase">Simpan</Button>
                  </div>
                </div>
              )}

              {currentUser?.role === "PENARIK" && !isEditing && (
                <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase">Pemindahan Alokasi</span>
                  {item.penarikId === currentUser.id ? (
                    <div className="flex items-center gap-1.5">
                      <Select value={selectedTransferPenarik} onValueChange={(v) => setSelectedTransferPenarik(v || "")}>
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="Pilih Penerima">
                            {availableFilters.penarik.find(p => p.id === selectedTransferPenarik)?.name || selectedTransferPenarik}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {availableFilters.penarik.filter(p => p.id !== currentUser.id).map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={() => handleTransferSubmit("GIVE")} disabled={!selectedTransferPenarik || isUIBlocked} className="h-8 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400 text-[10px] px-3 font-black uppercase">Kirim</Button>
                    </div>
                  ) : item.penarikId ? (
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-2.5 rounded-xl flex items-center justify-between gap-3">
                       <div className="flex items-center gap-2 min-w-0">
                          <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full shrink-0"><User className="h-3 w-3 text-blue-600" /></div>
                          <p className="text-xs font-bold text-blue-700 dark:text-blue-300 truncate">Milik {item.penarik?.name || "Lainnya"}</p>
                       </div>
                       <Button onClick={() => handleTransferSubmit("TAKE")} disabled={isUIBlocked} className="h-8 px-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm shrink-0">Minta Data WP</Button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic text-center">Hanya ADMIN yang dapat mengatur alokasi awal</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {canManage && !isEditing && (
            <div className="sticky bottom-0 bg-white/95 px-5 py-5 border-t border-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/98 transition-all">
              <div className="grid grid-cols-3 gap-3">
                <Button onClick={() => handleStatusChange("SUSPEND")} disabled={isUIBlocked} variant="outline" className="flex h-20 flex-col gap-2 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest">
                  <ShieldAlert className="h-6 w-6" /> Sengketa
                </Button>
                <Button onClick={() => handleStatusChange("TIDAK_TERBIT")} disabled={isUIBlocked} variant="outline" className="flex h-20 flex-col gap-2 rounded-2xl bg-zinc-100 text-black font-black uppercase text-[10px] tracking-widest dark:bg-white">
                  <FileX className="h-6 w-6" /> Tdk Terbit
                </Button>
                <Button onClick={() => handleStatusChange(item.paymentStatus === "LUNAS" ? "BELUM_LUNAS" : "LUNAS")} disabled={isUIBlocked} className={cn("flex h-20 flex-col gap-2 rounded-2xl font-black uppercase text-[10px] tracking-widest", item.paymentStatus === "LUNAS" ? "bg-amber-400 text-black" : "bg-emerald-600 text-white")}>
                  {item.paymentStatus === "LUNAS" ? <RotateCcw className="h-6 w-6" /> : <CheckCircle className="h-6 w-6" />}
                  {item.paymentStatus === "LUNAS" ? "Batal Lunas" : "Tandai Lunas"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UnpaidBillDialog 
        open={showPayRedirect} 
        onOpenChange={setShowPayRedirect} 
        nop={item?.nop || ""} 
        namaWp={item?.namaWp || ""} 
        isDark={resolvedTheme === "dark"} 
        bapendaPaymentUrl={bapendaPaymentUrl}
        bapendaUrl={bapendaUrl}
        enableBapendaPayment={enableBapendaPayment}
        enableBapendaSync={enableBapendaSync}
        isJombangBapenda={isJombangBapenda}
        bapendaRegionName={bapendaRegionName}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-8 bg-white dark:bg-zinc-950 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-black mb-2">Konfirmasi Hapus</h3>
          <p className="text-sm text-muted-foreground mb-6">Hapus permanen data {item.namaWp}?</p>
          <div className="grid grid-cols-2 gap-3"><Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button><Button className="bg-red-600 text-white font-bold" onClick={confirmDelete}>Hapus</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
        <DialogContent 
          className="sm:max-w-[90vw] w-[95vw] h-[95vh] p-0 overflow-hidden border-none rounded-3xl bg-white dark:bg-zinc-950 flex flex-col"
          showCloseButton={false}
        >
          <DialogHeader className="p-4 border-b dark:border-zinc-800 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-xl"><FileText className="h-5 w-5 text-blue-600" /></div>
              <div>
                <DialogTitle className="text-sm font-black uppercase tracking-widest">Arsip Digital PBB</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase">{item.nop} - {item.tahun}</DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrint}
                    className="h-8 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2 bg-zinc-50 dark:bg-zinc-900"
                >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cetak</span>
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownload}
                    className="h-8 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                >
                    <FileDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                </Button>
                <div className="w-px h-4 bg-zinc-100 dark:bg-zinc-800 mx-1" />
                <Button variant="ghost" size="icon" onClick={() => setShowPdfViewer(false)} className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></Button>
            </div>
          </DialogHeader>
          <div className="flex-1 w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
            <iframe 
                ref={iframeRef}
                src={`/arsip-pbb/${item.tahun}/${archiveFile}#toolbar=0`} 
                className="w-full h-full border-none" 
                title="PDF Viewer" 
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
