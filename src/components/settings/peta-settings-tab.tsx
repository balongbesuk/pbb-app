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
        <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto relative">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Map className="w-8 h-8 text-primary" />
                    Pengaturan Peta Wilayah
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
                    Kelola koordinat dasar desa dan unggah batas wilayah administratif (GPX) secara massal.
                </p>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-zinc-950">
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="text-lg">Koordinat Dasar Desa</CardTitle>
                            <CardDescription className="max-w-md mt-1">
                                Atur titik tengah peta (Latitude dan Longitude) dan tingkat pembesaran (zoom) default.
                            </CardDescription>
                        </div>
                        <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setIsMapPickerOpen(true)}
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-900/60 dark:border dark:border-blue-800"
                        >
                            <Map className="w-4 h-4 mr-2" />
                            Pilih Langsung dari Peta
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="lat">Latitude (Lintang)</Label>
                                <Input 
                                    id="lat"
                                    placeholder="-7.5744" 
                                    value={form.lat}
                                    onChange={e => setForm({...form, lat: e.target.value.replace(/,/g, '.')})}
                                    maxLength={15}
                                    className="dark:bg-slate-900 dark:border-slate-800"
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
                                    className="dark:bg-slate-900 dark:border-slate-800"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Tingkat Zoom Awal: {form.zoom}</Label>
                            </div>
                            <Input 
                                type="range" min="10" max="18" step="1" 
                                value={form.zoom}
                                onChange={e => setForm({...form, zoom: e.target.value})}
                                className="accent-primary"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-zinc-950">
                    <CardHeader>
                        <CardTitle className="text-lg">Batas Wilayah Administratif</CardTitle>
                        <CardDescription>Pilih banyak file GPX sekaligus untuk membangun peta desa yang utuh.</CardDescription>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 space-y-2">
                            <p>Aplikasi mengenali file GPX berdasarkan nama file:</p>
                            <ul className="list-disc list-inside ml-4">
                                <li>RTxxRWyy (contoh: RT01RW01.gpx) – akan diproses sebagai RT dengan nomor urut.</li>
                                <li>RWyy (contoh: RW01.gpx) – diproses sebagai RW.</li>
                                <li>DUSUNnama (contoh: DusunKampungBaru.gpx) – diproses sebagai Dusun.</li>
                                <li>Desa atau Balongbesuk – diproses sebagai wilayah desa.</li>
                            </ul>
                            <p>Pastikan nama file mengikuti pola di atas agar metadata wilayah otomatis terisi dengan benar.</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-center bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                            <Upload className="w-10 h-10 text-slate-400" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Klik untuk pilih file atau seret file ke sini</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Format: .gpx (Multi-Select Aktif)</p>
                            </div>
                            <Input 
                                type="file" 
                                multiple
                                className="max-w-xs cursor-pointer border-slate-200 dark:border-slate-700 dark:bg-slate-900/50" 
                                accept=".gpx"
                                onChange={e => setFiles(Array.from(e.target.files || []))}
                            />
                            {files.length > 0 && (
                                <div className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                                    {files.length} File Terpilih Siap Diimpor
                                </div>
                            )}
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg flex gap-3 items-start border border-blue-100 dark:border-blue-900/50">
                             <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                             <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed font-medium">
                                <b>Tips:</b> Anda bisa mengunggah data RT satu per satu atau sekaligus banyak. Data wilayah baru akan otomatis digabungkan dengan yang sudah ada.
                             </p>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-end">
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
                <Card className="border-red-100 dark:border-red-900/30 shadow-sm bg-red-50/20 dark:bg-red-950/20">
                    <CardHeader>
                        <CardTitle className="text-md text-red-800 dark:text-red-500 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Zona Bahaya
                        </CardTitle>
                        <CardDescription className="text-red-600/70 dark:text-red-400/70 text-xs font-semibold">Bersihkan seluruh data peta fisik dari sistem.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-[11px] text-red-700 dark:text-red-400 leading-relaxed italic mb-4">
                            Menghapus data peta akan mengosongkan visualisasi di Peta Utama. Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            disabled={deleteLoading}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-300 dark:border-red-800 bg-red-600 dark:bg-red-600/80 px-3 text-xs font-medium text-white transition-colors hover:bg-red-700 dark:hover:bg-red-600 disabled:pointer-events-none disabled:opacity-50"
                        >
                            {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            {deleteLoading ? "Menghapus Data Peta..." : "Hapus Data Peta Saat Ini"}
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
