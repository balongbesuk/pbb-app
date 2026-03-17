"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadTaxData, clearTaxData, previewTaxData } from "@/app/actions/tax-actions";

import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  RefreshCcw,
  AlertCircle,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from "lucide-react";

import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { useRouter } from "next/navigation";
import { checkImportRequirements } from "@/app/actions/settings-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/utils";

interface PreviewData {
  total: number;
  updates: number;
  newItems: number;
  totalAmount: number;
  fileName: string;
}


export default function UploadPBBPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isRequirementWarningOpen, setIsRequirementWarningOpen] = useState(false);
  const [isDataExistsWarningOpen, setIsDataExistsWarningOpen] = useState(false);
  const [requirements, setRequirements] = useState<{ dusunCount: number, otomationCount: number, taxCount: number } | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [readInstructions, setReadInstructions] = useState({ 1: false, 2: false, 3: false });
  const [progress, setProgress] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);


  const performReset = async () => {
    setIsResetDialogOpen(false);
    setIsClearing(true);
    try {
      const res = await clearTaxData(tahun);
      if (res.success) {
        toast.success(`Data PBB tahun ${tahun} berhasil dibersihkan!`);
        setResetConfirmText("");
      } else {
        toast.error(`Gagal mereset data: ${(res as any).message || "Unknown error"}`);
      }
    } catch (e: any) {
      toast.error("Terjadi kesalahan sistem saat mereset data");
      console.error(e);
    } finally {
      setIsClearing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Silakan pilih file Excel terlebih dahulu");
      return;
    }

    // Periksa persyaratan referensi data dlu
    const reqRes = await checkImportRequirements(tahun) as any;
    if (reqRes.success) {
      if (reqRes.dusunCount === 0 || reqRes.otomationCount === 0) {
        setRequirements({
          dusunCount: reqRes.dusunCount,
          otomationCount: reqRes.otomationCount,
          taxCount: reqRes.taxCount,
        });
        setIsRequirementWarningOpen(true);
        return;
      }

      // Jika data sudah terisi, munculkan peringatan update
      if (reqRes.taxCount && reqRes.taxCount > 0) {
        setIsDataExistsWarningOpen(true);
        return;
      }
    }

    startActualUpload();
  };

  const handlePreview = async () => {
    if (!file) {
      toast.error("Silakan pilih file Excel terlebih dahulu");
      return;
    }

    setIsPreviewLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await previewTaxData(formData, tahun);
      if (result.success) {
        setPreviewData(result as unknown as PreviewData);
        setIsPreviewOpen(true);
      } else {
        toast.error(`Gagal preview: ${result.message}`);
      }
    } catch (e) {
      toast.error("Kesalahan sistem saat preview data");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const startActualUpload = async () => {
    if (!file) return;
    setIsPreviewOpen(false);
    setIsDataExistsWarningOpen(false);

    setReadInstructions({ 1: false, 2: false, 3: false }); // Reset checkboxes
    setIsUploading(true);
    setProgress(10);

    // Simulasi progress bar agar terlihat berjalan
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.floor(Math.random() * 5) + 2; // Naik acak 2-6% tiap interval
      });
    }, 800);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadTaxData(formData, tahun);

      clearInterval(progressInterval);

      if (result.success) {
        setProgress(100);
        toast.success(`Berhasil mengimpor ${result.count} data pajak!`);
        setFile(null);
      } else {
        setProgress(0);
        toast.error(`Gagal mengimpor: ${result.message}`);
      }
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      toast.error("Terjadi kesalahan sistem saat upload file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Upload Data PBB</h1>
          <p className="text-muted-foreground">Import data dari file Excel ke dalam sistem</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm lg:col-span-2 dark:border-zinc-900 dark:bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-50 px-6 pt-6 pb-5 dark:border-zinc-900/50">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">File Import</CardTitle>
              <CardDescription className="text-xs font-medium">
                Impor data pajak dari file Excel (.xlsx) atau CSV (.csv)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("/api/download-template", "_blank")}
              className="h-9 rounded-xl border-zinc-100 text-xs font-bold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <Download className="mr-2 h-4 w-4" /> Format Excel
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2.5">
              <Label className="text-muted-foreground px-1 text-[10px] font-bold tracking-widest uppercase">
                Tahun Pajak
              </Label>
              <Input
                type="number"
                value={tahun}
                onChange={(e) => setTahun(parseInt(e.target.value))}
                className="h-10 w-32 rounded-xl border-zinc-100 bg-zinc-50 font-bold dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <div
              className={`group flex flex-col items-center justify-center gap-6 rounded-3xl border-2 border-dashed p-10 transition-all hover:cursor-pointer ${
                file
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50 border-zinc-100 hover:bg-zinc-50/50 dark:border-zinc-900 dark:hover:bg-zinc-900/30"
              }`}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition-transform duration-500 group-hover:scale-110 dark:border-zinc-800 dark:bg-zinc-900">
                {file ? (
                  <FileSpreadsheet className="text-primary h-8 w-8" />
                ) : (
                  <Upload className="h-8 w-8 text-zinc-400" />
                )}
              </div>

              <div className="space-y-1 text-center">
                <p className="text-foreground text-sm font-bold">
                  {file ? file.name : "Klik atau seret file ke sini"}
                </p>
                <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                  Maksimal 5MB (.xlsx, .csv)
                </p>
              </div>

              <Input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                id="file-upload"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>

            {isUploading && (
              <div className="space-y-3 pt-2">
                <div className="flex items-end justify-between">
                  <span className="text-primary text-xs font-bold tracking-widest uppercase">
                    Memproses Data...
                  </span>
                  <span className="text-xs font-black">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}

            <Button
              className="shadow-primary/5 h-12 w-full rounded-2xl text-sm font-black shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-95"
              onClick={handlePreview}
              disabled={!file || isUploading || isPreviewLoading}
            >
              {isPreviewLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  MENGALISA FILE...
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  MENYERAP DATA...
                </>
              ) : (
                "IMPORT DATA KE SISTEM"
              )}
            </Button>

          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4 rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <div className="w-fit rounded-xl bg-blue-500/5 p-2.5">
              <AlertCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                Aturan Import
              </p>
              <ul className="text-foreground/70 space-y-2.5 text-xs font-bold tracking-tight">
                <li className="flex gap-2">
                  <div className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                  Format kolom Excel harus sesuai template
                </li>
                <li className="flex gap-2">
                  <div className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                  Pemetaan wilayah otomatis dari string alamat
                </li>
                <li className="text-foreground flex gap-2 font-black">
                  <div className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                  Data tahun lalu akan otomatis diterapkan ulang
                </li>
              </ul>
            </div>
          </Card>

          <Card className="space-y-5 rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <div className="w-fit rounded-xl bg-rose-500/5 p-2.5">
              <RefreshCcw className="h-5 w-5 text-rose-500" />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                  Reset Data
                </p>
                <p className="text-muted-foreground/60 text-xs font-medium">
                  Hapus seluruh data pada tahun terpilih.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-full rounded-xl border-rose-100 text-xs font-bold text-rose-600 transition-all hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950"
                disabled={isClearing}
                onClick={() => {
                  setResetConfirmText("");
                  setIsResetDialogOpen(true);
                }}
              >
                {isClearing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                HAPUS DATA TAHUN {tahun}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Dialog
        open={isResetDialogOpen}
        onOpenChange={(val) => {
          setIsResetDialogOpen(val);
          if (!val) setResetConfirmText("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Peringatan Reset Data PBB
            </DialogTitle>
            <DialogDescription className="text-foreground/70 pt-1">
              Anda akan menghapus <strong>seluruh data PBB tahun {tahun}</strong> yang telah diimpor
              ke sistem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="rounded-md bg-rose-100 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
              Tindakan ini juga akan menghapus riwayat pembayaran, nama wajib pajak tersinkronisasi,
              tagihan, dan alokasi penagih pada tahun {tahun} tersebut. Data tidak dapat
              dikembalikan.
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="confirm-reset" className="text-foreground px-1 text-xs font-bold">
                Ketik <span className="font-bold select-all">RESET {tahun}</span> untuk konfirmasi:
              </Label>
              <Input
                id="confirm-reset"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder={`RESET ${tahun}`}
                className="rounded-xl border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter className="mt-4 flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsResetDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={performReset}
              disabled={isClearing || resetConfirmText !== `RESET ${tahun}`}
              className="w-full sm:w-auto"
            >
              Ya, Reset Data Tahun {tahun}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Requirement Warning Dialog */}
      <Dialog open={isRequirementWarningOpen} onOpenChange={setIsRequirementWarningOpen}>
        <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-950/30">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1 text-center">
              <DialogTitle className="text-xl font-bold">Data Referensi Belum Lengkap</DialogTitle>
              <DialogDescription className="text-foreground/70 leading-relaxed">
                Sistem mendeteksi bahwa data referensi berikut belum diisi di Pengaturan:
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${requirements?.dusunCount === 0 ? "bg-rose-500" : "bg-emerald-500"}`} />
                  <span className="text-sm font-semibold">Data Referensi Dusun</span>
                </div>
                <span className={`text-xs font-bold ${requirements?.dusunCount === 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {requirements?.dusunCount === 0 ? "Belum Ada" : "Sudah Ada"}
                </span>
              </div>
              
              <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${requirements?.otomationCount === 0 ? "bg-rose-500" : "bg-emerald-500"}`} />
                  <span className="text-sm font-semibold">Otomasi Wilayah ke Dusun</span>
                </div>
                <span className={`text-xs font-bold ${requirements?.otomationCount === 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {requirements?.otomationCount === 0 ? "Belum Ada" : "Sudah Ada"}
                </span>
              </div>
            </div>
            
            <p className="text-muted-foreground bg-amber-50/50 border-amber-100 rounded-xl border p-3 text-center text-[10px] italic leading-relaxed dark:bg-amber-950/10 dark:border-amber-900/30">
              Penting: Data ini diperlukan agar sistem dapat memilah wilayah RT/RW secara otomatis saat file Excel diimpor.
            </p>
          </div>

          <DialogFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setIsRequirementWarningOpen(false)}
              className="h-11 w-full sm:min-w-[120px] sm:w-auto rounded-xl font-bold border-zinc-200"
            >
              Nanti Saja
            </Button>
            <Button
              onClick={() => {
                setIsRequirementWarningOpen(false);
                router.push("/settings");
              }}
              className="h-11 w-full sm:flex-1 max-w-[240px] rounded-xl font-bold shadow-lg shadow-primary/20"
            >
              Lengkapi di Pengaturan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Exists Warning Dialog */}
      <Dialog open={isDataExistsWarningOpen} onOpenChange={setIsDataExistsWarningOpen}>
        <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 dark:bg-blue-950/30">
              <RefreshCcw className="h-6 w-6" />
            </div>
            <div className="space-y-1 text-center">
              <DialogTitle className="text-xl font-bold">Sinkronisasi Data</DialogTitle>
              <DialogDescription className="text-foreground/70 leading-relaxed font-semibold">
                Sistem mendeteksi data pajak tahun {tahun} sudah ada.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-blue-50/50 border-blue-200 border rounded-2xl p-4 text-sm space-y-4 dark:bg-blue-950/20 dark:border-blue-900/40">
              <p className="font-bold text-blue-900 dark:text-blue-400 text-xs uppercase tracking-wider">Fitur Sinkronisasi Smart (Smart Sync):</p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    id="ins-1" 
                    checked={readInstructions[1]} 
                    onCheckedChange={(checked) => setReadInstructions(p => ({ ...p, 1: !!checked }))}
                    className="mt-0.5"
                  />
                  <Label htmlFor="ins-1" className="text-xs font-bold leading-normal cursor-pointer text-blue-800 dark:text-blue-500 flex-1">
                    <span>Sistem akan melakukan <span className="font-black italic">Sinkronisasi</span> & <span className="font-black italic">Update</span> otomatis berdasarkan NOP.</span>
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox 
                    id="ins-2" 
                    checked={readInstructions[2]} 
                    onCheckedChange={(checked) => setReadInstructions(p => ({ ...p, 2: !!checked }))}
                    className="mt-0.5"
                  />
                  <Label htmlFor="ins-2" className="text-xs font-bold leading-normal cursor-pointer text-blue-800 dark:text-blue-500 flex-1">
                    <span>Data yang sudah ada di sistem akan diperbarui statusnya mengikuti isi file Excel <span className="text-emerald-700 font-extrabold uppercase">Terbaru</span>.</span>
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox 
                    id="ins-3" 
                    checked={readInstructions[3]} 
                    onCheckedChange={(checked) => setReadInstructions(p => ({ ...p, 3: !!checked }))}
                    className="mt-0.5"
                  />
                  <Label htmlFor="ins-3" className="text-xs font-black leading-normal cursor-pointer text-blue-700 dark:text-blue-400 flex-1">
                    <span>SAYA MENGERTI: Data lama yang <span className="underline">TIDAK ADA</span> di file baru akan tetap aman (tidak berubah statusnya).</span>
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setIsDataExistsWarningOpen(false);
                setReadInstructions({ 1: false, 2: false, 3: false });
              }}
              className="h-11 w-full sm:w-auto rounded-xl font-bold border-zinc-200"
            >
              Batalkan
            </Button>
            <Button
              onClick={startActualUpload}
              disabled={
                !readInstructions[1] || 
                !readInstructions[2] || 
                !readInstructions[3]
              }
              className="h-11 w-full sm:w-auto rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
            >
              Ya, Sinkronkan Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-lg rounded-3xl border-none p-0 shadow-2xl overflow-hidden">
          <div className="bg-primary/5 flex items-center gap-4 p-6 text-primary">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black">Preview Data PBB</DialogTitle>
              <DialogDescription className="text-primary/60 font-bold text-xs uppercase tracking-widest">
                Konfirmasi sebelum impor ke database
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 border-zinc-100 rounded-2xl border p-4 dark:bg-zinc-900/50 dark:border-zinc-800">
                <p className="text-muted-foreground mb-1 text-[10px] font-bold tracking-widest uppercase">Total Baris</p>
                <p className="text-2xl font-black">{previewData?.total.toLocaleString("id-ID")}</p>
              </div>
              <div className="bg-emerald-50/50 border-emerald-100 rounded-2xl border p-4 dark:bg-emerald-950/10 dark:border-emerald-900/30">
                <p className="text-emerald-600/70 mb-1 text-[10px] font-bold tracking-widest uppercase">Data Baru</p>
                <p className="text-emerald-600 text-2xl font-black">{previewData?.newItems.toLocaleString("id-ID")}</p>
              </div>
              <div className="bg-blue-50/50 border-blue-100 rounded-2xl border p-4 dark:bg-blue-950/10 dark:border-blue-900/30">
                <p className="text-blue-600/70 mb-1 text-[10px] font-bold tracking-widest uppercase">Update Data</p>
                <p className="text-blue-600 text-2xl font-black">{previewData?.updates.toLocaleString("id-ID")}</p>
              </div>
              <div className="bg-zinc-50 border-zinc-100 rounded-2xl border p-4 dark:bg-zinc-900/50 dark:border-zinc-800">
                <p className="text-muted-foreground mb-1 text-[10px] font-bold tracking-widest uppercase">Tahun Pajak</p>
                <p className="text-2xl font-black">{tahun}</p>
              </div>
            </div>

            <div className="bg-primary border-primary/20 rounded-2xl border p-5 shadow-lg shadow-primary/20">
              <p className="text-primary-foreground/60 mb-1 text-[10px] font-bold tracking-widest uppercase">Total Nilai Ketetapan Pajak</p>
              <p className="text-primary-foreground text-3xl font-black tracking-tighter">
                {formatCurrency(previewData?.totalAmount || 0)}
              </p>
            </div>

            <div className="flex items-start gap-3 bg-amber-50 border-amber-100 rounded-xl border p-3 dark:bg-amber-950/10 dark:border-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-amber-700 dark:text-amber-400 text-[11px] font-bold leading-relaxed">
                Penting: Sistem akan otomatis mencadangkan database sebelum proses impor dimulai untuk memastikan keamanan data Anda.
              </p>
            </div>
          </div>

          <div className="bg-zinc-50 flex items-center justify-between gap-4 p-6 dark:bg-zinc-900/50">
            <Button
              variant="ghost"
              onClick={() => setIsPreviewOpen(false)}
              className="rounded-xl font-bold"
            >
              Batal
            </Button>
            <Button
              onClick={handleUpload}
              className="shadow-primary/20 flex-1 rounded-xl h-11 font-black shadow-lg"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              KONFIRMASI & IMPORT
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

  );
}
