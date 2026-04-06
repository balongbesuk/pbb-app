"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Upload, 
  Zap, 
  Files, 
  HardDriveDownload, 
  UploadCloud, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  FileStack,
  AlertTriangle,
  FolderOpen,
  RotateCcw,
  ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { uploadArchives, clearAllArchives } from "@/app/actions/archive-actions";

export function ArchiveSettingsTab() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [scanningStatus, setScanningStatus] = useState("");
  const [scanningProgress, setScanningProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressDialogOpen, setCompressDialogOpen] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);
  const [compressStatus, setCompressStatus] = useState("");
  // Rencana: Gunakan useRef untuk AbortController jika ingin pembatalan tuntas
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCloseRestore = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    setRestoreDialogOpen(false);
    setIsRestoring(false);
  };

  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<string>("idle");
  const [restoreProgress, setRestoreProgress] = useState(0);

  // Ambil tahun pajak saat ini
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/village-config", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.tahunPajak) setSelectedYear(data.tahunPajak);
        }
      } catch {}
    }
    fetchConfig();
  }, []);

  // Fungsi-fungsi Action (Menggunakan Server Actions)
  const handleSmartScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanningProgress(0);
    setScanningStatus("Memulai...");
    
    abortControllerRef.current = new AbortController();
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("year", selectedYear.toString());
    
    try {
      const res = await fetch("/api/archive/smart-scan", { 
        method: "POST", 
        body: formData,
        signal: abortControllerRef.current.signal
      });
      
      if (!res.ok || !res.body) {
        toast.error("Gagal memulai pemrosesan.");
        setScanning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type === "progress") {
               setScanningProgress(msg.percent);
               setScanningStatus(`Halaman ${msg.current}/${msg.total} (NOP: ${msg.nopLast})`);
            } else if (msg.type === "done") {
               if (msg.success) toast.success(msg.message);
               else toast.error(msg.message);
               router.refresh();
            }
          } catch {}
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const message = error instanceof Error ? error.message : "Terjadi kesalahan sistem.";
      toast.error("Kesalahan sistem: " + message);
    } finally {
      setScanning(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append("files", files[i]);
    formData.append("year", selectedYear.toString());
    try {
      const res = await uploadArchives(formData);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message || "Gagal unggah file.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setUploading(false);
    }
  };

  const handleCompressMassal = async () => {
    setCompressProgress(0);
    setCompressStatus("Inisialisasi...");
    setIsCompressing(true);
    
    abortControllerRef.current = new AbortController();
    
    try {
       const res = await fetch("/api/compress-archives-api", { 
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ year: selectedYear }),
         signal: abortControllerRef.current.signal
       });
       
       if (!res.ok || !res.body) {
         setCompressStatus("Gagal memulai kompresi.");
         setIsCompressing(false);
         return;
       }

       const reader = res.body.getReader();
       const decoder = new TextDecoder();
       let buffer = "";
       while (true) {
         const { done, value } = await reader.read();
         if (done) break;
         buffer += decoder.decode(value, { stream: true });
         const lines = buffer.split("\n");
         buffer = lines.pop() ?? "";
         for (const line of lines) {
           if (!line.trim()) continue;
           try {
             const msg = JSON.parse(line);
             if (msg.type === "info") {
               setCompressStatus(msg.message);
             } else if (msg.type === "progress") {
               setCompressProgress(msg.percent);
               setCompressStatus(`Mengompres ${msg.current}/${msg.total}: ${msg.file}`);
             } else if (msg.type === "done") {
               if (msg.success) {
                 setCompressProgress(100);
                 setCompressStatus("Kompresi Selesai!");
                 toast.success(msg.message);
                 setTimeout(() => setCompressDialogOpen(false), 1500);
               } else {
                 setCompressStatus("Error: " + msg.message);
                 toast.error(msg.message);
               }
               router.refresh();
             }
           } catch {}
         }
       }
    } catch (error) {
       if (error instanceof DOMException && error.name === "AbortError") {
         return;
       }
       const message = error instanceof Error ? error.message : "Terjadi kesalahan sistem.";
       setCompressStatus("Kesalahan: " + message);
       toast.error("Terjadi kesalahan sistem.");
    } finally {
       setIsCompressing(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    toast.info("Menyiapkan file backup, mohon tunggu...");
    try {
       const res = await fetch(`/api/archive/backup?year=${selectedYear}`);
       if (!res.ok) {
         const text = await res.text();
         throw new Error(text || "Gagal melakukan backup.");
       }
       
       const blob = await res.blob();
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement("a");
       a.href = url;
       const timestamp = new Date().toISOString().slice(0, 10);
       a.download = `Arsip-PBB-${selectedYear}-${timestamp}.zip`;
       document.body.appendChild(a);
       a.click();
       window.URL.revokeObjectURL(url);
       document.body.removeChild(a);
       
       toast.success("Backup berhasil diunduh.");
    } catch (error) {
       const message = error instanceof Error ? error.message : "Gagal melakukan backup.";
       toast.error(message);
    } finally {
       setIsBackingUp(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);
    setRestoreDialogOpen(true);
    setRestoreStatus("idle");
    setRestoreProgress(0);
    // Reset input
    e.target.value = "";
  };

  const executeRestore = async () => {
    if (!restoreFile) return;
    setIsRestoring(true);
    setRestoreStatus("Mengunggah file backup...");
    setRestoreProgress(20);

    abortControllerRef.current = new AbortController();

    const formData = new FormData();
    formData.append("file", restoreFile);
    formData.append("year", selectedYear.toString());

    let pInterval: any = null;
    try {
       setRestoreStatus("Server sedang membersihkan folder lama & mengekstrak file...");
       setRestoreProgress(50);
       
       pInterval = setInterval(() => {
          setRestoreProgress(prev => (prev < 92 ? prev + 1 : prev));
       }, 2000);
       
       const res = await fetch("/api/archive/restore", { 
         method: "POST", 
         body: formData,
         signal: abortControllerRef.current.signal
       });
       const data = await res.json();
       
       if (res.ok) {
         setRestoreProgress(100);
         setRestoreStatus("Selesai! Arsip berhasil dipulihkan.");
         toast.success(data.message || "Arsip berhasil dipulihkan!");
         setTimeout(() => {
            setRestoreDialogOpen(false);
            router.refresh();
         }, 1500);
       } else {
         setRestoreStatus("Error: " + (data.error || "Gagal restore arsip."));
         toast.error(data.error || "Gagal restore arsip.");
       }
    } catch (error) {
       if (error instanceof DOMException && error.name === "AbortError") return;
       setRestoreStatus("Gagal: Terjadi kesalahan sistem.");
       const message = error instanceof Error ? error.message : "Terjadi kesalahan sistem.";
       toast.error("Terjadi kesalahan sistem: " + message);
    } finally {
       if (pInterval) clearInterval(pInterval);
       setIsRestoring(false);
    }
  };

  const handleReset = () => {
    setResetDialogOpen(true);
  };

  const executeReset = async () => {
    setIsClearing(true);
    try {
      const res = await clearAllArchives(selectedYear);
      if (res.success) {
        toast.success(res.message);
        setResetDialogOpen(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Gagal sistem.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FolderOpen className="w-7 h-7 text-primary" />
          Manajemen Arsip Digital
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Konfigurasi penyimpanan arsip, unggah massal, dan pemeliharaan basis data dokumen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Upload Massal (Smart Scan) */}
          <Card className="glass border-none shadow-lg overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileStack className="text-amber-500 h-5 w-5" />
                Pemilahan Bundle PDF (Super Cepat)
              </CardTitle>
              <CardDescription className="text-xs -mt-1 font-medium">
                Pecah PDF bundle/gabungan menjadi file individu otomatis berdasarkan NOP.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-amber-500/5 border-amber-500/10 text-amber-700 dark:text-amber-400 py-3">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-[10px] font-black uppercase tracking-widest mb-1">Penting</AlertTitle>
                <AlertDescription className="text-[11px] leading-relaxed">
                  Sangat disarankan menggunakan fitur ini untuk mengunggah arsip scan masal (per buku/per dusun). Sistem akan mendeteksi NOP di setiap halaman secara otomatis.
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed border-amber-500/10 rounded-2xl p-8 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col items-center justify-center gap-3">
                {scanning ? (
                  <div className="flex flex-col items-center gap-4 w-full max-w-xs transition-all duration-500">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    <div className="w-full space-y-2">
                       <div className="flex justify-between text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                          <span>{scanningStatus}</span>
                          <span>{scanningProgress}%</span>
                       </div>
                       <Progress value={scanningProgress} className="h-1.5 w-full" />
                    </div>
                    <p className="text-[10px] font-medium text-amber-700/60 animate-pulse italic">Mohon jangan tutup halaman ini...</p>
                  </div>
                ) : (
                  <>
                    <Zap className="h-8 w-8 text-amber-500/40" />
                    <p className="text-xs text-muted-foreground text-center max-w-xs">Pilih file PDF bundle (Hasil Scan Massal)</p>
                    <input type="file" id="tab-smart-scan" className="hidden" accept=".pdf" onChange={handleSmartScan} />
                    <Button 
                      variant="secondary" 
                      className="rounded-xl font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200"
                      onClick={() => document.getElementById("tab-smart-scan")?.click()}
                    >
                      Pilih Bundle PDF
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Manual Upload */}
          <Card className="glass border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="text-blue-500 h-5 w-5" />
                Upload File Manual
              </CardTitle>
              <CardDescription className="text-xs -mt-1 font-medium">
                Gunakan ini untuk upload file satuan yang sudah dinamai sesuai NOP.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-500/5 rounded-2xl border border-blue-500/10 p-4">
                <p className="font-bold text-[10px] uppercase tracking-widest text-blue-600 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" />
                  Format Nama File
                </p>
                <p className="text-[11px] text-blue-700/80 leading-relaxed italic">
                  Pastikan nama file adalah 18 digit NOP. <br/>
                  Contoh: <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">351704...pdf</code> atau <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">351704...jpg</code>
                </p>
              </div>

              <div className="border-2 border-dashed border-blue-500/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-blue-500/5 dark:bg-blue-500/10 transition-all">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-xs font-bold animate-pulse text-blue-600">Mengunggah file...</p>
                  </div>
                ) : (
                  <>
                    <Files className="h-8 w-8 text-blue-500/40" />
                    <p className="text-xs text-muted-foreground">Mendukung banyak file sekaligus (PDF/Gambar)</p>
                    <input type="file" id="tab-manual-upload" className="hidden" multiple accept=".pdf,image/*" onChange={handleManualUpload} />
                    <Button 
                      variant="secondary" 
                      className="rounded-xl font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-200"
                      onClick={() => document.getElementById("tab-manual-upload")?.click()}
                    >
                      Pilih File
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Pemeliharaan & Backup */}
        <div className="space-y-6">
          <Card className="glass border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Pemeliharaan</CardTitle>
              <CardDescription className="text-xs uppercase font-bold tracking-widest text-muted-foreground/60">Optimasi Ruang</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                     <Zap className="h-4 w-4 fill-emerald-500" />
                     <span className="text-xs font-black uppercase tracking-tight">Kompresi Massal</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Kecilkan ukuran seluruh file PDF (hingga 70%) tanpa merusak kualitas teks. Sangat berguna untuk menghemat penyimpanan server.
                  </p>
                  <Button 
                    onClick={() => {
                      setCompressProgress(0);
                      setCompressDialogOpen(true);
                    }}
                    disabled={isCompressing}
                    className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow-lg shadow-emerald-600/20 border-none transition-all duration-300 group"
                  >
                     <Zap className="w-4 h-4 mr-2 group-hover:scale-125 transition-transform" />
                     Jalankan Kompresi
                  </Button>
               </div>
            </CardContent>
          </Card>

          <Card className="glass border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Basis Data Arsip</CardTitle>
              <CardDescription className="text-xs uppercase font-bold tracking-widest text-muted-foreground/60">Backup & Restore</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 rounded-xl border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 font-bold text-xs"
                onClick={handleBackup}
                disabled={isBackingUp}
              >
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                  <HardDriveDownload className="h-4 w-4" />
                </div>
                Backup Seluruh Arsip (.zip)
              </Button>

              <input type="file" id="tab-restore-zip" className="hidden" accept=".zip" onChange={handleRestore} />
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 rounded-xl border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 font-bold text-xs"
                onClick={() => document.getElementById("tab-restore-zip")?.click()}
                disabled={isRestoring}
              >
                <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600">
                  <UploadCloud className="h-4 w-4" />
                </div>
                Restore dari Backup
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-none shadow-lg bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-rose-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Zona Berbahaya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] text-rose-700/80 dark:text-rose-400/80 leading-relaxed font-medium mb-3">
                Menghapus file secara permanen dari server. Tindakan ini tidak dapat dibatalkan.
              </p>
              <Button 
                variant="ghost" 
                className="w-full text-xs font-bold text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 rounded-xl"
                onClick={handleReset}
                disabled={isClearing}
              >
                {isClearing && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                Reset Semua File Arsip
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Dialog Restore Kustom */}
      <Dialog open={restoreDialogOpen} onOpenChange={handleCloseRestore}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-violet-500" />
              Pemulihan Arsip Digital
            </DialogTitle>
            <DialogDescription>
              Anda akan memulihkan data arsip dari file backup.
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
                    <p className="text-[10px] text-muted-foreground">Tahun Target: {selectedYear}</p>
                </div>
             </div>

             {isRestoring ? (
               <div className="space-y-6 py-2 animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-violet-400/20 rounded-full animate-ping" />
                        <div className="relative bg-violet-100 dark:bg-violet-900/40 p-5 rounded-full border-4 border-white dark:border-zinc-950 shadow-xl">
                            <RotateCcw className="w-10 h-10 text-violet-600 animate-spin-slow" />
                        </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end mb-1">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest animate-pulse">
                                {restoreStatus}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-medium italic">
                                {restoreProgress < 50 ? "Sedang mengirim data ke server..." : 
                                 restoreProgress < 90 ? "Server sedang merestore fisik file..." : 
                                 "Hampir selesai, sedang sinkronisasi..."}
                            </span>
                        </div>
                        <span className="text-xl font-black text-violet-600">{restoreProgress}%</span>
                    </div>
                    <Progress value={restoreProgress} className="h-3 w-full bg-violet-100 dark:bg-violet-950/40" />
                    
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-start gap-3 shadow-sm transition-all duration-500">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 animate-bounce" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider mb-1">Penting: Proses Kritis</p>
                            <p className="text-[11px] leading-relaxed text-amber-800/80 dark:text-amber-400/80 font-medium">
                                <b>DILARANG MENUTUP TAB</b> atau me-refresh halaman! Memutus koneksi sekarang dapat menyebabkan data arsip menjadi korup atau hilang separuh.
                            </p>
                        </div>
                    </div>
                  </div>
               </div>
             ) : (
                <Alert className="bg-rose-50 border-rose-100 text-rose-800 py-3">
                   <ShieldAlert className="h-4 w-4 text-rose-600" />
                   <AlertDescription className="text-[11px] font-medium leading-relaxed">
                     Peringatan: Seluruh arsip yang ada pada tahun <b>{selectedYear}</b> akan dihapus dan diganti dengan isi file backup ini.
                   </AlertDescription>
                </Alert>
             )}
          </div>

          <DialogFooter className="sm:justify-between items-center gap-4">
             {!isRestoring && (
               <>
                 <Button variant="ghost" onClick={() => setRestoreDialogOpen(false)} className="rounded-xl font-bold">
                    Batal
                 </Button>
                 <Button onClick={executeRestore} className="rounded-xl bg-violet-600 hover:bg-violet-700 font-bold px-8 shadow-lg shadow-violet-600/20">
                    Lanjutkan Restore
                 </Button>
               </>
             )}
             {isRestoring && restoreProgress === 100 && (
               <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mx-auto">
                 <CheckCircle className="w-3 h-3" /> Berhasil! Me-refresh halaman...
               </p>
             )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog 
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="Hapus Semua Arsip?"
        description={
            <>
                Anda akan menghapus <b>SELURUH</b> file arsip digital untuk tahun <b>{selectedYear}</b> secara permanen dari server. Tindakan ini tidak dapat dibatalkan.
            </>
        }
        onConfirm={executeReset}
        isDeleting={isClearing}
      />

      {/* Dialog Kompresi Kustom */}
      <Dialog open={compressDialogOpen} onOpenChange={isCompressing ? () => {} : setCompressDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={!isCompressing}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500 fill-emerald-500" />
              Optimalisasi Penyimpanan
            </DialogTitle>
            <DialogDescription className="text-rose-600 font-bold animate-pulse">
              PENTING: Jangan tutup halaman ini! Proses tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
             {!isCompressing && compressProgress === 0 ? (
               <Alert className="bg-amber-50 border-amber-100 text-amber-800 py-3">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-[11px] font-medium leading-relaxed">
                    Tindakan ini akan mengompres seluruh PDF guna menghemat ruang. <b>Proses ini harus berjalan hingga selesai dan tidak bisa dihentikan di tengah jalan.</b>
                  </AlertDescription>
               </Alert>
             ) : (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                   <div className="flex justify-between items-end mb-1">
                       <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest animate-pulse truncate max-w-[80%]">
                         {compressStatus}
                       </span>
                       <span className="text-xs font-black">{compressProgress}%</span>
                   </div>
                   <Progress value={compressProgress} className="h-2 w-full" />
                   
                   <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2">
                      <ShieldAlert className="w-3 h-3 text-rose-600 mt-0.5" />
                      <p className="text-[9px] text-rose-700 leading-tight">
                        <b>DILARANG MENUTUP TAB INI:</b> Kompresi sedang memanipulasi file fisik di server. Menutup browser secara paksa berisiko menyebabkan file arsip rusak atau korup.
                      </p>
                   </div>
                </div>
             )}
          </div>

          <DialogFooter className="sm:justify-between items-center gap-4">
             {!isCompressing && compressProgress === 0 ? (
               <>
                 <Button variant="ghost" onClick={() => setCompressDialogOpen(false)} className="rounded-xl font-bold">
                    Batal
                 </Button>
                 <Button onClick={handleCompressMassal} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold px-8 shadow-lg shadow-emerald-600/20">
                    Mulai Kompresi
                 </Button>
               </>
             ) : compressProgress === 100 ? (
                <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mx-auto">
                    <CheckCircle className="w-3 h-3" /> Berhasil Dioptimalkan!
                </p>
             ) : (
               <p className="text-[10px] text-muted-foreground mx-auto flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Sedang bekerja...
               </p>
             )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
