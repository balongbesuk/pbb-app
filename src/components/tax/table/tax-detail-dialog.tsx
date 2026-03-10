"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Loader2, Save, User } from "lucide-react";
import { updateWpRegion } from "@/app/actions/tax-update-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TaxDetailDialogProps {
    item: any;
    onClose: () => void;
    availableFilters: any;
    currentUser: any;
}

export function TaxDetailDialog({ item, onClose, availableFilters, currentUser }: TaxDetailDialogProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [editDusun, setEditDusun] = useState(item?.dusun || "");
    const [editRt, setEditRt] = useState(item?.rt || "");
    const [editRw, setEditRw] = useState(item?.rw || "");
    const [isUpdating, setIsUpdating] = useState(false);

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
            router.refresh();
            onClose();
        } else {
            toast.error("Gagal update: " + res.message);
        }
        setIsUpdating(false);
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto glass border-primary/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Detail & Perbaikan Wilayah
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-4 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-border/20">
                        <div className="flex gap-2 items-center">
                            <span className="text-muted-foreground w-12 text-xs uppercase font-bold opacity-70">NOP</span>
                            <span className="font-mono font-bold text-primary">{item.nop}</span>
                        </div>
                        {!isEditing && currentUser?.role !== "PENGGUNA" && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] gap-1 px-2 border-primary/30 text-primary hover:bg-primary/10 shadow-sm font-bold"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit2 className="w-3 h-3" />
                                Perbaiki Wilayah
                            </Button>
                        )}
                    </div>

                    <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-xl space-y-3 border border-primary/10 shadow-inner">
                        <div className="grid grid-cols-3 gap-2 items-center">
                            <span className="text-muted-foreground text-xs font-bold uppercase opacity-60">Dusun</span>
                            <div className="col-span-2">
                                {isEditing ? (
                                    <Select value={editDusun} onValueChange={setEditDusun}>
                                        <SelectTrigger className="h-8 text-xs bg-background">
                                            <SelectValue placeholder="Pilih Dusun" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(availableFilters.dusunRefs || availableFilters.dusun).map((d: string) => (
                                                <SelectItem key={d} value={d}>{d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span className="font-bold text-foreground">{item.dusun || "Belum diisi"}</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 items-center">
                            <span className="text-muted-foreground text-xs font-bold uppercase opacity-60">RT / RW</span>
                            <div className="col-span-2 flex items-center gap-2">
                                {isEditing ? (
                                    <>
                                        <Input value={editRt} onChange={(e) => setEditRt(e.target.value)} className="h-8 text-xs bg-background w-20" placeholder="RT" />
                                        <span className="text-muted-foreground">/</span>
                                        <Input value={editRw} onChange={(e) => setEditRw(e.target.value)} className="h-8 text-xs bg-background w-20" placeholder="RW" />
                                    </>
                                ) : (
                                    <span className="font-bold text-foreground font-mono">RT {item.rt || "0"} / RW {item.rw || "0"}</span>
                                )}
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex justify-end gap-2 pt-1">
                                {(currentUser?.role === "ADMIN" || currentUser?.id === item.penarikId) ? (
                                    <>
                                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsEditing(false)} disabled={isUpdating}>Batal</Button>
                                        <Button size="sm" className="h-8 text-xs gap-1.5 font-bold" onClick={handleUpdate} disabled={isUpdating}>
                                            {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            Simpan Perubahan
                                        </Button>
                                    </>
                                ) : (
                                    <div className="text-[10px] text-destructive italic p-2 bg-destructive/5 rounded border border-destructive/10 w-full text-center">
                                        Akses terbatas. Hubungi admin atau penugasan terkait.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 px-1">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Nama Wajib Pajak</span>
                            <span className="font-bold text-base leading-tight">{item.namaWp}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Alamat Objek</span>
                            <span className="text-xs text-muted-foreground leading-relaxed italic">{item.alamatObjek}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-y border-border/20">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Penarik Pajak</span>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                    {item.penarik?.name?.charAt(0) || <User className="w-3 h-3" />}
                                </div>
                                <span className="font-bold text-xs">{item.penarik?.name || "Belum Dialokasikan"}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Total Tagihan</span>
                            <span className="font-extrabold text-xl text-primary">{formatCurrency(item.ketetapan)}</span>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-lg flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Luas Tanah / Bangunan</span>
                            <span className="text-xs font-bold">{item.luasTanah} m² / {item.luasBangunan} m²</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
