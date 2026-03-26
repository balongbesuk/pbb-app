"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileStack, Upload, Trash2, Loader2, FileText, Search, Download, Zap, ChevronLeft, ChevronRight, Info, AlertCircle, FileUp, Files, HardDriveDownload, UploadCloud } from "lucide-react";
import { getArchiveList, uploadArchives, deleteArchive, processSmartArchive } from "@/app/actions/settings-actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TaxTablePagination } from "@/components/tax/table/tax-table-pagination";

function generateSecureSessionId(): string {
  // Generate a cryptographically secure random 16-byte (128-bit) identifier,
  // encoded in base36 for compactness, optionally prefixed with a timestamp.
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const randomPart = Array.from(randomBytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("");
  const timePart = Date.now().toString(36);
  return `${timePart}-${randomPart}`;
}

export function ArchiveManager() {
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState(2026);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  
  const [isSmartOpen, setIsSmartOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    toast.info("Membuat backup arsip... Mohon tunggu.");
    try {
      const resp = await fetch("/api/backup-archive", { method: "POST" });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Gagal" }));
        toast.error(err.error || "Backup gagal.");
        return;
      }
      const blob = await resp.blob();
      const disposition = resp.headers.get("Content-Disposition") || "";
      const nameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = nameMatch ? nameMatch[1] : `backup-arsip-pbb.zip`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup berhasil diunduh!");
    } catch (e: any) {
      toast.error(`Gagal backup: ${e.message}`);
    }
    setIsBackingUp(false);
  };

  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".zip")) {
      toast.error("Pilih file ZIP hasil backup.");
      return;
    }
    if (!confirm(`Restore akan menimpa arsip yang ada dengan isi file "${file.name}". Lanjutkan?`)) return;

    setIsRestoring(true);
    const CHUNK_SIZE = 2 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const sessionId = generateSecureSessionId();

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const fd = new FormData();
        fd.append("chunk", new File([chunk], file.name));
        fd.append("sessionId", sessionId);
        fd.append("chunkIndex", i.toString());
        fd.append("filename", file.name);
        const r = await fetch("/api/upload-chunk", { method: "POST", body: fd });
        if (!r.ok) { toast.error(`Gagal upload bagian ${i + 1}`); setIsRestoring(false); return; }
        const pct = Math.round(((i + 1) / totalChunks) * 100);
        toast.info(`Mengunggah ZIP... ${pct}%`, { id: "restore-progress" });
      }
      toast.dismiss("restore-progress");
      toast.info("Mengekstrak arsip...");

      const fd = new FormData();
      fd.append("sessionId", sessionId);
      fd.append("filename", file.name);
      fd.append("totalChunks", totalChunks.toString());
      const resp = await fetch("/api/restore-archive", { method: "POST", body: fd });
      if (!resp.ok || !resp.body) { toast.error(`Error: ${resp.status}`); setIsRestoring(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type === "status") toast.info(msg.message, { id: "restore-progress" });
            else if (msg.type === "progress") toast.info(`Memulihkan file ${msg.current}/${msg.total}...`, { id: "restore-progress" });
            else if (msg.type === "done") {
              toast.dismiss("restore-progress");
              if (msg.success) { toast.success(msg.message); fetchArchives(selectedYear); }
              else toast.error(msg.message);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err: any) {
      toast.error(`Gagal restore: ${err.message}`);
    }
    setIsRestoring(false);
    e.target.value = "";
  };

  useEffect(() => {
    async function init() {
       try {
         const resp = await fetch("/api/village-config");
         const config = await resp.json();
         if (config.tahunPajak) setSelectedYear(config.tahunPajak);
       } catch (e) {}
    }
    init();
  }, []);

  const fetchArchives = async (year: number) => {
    setLoading(true);
    const data = await getArchiveList(year);
    setFiles(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchArchives(selectedYear);
    setCurrentPage(1);
  }, [selectedYear]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Ref untuk nyimpen abort controller agar bisa dibatalkan secara live
  const compressAbortRef = useRef<AbortController | null>(null);

  const handleCompressMassal = async () => {
    if (!confirm("Fitur ini akan mengecilkan semua ukuran PDF secara massal di latar belakang (Bisa memakan waktu lama tergantung jumlah file). Lanjutkan?")) return;
    
    setIsCompressing(true);
    const controller = new AbortController();
    compressAbortRef.current = controller;

    try {
      const resp = await fetch("/api/compress-archives-api", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: selectedYear }),
        signal: controller.signal // pasang signal pemutus
      });
      
      if (!resp.ok || !resp.body) {
        toast.error("Gagal memulai kompresi massal.");
        setIsCompressing(false);
        return;
      }
      
      const reader = resp.body.getReader();
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
               toast.info(`Mengompres file ${msg.current}/${msg.total} (${msg.percent}%)...`, { id: "compress-progress" });
            } else if (msg.type === "done") {
               toast.dismiss("compress-progress");
               if (msg.success) toast.success(msg.message);
               else toast.error(msg.message);
               fetchArchives(selectedYear);
            }
          } catch { /* skip */ }
        }
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        toast.dismiss("compress-progress");
        toast.error("Kompresi Dibatalkan.");
      } else {
        toast.error(`Terjadi kesalahan kompresi: ${e.message}`);
        toast.dismiss("compress-progress");
      }
    }
    setIsCompressing(false);
    compressAbortRef.current = null;
  };

  const handleCancelCompress = () => {
    if (compressAbortRef.current) {
      compressAbortRef.current.abort();
    }
  };

  const handleSmartScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("year", selectedYear.toString());

    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB per chunk
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const sessionId = generateSecureSessionId();

    try {
      // Step 1: Upload file in chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const chunkBlob = file.slice(start, start + CHUNK_SIZE);
        const fd = new FormData();
        fd.append("chunk", new File([chunkBlob], file.name));
        fd.append("sessionId", sessionId);
        fd.append("chunkIndex", i.toString());
        fd.append("filename", file.name);

        const r = await fetch("/api/upload-chunk", { method: "POST", body: fd });
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: "Unknown" }));
          toast.error(`Gagal mengunggah bagian ${i + 1}: ${err.error}`);
          setScanning(false);
          e.target.value = "";
          return;
        }
        const pct = Math.round(((i + 1) / totalChunks) * 100);
        toast.info(`Mengunggah... ${pct}% (${i + 1}/${totalChunks})`, { id: "upload-progress" });
      }

      toast.dismiss("upload-progress");
      toast.info("Upload selesai. Memulai pemindaian...");

      // Step 2: Trigger processing with just metadata
      const fd = new FormData();
      fd.append("sessionId", sessionId);
      fd.append("filename", file.name);
      fd.append("totalChunks", totalChunks.toString());
      fd.append("year", selectedYear.toString());

      const resp = await fetch("/api/smart-scan", { method: "POST", body: fd });
      if (!resp.ok || !resp.body) {
        toast.error(`Error Server: ${resp.status}`);
        setScanning(false);
        e.target.value = "";
        return;
      }

      // Step 3: Read streaming NDJSON progress
      const reader = resp.body.getReader();
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
            if (msg.type === "status") {
              toast.info(msg.message, { id: "scan-progress" });
            } else if (msg.type === "progress") {
              const label = msg.phase === "save"
                ? `Mentransfer arsip mentah ${msg.current} / ${msg.total}...`
                : `Mendeteksi NOP ${msg.current} / ${msg.total}...`;
              toast.info(label, { id: "scan-progress" });
            } else if (msg.type === "done" || msg.success !== undefined) {
              toast.dismiss("scan-progress");
              if (msg.success) {
                toast.success(msg.message);
                setIsSmartOpen(false);
                fetchArchives(selectedYear);
              } else {
                toast.error(msg.message || "Gagal memproses file.");
              }
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (e: any) {
      toast.error(`Terjadi kesalahan: ${e.message || "Unknown error"}`);
    }
    setScanning(false);
    e.target.value = "";
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("year", selectedYear.toString());
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("files", selectedFiles[i]);
    }

    try {
      const res = await uploadArchives(formData);
      if (res.success) {
        toast.success(res.message);
        setIsManualOpen(false);
        fetchArchives(selectedYear);
      } else {
        toast.error(res.message || "Gagal mengunggah file.");
      }
    } catch (e: any) {
      toast.error(`Gagal mengunggah: ${e.message || "Unknown error"}`);
    }
    setUploading(false);
    // Reset input
    e.target.value = "";
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Hapus file ${filename}?`)) return;
    const res = await deleteArchive(filename, selectedYear);
    if (res.success) {
      toast.success("File dihapus");
      fetchArchives(selectedYear);
    } else {
      toast.error(res.message);
    }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Pagination logic
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalSizeB = filteredFiles.reduce((acc, f) => acc + f.size, 0);
  const totalSizeMB = (totalSizeB / 1024 / 1024).toFixed(2);
  const totalSizeGB = (totalSizeB / 1024 / 1024 / 1024).toFixed(2);
  const displaySize = totalSizeB > 1024 * 1024 * 1024 ? `${totalSizeGB} GB` : `${totalSizeMB} MB`;

  return (
    <Card className="glass border-none shadow-lg mt-6">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <FileStack className="h-5 w-5 text-blue-500" />
              Arsip Digital PBB 
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Kapasitas: {displaySize}
              </span>
            </CardTitle>
            <CardDescription className="mt-1">
              Beri nama file sesuai NOP (misal: 3517...pdf) agar otomatis terdeteksi saat pencarian publik.
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3 bg-primary/5 p-2 px-3 rounded-2xl border border-primary/10">
            <Label htmlFor="year-select" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground whitespace-nowrap">
              Tahun Arsip:
            </Label>
            <Input
              id="year-select"
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value) || 2026)}
              className="h-8 w-24 bg-white dark:bg-zinc-950 font-bold text-center border-none shadow-inner"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                placeholder="Cari file arsip..."
                className="pl-9 bg-white/50 dark:bg-[#111827]/50 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 w-full lg:w-auto">
              {/* Pop-up Smart Scan */}
              <Dialog open={isSmartOpen} onOpenChange={setIsSmartOpen}>
                <DialogTrigger 
                  render={
                    <Button 
                      variant="default"
                      className="w-full sm:w-auto gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-none shadow-lg shadow-orange-500/20 rounded-xl"
                    />
                  }
                >
                  <FileStack className="h-4 w-4 fill-white text-white" />
                  Upload & Pemilahan Cepat
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-3xl border-none">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileStack className="h-5 w-5 text-amber-500" />
                      Memilah PDF Arsip
                    </DialogTitle>
                    <DialogDescription>
                      Pecah PDF besar (bundle) menjadi file individu otomatis berdasarkan NOP dalam kecepatan kilat. 
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <Alert variant="default" className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="font-bold text-xs uppercase tracking-widest">Informasi</AlertTitle>
                      <AlertDescription className="text-xs leading-relaxed">
                        Sistem ini sekarang memilah file secara *instan* tanpa kompresi, agar Anda dapat meng-upload file tebal sekaligus. Jika ukurannya jadi besar, jalankan **Kompresi Massal** dari Dashboard ini nanti!
                      </AlertDescription>
                    </Alert>

                    <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 bg-zinc-50 dark:bg-zinc-900/50">
                      {scanning ? (
                        <div className="flex flex-col items-center gap-3">
                           <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                           <p className="text-xs font-bold animate-pulse text-amber-600">Sedang memilah super cepat...</p>
                        </div>
                      ) : (
                        <>
                          <FileUp className="h-10 w-10 text-zinc-300 mb-3" />
                          <p className="text-xs text-muted-foreground mb-4 text-center">Tarik file ke sini atau klik tombol di bawah (Bisa Tembus Ribuan Lembar)</p>
                          <input
                            type="file"
                            id="smart-scan-input"
                            className="hidden"
                            onChange={handleSmartScan}
                            accept=".pdf"
                            disabled={scanning}
                          />
                          <Button 
                            variant="secondary" 
                            className="w-full sm:w-auto rounded-xl font-bold"
                            onClick={() => document.getElementById("smart-scan-input")?.click()}
                          >
                            Pilih Bundle PDF
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Pop-up Manual Upload */}
              <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
                <DialogTrigger 
                  render={
                    <Button 
                      variant="outline"
                      className="w-full sm:w-auto gap-2 rounded-xl"
                    />
                  }
                >
                  <Upload className="h-4 w-4" />
                  Manual Upload
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-3xl border-none">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Files className="h-5 w-5 text-blue-500" />
                      Manual Upload
                    </DialogTitle>
                    <DialogDescription>
                      Unggah satu atau banyak file PDF/Gambar secara manual.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl space-y-2">
                       <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Aturan Penamaan</p>
                       <p className="text-[11px] text-blue-700/80 leading-relaxed italic">
                          "Agar terdeteksi di pencarian publik, pastikan nama file adalah **NOMOR NOP** warga. Contoh: **351704001900100100.pdf**"
                       </p>
                    </div>

                    <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 bg-zinc-50 dark:bg-zinc-900/50">
                      {uploading ? (
                        <div className="flex flex-col items-center gap-3">
                           <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                           <p className="text-xs font-bold animate-pulse text-blue-600">Mengunggah file...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-zinc-300 mb-3" />
                          <p className="text-xs text-muted-foreground mb-4 text-center">Pilih file PDF atau Gambar (JPG/PNG)</p>
                          <input
                            type="file"
                            id="manual-upload-input"
                            multiple
                            className="hidden"
                            onChange={handleManualUpload}
                            accept=".pdf,image/*"
                            disabled={uploading}
                          />
                          <Button 
                            variant="secondary" 
                            className="rounded-xl font-bold"
                            onClick={() => document.getElementById("manual-upload-input")?.click()}
                          >
                            Pilih File
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <div className="text-[10px] text-center text-muted-foreground">
                      File akan disimpan ke folder arsip tahun **{selectedYear}**.
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center sm:justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-full sm:w-auto px-2 pb-2 sm:pb-0 border-b border-zinc-200/50 sm:border-none">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
              Alat Pemeliharaan
            </div>
            
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
              {/* Tombol Kompresi Massal */}
              {isCompressing ? (
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full sm:w-auto gap-2 bg-rose-500 hover:bg-rose-600 text-white border-none shadow-md shadow-rose-500/20 rounded-xl"
                  onClick={handleCancelCompress}
                >
                  <div className="h-3 w-3 rounded-sm border-2 border-white bg-white/20 animate-pulse" />
                  Batalkan Kompresi
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  className="w-full sm:w-auto gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-none shadow-md shadow-green-500/20 rounded-xl"
                  onClick={handleCompressMassal}
                  disabled={files.length === 0}
                >
                  <Zap className="h-3 w-3 fill-white" />
                  Kompresi Massal
                </Button>
              )}

              <div className="grid grid-cols-2 sm:flex items-center gap-2">
                {/* Backup Arsip */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto gap-2 rounded-xl border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  onClick={handleBackup}
                  disabled={isBackingUp}
                >
                  {isBackingUp
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <HardDriveDownload className="h-3 w-3" />
                  }
                  <span className="hidden sm:inline">Backup</span>
                  <span className="sm:hidden">Backup</span>
                </Button>

                {/* Restore Arsip */}
                <>
                  <input
                    type="file"
                    id="restore-zip-input"
                    className="hidden"
                    accept=".zip"
                    onChange={handleRestore}
                    disabled={isRestoring}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto gap-2 rounded-xl border-violet-500/30 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                    onClick={() => document.getElementById("restore-zip-input")?.click()}
                    disabled={isRestoring}
                  >
                    {isRestoring
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <UploadCloud className="h-3 w-3" />
                    }
                    <span className="hidden sm:inline">Restore</span>
                    <span className="sm:hidden">Restore</span>
                  </Button>
                </>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed p-1 min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/60">
              <FileText className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm font-medium">Belum ada file arsip yang ditemukan.</p>
              <p className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-50">Upload file PDF/Gambar di sini.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
                {paginatedFiles.map((file) => (
                  <div 
                    key={file.name}
                    className="group relative flex items-center justify-between p-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all overflow-hidden"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-lg shadow-sm">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate pr-8">{file.name}</p>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-muted-foreground font-medium bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-sm">{(file.size / 1024).toFixed(1)} KB</span>
                            <a 
                            href={`/arsip-pbb/${selectedYear}/${file.name}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[9px] text-blue-500 hover:underline font-bold uppercase tracking-tighter"
                            >
                            Lihat File
                            </a>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(file.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

                <div className="border-t pt-4 px-2">
                  <TaxTablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    total={filteredFiles.length}
                    label="Arsip PDF"
                    onPageChange={setCurrentPage}
                  />
                </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
