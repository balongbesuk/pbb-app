"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileStack, Trash2, Loader2, FileText, Search, AlertTriangle, CheckCircle2, Files, Printer, FileDown, X } from "lucide-react";
import { getArchiveList, deleteArchive, getArchiveStats } from "@/app/actions/archive-actions";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TaxTablePagination } from "@/components/tax/table/tax-table-pagination";

export function ArchiveManager() {
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState(2026);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState<{ name: string; year: number } | null>(null);
  const [archiveStats, setArchiveStats] = useState({ connected: 0, disconnected: 0, total: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    async function init() {
       try {
         const resp = await fetch("/api/village-config");
         const config = await resp.json();
         if (config.tahunPajak) setSelectedYear(config.tahunPajak);
       } catch {}
    }
    init();
  }, []);

  const fetchArchives = async (year: number) => {
    setLoading(true);
    setLoadingStats(true);
    const [data, stats] = await Promise.all([
      getArchiveList(year),
      getArchiveStats(year)
    ]);
    setFiles(data);
    setArchiveStats(stats);
    setLoading(false);
    setLoadingStats(false);
  };

  useEffect(() => {
    fetchArchives(selectedYear);
    setCurrentPage(1);
  }, [selectedYear]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleDeleteRequest = (filename: string) => {
    setFileToDelete(filename);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    const res = await deleteArchive(fileToDelete, selectedYear);
    if (res.success) {
      toast.success("File berhasil dihapus");
      fetchArchives(selectedYear);
      setIsDeleteDialogOpen(false);
    } else {
      toast.error(res.message);
    }
    setIsDeleting(false);
    setFileToDelete(null);
  };

  const handleViewFile = (filename: string) => {
    setViewingFile({ name: filename, year: selectedYear });
    setIsViewerOpen(true);
  };

  const handlePrint = () => {
    if (iframeRef.current) {
        iframeRef.current.contentWindow?.focus();
        iframeRef.current.contentWindow?.print();
    }
  };

  const handleDownload = () => {
    if (!viewingFile) return;
    const link = document.createElement("a");
    link.href = `/arsip-pbb/${viewingFile.year}/${viewingFile.name}`;
    link.download = viewingFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
              Daftar arsip digital yang tersimpan di server.
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
           <div className="hover:border-primary/20 group space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="rounded-xl border border-blue-100 bg-blue-500/5 p-2.5 dark:border-blue-900/40 text-blue-600">
                  <Files className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="rounded-full border-blue-500/20 bg-blue-500/5 px-2 py-0.5 text-[9px] font-black text-blue-600 uppercase">
                  Penyimpanan
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Total Arsip</p>
                <div className="text-foreground text-3xl leading-none font-black tracking-tighter">
                  {loadingStats ? "..." : archiveStats.total}
                </div>
                <p className="text-muted-foreground flex items-center gap-1.5 pt-1 text-[10px] leading-relaxed uppercase font-bold opacity-60">
                  <span className="h-1 w-1 rounded-full bg-blue-500" />
                  Kapasitas: {displaySize}
                </p>
              </div>
           </div>

           <div className="hover:border-primary/20 group space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="rounded-xl border border-emerald-100 bg-emerald-500/5 p-2.5 dark:border-emerald-900/40 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="rounded-full border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[9px] font-black text-emerald-600 uppercase">
                  Data Valid
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Terkoneksi</p>
                <div className="text-emerald-600 dark:text-emerald-400 text-3xl leading-none font-black tracking-tighter">
                  {loadingStats ? "..." : archiveStats.connected}
                </div>
                <p className="text-muted-foreground flex items-center gap-1.5 pt-1 text-[10px] leading-relaxed uppercase font-bold opacity-60">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                  Sesuai NOP Database
                </p>
              </div>
           </div>

           <div className="hover:border-primary/20 group space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="rounded-xl border border-rose-100 bg-rose-500/5 p-2.5 dark:border-rose-900/40 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="rounded-full border-rose-500/20 bg-rose-500/5 px-2 py-0.5 text-[9px] font-black text-rose-600 uppercase">
                  Perlu Cek
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Yatim / Anonim</p>
                <div className="text-rose-600 dark:text-rose-400 text-3xl leading-none font-black tracking-tighter">
                  {loadingStats ? "..." : archiveStats.disconnected}
                </div>
                <p className="text-muted-foreground flex items-center gap-1.5 pt-1 text-[10px] leading-relaxed uppercase font-bold opacity-60">
                  <span className="h-1 w-1 rounded-full bg-rose-500" />
                  NOP Tidak Terdaftar
                </p>
              </div>
           </div>
        </div>

        <div className="pt-2">
           <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
              <Input
                placeholder="Masukkan NOP atau Nama File untuk mencari..."
                className="pl-11 h-12 bg-zinc-50 dark:bg-[#09090b] border-zinc-200 dark:border-white/5 rounded-2xl shadow-inner focus:ring-blue-500 transition-all font-medium text-sm pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
              <p className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-50">Upload file PDF/Gambar di Pengaturan.</p>
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
                            <button 
                            onClick={() => handleViewFile(file.name)}
                            className="text-[9px] text-blue-500 hover:underline font-bold uppercase tracking-tighter"
                            >
                            Lihat File
                            </button>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteRequest(file.name)}
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl border-none p-0 overflow-hidden bg-white dark:bg-zinc-950 shadow-2xl">
          <div className="p-8 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse" />
            </div>
            
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mb-2 uppercase tracking-tight">
              Konfirmasi Hapus File
            </h3>
            
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus file <span className="font-bold text-zinc-900 dark:text-zinc-100">{fileToDelete}</span> secara permanen dari server?
            </p>
            
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button 
                variant="outline"
                className="h-12 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Batal
              </Button>
              
              <Button 
                className="h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/20 active:scale-[0.98] transition-transform"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                   <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Tetap Hapus
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent 
           className="max-w-[95vw] lg:max-w-7xl h-[92vh] p-0 overflow-hidden border-none rounded-3xl shadow-2xl bg-white dark:bg-zinc-950 flex flex-col"
           showCloseButton={false}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-zinc-900/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <FileText className="h-5 w-5 text-blue-500" />
               </div>
               <div className="min-w-0">
                  <h2 className="text-zinc-900 dark:text-white font-bold text-sm lg:text-base leading-tight pr-4 truncate max-w-[200px] sm:max-w-md">
                    {viewingFile?.name}
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                    Arsip Tahun {viewingFile?.year}
                  </p>
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
                <Button variant="ghost" size="icon" onClick={() => setIsViewerOpen(false)} className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></Button>
            </div>
          </div>
          
          <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 relative">
             {viewingFile && (
               <iframe 
                 ref={iframeRef}
                 src={`/arsip-pbb/${viewingFile.year}/${viewingFile.name}#toolbar=0`} 
                 className="w-full h-full border-none"
                 title={viewingFile.name}
               />
             )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
