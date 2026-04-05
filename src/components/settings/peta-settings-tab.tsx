"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
    Navigation, 
    Upload, 
    CheckCircle, 
    Loader2, 
    Map, 
    Trash2, 
    AlertTriangle,
    HardDriveDownload,
    UploadCloud,
    RotateCcw,
    Files,
    ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [restoreStatus, setRestoreStatus] = useState<string>("idle");
    const [restoreProgress, setRestoreProgress] = useState(0);

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

    const handleBackup = async () => {
        setIsBackingUp(true);
        toast.info("Menyiapkan cadangan peta, mohon tunggu...");
        try {
            const res = await fetch("/api/peta/backup");
            if (!res.ok) throw new Error("Gagal mengunduh cadangan peta.");
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const timestamp = new Date().toISOString().slice(0, 10);
            a.download = `Backup-Peta-${timestamp}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success("Cadangan peta berhasil diunduh.");
            } catch (err) {
            const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mencadangkan peta.";
            toast.error(message);
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleRestoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setRestoreFile(file);
        setRestoreDialogOpen(true);
        setRestoreStatus("idle");
        setRestoreProgress(0);
        e.target.value = "";
    };

    const executeRestore = async () => {
        if (!restoreFile) return;
        setIsRestoring(true);
        setRestoreStatus("Mengunggah cadangan...");
        setRestoreProgress(30);

        try {
            const formData = new FormData();
            formData.append("file", restoreFile);

            setRestoreStatus("Mengekstrak dan memulihkan data spasial...");
            setRestoreProgress(60);

            const res = await fetch("/api/peta/restore", {
                method: "POST",
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                setRestoreProgress(100);
                setRestoreStatus("Berhasil!");
                toast.success(data.message || "Data peta berhasil dipulihkan!");
                setTimeout(() => {
                    setRestoreDialogOpen(false);
                    router.refresh();
                }, 1500);
            } else {
                toast.error(data.error || "Gagal memulihkan peta.");
                setRestoreStatus("Gagal: " + (data.error || "Cek file ZIP Anda"));
            }
        } catch {
            toast.error("Terjadi kesalahan sistem saat pemulihan.");
            setRestoreStatus("Gagal: Kesalahan sistem.");
        } finally {
            setIsRestoring(false);
        }
    };

    const handleDeleteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setDeleteLoading(true);
        try {
            const res = await fetch('/api/peta/upload', { method: 'DELETE' });
            if (res.ok) {
                router.replace('/settings?mapCleared=1');
            } else {
                router.replace('/settings?mapError=1');
            }
        } catch {
            router.replace('/settings?mapError=1');
        } finally {
            setDeleteLoading(false);
            setIsDeleteDialogOpen(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Map className="w-7 h-7 text-primary" />
                    Pengaturan Peta Wilayah
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Kelola koordinat dasar desa dan unggah batas wilayah administratif (GPX) secara massal.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kolom Kiri: Pengaturan Utama */}
                <div className="lg:col-span-2 space-y-6">
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
                        <CardFooter className="px-6 py-4 flex justify-end bg-black/5 dark:bg-white/5 border-t border-white/10 dark:border-white/5">
                            <Button 
                                type="button"
                                onClick={handleUpload}
                                disabled={loading}
                                className="bg-primary hover:opacity-90 flex items-center gap-2 rounded-xl"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Simpan & Tanam Data Peta
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Kolom Kanan: Sidebar Pemeliharaan */}
                <div className="space-y-6">
                    <Card className="glass border-none shadow-lg">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-bold">Basis Data Peta</CardTitle>
                            <CardDescription className="text-xs uppercase font-bold tracking-widest text-muted-foreground/60">Backup & Restore Wilayah</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button 
                                variant="outline" 
                                className="w-full justify-start gap-3 rounded-xl border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 font-bold text-xs"
                                onClick={handleBackup}
                                disabled={isBackingUp}
                            >
                                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                                    {isBackingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDriveDownload className="h-4 w-4" />}
                                </div>
                                {isBackingUp ? "Menyiapkan..." : "Backup Seluruh Peta (.zip)"}
                            </Button>

                            <input type="file" id="peta-restore-zip" className="hidden" accept=".zip" onChange={handleRestoreChange} />
                            <Button 
                                variant="outline" 
                                className="w-full justify-start gap-3 rounded-xl border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 font-bold text-xs"
                                onClick={() => document.getElementById("peta-restore-zip")?.click()}
                                disabled={isRestoring}
                            >
                                <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600">
                                    {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                                </div>
                                Restore dari Cadangan
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="glass border-none shadow-lg bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-rose-600 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Zona Bahaya
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[10px] text-rose-700/80 dark:text-rose-400/80 leading-relaxed font-medium mb-3">
                                Tindakan ini akan menghapus seluruh data batas administratif desa (poligon peta). Ini tidak akan menghapus data Wajib Pajak.
                            </p>
                            <Button
                                variant="ghost"
                                onClick={() => setIsDeleteDialogOpen(true)}
                                disabled={deleteLoading}
                                className="w-full text-xs font-bold text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 rounded-xl"
                            >
                                {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                Hapus Seluruh Data Peta
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <MapPickerDialog 
                open={isMapPickerOpen}
                onOpenChange={setIsMapPickerOpen}
                defaultLat={form.lat}
                defaultLng={form.lng}
                onSave={(lat: string, lng: string) => setForm(prev => ({ ...prev, lat, lng }))}
            />

            <Dialog open={restoreDialogOpen} onOpenChange={isRestoring ? () => {} : setRestoreDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RotateCcw className="w-5 h-5 text-violet-500" />
                            Pemulihan Data Peta
                        </DialogTitle>
                        <DialogDescription>
                            Anda akan memulihkan seluruh batas wilayah dari file cadangan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-violet-500/5 border border-violet-500/10 rounded-2xl p-4 flex items-center gap-4">
                            <div className="p-3 bg-violet-500/10 rounded-xl text-violet-600">
                                <Files className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black uppercase text-violet-600 tracking-wider mb-0.5">File Terpilih</p>
                                <p className="text-sm font-bold truncate">{restoreFile?.name || "Tidak ada file"}</p>
                            </div>
                        </div>

                        {isRestoring ? (
                            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest animate-pulse">
                                        {restoreStatus}
                                    </span>
                                    <span className="text-xs font-black">{restoreProgress}%</span>
                                </div>
                                <Progress value={restoreProgress} className="h-2 w-full" />
                            </div>
                        ) : (
                            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 flex items-start gap-3">
                                <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5" />
                                <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
                                    <b>Peringatan:</b> Seluruh data peta (GPX) yang ada saat ini akan dihapus dan diganti dengan data dari file cadangan ini.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="sm:justify-between items-center gap-4">
                        {!isRestoring && (
                            <>
                                <Button variant="ghost" onClick={() => setRestoreDialogOpen(false)} className="rounded-xl font-bold text-sm">
                                    Batal
                                </Button>
                                <Button onClick={executeRestore} className="rounded-xl bg-violet-600 hover:bg-violet-700 font-bold px-8 shadow-lg shadow-violet-600/20 text-white border-none text-sm">
                                    Lanjutkan Restore
                                </Button>
                            </>
                        )}
                        {isRestoring && restoreProgress === 100 && (
                            <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mx-auto uppercase tracking-widest">
                                <CheckCircle className="w-3 h-3" /> Berhasil! Memperbarui halaman...
                            </p>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                            onClick={handleDeleteSubmit}
                            disabled={deleteLoading}
                            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-300 dark:border-red-800 bg-red-600 dark:bg-red-600/80 px-3 text-xs font-medium text-white transition-colors hover:bg-red-700 dark:hover:bg-red-600 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
                        >
                            {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            {deleteLoading ? "Menghapus..." : "Ya, Hapus Data Peta"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
