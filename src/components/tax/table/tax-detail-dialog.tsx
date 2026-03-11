"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Loader2, Save, User, CheckCircle, Clock, MapPin, X, History } from "lucide-react";
import { updateWpRegion } from "@/app/actions/tax-update-actions";
import { getWpPaymentHistory } from "@/app/actions/log-actions";
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
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("detail");

  useEffect(() => {
    if (item) {
      setEditDusun(item.dusun || "");
      setEditRt(item.rt || "");
      setEditRw(item.rw || "");
      setIsEditing(false);
      setActiveTab("detail");
      setHistory([]);
    }
  }, [item]);

  const fetchHistory = async () => {
    if (history.length > 0 || !item) return;
    setHistoryLoading(true);
    const data = await getWpPaymentHistory(item.namaWp);
    setHistory(data);
    setHistoryLoading(false);
  };

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
        {/* Header */}
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

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            if (v === "riwayat") fetchHistory();
          }}
          className="px-6 pb-6"
        >
          <TabsList className="mb-4 h-9 w-full rounded-xl bg-zinc-100 dark:bg-zinc-900">
            <TabsTrigger value="detail" className="flex-1 rounded-lg text-xs font-semibold">
              Detail
            </TabsTrigger>
            <TabsTrigger value="riwayat" className="flex flex-1 items-center gap-1.5 rounded-lg text-xs font-semibold">
              <History className="h-3.5 w-3.5" /> Riwayat Setoran
            </TabsTrigger>
          </TabsList>
          {/* TAB: DETAIL */}
          <TabsContent value="detail" className="mt-0">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
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
                      {item.paymentStatus === "LUNAS"
                        ? "Lunas"
                        : item.paymentStatus === "BELUM_LUNAS"
                          ? "Belum Lunas"
                          : "Tdk Terbit"}
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
          </TabsContent>

          {/* TAB: RIWAYAT */}
          <TabsContent value="riwayat" className="mt-0">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center">
                <History className="mx-auto mb-3 h-10 w-10 opacity-20" />
                <p className="text-sm">Belum ada riwayat perubahan status untuk WP ini.</p>
              </div>
            ) : (
              <div className="space-y-2 pb-2">
                {history.map((log: any) => {
                  const isLunas = log.action === "UPDATE_PAYMENT" && log.details?.includes("LUNAS") && !log.details?.includes("BELUM_LUNAS");
                  const isUnpaid = log.action === "UPDATE_PAYMENT" && log.details?.includes("BELUM_LUNAS");
                  const isRegion = log.action === "UPDATE_REGION";
                  return (
                    <div
                      key={log.id}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
                        isLunas
                          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/30"
                          : isUnpaid
                            ? "border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30"
                            : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30"
                      }`}
                    >
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                        isLunas ? "bg-emerald-500 text-white" : isUnpaid ? "bg-amber-500 text-white" : "bg-zinc-400 text-white"
                      }`}>
                        {isLunas ? "✓" : isUnpaid ? "✗" : "↔"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground text-xs">
                          {isLunas ? "Status bayar: LUNAS" : isUnpaid ? "Status dibatalkan: Belum Lunas" : "Perubahan Wilayah"}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
                          {log.details || "-"}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(log.createdAt).toLocaleDateString("id-ID", {
                              day: "2-digit", month: "long", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                          {log.user?.name && (
                            <>
                              <span className="text-muted-foreground/40 text-[10px]">•</span>
                              <span className="text-[10px] font-semibold text-muted-foreground">{log.user.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
        <div className="h-4" />
      </DialogContent>
    </Dialog>
  );
}
