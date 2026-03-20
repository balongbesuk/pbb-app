"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileStack, Upload, Trash2, Loader2, FileText, Search, Download, Zap, ChevronLeft, ChevronRight, Info, AlertCircle, FileUp, Files } from "lucide-react";
import { getArchiveList, uploadArchives, deleteArchive, processSmartArchive } from "@/app/actions/settings-actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ArchiveManager() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState(2026);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  
  const [isSmartOpen, setIsSmartOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);

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

  const handleSmartScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("year", selectedYear.toString());

    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB per chunk
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

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
            if (msg.type === "progress") {
              toast.info(`Memproses halaman ${msg.current} / ${msg.total}...`, { id: "scan-progress" });
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

  const filteredFiles = files.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()));

  // Pagination logic
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card className="glass border-none shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <FileStack className="h-5 w-5 text-blue-500" />
              Arsip Digital PBB (E-SPPT)
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
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Cari file arsip..."
              className="pl-9 bg-white/50 dark:bg-[#111827]/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Pop-up Smart Scan */}
            <Dialog open={isSmartOpen} onOpenChange={setIsSmartOpen}>
              <DialogTrigger 
                render={
                  <Button 
                    variant="default"
                    className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-none shadow-lg shadow-orange-500/20"
                  />
                }
              >
                <Zap className="h-4 w-4 fill-white" />
                Smart Scan PDF
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-3xl border-none">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
                    Smart Scan PDF
                  </DialogTitle>
                  <DialogDescription>
                    Pecah PDF besar (bundle) menjadi file individu otomatis berdasarkan NOP.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <Alert variant="default" className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="font-bold text-xs uppercase tracking-widest">Peringatan Kapasitas</AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed">
                      Untuk menjaga stabilitas sistem, mohon **bagi file PDF Anda menjadi maksimal 500 halaman** per unggahan.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 bg-zinc-50 dark:bg-zinc-900/50">
                    {scanning ? (
                      <div className="flex flex-col items-center gap-3">
                         <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                         <p className="text-xs font-bold animate-pulse text-amber-600">Sedang memproses halaman...</p>
                      </div>
                    ) : (
                      <>
                        <FileUp className="h-10 w-10 text-zinc-300 mb-3" />
                        <p className="text-xs text-muted-foreground mb-4 text-center">Tarik file ke sini atau klik tombol di bawah</p>
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
                          className="rounded-xl font-bold"
                          onClick={() => document.getElementById("smart-scan-input")?.click()}
                        >
                          Pilih File PDF
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="flex items-start gap-2 text-[10px] text-muted-foreground bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl">
                    <Info className="h-3 w-3 shrink-0 mt-0.5" />
                    <p>Sistem akan memindai teks, mencari NOP, dan menyimpan potongan PDF ke folder tahun **{selectedYear}** secara otomatis.</p>
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
                    className="gap-2 rounded-xl"
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
                    key={file}
                    className="group relative flex items-center justify-between p-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all overflow-hidden"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-lg shadow-sm">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate pr-8">{file}</p>
                        <a 
                          href={`/arsip-pbb/${selectedYear}/${file}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[9px] text-blue-500 hover:underline font-bold uppercase tracking-tighter"
                        >
                          Lihat File
                        </a>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(file)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t p-4 px-6 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-2xl">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    Halaman {currentPage} dari {totalPages} ({filteredFiles.length} total file)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
