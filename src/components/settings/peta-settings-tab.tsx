"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation, Upload, CheckCircle, Loader2, Map, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MapPickerDialog } from "./map-picker-dialog";

export function PetaSettingsTab() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [form, setForm] = useState({
        lat: "",
        lng: "",
        zoom: "15"
    });

    const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

    useEffect(() => {
        if (!searchParams) return;
        const cleared = searchParams.get("mapCleared");
        const error = searchParams.get("mapError");

        if (cleared === "1") {
            toast.success("Data peta berhasil dikosongkan.");
            router.replace("/settings");
        } else if (error === "1") {
            toast.error("Gagal mengosongkan data peta.");
            router.replace("/settings");
        }
    }, [searchParams, router]);

    // Ambil data config saat ini
    useEffect(() => {
        async function fetchConfig() {
            try {
                const res = await fetch("/api/village-config", { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    setForm({
                        lat: String(data.mapCenterLat || ""),
                        lng: String(data.mapCenterLng || ""),
                        zoom: String(data.mapDefaultZoom || "15")
                    });
                }
            } catch (err) {
                console.error("Gagal mengambil konfigurasi dusa:", err);
            }
        }
        fetchConfig();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            files.forEach(f => formData.append("file", f));
            formData.append("lat", form.lat);
            formData.append("lng", form.lng);
            formData.append("zoom", form.zoom);

            const res = await fetch("/api/peta/upload", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(data.message || "Konfigurasi peta berhasil diperbarui!");
                setFiles([]);
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || "Gagal memperbarui peta");
            }
        } catch (error) {
            console.error("Gagal upload peta:", error);
            toast.error("Terjadi kesalahan sistem saat memproses peta");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setDeleteLoading(true);
        try {
            const res = await fetch('/api/peta/upload', { method: 'DELETE' });
            if (res.ok) {
                // redirect with success param
                router.replace('/settings?mapCleared=1');
            } else {
                router.replace('/settings?mapError=1');
            }
        } catch (err) {
            console.error('Delete error:', err);
            router.replace('/settings?mapError=1');
        } finally {
            setDeleteLoading(false);
            setIsDeleteDialogOpen(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Map className="w-7 h-7 text-primary" />
                    Pengaturan Peta Wilayah
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Kelola koordinat dasar desa dan unggah batas wilayah administratif (GPX) secara massal.
                </p>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
                <Card className="glass border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Navigation className="text-primary h-5 w-5" />
                                Koordinat Dasar Desa
                            </CardTitle>
                            <CardDescription className="max-w-md text-xs -mt-1 font-medium">
                                Atur titik tengah peta dan tingkat pembesaran (zoom) default.
                            </CardDescription>
                        </div>
                        <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setIsMapPickerOpen(true)}
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-900/60 dark:border dark:border-blue-800 rounded-xl"
                        >
                            <Map className="w-4 h-4 mr-2" />
                            Pilih di Peta
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="lat">Latitude (Lintang)</Label>
                                <Input 
                                    id="lat"
                                    placeholder="-7.5744" 
                                    value={form.lat}
                                    onChange={e => setForm({...form, lat: e.target.value.replace(/,/g, '.')})}
                                    maxLength={15}
                                    className="bg-white/50 dark:bg-[#111827]/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lng">Longitude (Bujur)</Label>
                                <Input 
                                    id="lng"
                                    placeholder="112.235" 
                                    value={form.lng}
                                    onChange={e => setForm({...form, lng: e.target.value.replace(/,/g, '.')})}
                                    maxLength={15}
                                    className="bg-white/50 dark:bg-[#111827]/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <Label className="text-sm">Tingkat Zoom Awal: {form.zoom}</Label>
                            <Input 
                                type="range" min="10" max="18" step="1" 
                                value={form.zoom}
                                onChange={e => setForm({...form, zoom: e.target.value})}
                                className="accent-primary h-2"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-none shadow-lg">
                    <CardHeader className="pb-3">
                         <CardTitle className="flex items-center gap-2 text-lg">
                            <Upload className="text-primary h-5 w-5" />
                            Batas Wilayah Administratif
                        </CardTitle>
                        <CardDescription className="text-xs -mt-1 font-medium">Pilih banyak file GPX sekaligus untuk membangun peta desa yang utuh.</CardDescription>
                        <div className="bg-primary/5 rounded-2xl border border-primary/10 overflow-hidden">
                             <div className="bg-primary/10 px-4 py-2 border-b border-primary/10">
                                <p className="font-bold text-[10px] uppercase tracking-widest text-primary flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3" />
                                    Panduan Penamaan File (.gpx)
                                </p>
                             </div>
                             <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Level RT & RW</p>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                                            Wajib menyertakan teks <b>RT/RW</b> diikuti angka. <br/>
                                            Contoh: <code className="bg-white/50 px-1 rounded text-primary">RT01RW01.gpx</code> atau <code className="bg-white/50 px-1 rounded text-primary">RT5 RW2.gpx</code>
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Level Dusun</p>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                                            Wajib diawali kata <b>Dusun</b>. <br/>
                                            Contoh: <code className="bg-white/50 px-1 rounded text-primary">Dusun Krajan.gpx</code> atau <code className="bg-white/50 px-1 rounded text-primary">DUSUN_MUKTI.gpx</code>
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Batas Desa (Utuh)</p>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                                            Gunakan kata <b>Desa</b> atau nama desa langsung.<br/>
                                            Contoh: <code className="bg-white/50 px-1 rounded text-primary">Desa.gpx</code> atau <code className="bg-white/50 px-1 rounded text-primary">Balongbesuk.gpx</code>
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-amber-500/5 p-2 border border-amber-500/10">
                                        <p className="text-[9px] text-amber-700 dark:text-amber-400 font-bold leading-tight">
                                           💡 TIPS: Gunakan Nama File yang Jelas jika data GPX tidak memiliki metadata "Name". Sistem akan otomatis mengambil identitas wilayah dari nama file.
                                        </p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed border-primary/10 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center bg-white/30 dark:bg-black/20 hover:bg-white/50 dark:hover:bg-black/30 transition-all group">
                            <div className="rounded-2xl bg-primary/10 p-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-primary/60" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold">Seret atau Pilih File GPX</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Multi-Select Aktif</p>
                            </div>
                            <Input 
                                type="file" 
                                multiple
                                className="max-w-xs cursor-pointer bg-white/50 dark:bg-black/20 border-primary/10 rounded-xl" 
                                accept=".gpx"
                                onChange={e => setFiles(Array.from(e.target.files || []))}
                            />
                            {files.length > 0 && (
                                <div className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                                    {files.length} File Siap Diimpor
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="px-6 py-4 flex justify-end">
                        <Button 
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:opacity-90 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Simpan & Tanam Data Peta
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            <form id="clear-map-form" action="/api/peta/clear" method="post" onSubmit={handleDeleteSubmit}>
                <Card className="glass border-none shadow-lg bg-rose-500/5 dark:bg-rose-500/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-md text-rose-600 dark:text-rose-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Zona Bahaya
                        </CardTitle>
                        <CardDescription className="text-rose-500/70 dark:text-rose-400/60 text-xs font-bold tracking-widest uppercase">Kosongkan Dataset Wilayah</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 leading-relaxed font-medium mb-4">
                            Tindakan ini akan menghapus seluruh data batas administratif desa (poligon peta). Ini tidak akan menghapus data Wajib Pajak.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            disabled={deleteLoading}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 text-xs font-bold text-white transition-all hover:bg-rose-700 active:scale-95 disabled:opacity-50"
                        >
                            {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Hapus Seluruh Data Peta
                        </button>
                    </CardContent>
                </Card>

                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="dark:bg-slate-950 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-500">
                                <AlertTriangle className="h-5 w-5" />
                                Konfirmasi Hapus Data Peta
                            </DialogTitle>
                            <DialogDescription className="pt-1 dark:text-slate-400">
                                Seluruh data batas wilayah peta akan dikosongkan dari sistem.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="rounded-md bg-red-100 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-400">
                            Visualisasi di halaman Peta Utama akan kosong setelah tindakan ini dijalankan, dan perubahan ini tidak bisa dibatalkan.
                        </div>

                        <DialogFooter className="mt-4 flex-col-reverse gap-2 sm:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDeleteDialogOpen(false)}
                                disabled={deleteLoading}
                                className="w-full sm:w-auto dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                                Batal
                            </Button>
                            <button
                                type="submit"
                                form="clear-map-form"
                                disabled={deleteLoading}
                                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-300 dark:border-red-800 bg-red-600 dark:bg-red-600/80 px-3 text-xs font-medium text-white transition-colors hover:bg-red-700 dark:hover:bg-red-600 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
                            >
                                {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                {deleteLoading ? "Menghapus..." : "Ya, Hapus Data Peta"}
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </form>
            <MapPickerDialog 
                open={isMapPickerOpen}
                onOpenChange={setIsMapPickerOpen}
                defaultLat={form.lat}
                defaultLng={form.lng}
                onSave={(lat: string, lng: string) => setForm(prev => ({ ...prev, lat, lng }))}
            />
        </div>
    );
}
