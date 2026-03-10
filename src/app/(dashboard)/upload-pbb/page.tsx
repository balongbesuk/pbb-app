"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadTaxData, clearTaxData } from "@/app/actions/tax-actions";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Loader2, RefreshCcw, AlertCircle, Download, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
        toast.error(`Gagal mereset data: ${(res as any).message || 'Unknown error'}`);
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Upload Data PBB</h1>
          <p className="text-muted-foreground">Import data dari file Excel ke dalam sistem</p>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 glass border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>File Import</CardTitle>
              <CardDescription>Pilih file Excel (.xlsx atau .xls) dari DHKP Pajak</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.open("/api/download-template", "_blank")}>
              <Download className="w-4 h-4 mr-2" /> Format Excel
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tahun Pajak</Label>
              <Input
                type="number"
                value={tahun}
                onChange={(e) => setTahun(parseInt(e.target.value))}
                className="w-32 bg-muted/30 border-primary/20"
              />
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-12 transition-all flex flex-col items-center justify-center gap-4 ${file ? "border-primary bg-primary/5" : "border-white/20 hover:border-primary/50"
                }`}
            >
              <div className="p-4 bg-primary/10 rounded-full">
                {file ? <FileSpreadsheet className="w-10 h-10 text-primary" /> : <Upload className="w-10 h-10 text-muted-foreground" />}
              </div>

              <div className="text-center">
                <p className="font-bold text-foreground">{file ? file.name : "Klik atau seret file ke sini"}</p>
                <p className="text-xs text-foreground/60 font-medium">Maksimal 20MB (.xlsx)</p>
              </div>

              <Input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                id="file-upload"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <Label
                htmlFor="file-upload"
                className="cursor-pointer bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              >
                Pilih File
              </Label>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Memproses data pajak...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <Button
              className="w-full h-12 text-lg font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95"
              onClick={handleUpload}
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sedang Mengimpor...
                </>
              ) : (
                "Mulai Import Sekarang"
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass border-none shadow-xl bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                Instruksi
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3 text-foreground/80 font-medium">
              <p>1. Pastikan urutan dan format kolom Excel sesuai standar.</p>
              <p>2. Sistem akan otomatis mendeteksi RT/RW dari string Alamat.</p>
              <p>3. <strong className="text-foreground">Sistem Rekam Jejak (Mapping):</strong> Perbaikan RT/RW dan Penugasan yang Anda lakukan tahun lalu akan otomatis diterapkan ulang.</p>
              <p>4. <strong className="text-foreground">Anti Ganda (Deduplikasi):</strong> Mengunggah ulang (*re-upload*) data DHKP terbaru hanya akan menambah NOP yang benar-benar baru.</p>
              <p>5. <strong className="text-foreground">Auto-Lunas Pintar:</strong> Jika pada Excel terbaru NOP tersebut sudah hilang/tidak terdaftar lagi, sistem akan otomatis menetapkan status NOP tersebut menjadi LUNAS.</p>
            </CardContent>
          </Card>

          <Card className="glass border-none shadow-xl bg-red-50/50 dark:bg-red-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 text-red-500" />
                Bersihkan Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">Ingin mengulang import? Hapus semua data tahun ini.</p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full relative transition-all"
                disabled={isClearing}
                onClick={() => {
                  setResetConfirmText("");
                  setIsResetDialogOpen(true);
                }}
              >
                {isClearing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Reset Data Tahun {tahun}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isResetDialogOpen} onOpenChange={(val) => { setIsResetDialogOpen(val); if (!val) setResetConfirmText(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              Peringatan Reset Data PBB
            </DialogTitle>
            <DialogDescription className="pt-3 space-y-4">
              <span className="block text-foreground/80">
                Anda akan menghapus <strong>seluruh data PBB tahun {tahun}</strong> yang telah diimpor ke sistem.
              </span>

              <span className="block bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 p-3 rounded-md text-xs font-semibold">
                Tindakan ini juga akan menghapus riwayat pembayaran, nama wajib pajak tersinkronisasi, tagihan, dan alokasi penagih pada tahun {tahun} tersebut. Data tidak dapat dikembalikan.
              </span>

              <span className="block space-y-2 pt-2">
                <Label htmlFor="confirm-reset" className="text-foreground">
                  Ketik <span className="font-bold select-all">RESET {tahun}</span> untuk konfirmasi:
                </Label>
                <Input
                  id="confirm-reset"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder={`RESET ${tahun}`}
                  className="bg-white/50"
                  autoComplete="off"
                />
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 flex-col-reverse sm:flex-row">
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)} className="w-full sm:w-auto">Batal</Button>
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
