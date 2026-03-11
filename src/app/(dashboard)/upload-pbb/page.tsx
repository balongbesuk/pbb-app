"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadTaxData, clearTaxData } from "@/app/actions/tax-actions";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  RefreshCcw,
  AlertCircle,
  Download,
  AlertTriangle,
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

export default function UploadPBBPage() {
  const [file, setFile] = useState<File | null>(null);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [progress, setProgress] = useState(0);

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
                Impor data pajak dari file Excel (.xlsx)
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
                  Maksimal 5MB (.xlsx)
                </p>
              </div>

              <Input
                type="file"
                accept=".xlsx, .xls"
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
              onClick={handleUpload}
              disabled={!file || isUploading}
            >
              {isUploading ? (
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
    </div>
  );
}
